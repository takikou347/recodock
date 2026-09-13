import { EyeIcon, EyeOffIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AppError } from '@recodock/shared';

import { useAuth } from './auth';
import { AuthLayout } from './AuthLayout';

import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** ログイン画面へ送られる際に元の遷移先を持ち回る。 */
interface LoginLocationState {
  from?: string;
}

/** SC-01 ログイン。メール＋パスワードと Google 連携(Supabase Auth)。 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signInWithGoogle } = useAuth();
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

  const onGoogle = async () => {
    setErrorText(undefined);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : 'Google 連携に失敗しました');
    }
  };

  return (
    <AuthLayout
      title="recodock"
      description="毎日の記録を、ひとつのドックに"
      footer={
        <span>
          アカウントをお持ちでないですか？{' '}
          <Link to="/signup" className="text-foreground underline underline-offset-4">
            新規登録
          </Link>
        </span>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {/* 入力単位ではなくフォーム単位のエラーなので、先頭にまとめて出す */}
        {errorText ? (
          <Alert variant="destructive">
            <AlertDescription>{errorText}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="login-email">メールアドレス</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="kota@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">パスワード</Label>
            <Link
              to="/reset-password"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
            >
              お忘れですか？
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground absolute top-0 right-0 size-9 hover:bg-transparent"
              aria-label={isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '処理中…' : 'ログイン'}
        </Button>

        <div className="after:border-border relative text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-card text-muted-foreground relative z-10 px-2 text-xs">または</span>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
          <GoogleIcon className="size-4" />
          Google で続ける
        </Button>
      </form>
    </AuthLayout>
  );
}
