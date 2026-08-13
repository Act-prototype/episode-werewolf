import { Image, View, StyleProp, ViewStyle } from "react-native";
import { sketchDigits } from "@/theme/sketchAssets";

interface Props {
  value: number;
  /** 数字の高さ。素材は26px相当なので拡大しすぎると鉛筆線がぼやける */
  height?: number;
  /** 桁間の空き */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 手書き数字。人数表示や手順番号に使う。
 *
 * モックでは数字もフォントではなく手書き画像なので、0-9の素材を桁ごとに並べる。
 * 素材の高さは全桁で共通に切り出しているため、そのまま並べれば基線が揃う。
 */
export function SketchNumber({ value, height = 26, gap = 2, style }: Props) {
  const digits = Math.abs(Math.trunc(value)).toString().split("");

  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-end", gap }, style]}>
      {digits.map((d, i) => {
        const glyph = sketchDigits[Number(d)];
        return (
          <Image
            key={`${i}-${d}`}
            source={glyph.source}
            style={{ height, width: (height * glyph.width) / glyph.height }}
            resizeMode="contain"
          />
        );
      })}
    </View>
  );
}
