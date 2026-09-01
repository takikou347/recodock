import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatTime } from '@recodock/shared';

import type { IconName } from '../../components/icons/Icon';
import { Icon } from '../../components/icons/Icon';
import { useToast } from '../../components/Toast';
import { moduleThemeClass } from '../../lib/moduleTheme';
import type { DiaryBlock, ImageAlign } from './useDiaries';
import { serializeBlocks, useDiary, useSaveDiary } from './useDiaries';

import styles from './DiaryEditorPage.module.css';

/** スラッシュメニューで追加できるブロック。 */
interface SlashCommand {
  id: string;
  /** アイコンの代わりに出す短いラベル(Aa / H1) */
  glyph?: string;
  icon?: IconName;
  label: string;
  description: string;
  createBlock: (id: string) => DiaryBlock;
}

const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: 'text',
    glyph: 'Aa',
    label: 'テキスト',
    description: 'そのまま書きはじめる',
    createBlock: (id) => ({ id, kind: 'text', text: '' }),
  },
  {
    id: 'heading',
    glyph: 'H1',
    label: '見出し',
    description: 'セクションの大見出し',
    createBlock: (id) => ({ id, kind: 'heading', level: 1, text: '' }),
  },
  {
    id: 'list',
    icon: 'list',
    label: '箇条書き',
    description: 'リストを作成する',
    createBlock: (id) => ({ id, kind: 'list', items: [''] }),
  },
  {
    id: 'checklist',
    icon: 'check',
    label: 'チェックリスト',
    description: 'ToDo を管理する',
    createBlock: (id) => ({ id, kind: 'list', items: [''] }),
  },
  {
    id: 'image',
    icon: 'image',
    label: '画像',
    description: 'アップロード・貼り付け',
    createBlock: (id) => ({
      id,
      kind: 'image',
      assetId: `asset-${id}`,
      fileName: 'IMG_new.jpg',
      align: 'full',
      caption: '',
    }),
  },
  {
    id: 'place',
    icon: 'map',
    label: '場所',
    description: '地図のスポットを埋め込む',
    createBlock: (id) => ({ id, kind: 'text', text: '📍 鴨川 三条' }),
  },
];

const IMAGE_ALIGN_OPTIONS: readonly { value: ImageAlign; label: string }[] = [
  { value: 'full', label: '幅いっぱい' },
  { value: 'center', label: '中央' },
  { value: 'wrap', label: '回り込み' },
];

let blockIdCounter = 0;
function nextBlockId(): string {
  blockIdCounter += 1;
  return `b-new-${blockIdCounter}`;
}

/** 入力が止まってから保存するまでの待ち時間(自動保存)。 */
const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * DIA-42 日記エディタ(リッチエディタ)。
 * ブロック配列で本文を保持し、ホバーでハンドル、テキスト選択でバブル、
 * 「/」でスラッシュメニューを出す。画像は配置(幅いっぱい / 中央 / 回り込み)とキャプションを持つ。
 * 入力が止まると自動保存する。
 */
export function DiaryEditorPage() {
  const navigate = useNavigate();
  const { diaryId } = useParams();
  const diary = useDiary(diaryId);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<readonly DiaryBlock[]>([]);
  const [history, setHistory] = useState<readonly (readonly DiaryBlock[])[]>([]);
  const loadedDiaryId = useRef<string | undefined>(undefined);
  const [hoveredBlockId, setHoveredBlockId] = useState<string>();
  const [selectedImageId, setSelectedImageId] = useState<string>();
  const [bubbleBlockId, setBubbleBlockId] = useState<string>();
  const [slashBlockId, setSlashBlockId] = useState<string>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saveDiary = useSaveDiary();
  const isDirty = useRef(false);

  const commit = useCallback(
    (updater: (current: readonly DiaryBlock[]) => readonly DiaryBlock[]) => {
      setBlocks((current) => {
        setHistory((past) => [...past, current]);
        return updater(current);
      });
      setSavedAt(new Date());
    },
    [],
  );

  // 外部システム(サーバー)との同期: 取得できた日記をエディタへ読み込む
  useEffect(() => {
    if (!diary || loadedDiaryId.current === diary.id) return;
    loadedDiaryId.current = diary.id;
    setTitle(diary.title);
    setBlocks(diary.blocks);
    isDirty.current = false;
  }, [diary]);

  const undo = () => {
    setHistory((past) => {
      const previous = past[past.length - 1];
      if (!previous) return past;
      setBlocks(previous);
      return past.slice(0, -1);
    });
  };

  const updateBlock = (blockId: string, next: DiaryBlock) => {
    commit((current) => current.map((block) => (block.id === blockId ? next : block)));
  };

  const insertAfter = (blockId: string, block: DiaryBlock) => {
    commit((current) => {
      const index = current.findIndex((item) => item.id === blockId);
      const next = [...current];
      next.splice(index + 1, 0, block);
      return next;
    });
  };

  const removeBlock = (blockId: string) => {
    commit((current) => current.filter((block) => block.id !== blockId));
    setSelectedImageId(undefined);
  };

  // 外部システム(サーバー)との同期: 入力が止まったら本文を保存する
  useEffect(() => {
    if (!diary || !isDirty.current) return;
    const timer = setTimeout(() => {
      isDirty.current = false;
      const body = [title, serializeBlocks(blocks)].filter(Boolean).join('\n\n');
      saveDiary.mutate(
        { diaryId: diary.id, input: { body } },
        { onSuccess: () => setSavedAt(new Date()) },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, blocks, diary, saveDiary]);

  // 外部システム(document のクリック)との同期: 余白クリックで選択・メニューを解除する
  useEffect(() => {
    const onPointerDown = () => {
      setBubbleBlockId(undefined);
      setSlashBlockId(undefined);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className={[styles.root, moduleThemeClass('diary')].join(' ')}>
      <div className={styles.main}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.breadcrumbLink}
            onClick={() => navigate('/diary')}
          >
            <Icon name="chevronLeft" size={14} />
            日記
          </button>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{diary?.headingDate}</span>

          <div className={styles.historyGroup}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="元に戻す"
              disabled={history.length === 0}
              onClick={undo}
            >
              <Icon name="undo" size={17} />
            </button>
            <button type="button" className={styles.iconButton} aria-label="やり直す" disabled>
              <Icon name="redo" size={17} />
            </button>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.savedState}>
              <span className={styles.savedIcon}>
                <Icon name="check" size={14} />
              </span>
              {saveDiary.isPending
                ? '保存中…'
                : savedAt
                  ? `保存済み ${formatTime(savedAt)}`
                  : '未保存'}
            </span>
            <button
              type="button"
              className={styles.moreButton}
              aria-label="その他の操作"
              onClick={() => showToast({ message: 'この日記のメニューを開きます' })}
            >
              <Icon name="dots" size={17} />
            </button>
          </div>
        </header>

        <div className={styles.canvas}>
          <div className={styles.document}>
            <div className={styles.metaRow}>
              <span className={styles.metaDate}>{diary?.fullDate}</span>
              <span className={styles.metaMood}>{diary?.mood}</span>
              <span className={styles.metaPlace}>
                <Icon name="map" size={13} />
                鴨川 三条
              </span>
              <button type="button" className={styles.metaAdd} aria-label="タグを追加">
                <Icon name="plus" size={13} />
              </button>
            </div>

            <input
              className={styles.titleInput}
              value={title}
              placeholder="タイトル"
              aria-label="日記のタイトル"
              onChange={(event) => setTitle(event.target.value)}
            />

            {blocks.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                isHovered={hoveredBlockId === block.id}
                isBubbleOpen={bubbleBlockId === block.id}
                isSlashOpen={slashBlockId === block.id}
                isImageSelected={selectedImageId === block.id}
                onHover={setHoveredBlockId}
                onChange={(next) => updateBlock(block.id, next)}
                onInsertAfter={(created) => insertAfter(block.id, created)}
                onRemove={() => removeBlock(block.id)}
                onOpenSlash={() => setSlashBlockId(block.id)}
                onCloseSlash={() => setSlashBlockId(undefined)}
                onOpenBubble={() => setBubbleBlockId(block.id)}
                onSelectImage={() => setSelectedImageId(block.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <aside className={styles.aside}>
        <h2 className={styles.asideTitle}>この日記の付帯情報</h2>

        <div className={styles.asideCard}>
          <p className={styles.asideLabel}>写真</p>
          <div className={styles.thumbRow}>
            <span className={styles.thumb}>
              <Icon name="image" size={20} />
            </span>
            <button type="button" className={styles.thumbAdd} aria-label="写真を追加">
              <Icon name="plus" size={18} />
            </button>
          </div>
          <p className={styles.asideHint}>サムネイルから本文へドラッグして挿入</p>
        </div>

        <button
          type="button"
          className={styles.asideLink}
          style={
            {
              '--tone-bg': 'var(--color-map-bg)',
              '--tone-line': 'var(--color-map-line)',
              '--tone-fg': 'var(--color-map-fg)',
            } as CSSProperties
          }
        >
          <Icon name="map" size={20} />
          鴨川 三条 を紐付け
        </button>

        <button
          type="button"
          className={styles.asideLink}
          style={
            {
              '--tone-bg': 'var(--color-money-bg)',
              '--tone-line': 'var(--color-money-line)',
              '--tone-fg': 'var(--color-money-fg)',
            } as CSSProperties
          }
        >
          <Icon name="money" size={20} />
          同日の支出 3 件を表示
        </button>

        <p className={styles.asideNote}>
          本文はブロック配列で保存（text / heading / list / image / embed）。画像は{' '}
          <span className={styles.mono}>asset_id</span> 参照で、配置（full / center /
          wrap）とキャプションを持つ。
        </p>
      </aside>
    </div>
  );
}

interface BlockRowProps {
  block: DiaryBlock;
  isHovered: boolean;
  isBubbleOpen: boolean;
  isSlashOpen: boolean;
  isImageSelected: boolean;
  onHover: (blockId: string | undefined) => void;
  onChange: (block: DiaryBlock) => void;
  onInsertAfter: (block: DiaryBlock) => void;
  onRemove: () => void;
  onOpenSlash: () => void;
  onCloseSlash: () => void;
  onOpenBubble: () => void;
  onSelectImage: () => void;
}

/** 1 ブロック。ホバーで左に ＋ と ⠿ のハンドルが出る。 */
function BlockRow({
  block,
  isHovered,
  isBubbleOpen,
  isSlashOpen,
  isImageSelected,
  onHover,
  onChange,
  onInsertAfter,
  onRemove,
  onOpenSlash,
  onCloseSlash,
  onOpenBubble,
  onSelectImage,
}: BlockRowProps) {
  return (
    <div
      className={[styles.block, isHovered ? styles.blockHovered : ''].filter(Boolean).join(' ')}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={() => onHover(undefined)}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {isBubbleOpen ? <SelectionBubble /> : null}

      <div className={styles.gutter}>
        <button
          type="button"
          className={styles.handle}
          aria-label="下にブロックを追加"
          onClick={() => onInsertAfter({ id: nextBlockId(), kind: 'text', text: '' })}
        >
          <Icon name="plus" size={14} />
        </button>
        <button type="button" className={styles.handle} aria-label="ブロックを移動">
          <Icon name="drag" size={14} />
        </button>
      </div>

      <div className={styles.blockBody}>
        {block.kind === 'image' ? (
          <ImageBlock
            block={block}
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
            onOpenBubble={onOpenBubble}
          />
        )}
      </div>

      {isSlashOpen ? (
        <SlashMenu
          onSelect={(command) => {
            onChange(command.createBlock(block.id));
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
  onOpenBubble: () => void;
}

/** テキスト・見出し・箇条書きのブロック。入力に応じて高さを自動調整する。 */
function TextBlock({ block, onChange, onOpenSlash, onCloseSlash, onOpenBubble }: TextBlockProps) {
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

  const headingClass =
    block.kind === 'heading'
      ? [styles.headingInput, block.level === 1 ? styles.heading1Input : styles.heading2Input].join(
          ' ',
        )
      : '';

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      className={[styles.textInput, headingClass].filter(Boolean).join(' ')}
      value={value}
      placeholder="「/」でブロックを追加"
      aria-label="本文"
      onChange={(event) => onInput(event.target.value)}
      onSelect={(event) => {
        const target = event.currentTarget;
        if (target.selectionStart !== target.selectionEnd) onOpenBubble();
      }}
    />
  );
}

/** テキスト選択で出るバブルツールバー(B・I・S・H1/H2・リスト・リンク)。 */
function SelectionBubble() {
  return (
    <div className={styles.bubble} role="toolbar" aria-label="書式">
      <button
        type="button"
        className={[styles.bubbleButton, styles.bubbleBold, styles.bubbleActive].join(' ')}
        aria-label="太字"
      >
        B
      </button>
      <button
        type="button"
        className={[styles.bubbleButton, styles.bubbleItalic].join(' ')}
        aria-label="斜体"
      >
        I
      </button>
      <button
        type="button"
        className={[styles.bubbleButton, styles.bubbleStrike].join(' ')}
        aria-label="打ち消し線"
      >
        S
      </button>
      <span className={styles.bubbleDivider} />
      <button
        type="button"
        className={[styles.bubbleButton, styles.bubbleHeading].join(' ')}
        aria-label="見出し1"
      >
        H1
      </button>
      <button
        type="button"
        className={[styles.bubbleButton, styles.bubbleHeading].join(' ')}
        aria-label="見出し2"
      >
        H2
      </button>
      <span className={styles.bubbleDivider} />
      <button type="button" className={styles.bubbleButton} aria-label="箇条書き">
        <Icon name="list" size={15} />
      </button>
      <button type="button" className={styles.bubbleButton} aria-label="リンク">
        <Icon name="link" size={15} />
      </button>
    </div>
  );
}

interface ImageBlockProps {
  block: Extract<DiaryBlock, { kind: 'image' }>;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (block: DiaryBlock) => void;
  onRemove: () => void;
}

/** 画像ブロック。選択するとリサイズハンドルと配置ツールバーが出る。 */
function ImageBlock({ block, isSelected, onSelect, onChange, onRemove }: ImageBlockProps) {
  const alignClass =
    block.align === 'center'
      ? styles.figureAlignCenter
      : block.align === 'wrap'
        ? styles.figureAlignWrap
        : '';

  return (
    <div className={styles.imageWrap}>
      {isSelected ? (
        <div className={styles.imageToolbar} role="toolbar" aria-label="画像の配置">
          {IMAGE_ALIGN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={[
                styles.imageToolbarButton,
                block.align === option.value ? styles.imageToolbarActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange({ ...block, align: option.value })}
            >
              {option.label}
            </button>
          ))}
          <span className={styles.bubbleDivider} />
          <button type="button" className={styles.imageToolbarButton}>
            置換
          </button>
          <button
            type="button"
            className={[styles.imageToolbarButton, styles.imageToolbarDanger].join(' ')}
            onClick={onRemove}
          >
            削除
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={[styles.figure, alignClass, isSelected ? styles.figureSelected : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={`画像 ${block.fileName}`}
        aria-pressed={isSelected}
        onClick={onSelect}
      >
        <Icon name="image" size={28} />
        <span className={styles.figureName}>{block.fileName}</span>
        {isSelected ? (
          <>
            <span className={[styles.resizeHandle, styles.resizeTopLeft].join(' ')} />
            <span className={[styles.resizeHandle, styles.resizeTopRight].join(' ')} />
            <span className={[styles.resizeHandle, styles.resizeBottomLeft].join(' ')} />
            <span className={[styles.resizeHandle, styles.resizeBottomRight].join(' ')} />
          </>
        ) : null}
      </button>

      <input
        className={styles.captionInput}
        value={block.caption}
        placeholder="キャプションを追加"
        aria-label="画像のキャプション"
        onChange={(event) => onChange({ ...block, caption: event.target.value })}
      />
    </div>
  );
}

interface SlashMenuProps {
  onSelect: (command: SlashCommand) => void;
}

/** 「/」で開くブロック追加メニュー。 */
function SlashMenu({ onSelect }: SlashMenuProps) {
  return (
    <div className={styles.slashMenu} role="menu">
      <p className={styles.slashLabel}>ブロックを追加</p>
      {SLASH_COMMANDS.map((command, index) => (
        <button
          key={command.id}
          type="button"
          role="menuitem"
          className={[styles.slashItem, index === 0 ? styles.slashItemActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(command)}
        >
          <span className={styles.slashIcon}>
            {command.icon ? <Icon name={command.icon} size={16} /> : command.glyph}
          </span>
          <span className={styles.slashText}>
            <span className={styles.slashName}>{command.label}</span>
            <span className={styles.slashDesc}>{command.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
