import { Skeleton as UiSkeleton } from '@/components/ui/skeleton';

export interface SkeletonProps {
  /** 行数。形は実コンテンツに合わせる */
  lineCount?: number;
  /** 末尾に大きなブロック(カード・グラフ)を置く */
  hasBlock?: boolean;
}

// 実コンテンツに近い不揃いさを出すための幅
const LINE_WIDTHS = ['w-3/5', 'w-11/12', 'w-3/4', 'w-5/6'];

/** 読み込み中のスケルトン。 */
export function Skeleton({ lineCount = 3, hasBlock = false }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: lineCount }, (_, index) => (
        <UiSkeleton key={index} className={`h-4 ${LINE_WIDTHS[index % LINE_WIDTHS.length]}`} />
      ))}
      {hasBlock ? <UiSkeleton className="mt-2 h-32 w-full" /> : null}
    </div>
  );
}
