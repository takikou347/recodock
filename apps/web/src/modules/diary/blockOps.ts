import type { DiaryBlock } from '@/modules/diary/useDiaries';

/**
 * 本文ブロックの種類。保存形式(useDiaries の serializeBlocks)が表現できるものだけを並べる。
 * 太字・斜体・リンクのような文字単位の装飾は保存形式に無いため、ここには無い。
 */
export type BlockKind = 'text' | 'heading1' | 'heading2' | 'list';

let blockIdCounter = 0;

/** 新しいブロックの id。保存時に採番し直されるため、画面内で重複しなければよい。 */
export function nextBlockId(): string {
  blockIdCounter += 1;
  return `b-new-${blockIdCounter}`;
}

/** 種類から空のブロックを作る。 */
export function createBlock(kind: BlockKind, id: string): DiaryBlock {
  switch (kind) {
    case 'heading1':
      return { id, kind: 'heading', level: 1, text: '' };
    case 'heading2':
      return { id, kind: 'heading', level: 2, text: '' };
    case 'list':
      return { id, kind: 'list', items: [''] };
    case 'text':
      return { id, kind: 'text', text: '' };
  }
}

/** 画面で扱う種類。画像は書式として切り替えられないので undefined を返す。 */
export function blockKindOf(block: DiaryBlock): BlockKind | undefined {
  switch (block.kind) {
    case 'text':
      return 'text';
    case 'heading':
      return block.level === 1 ? 'heading1' : 'heading2';
    case 'list':
      return 'list';
    case 'image':
      return undefined;
  }
}

/** 書いてある文字は保ったまま種類だけ変える。 */
export function changeBlockKind(block: DiaryBlock, kind: BlockKind): DiaryBlock {
  if (block.kind === 'image') return block;
  const text = block.kind === 'list' ? block.items.join('\n') : block.text;
  switch (kind) {
    case 'heading1':
      return { id: block.id, kind: 'heading', level: 1, text };
    case 'heading2':
      return { id: block.id, kind: 'heading', level: 2, text };
    case 'list':
      return { id: block.id, kind: 'list', items: text.split('\n') };
    case 'text':
      return { id: block.id, kind: 'text', text };
  }
}
