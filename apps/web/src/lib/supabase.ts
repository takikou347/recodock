import { createSupabaseClient } from '@recodock/shared';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ビルド時に環境変数が渡っていないと supabase-js が例外を投げて画面が真っ白になり、
// ホスティング側の設定漏れだと気づきにくい。原因を画面に出してから止める。
if (!url || !anonKey) {
  const missing = [!url && 'VITE_SUPABASE_URL', !anonKey && 'VITE_SUPABASE_ANON_KEY']
    .filter(Boolean)
    .join(' / ');
  const message = `Supabase の環境変数(${missing})がビルドに含まれていません。ホスティングの環境変数を設定して再デプロイしてください。`;
  const root = document.getElementById('root');
  if (root) {
    const notice = document.createElement('p');
    notice.textContent = message;
    notice.style.cssText = 'padding:24px;font-family:sans-serif;color:#7a1f1f';
    root.replaceChildren(notice);
  }
  throw new Error(message);
}

// Web 用の Supabase クライアント。UI からはデータアクセス層(@recodock/shared)経由で使う。
export const supabase = createSupabaseClient({ url, anonKey });
