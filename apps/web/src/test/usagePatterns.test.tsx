import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  diariesRepo,
  eventsRepo,
  itemsRepo,
  moneyRepo,
  notesRepo,
  userModulesRepo,
} from '@recodock/shared';

import { renderApp } from './harness';

// カレンダーの「今日」を固定して、月の見出しや取得範囲がテストごとにぶれないようにする
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 7, 22, 10, 0));
});

describe('ホーム(SC-04): 記録が集まって見える', () => {
  it('当月のカレンダーと、選択日の記録が並ぶ', async () => {
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { name: '2026年 8月' })).toBeInTheDocument();
    // calendar_entries の集約が右ペインに出る
    expect(await screen.findByText('夏のはじまり、川沿いを歩いた')).toBeInTheDocument();
    expect(screen.getByText('スーパーで買い物')).toBeInTheDocument();
  });

  it('サイドバーには追加済みモジュールだけが並ぶ', async () => {
    renderApp({ route: '/' });

    const nav = await screen.findByRole('navigation', { name: 'モジュール' });
    // user_modules の取得が終わると、追加済みのモジュールが並ぶ
    expect(await within(nav).findByRole('link', { name: /家計簿/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /カレンダー/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /日記/ })).toBeInTheDocument();
    // 追加していない持ち物・メモは出ない(CORE-02 / FR-01)
    expect(within(nav).queryByRole('link', { name: /持ち物/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /メモ/ })).not.toBeInTheDocument();
  });
});

describe('予定作成(CAL-12): FAB から予定を保存する', () => {
  it('タイトル未入力では保存せず、入力すると events に登録される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    await user.click(await screen.findByRole('button', { name: '記録を追加' }));
    await user.click(await screen.findByRole('menuitem', { name: '予定を作成' }));

    const dialog = await screen.findByRole('dialog', { name: '予定を作成' });

    // 未入力のまま保存 → 検証エラーで登録されない
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));
    expect(await screen.findByText('タイトルを入力してください')).toBeInTheDocument();
    expect(eventsRepo.create).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText('タイトル'), '散歩');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(eventsRepo.create).toHaveBeenCalledTimes(1));
    const [, userId, input] = vi.mocked(eventsRepo.create).mock.calls[0] ?? [];
    expect(userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(input).toMatchObject({ title: '散歩', isAllDay: false });
    expect(await screen.findByText('予定を保存しました')).toBeInTheDocument();
  });

  it('繰り返しを選ぶと RRULE として保存される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    await user.click(await screen.findByRole('button', { name: '記録を追加' }));
    await user.click(await screen.findByRole('menuitem', { name: '予定を作成' }));

    const dialog = await screen.findByRole('dialog', { name: '予定を作成' });
    await user.type(within(dialog).getByLabelText('タイトル'), '読書会');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(eventsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(eventsRepo.create).mock.calls[0] ?? [];
    expect(input?.rrule).toBe('FREQ=WEEKLY;BYDAY=SA');
  });
});

describe('家計簿(MON-20/21): 実データから集計する', () => {
  it('収入・支出・収支が取引から計算されて出る', async () => {
    renderApp({ route: '/money' });

    // 収入 280,000 / 支出 1,280 / 収支 +278,720(振替は含まない)
    expect(await screen.findByText('¥280,000')).toBeInTheDocument();
    expect(screen.getByText('¥1,280')).toBeInTheDocument();
    expect(screen.getByText('+¥278,720')).toBeInTheDocument();
  });

  it('「支出」で絞ると収入の行が消える', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    expect(await screen.findByText('8月分 給与')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /支出/ }));

    await waitFor(() => expect(screen.queryByText('8月分 給与')).not.toBeInTheDocument());
    expect(screen.getByText('スーパーで買い物')).toBeInTheDocument();
  });

  it('取引を追加すると transactions に登録される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    await user.click(await screen.findByRole('button', { name: /取引を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '取引を追加' });

    await user.type(within(dialog).getByLabelText('金額'), '1280');
    await user.type(within(dialog).getByLabelText('メモ'), 'スーパーで買い物');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(moneyRepo.createTransaction).toHaveBeenCalledTimes(1));
    const [, , input] = vi.mocked(moneyRepo.createTransaction).mock.calls[0] ?? [];
    expect(input).toMatchObject({
      kind: 'expense',
      amount: 1280,
      accountId: 'account-1',
      categoryId: 'category-food',
      memo: 'スーパーで買い物',
    });
  });

  it('金額が 0 以下だと保存せずエラーを出す', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    await user.click(await screen.findByRole('button', { name: /取引を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '取引を追加' });
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    expect(await screen.findByText('金額は 0 より大きい数で入力してください')).toBeInTheDocument();
    expect(moneyRepo.createTransaction).not.toHaveBeenCalled();
  });

  it('振替を選ぶとカテゴリを持たず、入金先を指定する(MON-05)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    await user.click(await screen.findByRole('button', { name: /取引を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '取引を追加' });

    await user.click(within(dialog).getByRole('radio', { name: '振替' }));
    await user.type(within(dialog).getByLabelText('金額'), '30000');
    expect(within(dialog).queryByLabelText('カテゴリ')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(moneyRepo.createTransaction).toHaveBeenCalled());
    const [, , input] = vi.mocked(moneyRepo.createTransaction).mock.calls[0] ?? [];
    expect(input).toMatchObject({
      kind: 'transfer',
      categoryId: null,
      accountId: 'account-1',
      transferAccountId: 'account-2',
    });
  });
});

describe('日記(DIA-40/41): 一覧と本文', () => {
  it('一覧から選ぶと本文が右に出る', async () => {
    renderApp({ route: '/diary' });

    const detail = await screen.findByRole('article');
    expect(
      within(detail).getByRole('heading', { name: '夏のはじまり、川沿いを歩いた' }),
    ).toBeInTheDocument();
    expect(within(detail).getByText(/夕方から鴨川沿いを 1 時間ほど歩いた/)).toBeInTheDocument();
    // 気分タグは日本語表示に変換される(DB は great/good/... で持つ)
    expect(within(detail).getByText('ごきげん')).toBeInTheDocument();
  });

  it('削除は確認ダイアログを挟んでから実行する', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/diary' });

    await user.click(await screen.findByRole('button', { name: '削除' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/30日間はゴミ箱から戻せます/)).toBeInTheDocument();
    // 確認前は消さない
    expect(diariesRepo.remove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: '削除する' }));
    await waitFor(() =>
      expect(diariesRepo.remove).toHaveBeenCalledWith(expect.anything(), 'diary-1'),
    );
  });
});

describe('モジュール管理(SC-05 / SC-08): 使うものだけ追加する', () => {
  it('未追加のモジュールを追加すると user_modules に登録される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/modules' });

    const addable = await screen.findByText('持ち物');
    const row = addable.closest('div')?.parentElement;
    await user.click(within(row as HTMLElement).getByRole('button', { name: /追加/ }));

    await waitFor(() => expect(userModulesRepo.add).toHaveBeenCalled());
    const [, , moduleKey] = vi.mocked(userModulesRepo.add).mock.calls[0] ?? [];
    expect(moduleKey).toBe('items');
  });

  it('コアのカレンダーには削除ボタンが出ない(FR-01)', async () => {
    renderApp({ route: '/modules' });

    const calendarRow = (await screen.findByText(/Reco Calendar/)).closest('div')
      ?.parentElement as HTMLElement;
    expect(within(calendarRow).getByText('コア')).toBeInTheDocument();
    expect(within(calendarRow).queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
  });

  it('追加済みモジュールを削除すると無効化される(データは保持)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/modules' });

    const moneyRow = (await screen.findByText(/Reco Money/)).closest('div')
      ?.parentElement as HTMLElement;
    await user.click(within(moneyRow).getByRole('button', { name: '削除' }));

    await waitFor(() =>
      expect(userModulesRepo.setEnabled).toHaveBeenCalledWith(expect.anything(), 'money', false),
    );
  });
});

describe('横断検索(SC-07): 全モジュールを1本の入力で探す', () => {
  it('検索語を入れると search_entries を引き、モジュール別に絞り込める', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/search' });

    const input = await screen.findByRole('searchbox', { name: 'すべての記録を検索' });
    await user.type(input, '鴨川');

    expect(await screen.findByText('鴨川で読む本リスト')).toBeInTheDocument();
    expect(screen.getByText('鴨川 三条')).toBeInTheDocument();

    // モジュールのチップで絞る
    const filters = screen.getByRole('group', { name: 'モジュールで絞り込み' });
    await user.click(within(filters).getByRole('button', { name: /^日記/ }));
    await waitFor(() => expect(screen.queryByText('鴨川で読む本リスト')).not.toBeInTheDocument());
    expect(screen.getByText('夏のはじまり、川沿いを歩いた')).toBeInTheDocument();
  });
});

describe('持ち物・メモ', () => {
  it('持ち物を追加すると items に登録される(ITM-51)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/items' });

    await user.click(await screen.findByRole('button', { name: /持ち物を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '持ち物を追加' });
    await user.type(within(dialog).getByLabelText('持ち物の名前'), '炊飯器');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(itemsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(itemsRepo.create).mock.calls[0] ?? [];
    expect(input).toMatchObject({ name: '炊飯器' });
  });

  it('メモはピン留めとそれ以外に分かれて出る(MEM-60)', async () => {
    renderApp({ route: '/notes' });

    expect(await screen.findByRole('heading', { name: /ピン留め/ })).toBeInTheDocument();
    expect(screen.getByText('鴨川で読む本リスト')).toBeInTheDocument();
    expect(screen.getByText('買い物メモ')).toBeInTheDocument();
  });

  it('メモを作成すると notes に登録される(MEM-61)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/notes' });

    await user.click(await screen.findByRole('button', { name: /新規メモ/ }));
    const dialog = await screen.findByRole('dialog', { name: '新規メモ' });
    await user.type(within(dialog).getByLabelText('メモのタイトル'), '週次ふりかえり');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(notesRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(notesRepo.create).mock.calls[0] ?? [];
    expect(input).toMatchObject({ title: '週次ふりかえり' });
  });
});
