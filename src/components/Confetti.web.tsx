/**
 * Web 向けフォールバック。Web では Skia(CanvasKit) を読み込まないよう no-op にする。
 */
export function Celebrate(_props: { colors?: string[]; count?: number }) {
  return null;
}
