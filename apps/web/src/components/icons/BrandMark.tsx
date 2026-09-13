import { cn } from '@/lib/utils';

interface BrandMarkProps {
  /** 大きさは size-* で指定する(既定 32px)。角丸も上書きできる */
  className?: string;
}

/** assets/brand/recodock-mark.svg と同じパス(32 グリッド・単一パス・nonzero)。 */
const MARK_PATH =
  'M13 6H19A6.5 6.5 0 0 1 25.5 12.5V18.5A6.5 6.5 0 0 1 19 25H13A6.5 6.5 0 0 1 6.5 18.5V12.5A6.5 6.5 0 0 1 13 6ZM6.26 7.85A3.5 8.2 6 0 1 4.54 24.15A3.5 8.2 6 0 1 6.26 7.85ZM25.74 7.85A3.5 8.2 -6 0 1 27.46 24.15A3.5 8.2 -6 0 1 25.74 7.85ZM12.2 13.1A1.9 1.9 0 0 0 12.2 16.9A1.9 1.9 0 0 0 12.2 13.1ZM19.8 13.1A1.9 1.9 0 0 0 19.8 16.9A1.9 1.9 0 0 0 19.8 13.1ZM16 18.6A2.3 1.6 0 0 0 16 21.8A2.3 1.6 0 0 0 16 18.6Z';

/**
 * プロダクトマーク(垂れ耳の犬。ADR-0009)。favicon / iOS アイコンと同じく黒地のタイルに白抜きで載せる。
 * 装飾なので aria-hidden。隣に必ず「recodock」の文字を置く。
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-md',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-[68%]">
        <path fill="currentColor" fillRule="nonzero" d={MARK_PATH} />
      </svg>
    </span>
  );
}
