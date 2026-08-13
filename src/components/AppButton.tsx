import { Text, StyleSheet, View, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { PressableScale } from "./PressableScale";
import { Icon, IconName } from "./Icon";
import { SketchStretch } from "./sketch/SketchStretch";
import { colors, sizing, type } from "@/theme/tokens";
import { SketchSliceName } from "@/theme/sketchAssets";

type Variant = "primary" | "secondary" | "ai" | "danger" | "outline";
type Size = "lg" | "md" | "sm";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  /** アイコンを文字の後ろに置く */
  iconTrailing?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

/** 見た目は手書き素材で作る。塗り＝黒/赤、それ以外は線画の器を使う。 */
const VARIANT: Record<Variant, { slice: SketchSliceName; fg: string }> = {
  primary: { slice: "buttonBlack", fg: colors.onInk },
  danger: { slice: "buttonRed", fg: colors.onInk },
  secondary: { slice: "box", fg: colors.ink },
  ai: { slice: "box", fg: colors.ink },
  outline: { slice: "box", fg: colors.ink },
};

const SIZING: Record<Size, { h: number; fontSize: number }> = {
  lg: { h: sizing.buttonLg, fontSize: 18 },
  md: { h: sizing.buttonMd, fontSize: 16 },
  sm: { h: sizing.buttonSm, fontSize: 14 },
};

/** アプリ標準ボタン。押下スケール・触覚・ローディング・アイコンを内包。 */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  iconTrailing = false,
  loading = false,
  disabled = false,
  style,
  haptic = true,
}: Props) {
  const v = VARIANT[variant];
  const s = SIZING[size];
  const h = s.h;
  const isDisabled = disabled || loading;

  return (
    // 幅やmarginは外側のViewで受ける（PressableScaleのstyleは内側のViewに渡るため）
    <View style={style}>
      <PressableScale onPress={onPress} disabled={isDisabled} haptic={haptic} style={{ height: h }}>
        <SketchStretch name={v.slice} height={h} style={StyleSheet.absoluteFill} />
        <View style={[styles.row, { height: h }]}>
          {loading ? (
            <ActivityIndicator color={v.fg} />
          ) : (
            <>
              {icon && !iconTrailing && <Icon name={icon} size={20} color={v.fg} />}
              <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize }]} numberOfLines={1}>
                {label}
              </Text>
              {icon && iconTrailing && <Icon name={icon} size={20} color={v.fg} />}
            </>
          )}
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  label: { ...type.title, flexShrink: 1 },
});
