import { Text, StyleSheet, View, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { PressableScale } from "./PressableScale";
import { Icon, IconName } from "./Icon";
import { colors, radius, shadow } from "@/theme/tokens";

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

const VARIANT: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.ink900, fg: colors.white },
  secondary: { bg: colors.ink100, fg: colors.ink600 },
  ai: { bg: colors.aiSurface, fg: colors.aiText },
  danger: { bg: colors.wolf, fg: colors.white },
  outline: { bg: colors.white, fg: colors.ink900, border: colors.ink300 },
};

const SIZE: Record<Size, { h: number; fontSize: number; iconSize: number }> = {
  lg: { h: 60, fontSize: 18, iconSize: 24 },
  md: { h: 52, fontSize: 16, iconSize: 22 },
  sm: { h: 44, fontSize: 14, iconSize: 18 },
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
  const s = SIZE[size];
  const isDisabled = disabled || loading;
  const elevated = variant === "primary" || variant === "danger";

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={haptic}
      style={[
        styles.btn,
        {
          height: s.h,
          backgroundColor: v.bg,
          borderColor: v.border ?? "transparent",
          borderWidth: v.border ? 2 : 0,
        },
        elevated && shadow.raised,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <>
            {icon && !iconTrailing && <Icon name={icon} size={s.iconSize} color={v.fg} />}
            <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize }]}>{label}</Text>
            {icon && iconTrailing && <Icon name={icon} size={s.iconSize} color={v.fg} />}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  label: { fontWeight: "800" },
});
