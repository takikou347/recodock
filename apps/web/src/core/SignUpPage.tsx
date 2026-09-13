import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppError } from '@recodock/shared';

import { useAuth } from './auth';
import { AuthLayout } from './AuthLayout';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <AuthLayout
      title="新規登録"
      description="毎日の記録を、ひとつのドックに"
      footer={
        <span>
          アカウントをお持ちですか？{' '}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            ログイン
          </Link>
        </span>
      }
    >
      {isAwaitingEmail ? (
        <Alert role="status">
          <AlertDescription>
            確認メールを送りました。メール内のリンクを開くと登録が完了します。
          </AlertDescription>
        </Alert>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {errorText ? (
            <Alert variant="destructive">
              <AlertDescription>{errorText}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="signup-email">メールアドレス</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="kota@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signup-password">パスワード</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="signup-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p id="signup-password-hint" className="text-muted-foreground text-xs">
              {PASSWORD_MIN_LENGTH}文字以上
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signup-confirmation">パスワード(確認)</Label>
            <Input
              id="signup-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '処理中…' : '登録する'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
