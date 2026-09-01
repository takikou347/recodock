import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AppError } from '@recodock/shared';

import { Button } from '../components/Button';
import { Icon } from '../components/icons/Icon';
import { TextField } from '../components/TextField';
import { useAuth } from './auth';

import styles from './LoginPage.module.css';

/** ログイン画面へ送られる際に元の遷移先を持ち回る。 */
interface LoginLocationState {
  from?: string;
}

/** SC-01 ログイン。メール＋パスワードと Google 連携(Supabase Auth)。 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorText, setErrorText] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as LoginLocationState | null)?.from ?? '/';

  // 外部システム(認証状態)との同期: ログイン済みなら元の画面へ戻す
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorText('メールアドレスとパスワードを入力してください');
      return;
    }
    setErrorText(undefined);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : 'ログインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignUp = async () => {
    if (!email || !password) {
      setErrorText('メールアドレスとパスワードを入力してください');
      return;
    }
    setErrorText(undefined);
    setIsSubmitting(true);
    try {
      await signUp(email, password);
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setErrorText(undefined);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : 'Google 連携に失敗しました');
    }
  };

  return (
    <div className={styles.page}>
      <span className={[styles.blob, styles.blobTopLeft].join(' ')} />
      <span className={[styles.blob, styles.blobBottomRight].join(' ')} />
      <span className={[styles.blob, styles.blobSquare].join(' ')} />
      <span className={[styles.blob, styles.blobSmall].join(' ')} />

      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Icon name="logo" size={32} />
          </span>
          <h1 className={styles.brandName}>recodock</h1>
          <p className={styles.tagline}>毎日の記録を、ひとつのドックに</p>
        </div>

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
          labelAside={<button type="button">お忘れですか？</button>}
          type={isPasswordVisible ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          errorText={errorText}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button
          variant="text"
          size="sm"
          onClick={() => setIsPasswordVisible((visible) => !visible)}
        >
          {isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
        </Button>

        <Button type="submit" variant="primary" size="lg" isBlock disabled={isSubmitting}>
          {isSubmitting ? '処理中…' : 'ログイン'}
        </Button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          または
          <span className={styles.dividerLine} />
        </div>

        <Button variant="secondary" size="lg" isBlock onClick={onGoogle}>
          <span className={styles.googleMark} aria-hidden="true">
            G
          </span>
          Google で続ける
        </Button>

        <p className={styles.signup}>
          アカウントをお持ちでないですか？{' '}
          <button
            type="button"
            className={styles.signupLink}
            onClick={onSignUp}
            disabled={isSubmitting}
          >
            新規登録
          </button>
        </p>
      </form>
    </div>
  );
}
