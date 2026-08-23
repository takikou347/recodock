import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/.turbo/**',
      'supabase/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // コーディング規約 10: import 順序(外部 → @recodock → 相対 → CSS)
      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^\\u0000', '^node:', '^@?\\w'], ['^@recodock'], ['^\\.'], ['\\.css$']],
        },
      ],
      'simple-import-sort/exports': 'error',
      // コーディング規約 2: default export 禁止(名前付き export に統一)
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      // ADR-0004: supabase-js の呼び出しはデータアクセス層(packages/shared)に限定する。
      // REST API 移行(Phase 2)時の書き直し範囲をこの層に閉じ込めるためのガード。
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'supabase-js は packages/shared のデータアクセス層からのみ使用する(ADR-0004)。@recodock/shared が公開するリポジトリ関数を経由すること。',
            },
          ],
        },
      ],
    },
  },
  {
    // データアクセス層(唯一の supabase-js 利用箇所)では制限を解除する
    files: ['packages/shared/src/supabase/**', 'packages/shared/src/data/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // 設定ファイルはツール仕様上 default export が必須
    files: ['**/*.config.{js,mjs,ts}'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
  {
    // CommonJS の設定ファイル(babel.config.js 等)
    files: ['**/*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
);
