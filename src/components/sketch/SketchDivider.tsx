import { Image, StyleProp, ImageStyle } from "react-native";
import { sketch } from "@/theme/sketchAssets";

type Weight = "long" | "medium" | "short" | "tiny" | "hair" | "fine" | "faint" | "tapered";

const SOURCE: Record<Weight, number> = {
  long: sketch.dividerLong,
  medium: sketch.dividerMedium,
  short: sketch.dividerShort,
  tiny: sketch.dividerTiny,
  hair: sketch.dividerHair,
  fine: sketch.dividerFine,
  faint: sketch.dividerFaint,
  tapered: sketch.dividerTapered,
};

interface Props {
  weight?: Weight;
  /** 線の描画幅。省略時は親幅いっぱい */
  width?: number | `${number}%`;
  /** 線の太さ。素材は端がかすれた鉛筆線なので4〜6px程度で使う */
  height?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * 手書きの区切り線。
 * 単純な線なので3スライスせず、そのまま横に伸ばす（かすれ具合が端に残る）。
 */
export function SketchDivider({ weight = "medium", width = "100%", height = 5, style }: Props) {
  return (
    <Image
      source={SOURCE[weight]}
      style={[{ width, height }, style]}
      resizeMode="stretch"
    />
  );
}
