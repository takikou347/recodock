# Recodock

カレンダーをコアに、記録系機能(家計簿・経歴・日記・持ち物・メモ・地図)をモジュールとして拡張できるパーソナル記録プラットフォーム。

- 要件定義・基本設計・ADR: [takikou347/develop-docs](https://github.com/takikou347/develop-docs) の `docs/recodock/`
- 技術スタック: TypeScript / React(Vite)/ React Native(Expo)/ Supabase / Vercel

## リポジトリ構成

| パス              | 内容                                                   |
| ----------------- | ------------------------------------------------------ |
| `apps/web`        | Web アプリ(React SPA、Vite + React Router)             |
| `apps/mobile`     | iOS アプリ(React Native + Expo)                        |
| `packages/shared` | 型・ドメインロジック・データアクセス層(Web / iOS 共有) |
| `supabase`        | DB マイグレーション・seed・ローカル環境設定            |

## セットアップ

前提: Node.js 22+ / pnpm(corepack)/ Docker(ローカル Supabase 用)/ Supabase CLI

```bash
pnpm install

# ローカル Supabase を起動(マイグレーションが自動適用される)
supabase start

# 型定義を生成
pnpm gen:types

# 環境変数を設定(supabase start の出力値を使う)
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# 開発サーバー
pnpm -F @recodock/web dev      # Web: http://localhost:5173
pnpm -F @recodock/mobile start # iOS: Expo Go / development build
```

## 開発コマンド

| コマンド                            | 内容                                               |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm lint`                         | ESLint(supabase-js の import 制限を含む)           |
| `pnpm format` / `pnpm format:check` | Prettier                                           |
| `pnpm typecheck`                    | 全パッケージの型チェック                           |
| `pnpm test`                         | テスト(Vitest。家計簿ドメインロジックが最優先領域) |
| `pnpm gen:types`                    | DB スキーマから TypeScript 型を生成                |

## アーキテクチャ上の重要ルール

- UI から supabase-js を直接呼ばない。必ず `packages/shared` のデータアクセス層を経由する
  (Phase 2 の REST API 移行に備えるガード。詳細は develop-docs の ADR-0004)。
- 認可は Supabase の RLS を境界とする。スキーマ変更は必ず `supabase/migrations/` で管理し、
  変更後に `pnpm gen:types` の生成結果をコミットする。
