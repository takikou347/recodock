import type { ReactNode } from 'react';

// デザイン(Recodock Screens.dc.html)の <symbol> をそのまま移植したもの。
// ストロークは 1.6px・currentColor に統一する(既存サービスに寄せたトーン調整済み)。
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** アイコン名 → SVG の中身。Icon.tsx からのみ参照する。 */
export const ICON_PATHS = {
  /* サービスマーク(ドック＋レコード) */
  logo: (
    <g {...stroke}>
      <path d="M7.5 5.5h9A2 2 0 0 1 18.5 7.5V9" />
      <rect x="3.5" y="9" width="15" height="10" rx="3" />
      <circle cx="8.5" cy="14" r="1.5" />
      <path d="M12 14h3.5" />
    </g>
  ),
  /* モジュール */
  calendar: (
    <g {...stroke}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M8 3v3M16 3v3M3.5 10h17" />
      <circle cx="8.5" cy="14" r="1.15" />
      <circle cx="12" cy="14" r="1.15" />
      <circle cx="15.5" cy="17.4" r="1.15" />
    </g>
  ),
  money: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.6 7.8L12 12.4l3.4-4.6M9.2 12.8h5.6M9.2 15.4h5.6M12 12.4V17" />
    </g>
  ),
  diary: (
    <g {...stroke}>
      <path d="M6.5 3h11A1.5 1.5 0 0 1 19 4.5v15A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z" />
      <path d="M9 3v7l2.1-1.5L13.2 10V3" />
      <path d="M8.6 14.5h6.8M8.6 17.4h4.4" />
    </g>
  ),
  items: (
    <g {...stroke}>
      <path d="M12 3l8.5 4.2v9.6L12 21l-8.5-4.2V7.2z" />
      <path d="M3.5 7.2L12 11.4l8.5-4.2M12 11.4V21" />
    </g>
  ),
  notes: (
    <g {...stroke}>
      <path d="M6.5 3h6.6L19 8.9v11.6A1.5 1.5 0 0 1 17.5 22h-11A1.5 1.5 0 0 1 5 20.5v-16A1.5 1.5 0 0 1 6.5 3z" />
      <path d="M13 3v6h6" />
      <path d="M8.5 13.5h7M8.5 16.8h4.6" />
    </g>
  ),
  map: (
    <g {...stroke}>
      <path d="M12 21s6.8-6.2 6.8-11A6.8 6.8 0 1 0 5.2 10c0 4.8 6.8 11 6.8 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </g>
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
