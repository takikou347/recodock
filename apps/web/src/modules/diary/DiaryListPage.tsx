import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { moduleThemeClass } from '../../lib/moduleTheme';
import type { DiaryBlock, DiarySummary } from './useDiaries';
import {
  useCreateDiary,
  useDeleteDiary,
  useDiaries,
  useDiary,
  useDiaryOneYearAgo,
} from './useDiaries';

import styles from './DiaryListPage.module.css';

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
    <div className={[styles.root, moduleThemeClass('diary')].join(' ')}>
      <div className={styles.listPane}>
        <div className={styles.listHead}>
          <div className={styles.listTitleRow}>
            <h1 className={styles.listTitle}>日記</h1>
            <Button variant="primary" size="sm" icon="plus" onClick={() => void onCreate()}>
              新規日記
            </Button>
          </div>
          {oneYearAgo ? (
            <button
              type="button"
              className={styles.oneYearAgo}
              onClick={() => navigate(`/diary/${oneYearAgo.id}`)}
            >
              1年前の今日: {oneYearAgo.title}
            </button>
          ) : null}
          <div className={styles.searchBox}>
            <Icon name="search" size={16} />
            <input
              className={styles.searchInput}
              type="search"
              value={keyword}
              placeholder="キーワード・気分タグで絞り込み"
              aria-label="日記を絞り込み"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.list}>
          {isError ? (
            <ErrorState title="日記を読み込めませんでした" description="接続を確認してください。" />
          ) : isLoading ? (
            <Skeleton lineCount={4} hasBlock />
          ) : diaries.length === 0 ? (
            <EmptyState
              icon="diary"
              title="一致する日記がありません"
              description="キーワードを変えてみてください"
            />
          ) : (
            diaries.map((diary) => (
              <button
                key={diary.id}
                type="button"
                className={[styles.listItem, diary.id === selected?.id ? styles.listItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => navigate(`/diary/${diary.id}`)}
              >
                <div className={styles.itemHead}>
                  <span className={styles.itemDate}>{diary.date}</span>
                  <span className={styles.itemMood}>{diary.mood}</span>
                  {diary.photoCount > 0 ? (
                    <span className={styles.itemPhotos}>写真 {diary.photoCount}</span>
                  ) : null}
                </div>
                <p className={styles.itemTitle}>{diary.title}</p>
                <p className={styles.itemExcerpt}>{diary.excerpt}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {selected ? (
        <DiaryDetail
          diary={selected}
          onEdit={() => navigate(`/diary/${selected.id}/edit`)}
          onDelete={() => setIsDeleteOpen(true)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="日記を削除しますか？"
        description={`「${selected?.title ?? ''}」を削除します。30日間はゴミ箱から戻せます。`}
        confirmLabel="削除する"
        onConfirm={() => void onDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}

interface DiaryDetailProps {
  diary: DiarySummary;
  onEdit: () => void;
  onDelete: () => void;
}

/** DIA-41 日記詳細。本文の流れの中に写真を置く。 */
function DiaryDetail({ diary, onEdit, onDelete }: DiaryDetailProps) {
  const moneyTone: CSSProperties = {
    '--tone-bg': 'var(--color-money-bg)',
    '--tone-line': 'var(--color-money-line)',
    '--tone-fg': 'var(--color-money-fg)',
    '--tone-solid': 'var(--color-money-solid)',
  } as CSSProperties;
  const mapTone: CSSProperties = {
    '--tone-bg': 'var(--color-map-bg)',
    '--tone-line': 'var(--color-map-line)',
    '--tone-fg': 'var(--color-map-fg)',
    '--tone-solid': 'var(--color-map-solid)',
  } as CSSProperties;

  return (
    <article className={styles.detailPane}>
      <div className={styles.detailHead}>
        <div>
          <p className={styles.detailDate}>{diary.fullDate}</p>
          <h2 className={styles.detailTitle}>{diary.title}</h2>
        </div>
        <div className={styles.detailActions}>
          <Button variant="secondary" onClick={onEdit}>
            編集
          </Button>
          <Button variant="primary">地図で見る</Button>
          <Button variant="text" onClick={onDelete}>
            削除
          </Button>
        </div>
      </div>

      <div className={styles.tags}>
        <span className={styles.tagMood}>{diary.mood}</span>
        {diary.placeTag ? <span className={styles.tagPlace}>{diary.placeTag}</span> : null}
      </div>

      <div className={styles.body}>
        {diary.blocks.map((block) => (
          <DiaryBlockView key={block.id} block={block} />
        ))}
      </div>

      <div className={styles.crossLinks}>
        <div className={styles.crossLink} style={moneyTone}>
          <span className={styles.crossDot} />
          同日の支出 3 件 ¥3,860
        </div>
        <div className={styles.crossLink} style={mapTone}>
          <span className={styles.crossDot} />
          スポット「鴨川 三条」
        </div>
      </div>
    </article>
  );
}

interface DiaryBlockViewProps {
  block: DiaryBlock;
}

/** 本文ブロックの表示。画像は配置(full / center / wrap)に応じて回り込ませる。 */
function DiaryBlockView({ block }: DiaryBlockViewProps) {
  switch (block.kind) {
    case 'text':
      return <p className={styles.paragraph}>{block.text}</p>;
    case 'heading':
      return block.level === 1 ? (
        <h3 className={styles.heading1}>{block.text}</h3>
      ) : (
        <h4 className={styles.heading2}>{block.text}</h4>
      );
    case 'list':
      return (
        <div className={styles.bullets}>
          {block.items.map((item) => (
            <span key={item} className={styles.bullet}>
              <span className={styles.bulletDot}>・</span>
              {item}
            </span>
          ))}
        </div>
      );
    case 'image': {
      const figureClass =
        block.align === 'wrap'
          ? styles.figureWrap
          : block.align === 'center'
            ? styles.figureCenter
            : styles.figureFull;
      return (
        <figure className={figureClass}>
          <div className={styles.imageBox}>
            <Icon name="image" size={26} />
            <span className={styles.imageLabel}>{block.fileName}</span>
          </div>
          {block.caption ? (
            <figcaption className={styles.caption}>{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
  }
}
