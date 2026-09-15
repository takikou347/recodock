import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, PinIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatFullDate, notesRepo } from '@recodock/shared';

import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { supabase } from '../../lib/supabase';

import styles from './NoteEditorPage.module.css';

/** 入力が止まってから保存するまでの待ち時間(自動保存)。 */
const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * MEM-61 メモ編集。Markdown エディタ(MEM-01)。一覧から直接編集に入る(詳細画面は設けない)。
 * チェックリストは Markdown の `- [ ]` 記法(MEM-03)で、ツールバーから挿入できる。
 */
export function NoteEditorPage() {
  const navigate = useNavigate();
  const { noteId } = useParams();
  const queryClient = useQueryClient();

  const noteQuery = useQuery({
    queryKey: ['notes', 'detail', noteId ?? ''],
    queryFn: () => notesRepo.get(supabase, noteId ?? ''),
    enabled: Boolean(noteId),
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isDirty = useRef(false);
  const loadedId = useRef<string | undefined>(undefined);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      notesRepo.update(supabase, noteId ?? '', { title: title.trim(), body, isPinned }),
    onSuccess: () => {
      setSavedAt(new Date());
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });

  // 外部システム(サーバー)との同期: 取得できたメモをエディタへ読み込む
  useEffect(() => {
    const note = noteQuery.data;
    if (!note || loadedId.current === note.id) return;
    loadedId.current = note.id;
    setTitle(note.title);
    setBody(note.body);
    setIsPinned(note.isPinned);
    isDirty.current = false;
  }, [noteQuery.data]);

  // 入力が止まったら自動保存する
  useEffect(() => {
    if (!noteId || !isDirty.current) return;
    const timer = setTimeout(() => {
      isDirty.current = false;
      saveMutation.mutate();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [noteId, title, body, isPinned, saveMutation]);

  const markDirty = () => {
    isDirty.current = true;
  };

  /** カーソル行の先頭にチェックリスト記法を挿入する(MEM-03 の入力支援)。 */
  const insertChecklist = () => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const lineStart = body.lastIndexOf('\n', cursor - 1) + 1;
    const next = `${body.slice(0, lineStart)}- [ ] ${body.slice(lineStart)}`;
    setBody(next);
    markDirty();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor + 6, cursor + 6);
    });
  };

  if (noteQuery.isError) {
    return (
      <div className={styles.page}>
        <ErrorState
          title="メモを読み込めませんでした"
          description="接続を確認してください。"
          onRetry={() => void noteQuery.refetch()}
        />
      </div>
    );
  }

  if (noteQuery.isPending) {
    return (
      <div className={styles.page}>
        <Skeleton lineCount={5} hasBlock />
      </div>
    );
  }

  return (
    <div className={[styles.page, moduleThemeClass('notes')].join(' ')}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/notes')}>
          <Icon name="chevronLeft" size={14} />
          メモ
        </button>
        <span className={styles.savedState}>
          {saveMutation.isPending
            ? '保存中…'
            : savedAt
              ? `保存済み ${formatFullDate(savedAt)}`
              : '未保存の変更は自動保存されます'}
        </span>
        <div className={styles.headerActions}>
          <Button
            variant={isPinned ? 'primary' : 'secondary'}
            size="sm"
            icon={PinIcon}
            onClick={() => {
              setIsPinned((current) => !current);
              markDirty();
            }}
          >
            {isPinned ? 'ピン留め中' : 'ピン留め'}
          </Button>
        </div>
      </header>

      <input
        className={styles.titleInput}
        value={title}
        placeholder="タイトル"
        aria-label="メモのタイトル"
        onChange={(event) => {
          setTitle(event.target.value);
          markDirty();
        }}
      />

      <div className={styles.toolbar} role="toolbar" aria-label="入力支援">
        <Button variant="text" size="sm" icon={CheckIcon} onClick={insertChecklist}>
          チェックリスト
        </Button>
        <span className={styles.toolbarHint}>Markdown で書けます(- [ ] でチェックリスト)</span>
      </div>

      <textarea
        ref={bodyRef}
        className={styles.bodyInput}
        value={body}
        placeholder="- [ ] 洗剤を買う"
        aria-label="メモの本文"
        onChange={(event) => {
          setBody(event.target.value);
          markDirty();
        }}
      />
    </div>
  );
}
