import { Image, PixelRatio, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { sketchSlices, SketchSliceName } from "@/theme/sketchAssets";

interface Props {
  name: SketchSliceName;
  /** 描画高さ。省略時は素材の実寸÷2（素材は2x解像度で書き出している） */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 手書きパーツを横方向に可変幅で描く。
 *
 * 1枚をそのまま伸ばすと角の手描きカーブが潰れるため、左端・中央・右端の
 * 3スライスに分け、中央だけを伸ばす（いわゆる3スライス／9スライス）。
 * 端キャップは高さから出した倍率で等比拡縮するので線の太さが変わらない。
 */
export function SketchStretch({ name, height, style }: Props) {
  const slice = sketchSlices[name];
  const h = height ?? slice.height / 2;
  // キャップ幅は端数dpになりがちで、そのままだと実機のピクセル境界で
  // 継ぎ目に隙間が出る（塗りのボタンだと紙が透けて白い縦線に見える）。
  // ピクセルに丸めたうえで、中央を1物理ピクセルぶん左右へ食い込ませて塞ぐ。
  const cap = PixelRatio.roundToNearestPixel((slice.cap * h) / slice.height);

  return (
    <View style={[{ height: h, flexDirection: "row", pointerEvents: "none" }, style]}>
      <Image source={slice.left} style={{ width: cap, height: h }} resizeMode="stretch" />
      <Image
        source={slice.middle}
        style={{ flex: 1, height: h, marginHorizontal: -StyleSheet.hairlineWidth }}
        resizeMode="stretch"
      />
      <Image source={slice.right} style={{ width: cap, height: h }} resizeMode="stretch" />
    </View>
  );
}

/** 素材の既定描画高さ（実寸÷2）。レイアウトの高さ合わせに使う。 */
export const sketchHeight = (name: SketchSliceName) => sketchSlices[name].height / 2;
