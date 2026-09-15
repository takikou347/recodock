import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  ListIcon,
  type LucideIcon,
  PlusIcon,
  Trash2Icon,
  TypeIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

import { SegmentedControl, type SegmentedOption } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { BlockKind } from '@/modules/diary/blockOps';
import { blockKindOf, changeBlockKind, createBlock, nextBlockId } from '@/modules/diary/blockOps';
import type { DiaryBlock, ImageAlign } from '@/modules/diary/useDiaries';

/** 種類の選択肢。スラッシュメニューとブロックメニューで同じ並びを使う。 */
const BLOCK_KINDS: readonly {
  kind: BlockKind;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { kind: 'text', label: 'テキスト', description: 'そのまま書きはじめる', icon: TypeIcon },
  { kind: 'heading1', label: '見出し1', description: 'セクションの大見出し', icon: Heading1Icon },
  { kind: 'heading2', label: '見出し2', description: '節の小見出し', icon: Heading2Icon },
  { kind: 'list', label: '箇条書き', description: '行ごとに項目を並べる', icon: ListIcon },
];

const IMAGE_ALIGN_OPTIONS: readonly SegmentedOption<ImageAlign>[] = [
  { value: 'full', label: '幅いっぱい' },
  { value: 'center', label: '中央' },
  { value: 'wrap', label: '回り込み' },
];

export interface BlockRowProps {
  block: DiaryBlock;
  /** 画像ブロックの署名 URL(取得前・失効時は undefined) */
  photoUrl?: string;
  isSlashOpen: boolean;
  isImageSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (block: DiaryBlock) => void;
  onInsertAfter: (block: DiaryBlock) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onOpenSlash: () => void;
  onCloseSlash: () => void;
  onSelectImage: () => void;
  /** 写真の選択ダイアログを開く(スラッシュメニューの「画像」) */
  onRequestPhoto: () => void;
}

/** 1 ブロック。ホバー・フォーカスで左に ＋ と操作メニューのハンドルが出る。 */
export function BlockRow({
  block,
  photoUrl,
  isSlashOpen,
  isImageSelected,
  canMoveUp,
  canMoveDown,
  onChange,
  onInsertAfter,
  onMove,
  onRemove,
  onOpenSlash,
  onCloseSlash,
  onSelectImage,
  onRequestPhoto,
}: BlockRowProps) {
  const kind = blockKindOf(block);

  return (
    <div
      className="group relative flex items-start gap-1"
      // 余白クリックでメニューを閉じる仕掛け(ページ側の mousedown)を、行の中では効かせない
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex shrink-0 gap-0.5 pt-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="下にブロックを追加"
          onClick={() => onInsertAfter(createBlock('text', nextBlockId()))}
        >
          <PlusIcon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="ブロックの操作">
              <GripVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onMove(-1)}>
              <ArrowUpIcon />
              上へ移動
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onMove(1)}>
              <ArrowDownIcon />
              下へ移動
            </DropdownMenuItem>
            {kind ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>種類を変える</DropdownMenuLabel>
                {BLOCK_KINDS.map((option) => (
                  <DropdownMenuItem
                    key={option.kind}
                    disabled={option.kind === kind}
                    onSelect={() => onChange(changeBlockKind(block, option.kind))}
                  >
                    <option.icon />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2Icon />
              このブロックを削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex-1">
        {block.kind === 'image' ? (
          <ImageBlock
            block={block}
            photoUrl={photoUrl}
            isSelected={isImageSelected}
            onSelect={onSelectImage}
            onChange={onChange}
            onRemove={onRemove}
          />
        ) : (
          <TextBlock
            block={block}
            onChange={onChange}
            onOpenSlash={onOpenSlash}
            onCloseSlash={onCloseSlash}
          />
        )}
      </div>

      {isSlashOpen ? (
        <SlashMenu
          onSelectKind={(selected) => {
            onChange(changeBlockKind(block, selected));
            onCloseSlash();
          }}
          onSelectPhoto={() => {
            onRequestPhoto();
            onCloseSlash();
          }}
        />
      ) : null}
    </div>
  );
}

interface TextBlockProps {
  block: Extract<DiaryBlock, { kind: 'text' | 'heading' | 'list' }>;
  onChange: (block: DiaryBlock) => void;
  onOpenSlash: () => void;
  onCloseSlash: () => void;
}

/** テキスト・見出し・箇条書きのブロック。入力に応じて高さを自動調整する。 */
function TextBlock({ block, onChange, onOpenSlash, onCloseSlash }: TextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const value = block.kind === 'list' ? block.items.join('\n') : block.text;

  // 外部システム(レイアウト)との同期: 内容に合わせて高さを揃える
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  const onInput = (nextValue: string) => {
    // 「/」だけ入力されたらスラッシュメニューを開く
    if (nextValue === '/') onOpenSlash();
    else onCloseSlash();

    if (block.kind === 'list') onChange({ ...block, items: nextValue.split('\n') });
    else onChange({ ...block, text: nextValue });
  };

  return (
    <Textarea
      ref={textareaRef}
      rows={1}
      className={cn(
        'field-sizing-fixed min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent px-0 py-1 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent',
        block.kind === 'heading' &&
          (block.level === 1
            ? 'font-heading text-xl font-semibold md:text-xl'
            : 'font-heading text-base font-semibold md:text-base'),
        block.kind === 'list' && 'pl-4',
      )}
      value={value}
      placeholder="「/」でブロックを追加"
      aria-label="本文"
      onChange={(event) => onInput(event.target.value)}
    />
  );
}

interface ImageBlockProps {
  block: Extract<DiaryBlock, { kind: 'image' }>;
  /** 署名 URL(取得前は undefined でプレースホルダを出す) */
  photoUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (block: DiaryBlock) => void;
  onRemove: () => void;
}

/** 画像ブロック。選ぶと配置の切り替えと削除が出る。 */
function ImageBlock({
  block,
  photoUrl,
  isSelected,
  onSelect,
  onChange,
  onRemove,
}: ImageBlockProps) {
  return (
    <div className="flex flex-col gap-2 py-1">
      {isSelected ? (
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={IMAGE_ALIGN_OPTIONS}
            value={block.align}
            onChange={(align) => onChange({ ...block, align })}
            ariaLabel="画像の配置"
          />
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2Icon />
            削除
          </Button>
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          'focus-visible:ring-ring/50 block overflow-hidden rounded-lg border text-left focus-visible:ring-[3px] focus-visible:outline-none',
          isSelected && 'border-primary',
          block.align === 'wrap' ? 'w-40' : block.align === 'center' ? 'w-3/5' : 'w-full',
        )}
        aria-label={`画像 ${block.fileName}`}
        aria-pressed={isSelected}
        onClick={onSelect}
      >
        {photoUrl ? (
          <img
            className="w-full object-cover"
            src={photoUrl}
            alt={block.caption || block.fileName}
          />
        ) : (
          <span className="text-muted-foreground flex aspect-video flex-col items-center justify-center gap-1 border-dashed">
            <ImageIcon className="size-6" aria-hidden="true" />
            <span className="max-w-full truncate px-2 text-xs">{block.fileName}</span>
          </span>
        )}
      </button>

      <Input
        className="h-7 rounded-none border-0 bg-transparent px-0 text-xs shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
        value={block.caption}
        placeholder="キャプションを追加"
        aria-label="画像のキャプション"
        onChange={(event) => onChange({ ...block, caption: event.target.value })}
      />
    </div>
  );
}

interface SlashMenuProps {
  onSelectKind: (kind: BlockKind) => void;
  onSelectPhoto: () => void;
}

/** 「/」で開くブロック追加メニュー。保存形式が持てる種類と、写真の追加だけを出す。 */
function SlashMenu({ onSelectKind, onSelectPhoto }: SlashMenuProps) {
  return (
    <div
      role="menu"
      aria-label="ブロックを追加"
      className="bg-popover text-popover-foreground absolute top-full left-10 z-20 mt-1 w-60 rounded-lg border p-1 shadow-md"
    >
      {BLOCK_KINDS.map((option) => (
        <SlashItem
          key={option.kind}
          icon={option.icon}
          label={option.label}
          description={option.description}
          onClick={() => onSelectKind(option.kind)}
        />
      ))}
      <SlashItem
        icon={ImageIcon}
        label="画像"
        description="写真を選んで貼り付ける"
        onClick={onSelectPhoto}
      />
    </div>
  );
}

interface SlashItemProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

function SlashItem({ icon: Icon, label, description, onClick }: SlashItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left focus-visible:outline-none"
      onClick={onClick}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="text-muted-foreground block truncate text-xs">{description}</span>
      </span>
    </button>
  );
}
