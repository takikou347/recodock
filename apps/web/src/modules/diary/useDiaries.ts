import { useMemo } from 'react';

/** 本文のブロック(DIA-42 のブロック配列。text / heading / list / image / embed)。 */
export type DiaryBlock =
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'heading'; level: 1 | 2; text: string }
  | { id: string; kind: 'list'; items: readonly string[] }
  | {
      id: string;
      kind: 'image';
      /** 画像は asset_id 参照で保持する */
      assetId: string;
      fileName: string;
      /** 本文中の配置 */
      align: ImageAlign;
      caption: string;
    };

/** 画像ブロックの配置(幅いっぱい / 中央小 / 回り込み)。 */
export type ImageAlign = 'full' | 'center' | 'wrap';

/** DIA-40 一覧の 1 件。 */
export interface DiarySummary {
  id: string;
  /** リスト内表記: 08/21 */
  date: string;
  /** 見出し表記: 8月21日(金) */
  headingDate: string;
  /** フル表記: 2026/08/21 (金) */
  fullDate: string;
  mood: string;
  title: string;
  excerpt: string;
  photoCount: number;
  /** 気分タグ以外のタグ(場所など) */
  placeTag?: string;
  blocks: readonly DiaryBlock[];
}

export interface DiariesResult {
  diaries: readonly DiarySummary[];
  isLoading: boolean;
  isError: boolean;
}

// TODO: diaries / diary_photos を引くリポジトリ関数＋TanStack Query に差し替える。
// 現在はデザイン(DIA-40 / DIA-41 / DIA-42)のサンプルを表示する。
const SAMPLE_DIARIES: readonly DiarySummary[] = [
  {
    id: 'd-0821',
    date: '08/21',
    headingDate: '8月21日(金)',
    fullDate: '2026/08/21 (金)',
    mood: 'ごきげん',
    title: '夏のはじまり、川沿いを歩いた',
    excerpt: '夕方から鴨川沿いを1時間ほど歩いた。三条から出発して、四条を越えたあたりで…',
    photoCount: 2,
    placeTag: '鴨川 · 京都',
    blocks: [
      {
        id: 'b1',
        kind: 'text',
        text: '夕方から鴨川沿いを 1 時間ほど歩いた。三条から出発して、四条を越えたあたりで日が落ちた。',
      },
      {
        id: 'b2',
        kind: 'image',
        assetId: 'asset-0824',
        fileName: 'IMG_0824.jpg',
        align: 'full',
        caption: '三条大橋の下、川床の灯りがつく直前',
      },
      {
        id: 'b3',
        kind: 'text',
        text: '河原にはランナーと、楽器の練習をする学生。風がやっと涼しくなってきた。',
      },
      {
        id: 'b4',
        kind: 'image',
        assetId: 'asset-0825',
        fileName: 'IMG_0825.jpg',
        align: 'wrap',
        caption: '回り込み配置',
      },
      {
        id: 'b5',
        kind: 'text',
        text: '写真は本文と同じ流れの中に置ける。段落のあいだに幅いっぱいで差し込むか、右に小さく回り込ませるかを選べて、ドラッグで前後を入れ替えられる。',
      },
      {
        id: 'b6',
        kind: 'text',
        text: 'アイスコーヒー ¥480 は家計簿へ、持ち物には「リネンシャツ」を追加した。位置情報を付けたので、地図のピンからもこの日記に戻ってこられる。',
      },
    ],
  },
  {
    id: 'd-0819',
    date: '08/19',
    headingDate: '8月19日(水)',
    fullDate: '2026/08/19 (水)',
    mood: 'ふつう',
    title: '請求書の締めと在庫整理',
    excerpt: '午前は事務作業。持ち物モジュールに夏服を登録して、保管場所を書き直した。',
    photoCount: 0,
    blocks: [
      {
        id: 'b1',
        kind: 'text',
        text: '午前は事務作業。持ち物モジュールに夏服を登録して、保管場所を書き直した。',
      },
    ],
  },
  {
    id: 'd-0815',
    date: '08/15',
    headingDate: '8月15日(土)',
    fullDate: '2026/08/15 (土)',
    mood: 'たのしい',
    title: '花火、遠くの音だけ聞いた',
    excerpt: 'ベランダから音だけ。位置情報を付けたので地図にもピンが立った。',
    photoCount: 1,
    blocks: [
      {
        id: 'b1',
        kind: 'text',
        text: 'ベランダから音だけ。位置情報を付けたので地図にもピンが立った。',
      },
    ],
  },
  {
    id: 'd-0810',
    date: '08/10',
    headingDate: '8月10日(月)',
    fullDate: '2026/08/10 (月)',
    mood: 'つかれた',
    title: '長い会議の日',
    excerpt: '3本連続。夜は何も作らずに済ませた。',
    photoCount: 0,
    blocks: [{ id: 'b1', kind: 'text', text: '3本連続。夜は何も作らずに済ませた。' }],
  },
  {
    id: 'd-0805',
    date: '08/05',
    headingDate: '8月5日(水)',
    fullDate: '2026/08/05 (水)',
    mood: 'しずか',
    title: '本を2冊読み終えた',
    excerpt: 'メモモジュールに読書メモを分けて残した。',
    photoCount: 0,
    blocks: [{ id: 'b1', kind: 'text', text: 'メモモジュールに読書メモを分けて残した。' }],
  },
];

/** 日記一覧を返す(DIA-40)。keyword で本文・タイトル・気分タグを絞り込む。 */
export function useDiaries(keyword: string): DiariesResult {
  return useMemo(() => {
    const trimmed = keyword.trim();
    const diaries = trimmed
      ? SAMPLE_DIARIES.filter(
          (diary) =>
            diary.title.includes(trimmed) ||
            diary.excerpt.includes(trimmed) ||
            diary.mood.includes(trimmed),
        )
      : SAMPLE_DIARIES;
    return { diaries, isLoading: false, isError: false };
  }, [keyword]);
}

/** 1 件の日記を返す(DIA-41 / DIA-42)。 */
export function useDiary(diaryId: string | undefined): DiarySummary | undefined {
  return useMemo(
    () => SAMPLE_DIARIES.find((diary) => diary.id === diaryId) ?? SAMPLE_DIARIES[0],
    [diaryId],
  );
}
