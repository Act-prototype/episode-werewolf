/**
 * デザイントークン。
 * Figmaモック「人狼デザインモック」に合わせた紙＋インクの手描き基調。
 * 色・サイズはFigmaの実測値、ボタン色は手書き素材から抽出した実測値を使う。
 *
 * 旧グレースケール基調のキー（ink900 など）は移行中の画面が参照しているため
 * 新パレットへのエイリアスとして残している。新規実装では下の意味名を使う。
 */

export const colors = {
  /** 紙の地色。背景テクスチャ assets/sketch/paper.jpg と同系 */
  paper: "#f6efe7",
  /** 紙より一段沈んだ面（入力欄の中など） */
  paperDeep: "#efe8de",
  /** 鉛筆・墨のインク色（本文・見出し） */
  ink: "#151515",
  /** 補足テキスト */
  inkSub: "#676767",
  /** さらに弱いテキスト・プレースホルダ */
  inkFaint: "#a29a8f",
  /** 黒ベタの上に乗る文字（紙色で抜く） */
  onInk: "#f6efe7",

  /** 役職: 人狼。カードモードの赤ボタン実測色 */
  wolf: "#c84840",
  /** 役職: 村人。ノーマルモードの青ボタン実測色 */
  villager: "#3080c0",

  /** オーバーレイ */
  scrim: "rgba(21,21,21,0.55)",

  // ── 以下は移行用エイリアス（新規実装では使わない） ──
  white: "#f6efe7",
  ink900: "#151515",
  ink800: "#151515",
  ink700: "#2b2b2b",
  ink600: "#676767",
  ink500: "#676767",
  ink400: "#a29a8f",
  ink300: "#c9c0b4",
  ink200: "#ded5c8",
  ink100: "#efe8de",
  ink50: "#f6efe7",
  wolfDeep: "#b13c35",
  wolfSurface: "#f6efe7",
  wolfBorder: "#c84840",
  wolfText: "#151515",
  villagerDeep: "#2a6fa8",
  villagerSurface: "#f6efe7",
  villagerBorder: "#3080c0",
  villagerText: "#151515",
  aiSurface: "#efe8de",
  aiText: "#151515",
  successSurface: "#f6efe7",
  successBorder: "#151515",
  successText: "#151515",
  dangerSurface: "#f6efe7",
  dangerBorder: "#c84840",
  dangerText: "#151515",
} as const;

/** 役職の代表色 */
export const roleColor = (role: "人狼" | "村人" | null) =>
  role === "人狼" ? colors.wolf : colors.villager;

/**
 * 読み込むフォント。
 * 日本語はすべて Zen Kaku Gothic New Medium、英字見出しのみ Readex Pro Light。
 * ウェイトはフォント側に焼き込まれているので fontWeight は指定しない
 * （指定すると別フェイスへのフォールバックや合成ボールドが起きる）。
 */
export const fontFamily = {
  jp: "ZenKakuGothicNew_500Medium",
  en: "ReadexPro_300Light",
  /** 情景の語り（結果発表の朝の描写）だけに使う明朝 */
  mincho: "HinaMincho_400Regular",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/** 手書き素材が角丸を担うため、角丸は素材を使わない箇所の控えめな値のみ */
export const radius = {
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 999,
} as const;

/**
 * タイポスケール。Figmaの実測値ベース。
 * トラッキングは日本語で4%（18pxなら+0.72px）。
 */
export const type = {
  /** 画面見出し。Readex Pro Light（Who are you? / SETTING / NORMAL Mode） */
  display: { fontFamily: fontFamily.en, fontSize: 25.6 },
  /** やや小さい英字見出し */
  displaySm: { fontFamily: fontFamily.en, fontSize: 21 },
  /** 主役の日本語テキスト（プレイヤー名・役職名・ボタン文字） */
  title: { fontFamily: fontFamily.jp, fontSize: 18, letterSpacing: 0.72 },
  /** セクション見出し（エピソードテーマ / プレイヤー名） */
  h2: { fontFamily: fontFamily.jp, fontSize: 17, letterSpacing: 0.68 },
  /** 本文 */
  body: { fontFamily: fontFamily.jp, fontSize: 14, letterSpacing: 0.56 },
  /** 補足・箇条書き */
  small: { fontFamily: fontFamily.jp, fontSize: 13, letterSpacing: 0.52 },
  /** ごく小さいラベル */
  caption: { fontFamily: fontFamily.jp, fontSize: 11, letterSpacing: 0.66 },

  // ── 英字表記（モックでは英語はすべて Readex Pro） ──
  /** Day1 / EPISODE TIME などの英字ラベル */
  labelEn: { fontFamily: fontFamily.en, fontSize: 15 },
  /** TODAY'S THEME / CARD MODE などの小さい英字（字間を開ける） */
  overlineEn: { fontFamily: fontFamily.en, fontSize: 11, letterSpacing: 1.2 },

  /** 情景の語り。明朝で組む一文（結果発表の朝の描写） */
  narration: { fontFamily: fontFamily.mincho, fontSize: 20, letterSpacing: 0.4 },

  // 移行用エイリアス
  h1: { fontFamily: fontFamily.jp, fontSize: 18, letterSpacing: 0.72 },
  h3: { fontFamily: fontFamily.jp, fontSize: 15, letterSpacing: 0.6 },
} as const;

/** 主要コントロールの基準サイズ（Figmaの実測値） */
export const sizing = {
  /** 主ボタン 304x65 */
  buttonLg: 65,
  buttonMd: 52,
  buttonSm: 44,
  /** テーマ選択ピル 141x33 */
  pill: 33,
  /** 入力ボックス 278x50 */
  box: 50,
  stepperBox: 76,
  stepperBtn: 50,
  heroIcon: 52,
  avatar: 72,
} as const;

/**
 * 紙の上のフラットな見た目なので影は使わない。
 * 影が必要な箇所は手書きの影付き素材（pill-sm-shadow など）で表現する。
 * 旧実装の参照を壊さないためキーは残す。
 */
export const shadow = {
  card: {},
  raised: {},
} as const;

/** スマホUIをタブレット/Webでも中央寄せ・最大幅で見せる */
export const LAYOUT_MAX_WIDTH = 480;

/** Figmaのアートボード幅。手書き素材の寸法はこの幅を基準にしている */
export const DESIGN_WIDTH = 393;
