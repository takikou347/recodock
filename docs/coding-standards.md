# コーディング規約

Recodock リポジトリのコーディング規約。機械化できる項目は ESLint / Prettier / TypeScript / CI で強制しており(各項目に「強制: 」で明記)、本書は「なぜそうするか」と機械化できない判断基準を定める。

## 1. TypeScript

- `strict` + `noUncheckedIndexedAccess` を前提に書く(強制: tsconfig.base.json)。
- `any` は使わない。外部データは境界(データアクセス層・API レスポンス)で型を確定させ、内側では型アサーション(`as`)も避ける。やむを得ない `as` には理由コメントを付ける。
- 型のみの import は `import type` を使う。
- 列挙は union 型(`'income' | 'expense' | 'transfer'`)で表現し、`enum` は使わない(DB の text + CHECK と対応させる)。
- 関数の公開シグネチャ(exported)には戻り値型を明示する。内部関数は推論に任せてよい。

## 2. 命名

| 対象                         | 規約                                                                   | 例                                  |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| React コンポーネントファイル | PascalCase.tsx(コンポーネント名と一致)                                 | `TransactionForm.tsx`               |
| それ以外のファイル           | camelCase.ts                                                           | `userModules.ts`, `queryKeys.ts`    |
| コンポーネント               | PascalCase、名前付き export(default export 禁止)                       | `export function TransactionForm()` |
| フック                       | `use` プレフィックス                                                   | `useTransactions`                   |
| リポジトリ関数モジュール     | テーブル名の camelCase + `Repo` として re-export                       | `transactionsRepo.list()`           |
| 定数                         | UPPER_SNAKE(モジュールスコープの不変値のみ)                            | `MODULE_KEYS`                       |
| boolean                      | `is` / `has` / `can` プレフィックス                                    | `isEnabled`                         |
| DB ↔ ドメイン                | DB は snake_case、ドメイン型は camelCase。変換はリポジトリ関数内で行う | `occurred_on` → `occurredOn`        |

## 3. ディレクトリ構造

```text
packages/shared/src/
├── domain/        # 純粋関数のドメインロジック(DB・React 非依存。テスト最優先)
├── data/          # リポジトリ関数(supabase-js を使える唯一の場所)
├── supabase/      # クライアントファクトリ(同上)
├── modules/       # モジュール定義の型・定数
└── database.types.ts  # gen:types の生成物(手編集禁止)

apps/web/src/
├── styles/        # デザイントークン(tokens.css)・グローバルスタイル
├── components/    # モジュール横断の共通 UI(Button, Dialog, EmptyState …)
├── lib/           # supabase クライアント、QueryClient、ユーティリティ
├── core/          # 認証・AppShell・モジュール管理・設定などコア画面
└── modules/<key>/ # モジュール別の画面・部品・フック(registry.tsx に登録)
```

- モジュール間は import しない(FR-03)。共有したいものは `components/` か `packages/shared` に昇格させる。
- モジュール追加はディレクトリ追加+ `registry.tsx` への登録のみで完結させる(FR-02)。コア(`core/`, `App.tsx`, `main.tsx`)にモジュール固有の分岐を書かない。

## 4. データアクセス

- **supabase-js の import は `packages/shared/src/supabase` と `src/data` のみ**(強制: ESLint `no-restricted-imports`。ADR-0004)。
- リポジトリ関数は「クライアントを第1引数に取る純関数」とし、ドメイン型を返す。生成型(`database.types.ts`)をこの層の外に出さない。
- エラーは `AppError`(code / message / cause)に変換してから投げる(03_api_design.md 4.1)。UI 層は PostgREST のエラー形式を知らない。
- 集計はクライアント側の全件処理でなく、PostgREST の集計クエリまたはビューで行う(NFR-P2)。

## 5. サーバー状態(TanStack Query)

- クエリキーはキーファクトリ(`packages/shared/src/data/queryKeys.ts`)から取得し、文字列リテラルを直接書かない。形式は `[module, resource, ...params]`。
- mutation 成功時の再取得は `invalidateQueries` で行い、手動キャッシュ書き換えは楽観更新が必要な箇所に限定する。
- 書き込み mutation はリトライしない(二重登録防止)。読み取りは既定(最大2回)。

## 6. スタイル・デザイン準拠

- 色・タイポグラフィ・余白・角丸・影は `styles/tokens.css` の CSS 変数のみを参照する。**コンポーネント内での色コードのハードコード禁止**(トークンは Claude Design の成果物から抽出して同期する)。
- スタイルは CSS Modules(`*.module.css`)で書く。インラインスタイルは動的な値(座標・進捗率など)のみに使う。
- レイアウトの状態網羅: 一覧系画面はローディング(Skeleton)・エラー(ErrorState)・0件(EmptyState)の3状態を必ず実装する。
- ライトモードのみ対応(01_screen_design.md 3.1)。ただし色は必ずトークン経由にし、将来のダークモード追加をトークン差し替えで行えるようにする。

## 7. React

- 関数コンポーネントのみ。Props は `interface XxxProps` を同ファイルに定義する。
- フックのルールは ESLint で強制(強制: `eslint-plugin-react-hooks`)。
- ページコンポーネント(ルート直下)がデータ取得(クエリフック)を担い、配下の表示コンポーネントは Props で受け取る(取得と表示の分離)。
- `useEffect` は「外部システムとの同期」のみに使う。派生状態は計算で、イベント起点の処理はハンドラで書く。

## 8. テスト

- テストは対象と同じディレクトリに `*.test.ts(x)` で置く(コロケーション)。
- ドメインロジック(`shared/domain`)は分岐網羅を意識する。金額計算・RRULE 展開が最優先(06_test_policy.md 1.2)。
- テスト名は日本語で「何を保証するか」を書く(例: `振替は収入・支出のどちらにも計上しない`)。
- モックは境界(リポジトリ関数)でのみ行い、supabase-js を直接モックしない。

## 9. Git

- コミットは Conventional Commits(`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`)。1コミット=1つの意図。
- main へは CI(lint / format / typecheck / test)成功が前提(強制: ci.yml)。
- スキーマ変更はマイグレーション追加 → `pnpm gen:types` → 生成物を同一コミットに含める。

## 10. import 順序(強制: ESLint `simple-import-sort`)

1. Node / 外部パッケージ
2. `@recodock/*`
3. 相対 import
4. CSS

並び替えは `pnpm lint --fix` で自動修正できる。
