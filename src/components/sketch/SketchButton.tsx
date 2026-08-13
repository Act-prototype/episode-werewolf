import { Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { PressableScale } from "../PressableScale";
import { SketchStretch, sketchHeight } from "./SketchStretch";
import { colors, type } from "@/theme/tokens";
import { SketchSliceName } from "@/theme/sketchAssets";

type Variant = "black" | "blue" | "red";

const SLICE: Record<Variant, SketchSliceName> = {
  black: "buttonBlack",
  blue: "buttonBlue",
  red: "buttonRed",
};

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** 描画高さ。省略時は素材の実寸に従う（黒=65 / 青赤=62 前後） */
  height?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

/**
 * 手書きボタン。塗りは素材、文字は紙色で抜く。
 * 幅は親に合わせて伸び、角のカーブは SketchStretch が保つ。
 */
export function SketchButton({
  label,
  onPress,
  variant = "black",
  height,
  disabled = false,
  style,
  haptic = true,
}: Props) {
  const name = SLICE[variant];
  const h = height ?? sketchHeight(name);

  return (
    // 幅やmarginは外側のViewで受ける。PressableScaleはstyleを内側のViewに渡すため、
    // ここに幅を渡すとフレックスアイテム（Pressable本体）の幅に効かない。
    <View style={style}>
      <PressableScale onPress={onPress} disabled={disabled} haptic={haptic} style={{ height: h }}>
        <SketchStretch name={name} height={h} style={StyleSheet.absoluteFill} />
        <View style={[styles.center, { height: h }]}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  label: { ...type.title, color: colors.onInk },
});
