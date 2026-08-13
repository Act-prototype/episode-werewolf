import { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { SketchStretch } from "./SketchStretch";
import { space } from "@/theme/tokens";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * 上下の手書きアーチで内容を挟む囲み。
 *
 * モックの「枠」は閉じた矩形ではなく、上アーチと下アーチの2パーツを離して置き
 * 左右が開いた形になっている（Figmaの Window01 / Window02 がこの使い方）。
 * アーチ自体が上下の余白を持つため、内容側の縦パディングは最小で足りる。
 */
export function SketchFrame({ children, style, contentStyle }: Props) {
  return (
    <View style={style}>
      <SketchStretch name="frameTop" />
      <View style={[{ paddingHorizontal: space.xl }, contentStyle]}>{children}</View>
      <SketchStretch name="frameBottom" />
    </View>
  );
}
