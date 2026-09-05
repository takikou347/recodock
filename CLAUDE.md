# CLAUDE.md

Recodock(レコドック): カレンダーをコアに、記録系機能をモジュールとして拡張できるパーソナル記録プラットフォーム。

## 設計ドキュメント

要件定義・基本設計・ADR は別リポジトリ `takikou347/develop-docs` の `docs/recodock/` にある。
実装は基本設計(`02_design/` の6ドキュメント)を正とし、逸脱する場合は先にドキュメント側を更新する。

## 構成

- pnpm workspace + Turborepo のモノレポ(NFR-E1)。Node 22 / pnpm。
- `apps/web` … React SPA(Vite + React Router)。Cloudflare Pages にデプロイ。
- `apps/mobile` … iOS アプリ(React Native + Expo)。EAS Build + TestFlight。
- `packages/shared` … 型・ドメインロジック・データアクセス層。Web / iOS で共有。
- `supabase/` … マイグレーション・seed。スキーマは必ずマイグレーションファイルで管理する。

## 必ず守るルール

コーディング規約は `docs/coding-standards.md` を正とする(命名・ディレクトリ構造・データアクセス・TanStack Query・スタイル・テスト・Git の規約)。機械化済みの項目は ESLint / Prettier / CI が強制する。以下は特に重要なもの。

- **supabase-js の import は `packages/shared/src/supabase` と `packages/shared/src/data` のみ**(ADR-0004)。
  UI からはデータアクセス層のリポジトリ関数を経由する。ESLint の `no-restricted-imports` で強制済み。
- **認可は RLS が境界**(NFR-S3)。アプリ側のチェックは UX 補助であり、新テーブルには必ず RLS ポリシーを付ける。
- スキーマ変更の手順: マイグレーション追加 → `supabase start` 環境で適用 → `pnpm gen:types` → 生成型をコミット。
- service_role キー・秘密情報をコードやクライアント側の env に置かない(NFR-S7)。
- 家計簿の金額計算・振替ロジック(`packages/shared/src/domain/money.ts`)はテスト最優先領域。変更時は必ずテストを追随させる。

## コマンド

```bash
pnpm install        # 依存インストール
pnpm lint           # ESLint(リポジトリ全体)
pnpm typecheck      # 型チェック(turbo)
pnpm test           # テスト(turbo → vitest)
pnpm -F @recodock/web dev     # Web 開発サーバー
pnpm -F @recodock/mobile start # Expo 開発サーバー
supabase start      # ローカル Supabase(要 Docker)
pnpm gen:types      # DB スキーマから型生成
```
