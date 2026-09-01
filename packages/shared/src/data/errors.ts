// PostgREST のエラー形式を UI 層に漏らさないための変換(03_api_design.md 4.1)。
// リポジトリ関数はここで AppError に変換してから投げる。

/**
 * アプリ全体で扱うエラーコード(03_api_design.md 4.1 の変換規約)。
 * unauthorized: RLS 違反・権限なし ／ validation: CHECK・UNIQUE 制約違反 ／
 * offline: ネットワーク断 ／ not_found: 対象 0 件 ／ unknown: その他
 */
export type AppErrorCode = 'unauthorized' | 'validation' | 'offline' | 'not_found' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

/** PostgREST が返すエラーのうち、変換に使う部分だけを見る形。 */
interface PostgrestErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
}

const MESSAGES: Readonly<Record<AppErrorCode, string>> = {
  unauthorized: 'ログインが必要です',
  validation: '入力内容を確認してください',
  offline: '通信に失敗しました。接続を確認してください',
  not_found: '対象が見つかりませんでした',
  unknown: '処理に失敗しました',
};

/**
 * PostgREST のエラーコードを AppError に写す(03_api_design.md 4.1)。
 * 参考: 23505=一意制約, 23514=CHECK 制約, 23503=外部キー, 42501=権限(RLS), PGRST116=0件。
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const pgError = error as PostgrestErrorLike | null;
  const code = pgError?.code;

  let appCode: AppErrorCode = 'unknown';
  if (code === 'PGRST116') appCode = 'not_found';
  else if (code?.startsWith('23')) appCode = 'validation';
  else if (code === '42501' || code === 'PGRST301' || code === '401') appCode = 'unauthorized';
  else if (error instanceof TypeError) appCode = 'offline';

  return new AppError(appCode, MESSAGES[appCode], error);
}

/** リポジトリ関数の共通ラッパー。PostgREST のエラーを AppError に変換して投げ直す。 */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  if (result.data === null) throw new AppError('not_found', MESSAGES.not_found);
  return result.data;
}

/** 戻り値を持たない書き込み用。 */
export function unwrapVoid(result: { error: unknown }): void {
  if (result.error) throw toAppError(result.error);
}
