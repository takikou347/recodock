import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppError, authRepo } from '@recodock/shared';

import { AuthLayout } from './AuthLayout';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

/** SC-03 パスワード再設定。メールでのリセットフロー。 */
export function PasswordResetPage() {
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
    <AuthLayout
      title="パスワード再設定"
      description="登録済みのメールアドレスに再設定リンクを送ります"
      footer={
        <Link to="/login" className="text-foreground underline underline-offset-4">
          ログインへ戻る
        </Link>
      }
    >
      {isSent ? (
        <Alert role="status">
          <AlertDescription>
            再設定メールを送りました。メール内のリンクから新しいパスワードを設定してください。
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
            <Label htmlFor="reset-email">メールアドレス</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="kota@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '送信中…' : '再設定メールを送る'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
