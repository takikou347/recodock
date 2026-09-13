import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError, authRepo } from '@recodock/shared';

import { TEST_USER } from './fixtures';
import { renderApp } from './harness';

/** 未ログイン状態を作る。afterEach でログイン済みへ戻す。 */
function signedOut() {
  vi.mocked(authRepo.getCurrentUser).mockResolvedValue(null);
}

afterEach(() => {
  vi.mocked(authRepo.getCurrentUser).mockResolvedValue(TEST_USER);
});

describe('認証(SC-01): ログインしないと記録に入れない', () => {
  it('未ログインならホームからログイン画面へ送られる', async () => {
    signedOut();

    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { name: 'recodock' })).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
  });

  it('メールとパスワードを入れるとログインしてホームへ入る', async () => {
    const user = userEvent.setup();
    signedOut();

    renderApp({ route: '/login' });

    await user.type(await screen.findByLabelText('メールアドレス'), 'kota@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password1234');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => expect(authRepo.signInWithPassword).toHaveBeenCalledTimes(1));
    expect(vi.mocked(authRepo.signInWithPassword).mock.calls[0]?.slice(1)).toEqual([
      'kota@example.com',
      'password1234',
    ]);
    // ログイン後はホーム(カレンダー)へ
    expect(await screen.findByRole('heading', { name: /年 .*月/ })).toBeInTheDocument();
  });

  it('未入力では認証を呼ばない', async () => {
    const user = userEvent.setup();
    signedOut();

    renderApp({ route: '/login' });
    await user.click(await screen.findByRole('button', { name: 'ログイン' }));

    expect(
      await screen.findByText('メールアドレスとパスワードを入力してください'),
    ).toBeInTheDocument();
    expect(authRepo.signInWithPassword).not.toHaveBeenCalled();
  });

  it('認証に失敗したらエラー文言を出す', async () => {
    const user = userEvent.setup();
    signedOut();
    vi.mocked(authRepo.signInWithPassword).mockRejectedValueOnce(
      new AppError('unauthorized', 'ログインが必要です'),
    );

    renderApp({ route: '/login' });
    await user.type(await screen.findByLabelText('メールアドレス'), 'kota@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(await screen.findByText('ログインが必要です')).toBeInTheDocument();
  });

  it('ログイン済みならサイドバーにユーザー名が出て、ログアウトできる', async () => {
    renderApp({ route: '/' });

    // 誤操作防止のため、ユーザーメニューを開いてからログアウトする。
    // Radix のメニューが開いている間は RTL の待機系(findBy* / waitFor)が act の都合で 10 秒超かかるため、
    // 開閉はキーボードイベントで同期的に起こし、項目も同期クエリで引く(メニューは同じ act 内で描画される)。
    const trigger = await screen.findByRole('button', { name: /瀧川皓太/ });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(screen.getByText('ログアウト'));

    expect(authRepo.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('サインアップ(SC-02)とパスワード再設定(SC-03)', () => {
  it('ログイン画面の「新規登録」からサインアップ画面へ移り、登録できる', async () => {
    const user = userEvent.setup();
    signedOut();

    renderApp({ route: '/login' });
    // 画面遷移は button ではなくリンクで提供する(ADR-0008 でアクセシビリティを是正)
    await user.click(await screen.findByRole('link', { name: '新規登録' }));

    expect(await screen.findByRole('heading', { name: '新規登録' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('メールアドレス'), 'kota@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password1234');
    await user.type(screen.getByLabelText('パスワード(確認)'), 'password1234');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(authRepo.signUpWithPassword).toHaveBeenCalledTimes(1));
  });

  it('確認用パスワードが一致しないと登録しない', async () => {
    const user = userEvent.setup();
    signedOut();

    renderApp({ route: '/signup' });
    await user.type(await screen.findByLabelText('メールアドレス'), 'kota@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password1234');
    await user.type(screen.getByLabelText('パスワード(確認)'), 'different');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByText('確認用のパスワードが一致しません')).toBeInTheDocument();
    expect(authRepo.signUpWithPassword).not.toHaveBeenCalled();
  });

  it('「お忘れですか？」から再設定メールを送れる', async () => {
    const user = userEvent.setup();
    signedOut();

    renderApp({ route: '/login' });
    await user.click(await screen.findByRole('link', { name: 'お忘れですか？' }));

    expect(await screen.findByRole('heading', { name: 'パスワード再設定' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('メールアドレス'), 'kota@example.com');
    await user.click(screen.getByRole('button', { name: '再設定メールを送る' }));

    await waitFor(() => expect(authRepo.requestPasswordReset).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/再設定メールを送りました/)).toBeInTheDocument();
  });
});
