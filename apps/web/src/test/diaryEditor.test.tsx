import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diariesRepo, storageRepo } from '@recodock/shared';

import { parseBlocks, serializeBlocks } from '../modules/diary/useDiaries';
import { diaries } from './fixtures';
import { renderApp } from './harness';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 7, 22, 10, 0));
});

describe('日記本文のブロック直列化(DIA-42)', () => {
  it('画像ブロックが保存形式と往復できる', () => {
    const blocks = [
      { id: 'b-0', kind: 'text', text: '川沿いを歩いた' },
      {
        id: 'b-1',
        kind: 'image',
        assetId: 'photo-1',
        fileName: 'walk.jpg',
        align: 'wrap',
        caption: '鴨川',
      },
    ] as const;

    const restored = parseBlocks(serializeBlocks(blocks));

    expect(restored[1]).toMatchObject({
      kind: 'image',
      assetId: 'photo-1',
      align: 'wrap',
      caption: '鴨川',
    });
  });

  it('キャプションなしの画像も text に化けずに戻る', () => {
    const body = '![](asset:photo-9?align=full)';
    expect(parseBlocks(body)[0]).toMatchObject({ kind: 'image', assetId: 'photo-9' });
  });
});

describe('日記エディタ(DIA-42): 自動保存', () => {
  it('本文を編集すると入力が止まったあとに保存される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/diary/diary-1/edit' });

    const title = await screen.findByLabelText('日記のタイトル');
    await user.clear(title);
    await user.type(title, '書き直したタイトル');

    // 入力が止まってデバウンス時間が経つと update が呼ばれる
    vi.advanceTimersByTime(2000);
    await waitFor(() => expect(diariesRepo.update).toHaveBeenCalled());
    const [, diaryId, input] = vi.mocked(diariesRepo.update).mock.calls[0] ?? [];
    expect(diaryId).toBe('diary-1');
    expect(input?.body).toContain('書き直したタイトル');
  });
});

describe('日記の写真(DIA-02 / NFR-S4): 署名 URL で表示する', () => {
  it('本文の画像ブロックが署名 URL の img として描画される', async () => {
    vi.mocked(diariesRepo.get).mockResolvedValue({
      ...diaries[0]!,
      body: '夏のはじまり、川沿いを歩いた\n\n![鴨川](asset:photo-1?align=full)',
    });
    vi.mocked(diariesRepo.listPhotos).mockResolvedValue([
      { id: 'photo-1', storagePath: 'user-1/walk.jpg', sortOrder: 0 },
    ]);

    renderApp({ route: '/diary/diary-1' });

    const image = await screen.findByRole('img', { name: '鴨川' });
    expect(image).toHaveAttribute('src', 'https://example.com/signed');
    expect(storageRepo.createSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      'diary-photos',
      'user-1/walk.jpg',
    );
  });
});
