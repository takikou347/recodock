/**
 * 繰り返し予定(RRULE)の展開(CAL-03)。
 * 06_test_policy.md 1.2 でテスト最優先に指定されている領域。
 * DB は rrule を文字列で持ち、展開はクライアント側で行う(02_data_model.md 3.2)。
 *
 * 対応するのは画面設計が使う範囲: FREQ=DAILY / WEEKLY / MONTHLY、INTERVAL、BYDAY、UNTIL、COUNT。
 */

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RecurrenceRule {
  freq: RecurrenceFrequency;
  /** 何回おきか。既定は 1 */
  interval: number;
  /** WEEKLY のときの曜日(0=日曜)。空なら開始日の曜日 */
  byWeekday: readonly number[];
  /** この日時を過ぎたら打ち切る */
  until?: Date;
  /** 生成する最大回数 */
  count?: number;
}

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** 1 回の展開で返す件数の上限。UI が扱う範囲(1 か月〜1 年の表示)には十分な値。 */
const MAX_OCCURRENCES = 1000;

/**
 * 候補の生成回数の上限。通常は limit(UNTIL または表示範囲の終わり)で先に止まるので、
 * これは無限ループを防ぐためだけの値。表示範囲より前から続く予定を捨てないよう、
 * 返す件数の上限とは別に大きく取る。
 */
const MAX_CANDIDATES = 200_000;

/**
 * RFC 5545 の RRULE 文字列を解釈する。
 * 未対応の FREQ や壊れた文字列は null を返し、呼び出し側は単発予定として扱う。
 */
export function parseRrule(rrule: string): RecurrenceRule | null {
  const parts = new Map<string, string>();
  for (const segment of rrule.replace(/^RRULE:/i, '').split(';')) {
    const [key, value] = segment.split('=');
    if (key && value) parts.set(key.toUpperCase(), value.toUpperCase());
  }

  const freq = parts.get('FREQ');
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') return null;

  const interval = Number(parts.get('INTERVAL') ?? '1');
  if (!Number.isInteger(interval) || interval < 1) return null;

  const byWeekday = (parts.get('BYDAY') ?? '')
    .split(',')
    .map((code) => WEEKDAY_CODES.indexOf(code.trim() as (typeof WEEKDAY_CODES)[number]))
    .filter((index) => index >= 0);

  const untilRaw = parts.get('UNTIL');
  const until = untilRaw ? parseUntil(untilRaw) : undefined;
  if (untilRaw && !until) return null;

  const countRaw = parts.get('COUNT');
  const count = countRaw ? Number(countRaw) : undefined;
  if (countRaw && (!Number.isInteger(count) || (count ?? 0) < 1)) return null;

  return { freq, interval, byWeekday, until, count };
}

/** UNTIL の形式: 20260930T235959Z / 20260930 */
function parseUntil(value: string): Date | undefined {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? '23'),
    Number(minute ?? '59'),
    Number(second ?? '59'),
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function atStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 繰り返し予定を [rangeStart, rangeEnd] に含まれる開始日時へ展開する(CAL-03)。
 * rrule が null / 解釈できない場合は、範囲に入っていれば開始日時をそのまま 1 件返す。
 * 除外日(event_overrides の is_canceled)は exceptDates で渡す。
 *
 * 終了日は RRULE 内の UNTIL と、DB の events.rrule_until 列の両方を受け付ける
 * (列は索引のために別に持っている)。両方あるときは早いほうで打ち切る。
 */
export function expandOccurrences(
  startsAt: Date,
  rrule: string | null,
  rangeStart: Date,
  rangeEnd: Date,
  exceptDates: readonly Date[] = [],
  rruleUntil: string | Date | null = null,
): Date[] {
  const isExcluded = (date: Date) => exceptDates.some((except) => isSameDay(except, date));

  if (!rrule) {
    const single = startsAt >= rangeStart && startsAt <= rangeEnd && !isExcluded(startsAt);
    return single ? [startsAt] : [];
  }

  const rule = parseRrule(rrule);
  if (!rule) {
    const single = startsAt >= rangeStart && startsAt <= rangeEnd && !isExcluded(startsAt);
    return single ? [startsAt] : [];
  }

  const until = earliest(rule.until, toDate(rruleUntil));
  const limit = until && until < rangeEnd ? until : rangeEnd;
  const occurrences: Date[] = [];
  // COUNT は DTSTART からの通算回数なので、表示範囲の外でも数える必要がある
  let generated = 0;

  for (const candidate of generate(startsAt, rule, limit)) {
    generated += 1;
    if (rule.count !== undefined && generated > rule.count) break;
    if (candidate < rangeStart) continue;
    if (isExcluded(candidate)) continue;
    occurrences.push(candidate);
    if (occurrences.length >= MAX_OCCURRENCES) break;
  }

  return occurrences;
}

function toDate(value: string | Date | null): Date | undefined {
  if (value === null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function earliest(a: Date | undefined, b: Date | undefined): Date | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

/**
 * 開始日時から規則に沿って候補を昇順に生み出す。
 * limit を過ぎたら止める。表示範囲より前の候補も昇順に出すので、
 * 呼び出し側が範囲外を読み飛ばしても後続の候補は失われない。
 */
function* generate(startsAt: Date, rule: RecurrenceRule, limit: Date): Generator<Date> {
  const timeOfDay = {
    hours: startsAt.getHours(),
    minutes: startsAt.getMinutes(),
    seconds: startsAt.getSeconds(),
  };
  const withTime = (date: Date) =>
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      timeOfDay.hours,
      timeOfDay.minutes,
      timeOfDay.seconds,
    );

  if (rule.freq === 'DAILY') {
    const cursor = atStartOfDay(startsAt);
    for (let i = 0; i < MAX_CANDIDATES; i += 1) {
      const date = withTime(
        new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i * rule.interval),
      );
      if (date > limit) return;
      yield date;
    }
    return;
  }

  if (rule.freq === 'WEEKLY') {
    const weekdays =
      rule.byWeekday.length > 0 ? [...rule.byWeekday].sort((a, b) => a - b) : [startsAt.getDay()];
    // 開始日を含む週の日曜
    const weekStart = atStartOfDay(startsAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let week = 0; week < MAX_CANDIDATES; week += 1) {
      for (const weekday of weekdays) {
        const date = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate() + week * rule.interval * 7 + weekday,
        );
        if (date < atStartOfDay(startsAt)) continue;
        const occurrence = withTime(date);
        if (occurrence > limit) return;
        yield occurrence;
      }
    }
    return;
  }

  // MONTHLY: 開始日と同じ日。存在しない月(31日など)はその月を飛ばす
  const day = startsAt.getDate();
  for (let i = 0; i < MAX_CANDIDATES; i += 1) {
    const base = new Date(startsAt.getFullYear(), startsAt.getMonth() + i * rule.interval, 1);
    if (base > limit) return;
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    if (day > daysInMonth) continue;
    const occurrence = withTime(new Date(base.getFullYear(), base.getMonth(), day));
    if (occurrence > limit) return;
    yield occurrence;
  }
}
