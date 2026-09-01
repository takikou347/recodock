import { describe, expect, it } from 'vitest';

import { AppError, toAppError, unwrap, unwrapVoid } from './errors';

describe('toAppError(03_api_design.md 4.1)', () => {
  it('PostgREST の 0 件エラーを not_found に写す', () => {
    const error = toAppError({ code: 'PGRST116', message: 'no rows' });
    expect(error.code).toBe('not_found');
    expect(error.message).toBe('対象が見つかりませんでした');
  });

  it('一意制約違反を conflict に写す', () => {
    expect(toAppError({ code: '23505' }).code).toBe('conflict');
  });

  it('CHECK・外部キー・NOT NULL 違反を validation に写す', () => {
    expect(toAppError({ code: '23514' }).code).toBe('validation');
    expect(toAppError({ code: '23503' }).code).toBe('validation');
    expect(toAppError({ code: '23502' }).code).toBe('validation');
  });

  it('RLS による拒否を forbidden に写す', () => {
    expect(toAppError({ code: '42501' }).code).toBe('forbidden');
  });

  it('通信断は network に写す', () => {
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('network');
  });

  it('知らないコードは unknown にする', () => {
    expect(toAppError({ code: 'XX000' }).code).toBe('unknown');
  });

  it('すでに AppError ならそのまま返す', () => {
    const original = new AppError('conflict', 'すでに登録されています');
    expect(toAppError(original)).toBe(original);
  });

  it('PostgREST の生のエラー形式を UI に漏らさない', () => {
    const error = toAppError({ code: '23505', message: 'duplicate key value violates ...' });
    expect(error.message).not.toContain('duplicate key');
  });
});

describe('unwrap', () => {
  it('データがあればそのまま返す', () => {
    expect(unwrap({ data: [1, 2], error: null })).toEqual([1, 2]);
  });

  it('エラーがあれば AppError を投げる', () => {
    expect(() => unwrap({ data: null, error: { code: '42501' } })).toThrow(AppError);
  });

  it('データが null なら not_found を投げる', () => {
    expect(() => unwrap({ data: null, error: null })).toThrow('対象が見つかりませんでした');
  });

  it('unwrapVoid はエラー時だけ投げる', () => {
    expect(() => unwrapVoid({ error: null })).not.toThrow();
    expect(() => unwrapVoid({ error: { code: '23505' } })).toThrow(AppError);
  });
});
