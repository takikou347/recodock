import { BookOpenIcon, HistoryIcon, ImageIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/core/auth';
import { Page, PageHeader, PageToolbar } from '@/core/PageLayout';
import { cn } from '@/lib/utils';
import { DiaryDetail } from '@/modules/diary/DiaryDetail';
import {
  useCreateDiary,
  useDeleteDiary,
  useDiaries,
  useDiary,
  useDiaryOneYearAgo,
} from '@/modules/diary/useDiaries';

/**
 * DIA-40 日記一覧 ＋ DIA-41 日記詳細(2ペイン)。
 * 左の一覧で選ぶと右に本文を出す。SP では一覧の下に本文を積む。
 */
export function DiaryListPage() {
  const navigate = useNavigate();
  const { diaryId } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { diaries, isLoading, isError } = useDiaries(keyword);
  const selected = useDiary(diaryId ?? diaries[0]?.id);
  const deleteDiary = useDeleteDiary();
  const createDiary = useCreateDiary(user?.id);
  const oneYearAgo = useDiaryOneYearAgo(new Date());

  const onCreate = async () => {
    const now = new Date();
    const entryDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const created = await createDiary.mutateAsync({ entryDate, body: '' });
    navigate(`/diary/${created.id}/edit`);
  };

  const onDelete = async () => {
    if (!selected) return;
    setIsDeleteOpen(false);
    await deleteDiary.mutateAsync(selected.id);
    showToast({ message: '日記を削除しました' });
    navigate('/diary');
  };

  return (
    <Page>
      <PageHeader
        title="日記"
        meta={isLoading ? undefined : `${diaries.length} 件`}
        actions={
          <Button variant="primary" size="sm" icon={PlusIcon} onClick={() => void onCreate()}>
            新規日記
          </Button>
        }
      />

      <PageToolbar>
        <SearchField
          value={keyword}
          onValueChange={setKeyword}
          ariaLabel="日記を絞り込み"
          placeholder="キーワード・気分タグで絞り込み"
          className="w-full sm:max-w-xs"
        />
        {oneYearAgo ? (
          <Button
            variant="text"
            size="sm"
            icon={HistoryIcon}
            className="max-w-full"
            onClick={() => navigate(`/diary/${oneYearAgo.id}`)}
          >
            <span className="min-w-0 truncate">1年前の今日: {oneYearAgo.title}</span>
          </Button>
        ) : null}
      </PageToolbar>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          {isError ? (
            <ErrorState title="日記を読み込めませんでした" description="接続を確認してください。" />
          ) : isLoading ? (
            <Skeleton lineCount={4} hasBlock />
          ) : diaries.length === 0 ? (
            // 検索で 0 件なのか、まだ 1 件も書いていないのかで次にすべきことが違う
            keyword ? (
              <EmptyState
                icon={SearchIcon}
                title="一致する日記がありません"
                description="キーワードを変えてみてください"
              />
            ) : (
              <EmptyState
                icon={BookOpenIcon}
                title="まだ日記がありません"
                description="今日あったことから書きはじめましょう"
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlusIcon}
                    onClick={() => void onCreate()}
                  >
                    新規日記
                  </Button>
                }
              />
            )
          ) : (
            diaries.map((diary) => (
              <Card
                key={diary.id}
                isRow
                className={cn('min-w-0', diary.id === selected?.id && 'border-primary bg-muted/50')}
                onClick={() => navigate(`/diary/${diary.id}`)}
              >
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span className="shrink-0">{diary.date}</span>
                  <Badge variant="outline">{diary.mood}</Badge>
                  {diary.photoCount > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <ImageIcon className="size-3" aria-hidden="true" />
                      {diary.photoCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate text-sm font-medium">{diary.title}</span>
                <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-sm">
                  {diary.excerpt}
                </span>
              </Card>
            ))
          )}
        </div>

        {selected ? (
          <DiaryDetail
            diary={selected}
            onEdit={() => navigate(`/diary/${selected.id}/edit`)}
            onDelete={() => setIsDeleteOpen(true)}
          />
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="日記を削除しますか？"
        description={`「${selected?.title ?? ''}」を削除します。30日間はゴミ箱から戻せます。`}
        confirmLabel="削除する"
        onConfirm={() => void onDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </Page>
  );
}
