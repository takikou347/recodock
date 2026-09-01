import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppError, authRepo } from '@recodock/shared';

import { Button } from '../components/Button';
import { Icon } from '../components/icons/Icon';
import { TextField } from '../components/TextField';
import { supabase } from '../lib/supabase';

import styles from './LoginPage.module.css';

/** SC-03 パスワード再設定。メールでのリセットフロー。 */
export function PasswordResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorText, setErrorText] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setErrorText('メールアドレスを入力してください');
      return;
    }
    setErrorText(undefined);
    setIsSubmitting(true);
    try {
      await authRepo.requestPasswordReset(supabase, email, `${window.location.origin}/login`);
      setIsSent(true);
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '送信に失敗しました');
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
          <h1 className={styles.brandName}>パスワード再設定</h1>
          <p className={styles.tagline}>登録済みのメールアドレスに再設定リンクを送ります</p>
        </div>

        {isSent ? (
          <p className={styles.notice} role="status">
            再設定メールを送りました。メール内のリンクから新しいパスワードを設定してください。
          </p>
        ) : (
          <>
            <TextField
              label="メールアドレス"
              type="email"
              autoComplete="email"
              placeholder="kota@example.com"
              value={email}
              errorText={errorText}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" variant="primary" size="lg" isBlock disabled={isSubmitting}>
              {isSubmitting ? '送信中…' : '再設定メールを送る'}
            </Button>
          </>
        )}

        <p className={styles.signup}>
          <button type="button" className={styles.signupLink} onClick={() => navigate('/login')}>
            ログインへ戻る
          </button>
        </p>
      </form>
    </div>
  );
}
