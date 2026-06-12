/**
 * デザイントークン。
 * Web版のグレースケール基調（gray-900〜gray-50）+ 役職色（人狼=赤 / 村人=青）+
 * AIアクセント（バイオレット）を、プラットフォーム非依存の値として一元管理する。
 */

export const colors = {
  // ベース（白〜濃いグレー）
  white: "#ffffff",
  ink900: "#111827",
  ink800: "#1f2937",
  ink700: "#374151",
  ink600: "#4b5563",
  ink500: "#6b7280",
  ink400: "#9ca3af",
  ink300: "#d1d5db",
  ink200: "#e5e7eb",
  ink100: "#f3f4f6",
  ink50: "#f9fafb",

  // 役職: 人狼（赤系）
  wolf: "#dc2626",
  wolfDeep: "#e11d48",
  wolfSurface: "#fef2f2",
  wolfBorder: "#fecaca",
  wolfText: "#7f1d1d",

  // 役職: 村人（青系）
  villager: "#2563eb",
  villagerDeep: "#0891b2",
  villagerSurface: "#eff6ff",
  villagerBorder: "#bfdbfe",
  villagerText: "#1e3a8a",

  // AIアクセント（バイオレット）
  aiSurface: "#ede9fe",
  aiText: "#6d28d9",

  // 状態色
  successSurface: "#f0fdf4",
  successBorder: "#22c55e",
  successText: "#14532d",
  dangerSurface: "#fef2f2",
  dangerBorder: "#ef4444",
  dangerText: "#7f1d1d",

  // オーバーレイ
  scrim: "rgba(0,0,0,0.55)",
} as const;

/** 役職グラデーション（expo-linear-gradient未使用のため、代表色を返す） */
export const roleColor = (role: "人狼" | "村人" | null) =>
  role === "人狼" ? colors.wolf : colors.villager;

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

export const radius = {
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 999,
} as const;

export const font = {
  /** 見出しは極太、本文は太字基調（Web版の font-black / font-bold を踏襲） */
  black: "800" as const,
  bold: "700" as const,
  medium: "500" as const,
  regular: "400" as const,
};

export const type = {
  hero: { fontSize: 36, fontWeight: font.black, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: font.black, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: font.black },
  h3: { fontSize: 18, fontWeight: font.black },
  body: { fontSize: 15, fontWeight: font.bold },
  small: { fontSize: 13, fontWeight: font.bold },
  caption: { fontSize: 11, fontWeight: font.bold, letterSpacing: 1 },
} as const;

/** iOS風の柔らかい影。Androidは elevation で近似。 */
export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  raised: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
} as const;

/** スマホUIをタブレット/Webでも中央寄せ・最大幅で見せる（Web版の max-w-[420px] 相当） */
export const LAYOUT_MAX_WIDTH = 480;
