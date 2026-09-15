import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, ChevronLeftIcon, PinIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { notesRepo } from '@recodock/shared';

import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { Page } from '@/core/PageLayout';
import { supabase } from '@/lib/supabase';

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
  const [hasSaved, setHasSaved] = useState(false);
  const isDirty = useRef(false);
  const loadedId = useRef<string | undefined>(undefined);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      notesRepo.update(supabase, noteId ?? '', { title: title.trim(), body, isPinned }),
    onSuccess: () => {
      setHasSaved(true);
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
      <Page>
        <ErrorState
          title="メモを読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
          onRetry={() => void noteQuery.refetch()}
        />
      </Page>
    );
  }

  if (noteQuery.isPending) {
    return (
      <Page>
        <Skeleton lineCount={5} hasBlock />
      </Page>
    );
  }

  // 保存状態の文言は日記エディタと揃える(監査: 同じ状態を別の言い方にしない)
  const savedLabel = saveMutation.isPending
    ? '保存中…'
    : hasSaved
      ? '保存しました'
      : '自動保存されます';

  return (
    <Page>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="text" size="sm" icon={ChevronLeftIcon} onClick={() => navigate('/notes')}>
          メモ
        </Button>
        <span className="text-muted-foreground text-sm" role="status" aria-live="polite">
          {savedLabel}
        </span>
        <Button
          variant={isPinned ? 'primary' : 'secondary'}
          size="sm"
          icon={PinIcon}
          className="ml-auto"
          onClick={() => {
            setIsPinned((current) => !current);
            markDirty();
          }}
        >
          {isPinned ? 'ピン留め中' : 'ピン留め'}
        </Button>
      </div>

      <input
        className="font-heading placeholder:text-muted-foreground w-full border-0 bg-transparent text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
        value={title}
        placeholder="タイトル"
        aria-label="メモのタイトル"
        onChange={(event) => {
          setTitle(event.target.value);
          markDirty();
        }}
      />

      <div
        className="flex flex-wrap items-center gap-3 border-y py-1"
        role="toolbar"
        aria-label="入力支援"
      >
        <Button variant="text" size="sm" icon={CheckIcon} onClick={insertChecklist}>
          チェックリスト
        </Button>
        <span className="text-muted-foreground text-xs">
          Markdown で書けます(- [ ] でチェックリスト)
        </span>
      </div>

      {/* 書くことに集中する面なので枠を持たせない(共通 Textarea は枠と自動伸長が前提) */}
      <textarea
        ref={bodyRef}
        className="placeholder:text-muted-foreground min-h-[50vh] flex-1 resize-none border-0 bg-transparent font-mono text-base leading-8 outline-none"
        value={body}
        placeholder="本文を書く"
        aria-label="メモの本文"
        onChange={(event) => {
          setBody(event.target.value);
          markDirty();
        }}
      />
    </Page>
  );
}
