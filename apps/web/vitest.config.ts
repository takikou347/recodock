import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 画面テストは jsdom 上で動かす。モックはリポジトリ関数の境界でのみ行う(コーディング規約 8)。
export default defineConfig({
  plugins: [react()],
  resolve: {
    // vite.config.ts と同じ `@/` エイリアス(shadcn/ui の慣習。ADR-0008)
    alias: { '@': new URL('./src/', import.meta.url).pathname },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // クライアント生成だけ通ればよい。実際の通信はリポジトリ関数のモックで止める。
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
