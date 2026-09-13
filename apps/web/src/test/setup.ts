import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Node 23+ の fetch(undici)は jsdom の AbortSignal をブランドチェックで拒否するため、
// react-router がナビゲーションごとに作る new Request(url, { signal }) が
// TypeError になる(Node 22 の CI では通る)。jsdom 由来の signal は除外して生成する。
// 中断の伝播はテストでは不要のため、signal は渡さない(undici が内部スロットで
// ブランドチェックするため、jsdom の signal は instanceof では判別できない)。
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init?.signal ? { ...init, signal: undefined } : init);
  }
} as typeof Request;

/**
 * モックはリポジトリ関数の境界でのみ行う(コーディング規約 8)。
 * supabase-js を直接モックせず、@recodock/shared が公開するリポジトリ関数を差し替える。
 * ドメイン関数(集計・RRULE 展開・表記規則)は本物をそのまま使う。
 */
vi.mock('@recodock/shared', async () => {
  const actual = await vi.importActual<typeof import('@recodock/shared')>('@recodock/shared');
  const fixtures = await import('./fixtures');

  return {
    ...actual,
    authRepo: {
      getCurrentUser: vi.fn(async () => fixtures.TEST_USER),
      onAuthStateChange: vi.fn(() => () => undefined),
      signInWithPassword: vi.fn(async () => fixtures.TEST_USER),
      signUpWithPassword: vi.fn(async () => fixtures.TEST_USER),
      signInWithGoogle: vi.fn(async () => undefined),
      requestPasswordReset: vi.fn(async () => undefined),
      signOut: vi.fn(async () => undefined),
    },
    userModulesRepo: {
      list: vi.fn(async () => fixtures.userModules),
      add: vi.fn(async () => undefined),
      setEnabled: vi.fn(async () => undefined),
      reorder: vi.fn(async () => undefined),
    },
    eventsRepo: {
      listByRange: vi.fn(async () => fixtures.events),
      create: vi.fn(async () => fixtures.events[0]),
      update: vi.fn(async () => fixtures.events[0]),
      remove: vi.fn(async () => undefined),
      replaceReminders: vi.fn(async () => undefined),
      cancelOccurrence: vi.fn(async () => undefined),
      listCanceledOccurrences: vi.fn(async () => []),
      listReminders: vi.fn(async () => [30]),
    },
    entriesRepo: {
      listCalendarEntries: vi.fn(async () => fixtures.calendarEntries),
      searchEntries: vi.fn(async () => fixtures.searchEntries),
      listMapEntries: vi.fn(async () => []),
    },
    moneyRepo: {
      getOrCreateLedger: vi.fn(async () => ({ id: 'ledger-1', name: '家計簿' })),
      listAccounts: vi.fn(async () => fixtures.accounts),
      listCategories: vi.fn(async () => fixtures.categories),
      listTransactions: vi.fn(async () => fixtures.transactions),
      createTransaction: vi.fn(async () => fixtures.transactions[0]),
      updateTransaction: vi.fn(async () => undefined),
      removeTransaction: vi.fn(async () => undefined),
      listBudgets: vi.fn(async () => fixtures.budgets),
      createAccount: vi.fn(async () => undefined),
      updateAccount: vi.fn(async () => undefined),
      createCategory: vi.fn(async () => undefined),
      renameCategory: vi.fn(async () => undefined),
      reorderCategories: vi.fn(async () => undefined),
      removeCategory: vi.fn(async () => undefined),
      upsertBudget: vi.fn(async () => undefined),
    },
    diariesRepo: {
      list: vi.fn(async () => fixtures.diaries),
      get: vi.fn(async () => fixtures.diaries[0]),
      create: vi.fn(async () => fixtures.diaries[0]),
      update: vi.fn(async () => fixtures.diaries[0]),
      remove: vi.fn(async () => undefined),
      listPhotos: vi.fn(async () => []),
      listBySpot: vi.fn(async () => fixtures.diaries),
      listByDate: vi.fn(async () => []),
    },
    itemsRepo: {
      list: vi.fn(async () => fixtures.items),
      get: vi.fn(async () => fixtures.items[0]),
      create: vi.fn(async () => fixtures.items[0]),
      update: vi.fn(async () => fixtures.items[0]),
      remove: vi.fn(async () => undefined),
    },
    notesRepo: {
      list: vi.fn(async () => fixtures.notes),
      get: vi.fn(async () => fixtures.notes[0]),
      create: vi.fn(async () => fixtures.notes[0]),
      update: vi.fn(async () => fixtures.notes[0]),
      setPinned: vi.fn(async () => undefined),
      remove: vi.fn(async () => undefined),
    },
    spotsRepo: {
      list: vi.fn(async () => fixtures.spots),
      create: vi.fn(async () => fixtures.spots[0]),
      update: vi.fn(async () => fixtures.spots[0]),
      remove: vi.fn(async () => undefined),
    },
    storageRepo: {
      uploadPhoto: vi.fn(async () => ({ path: 'user/photo.jpg' })),
      createSignedUrl: vi.fn(async () => 'https://example.com/signed'),
      addDiaryPhoto: vi.fn(async () => ({ id: 'photo-1' })),
      removeDiaryPhoto: vi.fn(async () => undefined),
    },
    userSettingsRepo: {
      listFlags: vi.fn(async () => ({ notifications: true })),
      setFlag: vi.fn(async () => undefined),
    },
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---- jsdom に無いブラウザ API。shadcn/ui(Sidebar の matchMedia、Radix のポインタ捕捉・スクロール)が参照する ----
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
if (typeof globalThis.ResizeObserver !== 'function') {
  class ResizeObserverStub {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.scrollIntoView ??= () => undefined;

// ---- nwsapi(jsdom のセレクタエンジン)2.2.27 の再帰バグ回避 ----
// `:modal` / `:fullscreen` の判定が matches() を経由して自分自身を呼び続け、1 回の照合に数秒かかる。
// Radix の Popper(floating-ui)は位置計算のたびに `matches(':popover-open')` と `matches(':modal')` を呼ぶため、
// メニューやポップオーバーを開いたテストの直後にタイマーが 7 秒以上止まり、CI ではタイムアウトしていた。
// jsdom にトップレイヤーは無いので、これらの擬似クラスは常に不一致として返す。
const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function matches(this: Element, selectors: string): boolean {
  if (/:(modal|popover-open|fullscreen)\b/.test(selectors)) return false;
  return nativeMatches.call(this, selectors);
};
