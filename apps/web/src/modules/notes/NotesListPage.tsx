import { PinIcon, PlusIcon, StickyNoteIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { QuickCreateModal } from '@/components/QuickCreateModal';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/core/auth';
import { Page, PageHeader } from '@/core/PageLayout';
import { useCreateNote, useNotes } from '@/modules/notes/useNotes';

/** MEM-60 メモ一覧。ピン留めを上に、残りをリストで並べる。 */
export function NotesListPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { pinnedNotes, notes, totalCount, isLoading, isError } = useNotes();
  const createNote = useCreateNote(user?.id);
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const onCreate = async (title: string) => {
    const created = await createNote.mutateAsync({ title, body: '' });
    showToast({ message: 'メモを作成しました' });
    navigate(`/notes/${created.id}`);
  };

  return (
    <Page>
      <PageHeader
        title="メモ"
        meta={`${totalCount} 件`}
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setIsCreateOpen(true)}>
            新規メモ
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="メモを読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={StickyNoteIcon}
          title="まだメモがありません"
          description="Markdown で書けます。よく使うメモはピン留めできます"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={PlusIcon}
              onClick={() => setIsCreateOpen(true)}
            >
              新規メモ
            </Button>
          }
        />
      ) : (
        <>
          {pinnedNotes.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <PinIcon className="size-3.5" aria-hidden="true" />
                ピン留め
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {pinnedNotes.map((note) => (
                  <Card key={note.id} onClick={() => navigate(`/notes/${note.id}`)}>
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium">{note.title}</span>
                      <PinIcon
                        className="text-muted-foreground size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-muted-foreground mt-1.5 line-clamp-2 block text-sm">
                      {note.excerpt}
                    </span>
                    <span className="text-muted-foreground mt-2 block font-mono text-xs tabular-nums">
                      {note.date}
                    </span>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {notes.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-medium">すべてのメモ</h2>
              <Card isFlush className="overflow-hidden">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    className="hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 focus-visible:ring-[3px] focus-visible:outline-none"
                    onClick={() => navigate(`/notes/${note.id}`)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{note.title}</span>
                      <span className="text-muted-foreground block truncate text-sm">
                        {note.excerpt}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                      {note.date}
                    </span>
                  </button>
                ))}
              </Card>
            </section>
          ) : null}
        </>
      )}

      <QuickCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="新規メモ"
        icon={StickyNoteIcon}
        fieldLabel="メモのタイトル"
        isSaving={createNote.isPending}
        onSubmit={onCreate}
      />
    </Page>
  );
}
