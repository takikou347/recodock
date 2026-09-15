import type { DiaryBlock } from '@/modules/diary/useDiaries';

export type BlockUpdater = (current: readonly DiaryBlock[]) => readonly DiaryBlock[];

export interface EditorState {
  blocks: readonly DiaryBlock[];
  /** 元に戻す用。取り消した内容は future に退避して、やり直しで戻せるようにする */
  past: readonly (readonly DiaryBlock[])[];
  future: readonly (readonly DiaryBlock[])[];
}

export type EditorAction =
  | { type: 'load'; blocks: readonly DiaryBlock[] }
  | { type: 'apply'; updater: BlockUpdater }
  | { type: 'undo' }
  | { type: 'redo' };

export const INITIAL_EDITOR: EditorState = { blocks: [], past: [], future: [] };

/** 本文と取り消し履歴。1 つの状態にまとめ、履歴の取りこぼしが起きないようにする。 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'load':
      return { blocks: action.blocks, past: [], future: [] };
    case 'apply': {
      const next = action.updater(state.blocks);
      if (next === state.blocks) return state;
      return { blocks: next, past: [...state.past, state.blocks], future: [] };
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        blocks: previous,
        past: state.past.slice(0, -1),
        future: [state.blocks, ...state.future],
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { blocks: next, past: [...state.past, state.blocks], future: rest };
    }
  }
}
