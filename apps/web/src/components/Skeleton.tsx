import type { CSSProperties } from 'react';

import styles from './States.module.css';

export interface SkeletonProps {
  /** 行数。形は実コンテンツに合わせる */
  lineCount?: number;
  /** 末尾に大きなブロック(カード・グラフ)を置く */
  hasBlock?: boolean;
}

// 実コンテンツに近い不揃いさを出すための幅(動的値なのでインラインで渡す)
const LINE_WIDTHS = ['60%', '90%', '75%', '82%'];

/** 読み込み中のスケルトン(1e フィードバック状態)。 */
export function Skeleton({ lineCount = 3, hasBlock = false }: SkeletonProps) {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: lineCount }, (_, index) => {
        const style: CSSProperties = { width: LINE_WIDTHS[index % LINE_WIDTHS.length] };
        return <span key={index} className={styles.bar} style={style} />;
      })}
      {hasBlock ? <span className={styles.block} /> : null}
    </div>
  );
}
