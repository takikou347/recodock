import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { Icon } from '../components/icons/Icon';
import { TextField } from '../components/TextField';

import styles from './LoginPage.module.css';

/**
 * SC-01 ログイン。メール＋パスワードと Google 連携。
 * TODO: Supabase Auth に接続する。現在は画面のみで、送信するとホームへ遷移する。
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorText, setErrorText] = useState<string>();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorText('メールアドレスとパスワードを入力してください');
      return;
    }
    setErrorText(undefined);
    navigate('/');
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

        <Button type="submit" variant="primary" size="lg" isBlock>
          ログイン
        </Button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          または
          <span className={styles.dividerLine} />
        </div>

        <Button variant="secondary" size="lg" isBlock>
          <span className={styles.googleMark} aria-hidden="true">
            G
          </span>
          Google で続ける
        </Button>

        <p className={styles.signup}>
          アカウントをお持ちでないですか？ <span className={styles.signupLink}>新規登録</span>
        </p>
      </form>
    </div>
  );
}
