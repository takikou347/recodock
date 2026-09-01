import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppError } from '@recodock/shared';

import { Button } from '../components/Button';
import { Icon } from '../components/icons/Icon';
import { TextField } from '../components/TextField';
import { useAuth } from './auth';

import styles from './LoginPage.module.css';

/** Supabase Auth のパスワードポリシーに合わせた最低文字数。 */
const PASSWORD_MIN_LENGTH = 8;

/**
 * SC-02 サインアップ。登録後は初期モジュール有効化済みでホームへ
 * (帳簿・プリセットカテゴリ・user_modules は handle_new_user トリガーが自動生成する)。
 */
export function SignUpPage() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorText, setErrorText] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAwaitingEmail, setIsAwaitingEmail] = useState(false);

  // すでにログイン済み(またはメール確認が不要な環境)ならホームへ
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorText('メールアドレスとパスワードを入力してください');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setErrorText(`パスワードは${PASSWORD_MIN_LENGTH}文字以上にしてください`);
      return;
    }
    if (password !== confirmation) {
      setErrorText('確認用のパスワードが一致しません');
      return;
    }
    setErrorText(undefined);
    setIsSubmitting(true);
    try {
      await signUp(email, password);
      // メール確認が有効な環境ではセッションが張られないため、案内に切り替える
      setIsAwaitingEmail(true);
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <span className={[styles.blob, styles.blobTopLeft].join(' ')} />
      <span className={[styles.blob, styles.blobBottomRight].join(' ')} />

      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Icon name="logo" size={32} />
          </span>
          <h1 className={styles.brandName}>新規登録</h1>
          <p className={styles.tagline}>毎日の記録を、ひとつのドックに</p>
        </div>

        {isAwaitingEmail ? (
          <p className={styles.notice} role="status">
            確認メールを送りました。メール内のリンクを開くと登録が完了します。
          </p>
        ) : (
          <>
            <TextField
              label="メールアドレス"
              type="email"
              autoComplete="email"
              placeholder="kota@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label="パスワード"
              type="password"
              autoComplete="new-password"
              helperText={`${PASSWORD_MIN_LENGTH}文字以上`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="パスワード(確認)"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              errorText={errorText}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <Button type="submit" variant="primary" size="lg" isBlock disabled={isSubmitting}>
              {isSubmitting ? '処理中…' : '登録する'}
            </Button>
          </>
        )}

        <p className={styles.signup}>
          アカウントをお持ちですか？{' '}
          <button type="button" className={styles.signupLink} onClick={() => navigate('/login')}>
            ログイン
          </button>
        </p>
      </form>
    </div>
  );
}
