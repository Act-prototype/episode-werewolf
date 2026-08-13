import { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { SketchStretch, sketchHeight } from "./SketchStretch";
import { space } from "@/theme/tokens";

interface Props {
  children: ReactNode;
  /** 描画高さ。省略時は素材の実寸（48前後） */
  height?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** 手書きの角丸ボックス。プレイヤー名の入力欄などの器として使う。 */
export function SketchBox({ children, height, style, contentStyle }: Props) {
  const h = height ?? sketchHeight("box");

  return (
    <View style={[{ height: h }, style]}>
      <SketchStretch name="box" height={h} style={StyleSheet.absoluteFill} />
      <View style={[styles.inner, { height: h }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { justifyContent: "center", paddingHorizontal: space.xl },
});
