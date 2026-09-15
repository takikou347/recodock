import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  diariesRepo,
  entriesRepo,
  eventsRepo,
  itemsRepo,
  moneyRepo,
  notesRepo,
  spotsRepo,
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
    // 既定は「繰り返さない」。毎週(土曜)を明示的に選ぶ
    // Radix の Select はトリガーが combobox ロール(ADR-0008 で自前実装から置き換え)
    await user.click(within(dialog).getByRole('combobox', { name: '繰り返し' }));
    // 選択肢はポータルで body 直下に出るので dialog の内側からは引けない
    await user.click(await screen.findByRole('option', { name: /毎週/ }));
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(eventsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(eventsRepo.create).mock.calls[0] ?? [];
    expect(input?.rrule).toBe('FREQ=WEEKLY;BYDAY=SA');
  });

  // BYDAY が土曜に焼き込まれていた時期があり、「今日」が土曜だと気づけなかった。
  // 曜日の違う日でも開始日から導出されることを見る
  it('繰り返しの曜日は開始日から決まる', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.setSystemTime(new Date(2026, 7, 25, 10, 0)); // 火曜
    renderApp({ route: '/' });

    await user.click(await screen.findByRole('button', { name: '記録を追加' }));
    await user.click(await screen.findByRole('menuitem', { name: '予定を作成' }));

    const dialog = await screen.findByRole('dialog', { name: '予定を作成' });
    await user.type(within(dialog).getByLabelText('タイトル'), '朝会');
    await user.click(within(dialog).getByRole('combobox', { name: '繰り返し' }));
    await user.click(await screen.findByRole('option', { name: /毎週/ }));
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(eventsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(eventsRepo.create).mock.calls[0] ?? [];
    expect(input?.rrule).toBe('FREQ=WEEKLY;BYDAY=TU');
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

    await user.click(await screen.findByRole('button', { name: '持ち物を追加' }));

    await waitFor(() => expect(userModulesRepo.add).toHaveBeenCalled());
    const [, , moduleKey] = vi.mocked(userModulesRepo.add).mock.calls[0] ?? [];
    expect(moduleKey).toBe('items');
  });

  it('コアのカレンダーには削除ボタンが出ない(FR-01)', async () => {
    renderApp({ route: '/modules' });

    expect(await screen.findByText(/Reco Calendar/)).toBeInTheDocument();
    expect(screen.getByText('コア')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'カレンダーを削除' })).not.toBeInTheDocument();
  });

  it('追加済みモジュールを削除すると無効化される(データは保持)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/modules' });

    await user.click(await screen.findByRole('button', { name: '家計簿を削除' }));

    await waitFor(() =>
      expect(userModulesRepo.setEnabled).toHaveBeenCalledWith(expect.anything(), 'money', false),
    );
  });

  it('並べ替えボタンで順番を入れ替えられる(H-5)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/modules' });

    await user.click(await screen.findByRole('button', { name: '家計簿を上へ' }));

    await waitFor(() => expect(userModulesRepo.reorder).toHaveBeenCalled());
    const [, keys] = vi.mocked(userModulesRepo.reorder).mock.calls[0] ?? [];
    expect(keys?.slice(0, 2)).toEqual(['money', 'calendar']);
  });
});

describe('横断検索(SC-07): 全モジュールを1本の入力で探す', () => {
  it('検索語を入れると search_entries を引き、モジュール別に絞り込める', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/search' });

    const input = await screen.findByRole('textbox', { name: 'すべての記録を検索' });
    await user.type(input, '鴨川');

    expect(await screen.findByText('鴨川で読む本リスト')).toBeInTheDocument();
    expect(screen.getByText('鴨川 三条')).toBeInTheDocument();
    // モックは引数を無視して固定値を返すので、入力がリポジトリまで届いたことも見る
    expect(entriesRepo.searchEntries).toHaveBeenCalledWith(expect.anything(), '鴨川');

    // モジュールのチップで絞る
    const filters = screen.getByRole('group', { name: 'モジュールで絞り込み' });
    await user.click(within(filters).getByRole('button', { name: /^日記/ }));
    await waitFor(() => expect(screen.queryByText('鴨川で読む本リスト')).not.toBeInTheDocument());
    expect(screen.getByText('夏のはじまり、川沿いを歩いた')).toBeInTheDocument();
  });
});

describe('持ち物・メモ', () => {
  it('持ち物を全項目つきで追加できる(ITM-52)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/items' });

    await user.click(await screen.findByRole('button', { name: /持ち物を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '持ち物を追加' });
    await user.type(within(dialog).getByLabelText('名称'), '炊飯器');
    await user.type(within(dialog).getByLabelText('カテゴリ'), '家電');
    await user.type(within(dialog).getByLabelText('保管場所'), 'キッチン');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(itemsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(itemsRepo.create).mock.calls[0] ?? [];
    expect(input).toMatchObject({ name: '炊飯器', category: '家電', location: 'キッチン' });
  });

  it('持ち物カードを開くと詳細(ITM-51)が出て、編集へ進める', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/items' });

    await user.click(await screen.findByText('加湿器'));
    const detail = await screen.findByRole('dialog', { name: '加湿器' });
    expect(within(detail).getByText('押入れ')).toBeInTheDocument();

    await user.click(within(detail).getByRole('button', { name: '編集' }));
    const editor = await screen.findByRole('dialog', { name: '持ち物を編集' });
    expect(within(editor).getByLabelText('名称')).toHaveValue('加湿器');

    await user.clear(within(editor).getByLabelText('名称'));
    await user.type(within(editor).getByLabelText('名称'), '加湿器(寝室)');
    await user.click(within(editor).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(itemsRepo.update).toHaveBeenCalled());
    const [, itemId, input] = vi.mocked(itemsRepo.update).mock.calls[0] ?? [];
    expect(itemId).toBe('item-1');
    expect(input).toMatchObject({ name: '加湿器(寝室)' });
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

describe('予定詳細(CAL-11): 確認・編集・削除の分岐', () => {
  it('予定チップをクリックすると詳細が開き、リマインド設定が見える', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    await user.click((await screen.findAllByRole('button', { name: /散歩/ }))[0] as HTMLElement);

    const dialog = await screen.findByRole('dialog', { name: '散歩' });
    expect(within(dialog).getByText('鴨川 三条')).toBeInTheDocument();
    expect(within(dialog).getByText('30分前')).toBeInTheDocument();
  });

  it('単発の予定は削除するとそのまま消える', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    await user.click((await screen.findAllByRole('button', { name: /散歩/ }))[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: '散歩' });
    await user.click(within(dialog).getByRole('button', { name: '削除' }));

    await waitFor(() =>
      expect(eventsRepo.remove).toHaveBeenCalledWith(expect.anything(), 'event-1'),
    );
    expect(eventsRepo.cancelOccurrence).not.toHaveBeenCalled();
  });

  it('繰り返しの予定は「この回のみ/すべての回」を選べる(CAL-01)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    // 8/22 の読書会(毎週土曜の1回)を開く
    await user.click((await screen.findAllByRole('button', { name: /読書会/ }))[3] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: '読書会' });
    await user.click(within(dialog).getByRole('button', { name: '削除' }));

    // 分岐が出る。この回のみ → event_overrides に取り消し行
    const choice = await within(dialog).findByRole('group', { name: '削除の範囲' });
    await user.click(within(choice).getByRole('button', { name: 'この回のみ' }));

    await waitFor(() => expect(eventsRepo.cancelOccurrence).toHaveBeenCalledTimes(1));
    expect(eventsRepo.remove).not.toHaveBeenCalled();
  });

  it('詳細から編集を開くとフォームに値が入っている(CAL-12 編集)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/' });

    await user.click((await screen.findAllByRole('button', { name: /散歩/ }))[0] as HTMLElement);
    const detail = await screen.findByRole('dialog', { name: '散歩' });
    await user.click(within(detail).getByRole('button', { name: '編集' }));

    const editor = await screen.findByRole('dialog', { name: '予定を編集' });
    expect(within(editor).getByLabelText('タイトル')).toHaveValue('散歩');
    expect(within(editor).getByLabelText('場所')).toHaveValue('鴨川 三条');

    await user.clear(within(editor).getByLabelText('タイトル'));
    await user.type(within(editor).getByLabelText('タイトル'), '夕方の散歩');
    await user.click(within(editor).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(eventsRepo.update).toHaveBeenCalled());
    const [, eventId, input] = vi.mocked(eventsRepo.update).mock.calls[0] ?? [];
    expect(eventId).toBe('event-1');
    expect(input).toMatchObject({ title: '夕方の散歩' });
  });
});

describe('家計簿の管理画面(MON-23〜26)', () => {
  it('口座一覧に「開始残高＋取引の積み上げ」の残高が出る(MON-02)', async () => {
    renderApp({ route: '/money/accounts' });

    // 三菱UFJ: 100,000 + 収入 280,000 − 支出 1,280 − 振替の出金 30,000 = 348,720
    expect(await screen.findByText('¥348,720')).toBeInTheDocument();
    // 現金: 20,000 + 振替の入金 30,000 = 50,000
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
    // 総残高 = 348,720 + 50,000。解約した口座(999,999)は含めない
    expect(screen.getByText('¥398,720')).toBeInTheDocument();
    expect(screen.queryByText('¥999,999')).not.toBeInTheDocument();
  });

  it('口座を追加すると accounts に登録される(MON-24)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money/accounts' });

    await user.click(await screen.findByRole('button', { name: /口座を追加/ }));
    const dialog = await screen.findByRole('dialog', { name: '口座を追加' });
    await user.type(within(dialog).getByLabelText('口座名'), '楽天カード');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(moneyRepo.createAccount).toHaveBeenCalledTimes(1));
    const [, , , input] = vi.mocked(moneyRepo.createAccount).mock.calls[0] ?? [];
    expect(input).toMatchObject({ name: '楽天カード', kind: 'bank' });
  });

  it('カテゴリを追加すると categories に登録される(MON-25)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money/categories' });

    await user.type(await screen.findByLabelText('新しいカテゴリ'), 'サブスク');
    await user.click(screen.getByRole('button', { name: '追加' }));

    await waitFor(() => expect(moneyRepo.createCategory).toHaveBeenCalledTimes(1));
    const [, , , input] = vi.mocked(moneyRepo.createCategory).mock.calls[0] ?? [];
    expect(input).toMatchObject({ name: 'サブスク', kind: 'expense' });
  });

  it('予算を保存すると budgets に月初日の行として入り、消化率が出る(MON-26)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money/budgets' });

    // 既存予算 250,000 / 支出 1,280 → 消化率 1%
    expect(await screen.findByText(/消化率 1%/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('月の予算(帳簿全体)'), '300000');
    await user.click(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(moneyRepo.upsertBudget).toHaveBeenCalledTimes(1));
    const [, , , input] = vi.mocked(moneyRepo.upsertBudget).mock.calls[0] ?? [];
    expect(input).toMatchObject({ month: '2026-08-01', categoryId: null, amount: 300000 });
  });

  it('取引行をクリックすると編集モーダルが開き、更新できる(MON-22 編集)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    await user.click(await screen.findByText('スーパーで買い物'));
    const dialog = await screen.findByRole('dialog', { name: '取引を編集' });
    expect(within(dialog).getByLabelText('金額')).toHaveValue(1280);

    await user.clear(within(dialog).getByLabelText('金額'));
    await user.type(within(dialog).getByLabelText('金額'), '1480');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(moneyRepo.updateTransaction).toHaveBeenCalled());
    const [, transactionId, input] = vi.mocked(moneyRepo.updateTransaction).mock.calls[0] ?? [];
    expect(transactionId).toBe('tx-1');
    expect(input).toMatchObject({ amount: 1480 });
  });

  it('口座で絞り込むと他口座の取引が消える(MON-21)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/money' });

    expect(await screen.findByText('スーパーで買い物')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: '口座で絞り込み' }));
    await user.click(await screen.findByRole('option', { name: '現金' }));

    await waitFor(() => expect(screen.queryByText('スーパーで買い物')).not.toBeInTheDocument());
  });
});

describe('メモ編集(MEM-61)とスポット(MAP-71/72)', () => {
  it('メモをクリックするとエディタが開き、編集すると自動保存される', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/notes' });

    await user.click(await screen.findByText('鴨川で読む本リスト'));
    const title = await screen.findByLabelText('メモのタイトル');
    expect(title).toHaveValue('鴨川で読む本リスト');

    await user.type(screen.getByLabelText('メモの本文'), ' 追記');
    // 自動保存のデバウンスを進める
    await vi.advanceTimersByTimeAsync(1500);

    await waitFor(() => expect(notesRepo.update).toHaveBeenCalled());
    const [, noteId, input] = vi.mocked(notesRepo.update).mock.calls[0] ?? [];
    expect(noteId).toBe('note-1');
    expect(String(input?.body)).toContain('追記');
  });

  it('チェックリストボタンで行頭に - [ ] が入る(MEM-03)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/notes/note-1' });

    await screen.findByLabelText('メモのタイトル');
    const body = screen.getByLabelText('メモの本文') as HTMLTextAreaElement;
    // 1行目にカーソルを置いてから挿入する
    body.setSelectionRange(0, 0);
    await user.click(screen.getByRole('button', { name: 'チェックリスト' }));

    expect(body.value.startsWith('- [ ] ')).toBe(true);
  });

  it('スポットを追加すると spots に登録される(MAP-72)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/map' });

    await user.click(await screen.findByRole('button', { name: /スポットを追加/ }));
    const dialog = await screen.findByRole('dialog', { name: 'スポットを追加' });
    await user.type(within(dialog).getByLabelText('場所名'), '出町柳デルタ');
    // 座標は必須。空のまま保存すると、本人が置いていない場所が記録として残る
    await user.type(within(dialog).getByLabelText('緯度'), '35.0316');
    await user.type(within(dialog).getByLabelText('経度'), '135.7712');
    await user.click(within(dialog).getByRole('radio', { name: '行きたい' }));
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(spotsRepo.create).toHaveBeenCalled());
    const [, , input] = vi.mocked(spotsRepo.create).mock.calls[0] ?? [];
    // 「行きたい」は訪問日を持たない(02_data_model.md 3.7)
    expect(input).toMatchObject({ name: '出町柳デルタ', status: 'wishlist', visitedOn: null });
  });

  it('スポット詳細(MAP-71)に関連日記への導線が出る', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp({ route: '/map' });

    await user.click(await screen.findByRole('button', { name: '詳細' }));
    const dialog = await screen.findByRole('dialog', { name: '鴨川 三条' });
    expect(within(dialog).getByText('関連日記')).toBeInTheDocument();
    expect(await within(dialog).findByText(/夏のはじまり、川沿いを歩いた/)).toBeInTheDocument();
  });
});
