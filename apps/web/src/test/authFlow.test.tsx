import { screen, waitFor } from '@testing-library/react';
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
    const user = userEvent.setup();
    renderApp({ route: '/' });

    const signOutButton = await screen.findByRole('button', { name: /瀧川皓太/ });
    await user.click(signOutButton);

    await waitFor(() => expect(authRepo.signOut).toHaveBeenCalledTimes(1));
  });
});
