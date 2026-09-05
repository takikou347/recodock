import type { ReactNode } from 'react';

// ストロークは 1.6px・currentColor に統一する(既存サービスに寄せたトーン調整済み)。
// サービスマークと6モジュールは「器＋耳＋中身」のアイコンシステム(develop-docs
// 02_design/01_screen_design.md 3.5)。操作系はデザイン(Recodock Screens.dc.html)の <symbol> の移植。
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** 器(角丸プレート)＋耳。サービスマークと全モジュールアイコンが共有する外形 */
const frame = (
  <g {...stroke}>
    <rect x="3.5" y="7" width="17" height="14.5" rx="3.8" />
    <path d="M3.9 8.4C2.6 5 3.5 2.3 5.6 2.3c1.9 0 3.2 2.3 3.4 5.4" />
    <path d="M20.1 8.4c1.3-3.4.4-6.1-1.7-6.1-1.9 0-3.2 2.3-3.4 5.4" />
  </g>
);

/** アイコン名 → SVG の中身。Icon.tsx からのみ参照する。 */
export const ICON_PATHS = {
  /* サービスマーク(器＋耳＋犬の顔)。カラー版は assets/brand/recodock-mark.svg */
  logo: (
    <>
      {frame}
      <circle cx="8.4" cy="12.2" r="1.5" fill="currentColor" />
      <circle cx="15.6" cy="12.2" r="1.5" fill="currentColor" />
      <rect x="8.9" y="14.3" width="6.2" height="4.4" rx="2.2" {...stroke} />
      <circle cx="12" cy="15.8" r="1.05" fill="currentColor" />
    </>
  ),
  /* モジュール(器＋耳＋中身)。中身は x 6–18 / y 9–19 に収め、要素は3つまで */
  calendar: (
    <>
      {frame}
      <path d="M3.5 11.2h17" {...stroke} />
      <circle cx="8.4" cy="14.8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="14.8" r="1.5" fill="currentColor" />
      <circle cx="15.6" cy="18" r="1.5" fill="currentColor" />
    </>
  ),
  money: (
    <>
      {frame}
      <path d="M9.3 10l2.7 3.4 2.7-3.4M9.7 14.4h4.6M9.7 16.5h4.6M12 13.4v4.8" {...stroke} />
    </>
  ),
  diary: (
    <>
      {frame}
      <path d="M9.6 7v4.8l2.4-1.7 2.4 1.7V7M8.2 16.6h7.6" {...stroke} />
    </>
  ),
  items: (
    <>
      {frame}
      <path
        d="M12 9.6l4.4 2.2v4.4L12 18.4l-4.4-2.2v-4.4zM7.6 11.8l4.4 2.2 4.4-2.2M12 14v4.4"
        {...stroke}
      />
    </>
  ),
  notes: (
    <>
      {frame}
      <path d="M8 11.6h8M8 14.6h8M8 17.6h4.8" {...stroke} />
    </>
  ),
  map: (
    <>
      {frame}
      <path d="M12 18.6s3.2-3.1 3.2-5.5a3.2 3.2 0 1 0-6.4 0c0 2.4 3.2 5.5 3.2 5.5z" {...stroke} />
      <circle cx="12" cy="13.1" r="1.3" fill="currentColor" />
    </>
  ),
  /* 操作 */
  search: (
    <g {...stroke}>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="M15.4 15.4L20.5 20.5" />
    </g>
  ),
  grid: (
    <g fill="currentColor">
      <circle cx="6" cy="6" r="1.8" />
      <circle cx="12" cy="6" r="1.8" />
      <circle cx="18" cy="6" r="1.8" />
      <circle cx="6" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="18" cy="12" r="1.8" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="12" cy="18" r="1.8" />
      <circle cx="18" cy="18" r="1.8" />
    </g>
  ),
  plus: (
    <g {...stroke} strokeWidth={2}>
      <path d="M12 5.5v13M5.5 12h13" />
    </g>
  ),
  check: (
    <g {...stroke} strokeWidth={2.2}>
      <path d="M5 12.8l4.6 4.4L19 6.6" />
    </g>
  ),
  settings: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.2v2.2M12 18.6v2.2M4.4 7.6l1.9 1.1M17.7 15.3l1.9 1.1M4.4 16.4l1.9-1.1M17.7 8.7l1.9-1.1" />
    </g>
  ),
  image: (
    <g {...stroke}>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="9" cy="10.2" r="1.7" />
      <path d="M4.4 17.2l4.8-4.3 3.9 3.4 2.6-2.2 3.7 3.1" />
    </g>
  ),
  bold: (
    <g {...stroke} strokeWidth={2}>
      <path d="M7 4.5h6a3.6 3.6 0 0 1 0 7.2H7zM7 11.7h6.8a3.9 3.9 0 0 1 0 7.8H7z" />
    </g>
  ),
  list: (
    <g {...stroke}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.6" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
    </g>
  ),
  pin: (
    <g {...stroke}>
      <path d="M14.6 3.4l6 6-2.4 1.2-4.8-4.8z" />
      <path d="M15.4 8.2L9.2 14.4l-1.6 4.6 4.6-1.6 6.2-6.2M7.6 19l-3.4 3.4" />
    </g>
  ),
  close: (
    <g {...stroke} strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </g>
  ),
  link: (
    <g {...stroke}>
      <path d="M9.8 14.2l4.4-4.4" />
      <path d="M8.2 10.6l-2.3 2.3a3.3 3.3 0 1 0 4.7 4.7l2.3-2.3M15.8 13.4l2.3-2.3a3.3 3.3 0 1 0-4.7-4.7l-2.3 2.3" />
    </g>
  ),
  dots: (
    <g fill="currentColor">
      <circle cx="5.5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.5" cy="12" r="1.7" />
    </g>
  ),
  undo: (
    <g {...stroke}>
      <path d="M8.5 4.5L4 9l4.5 4.5" />
      <path d="M4 9h9.5a6 6 0 0 1 0 12H10" />
    </g>
  ),
  redo: (
    <g {...stroke}>
      <path d="M15.5 4.5L20 9l-4.5 4.5" />
      <path d="M20 9h-9.5a6 6 0 0 0 0 12H14" />
    </g>
  ),
  chevronLeft: (
    <g {...stroke} strokeWidth={2}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </g>
  ),
  chevronRight: (
    <g {...stroke} strokeWidth={2}>
      <path d="M9.5 5.5L16 12l-6.5 6.5" />
    </g>
  ),
  chevronDown: (
    <g {...stroke} strokeWidth={2}>
      <path d="M5.5 9.5L12 16l6.5-6.5" />
    </g>
  ),
  drag: (
    <g fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </g>
  ),
  menu: (
    <g {...stroke} strokeWidth={2.5}>
      <path d="M4 7h16M4 12h16M4 17h11" />
    </g>
  ),
} satisfies Record<string, ReactNode>;
