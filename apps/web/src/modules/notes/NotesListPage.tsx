import { PlusIcon, StickyNoteIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { QuickCreateModal } from '../../components/QuickCreateModal';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { useCreateNote, useNotes } from './useNotes';

import layout from '../../core/pageLayout.module.css';
import styles from './NotesListPage.module.css';

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
    <div className={[layout.page, moduleThemeClass('notes')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>メモ</h1>
        <span className={layout.count}>{totalCount}件</span>
        <div className={layout.actions}>
          <Button variant="primary" icon={PlusIcon} onClick={() => setIsCreateOpen(true)}>
            新規メモ
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState title="メモを読み込めませんでした" description="接続を確認してください。" />
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
            <section className={styles.group}>
              <h2 className={[layout.sectionLabel, styles.pinnedLabel].join(' ')}>
                <Icon name="pin" size={13} />
                ピン留め
              </h2>
              <div className={styles.pinnedGrid}>
                {pinnedNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={styles.pinnedCard}
                    onClick={() => navigate(`/notes/${note.id}`)}
                  >
                    <span className={styles.pinnedHead}>
                      <span className={styles.pinnedTitle}>{note.title}</span>
                      <span className={styles.pinIcon}>
                        <Icon name="pin" size={14} />
                      </span>
                    </span>
                    <p className={styles.excerpt}>{note.excerpt}</p>
                    <span className={styles.date}>{note.date}</span>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.group}>
            <h2 className={layout.sectionLabel}>すべてのメモ</h2>
            <Card isFlush>
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={styles.row}
                  onClick={() => navigate(`/notes/${note.id}`)}
                >
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{note.title}</span>
                    <span className={styles.rowExcerpt}>{note.excerpt}</span>
                  </span>
                  <span className={styles.rowDate}>{note.date}</span>
                </button>
              ))}
            </Card>
          </section>
        </>
      )}

      <QuickCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="新規メモ"
        icon={StickyNoteIcon}
        fieldLabel="メモのタイトル"
        placeholder="鴨川で読む本リスト"
        isSaving={createNote.isPending}
        onSubmit={onCreate}
      />
    </div>
  );
}
