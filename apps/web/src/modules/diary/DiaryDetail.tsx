import { ImageIcon, MapPinIcon } from 'lucide-react';

import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { DiaryBlock, DiarySummary } from '@/modules/diary/useDiaries';
import { useDiaryPhotoUrls } from '@/modules/diary/useDiaries';

export interface DiaryDetailProps {
  diary: DiarySummary;
  onEdit: () => void;
  onDelete: () => void;
}

/** DIA-41 日記詳細。本文の流れの中に写真を置く。 */
export function DiaryDetail({ diary, onEdit, onDelete }: DiaryDetailProps) {
  const photoUrls = useDiaryPhotoUrls(diary.id);

  return (
    <article className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{diary.fullDate}</p>
          <h2 className="font-heading mt-0.5 text-lg font-semibold tracking-tight">
            {diary.title}
          </h2>
        </div>
        <div className="ml-auto flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            編集
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            削除
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{diary.mood}</Badge>
        {diary.placeTag ? (
          <Badge variant="outline">
            <MapPinIcon aria-hidden="true" />
            {diary.placeTag}
          </Badge>
        ) : null}
      </div>

      <Separator />

      {/* 回り込みの画像(float)を含むので、ブロックの縦並びは flex ではなく通常フローで組む */}
      <div className="space-y-3 text-sm leading-relaxed after:block after:clear-both after:content-['']">
        {diary.blocks.map((block) => (
          <DiaryBlockView
            key={block.id}
            block={block}
            photoUrl={block.kind === 'image' ? photoUrls[block.assetId] : undefined}
          />
        ))}
      </div>
    </article>
  );
}

interface DiaryBlockViewProps {
  block: DiaryBlock;
  /** 画像ブロックの署名 URL(取得前は undefined でプレースホルダを出す) */
  photoUrl?: string;
}

/** 本文ブロックの表示。画像は配置(full / center / wrap)に応じて幅と回り込みを変える。 */
function DiaryBlockView({ block, photoUrl }: DiaryBlockViewProps) {
  switch (block.kind) {
    case 'text':
      return <p className="break-words whitespace-pre-wrap">{block.text}</p>;
    case 'heading':
      return block.level === 1 ? (
        <h3 className="font-heading text-base font-semibold tracking-tight">{block.text}</h3>
      ) : (
        <h4 className="font-heading text-sm font-semibold tracking-tight">{block.text}</h4>
      );
    case 'list':
      return (
        <ul className="text-muted-foreground list-disc pl-5">
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      );
    case 'image':
      return (
        <figure
          className={cn(
            'my-1',
            block.align === 'wrap'
              ? 'float-left mr-4 mb-2 w-40'
              : block.align === 'center'
                ? 'mx-auto w-3/5'
                : 'w-full',
          )}
        >
          {photoUrl ? (
            <img
              className="w-full rounded-lg border object-cover"
              src={photoUrl}
              alt={block.caption || block.fileName}
            />
          ) : (
            <div className="text-muted-foreground flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-dashed">
              <ImageIcon className="size-5" aria-hidden="true" />
              <span className="max-w-full truncate px-2 text-xs">{block.fileName}</span>
            </div>
          )}
          {block.caption ? (
            <figcaption className="text-muted-foreground mt-1 text-xs">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
  }
}
