import { useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  ChevronLeftIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Redo2Icon,
  Trash2Icon,
  Undo2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AppError, formatTime, queryKeys, storageRepo } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import { Button as UiButton } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/core/auth';
import { Page, PageHeader } from '@/core/PageLayout';
import { supabase } from '@/lib/supabase';
import { nextBlockId } from '@/modules/diary/blockOps';
import { BlockRow } from '@/modules/diary/DiaryBlockEditor';
import type { BlockUpdater } from '@/modules/diary/editorState';
import { editorReducer, INITIAL_EDITOR } from '@/modules/diary/editorState';
import type { DiaryBlock } from '@/modules/diary/useDiaries';
import {
  serializeBlocks,
  useDeleteDiary,
  useDiary,
  useDiaryPhotoUrls,
  useSaveDiary,
} from '@/modules/diary/useDiaries';

/** 入力が止まってから保存するまでの待ち時間(自動保存)。 */
const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * DIA-42 日記エディタ(リッチエディタ)。
 * ブロック配列で本文を保持し、ホバーでハンドル、「/」でスラッシュメニューを出す。
 * 画像は配置(幅いっぱい / 中央 / 回り込み)とキャプションを持つ。入力が止まると自動保存する。
 */
export function DiaryEditorPage() {
  const navigate = useNavigate();
  const { diaryId } = useParams();
  const diary = useDiary(diaryId);
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const photoUrls = useDiaryPhotoUrls(diary?.id);

  const [title, setTitle] = useState('');
  const [editor, dispatch] = useReducer(editorReducer, INITIAL_EDITOR);
  const [selectedImageId, setSelectedImageId] = useState<string>();
  const [slashBlockId, setSlashBlockId] = useState<string>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const saveDiary = useSaveDiary();
  const deleteDiary = useDeleteDiary();
  const isDirty = useRef(false);
  const loadedDiaryId = useRef<string | undefined>(undefined);
  const photoInputRef = useRef<HTMLInputElement>(null);
  /** 写真を入れる位置。スラッシュメニューから開いたときだけ入る(未指定なら末尾) */
  const photoTargetBlockId = useRef<string | undefined>(undefined);

  const apply = useCallback((updater: BlockUpdater) => {
    dispatch({ type: 'apply', updater });
    isDirty.current = true;
  }, []);

  // 外部システム(サーバー)との同期: 取得できた日記をエディタへ読み込む
  useEffect(() => {
    if (!diary || loadedDiaryId.current === diary.id) return;
    loadedDiaryId.current = diary.id;
    setTitle(diary.title);
    dispatch({ type: 'load', blocks: diary.blocks });
    isDirty.current = false;
  }, [diary]);

  // 外部システム(サーバー)との同期: 入力が止まったら本文を保存する
  useEffect(() => {
    if (!diary || !isDirty.current) return;
    const timer = setTimeout(() => {
      isDirty.current = false;
      const body = [title, serializeBlocks(editor.blocks)].filter(Boolean).join('\n\n');
      saveDiary.mutate(
        { diaryId: diary.id, input: { body } },
        { onSuccess: () => setSavedAt(new Date()) },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, editor.blocks, diary, saveDiary]);

  // 外部システム(document のクリック)との同期: 余白クリックで選択・メニューを解除する
  useEffect(() => {
    const onPointerDown = () => {
      setSlashBlockId(undefined);
      setSelectedImageId(undefined);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const requestPhoto = (afterBlockId?: string) => {
    photoTargetBlockId.current = afterBlockId;
    photoInputRef.current?.click();
  };

  // 写真を Storage(diary-photos。user_id プレフィックス: NFR-S4)へ上げ、本文へ画像ブロックを足す
  const onPickPhoto = async (file: File) => {
    if (!diary || !user) return;
    setIsUploading(true);
    try {
      const uploaded = await storageRepo.uploadPhoto(supabase, 'diary-photos', user.id, file);
      const photo = await storageRepo.addDiaryPhoto(supabase, user.id, diary.id, uploaded.path, 0);
      void queryClient.invalidateQueries({ queryKey: queryKeys.diary.photos(diary.id) });
      const targetId = photoTargetBlockId.current;
      photoTargetBlockId.current = undefined;
      const image: DiaryBlock = {
        id: nextBlockId(),
        kind: 'image',
        assetId: photo.id,
        fileName: file.name,
        align: 'full',
        caption: '',
      };
      apply((current) => {
        const index = targetId ? current.findIndex((block) => block.id === targetId) : -1;
        if (index < 0) return [...current, image];
        const next = [...current];
        next.splice(index + 1, 0, image);
        return next;
      });
      showToast({ message: '写真を追加しました' });
    } catch (error) {
      showToast({
        message: error instanceof AppError ? error.message : '写真のアップロードに失敗しました',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDelete = async () => {
    if (!diary) return;
    setIsDeleteOpen(false);
    await deleteDiary.mutateAsync(diary.id);
    showToast({ message: '日記を削除しました' });
    navigate('/diary');
  };

  const moveBlock = (blockId: string, offset: -1 | 1) => {
    apply((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(target, 0, moved);
      return next;
    });
  };

  const savedLabel = saveDiary.isPending
    ? '保存中…'
    : savedAt
      ? `保存済み ${formatTime(savedAt)}`
      : '未保存';

  return (
    <Page>
      <div>
        <Button
          variant="text"
          size="sm"
          icon={ChevronLeftIcon}
          className="-ml-2"
          onClick={() => navigate('/diary')}
        >
          日記
        </Button>
      </div>

      <PageHeader
        title={diary?.headingDate ?? '日記'}
        meta={
          <span className="inline-flex items-center gap-1">
            {savedAt && !saveDiary.isPending ? (
              <CheckIcon className="size-3" aria-hidden="true" />
            ) : null}
            {savedLabel}
          </span>
        }
        actions={
          <>
            <UiButton
              variant="ghost"
              size="icon-sm"
              aria-label="元に戻す"
              disabled={editor.past.length === 0}
              onClick={() => {
                dispatch({ type: 'undo' });
                isDirty.current = true;
              }}
            >
              <Undo2Icon />
            </UiButton>
            <UiButton
              variant="ghost"
              size="icon-sm"
              aria-label="やり直す"
              disabled={editor.future.length === 0}
              onClick={() => {
                dispatch({ type: 'redo' });
                isDirty.current = true;
              }}
            >
              <Redo2Icon />
            </UiButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UiButton variant="outline" size="icon-sm" aria-label="その他の操作">
                  <MoreHorizontalIcon />
                </UiButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteOpen(true)}>
                  <Trash2Icon />
                  日記を削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="mx-auto w-full max-w-3xl min-w-0">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <span>{diary?.fullDate}</span>
            {diary ? <Badge variant="outline">{diary.mood}</Badge> : null}
            {diary?.placeTag ? (
              <Badge variant="outline">
                <MapPinIcon aria-hidden="true" />
                {diary.placeTag}
              </Badge>
            ) : null}
          </div>

          <Input
            className="font-heading mt-2 h-auto rounded-none border-0 bg-transparent px-0 py-1 text-2xl font-semibold tracking-tight shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-2xl dark:bg-transparent"
            value={title}
            placeholder="タイトル"
            aria-label="日記のタイトル"
            onChange={(event) => {
              isDirty.current = true;
              setTitle(event.target.value);
            }}
          />

          <div className="mt-2 flex flex-col">
            {editor.blocks.map((block, index) => (
              <BlockRow
                key={block.id}
                block={block}
                photoUrl={block.kind === 'image' ? photoUrls[block.assetId] : undefined}
                isSlashOpen={slashBlockId === block.id}
                isImageSelected={selectedImageId === block.id}
                canMoveUp={index > 0}
                canMoveDown={index < editor.blocks.length - 1}
                onChange={(next) =>
                  apply((current) => current.map((item) => (item.id === block.id ? next : item)))
                }
                onInsertAfter={(created) =>
                  apply((current) => {
                    const at = current.findIndex((item) => item.id === block.id);
                    const next = [...current];
                    next.splice(at + 1, 0, created);
                    return next;
                  })
                }
                onMove={(offset) => moveBlock(block.id, offset)}
                onRemove={() => {
                  apply((current) => current.filter((item) => item.id !== block.id));
                  setSelectedImageId(undefined);
                }}
                onOpenSlash={() => setSlashBlockId(block.id)}
                onCloseSlash={() => setSlashBlockId(undefined)}
                onSelectImage={() => setSelectedImageId(block.id)}
                onRequestPhoto={() => requestPhoto(block.id)}
              />
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <Card>
            <p className="text-sm font-medium">写真</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {isUploading ? 'アップロード中…' : '追加した写真は本文の画像ブロックになります'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(photoUrls).map(([assetId, url]) => (
                <img
                  key={assetId}
                  src={url}
                  alt="日記に追加した写真"
                  className="size-14 rounded-md border object-cover"
                />
              ))}
              <UiButton
                variant="outline"
                size="icon-lg"
                className="size-14"
                aria-label="写真を追加"
                disabled={isUploading}
                onClick={() => requestPhoto()}
              >
                <PlusIcon />
              </UiButton>
            </div>
          </Card>
        </aside>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        aria-label="写真ファイルを選択"
        onChange={(changeEvent) => {
          const file = changeEvent.target.files?.[0];
          changeEvent.target.value = '';
          if (file) void onPickPhoto(file);
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="日記を削除しますか？"
        description={`「${diary?.title ?? ''}」を削除します。30日間はゴミ箱から戻せます。`}
        confirmLabel="削除する"
        onConfirm={() => void onDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </Page>
  );
}
