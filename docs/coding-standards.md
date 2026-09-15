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
├── components/ui/ # shadcn/ui の取り込み(手で直すのは意図がある場合のみ)
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

ADR-0008 により、デザインシステムは **shadcn/ui の既定(`baseColor=neutral`)** を正とする。

- スタイルは **Tailwind のユーティリティクラス**で書く。CSS Modules は新規に作らない(旧 `*.module.css` は移行完了とともに削除)。
- 色は **shadcn のテーマ変数**(`bg-primary` / `text-muted-foreground` / `border` など)のみを参照する。**独自の色コード・独自トークンの追加は禁止**。
  - 例外は「色そのものが情報である」ごく少数の箇所のみ(曜日の赤/青、金額の符号、期限切れの警告)。その場合も Tailwind 標準パレット(`red-600` など)から選び、`dark:` の対も書く。
- アイコンは **lucide-react** のみを使う(ADR-0008)。文字や絵文字でアイコンを代用しない。同じ用途のアイコンはサイズを揃える。
- インラインスタイルは動的な値(座標・進捗率など)のみに使う。クラスの結合は `cn`(`@/lib/utils`)。
- **自前で作る前に `components/ui/`(shadcn)と `components/`(共通部品)を探す。** 特に Dialog / Select / Popover / ToggleGroup のようなキーボード操作とフォーカス管理を伴うものは絶対に自前実装しない。
- 入力には必ずラベルを結びつける(`htmlFor`/`id`、または `components/TextField`)。視覚ラベルが無い操作には `aria-label` を付ける。
- 画面遷移は `<a>` / `<Link>` で提供する(`<button onClick={navigate}>` にしない)。
- レイアウトの状態網羅: 一覧系画面はローディング(Skeleton)・エラー(ErrorState)・0件(EmptyState)の3状態を必ず実装する。**0 件と「検索に一致しない」は別の文言にする。**
- **実装されていない機能のボタンを置かない。** `onClick` の無いボタン、成功トーストだけ出して何もしない処理、事実と異なる状態表示(「端末に保存済み」など)は作らない。

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
- **実装を消しても通るテストを書かない。** 分岐を検証するテストには、その分岐でしか落ちない入力を必ず混ぜる(例: カテゴリ未設定の除外を見るなら、カテゴリ未設定かつ対象 kind の行を入れる)。
- 要素はアクセシビリティ経由で引く(`getByRole` / `getByLabelText`)。DOM の入れ子(`closest()` / `parentElement`)や位置インデックスに依存しない。一意に引けないときは、テストを工夫するのではなく**実装側に `aria-label` を足す**。
- 固定文字列を返すだけのモックに対して「表示されること」だけを確認しない。**引数が正しく渡ったこと**(`toHaveBeenCalledWith`)もあわせて見る。

### jsdom で Radix(shadcn/ui)を動かすための前提

`apps/web/src/test/setup.ts` が補っている。新しいテストが動かないときはまずここを疑う。

- **`PointerEvent` が無い**。無いと userEvent の `click` が `pointerdown` を `MouseEvent` として投げ、`button` / `pointerType` が欠けて Select・DropdownMenu・Popover が開かない。
- **`nwsapi`(セレクタエンジン)の `:modal` / `:fullscreen` 判定が自己再帰する**。floating-ui が位置計算のたびに `matches(':modal')` を呼ぶため、メニューを開いたテストの直後の `findBy*` / `waitFor` が 7 秒以上止まる。`Element.prototype.matches` をラップして該当の擬似クラスを不一致にしている。
- `matchMedia` / `ResizeObserver` / pointer capture / `scrollIntoView` も存在しないので補っている。
- Radix の `Select` はトリガーが `combobox` ロール。メニュー・ポップオーバーの中身は**ポータルで `body` 直下**に出るので、`within(dialog)` では引けない(`screen` から引く)。

## 9. Git

- コミットは Conventional Commits(`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`)。1コミット=1つの意図。
- ブランチ運用(ADR-0007): `main` = 本番(Cloudflare Pages Production / prod Supabase)、`develop` = 統合(Preview / dev Supabase)。
  feature ブランチ → PR → `develop`(CI + Preview で確認)→ PR → `main`(本番反映)。`main` / `develop` はどちらも
  直接 push 不可で PR 経由のみ(ブランチ保護 + `ci` 必須)。recodock は squash マージ。
- CI(lint / format / typecheck / test)の成功が `main` / `develop` への前提(強制: ci.yml + ブランチ保護)。
- Node は 22 に固定(`.node-version` / ci.yml の `node-version` / Cloudflare の `NODE_VERSION`)。`engines.node` は下限 `>=22`。
- スキーマ変更はマイグレーション追加 → `pnpm gen:types` → 生成物を同一コミットに含める。

## 10. import 順序(強制: ESLint `simple-import-sort`)

1. Node / 外部パッケージ
2. `@recodock/*`
3. 相対 import
4. CSS

並び替えは `pnpm lint --fix` で自動修正できる。
