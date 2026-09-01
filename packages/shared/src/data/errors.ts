// PostgREST のエラー形式を UI 層に漏らさないための変換(03_api_design.md 4.1)。
// リポジトリ関数はここで AppError に変換してから投げる。

/** アプリ全体で扱うエラーコード。UI はこのコードで文言を出し分ける。 */
export type AppErrorCode =
  'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'validation' | 'network' | 'unknown';

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
  forbidden: 'この操作を行う権限がありません',
  not_found: '対象が見つかりませんでした',
  conflict: 'すでに登録されています',
  validation: '入力内容を確認してください',
  network: '通信に失敗しました。接続を確認してください',
  unknown: '処理に失敗しました',
};

/**
 * PostgREST のエラーコードを AppError に写す。
 * 参考: 23505=一意制約, 23514=CHECK 制約, 23503=外部キー, 42501=権限(RLS), PGRST116=0件。
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const pgError = error as PostgrestErrorLike | null;
  const code = pgError?.code;

  let appCode: AppErrorCode = 'unknown';
  if (code === 'PGRST116') appCode = 'not_found';
  else if (code === '23505') appCode = 'conflict';
  else if (code === '23514' || code === '23503' || code === '23502') appCode = 'validation';
  else if (code === '42501') appCode = 'forbidden';
  else if (code === 'PGRST301' || code === '401') appCode = 'unauthorized';
  else if (error instanceof TypeError) appCode = 'network';

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
