import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { IconBadge } from "./IconBadge";
import { Icon, IconName } from "./Icon";
import { colors, space } from "@/theme/tokens";

interface Props {
  /** ブランド/モードのアイコン */
  icon?: IconName;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** 右肩に置く要素（GameMenu など） */
  right?: ReactNode;
  /** 中央寄せの大きなヒーロー型か、左寄せのコンパクト型か */
  variant?: "hero" | "bar";
}

/** 濃紺グレーのヘッダー。hero=中央大／bar=左寄せコンパクト。 */
export function Header({ icon, title, subtitle, onBack, right, variant = "hero" }: Props) {
  const insets = useSafeAreaInsets();
  if (variant === "bar") {
    return (
      <View style={[styles.bar, { paddingTop: insets.top + space.lg }]}>
        <View style={styles.barLeft}>
          {icon && <IconBadge icon={icon} box={44} size={24} bg={colors.ink800} />}
          <View>
            <Text style={styles.barTitle}>{title}</Text>
            {subtitle ? <Text style={styles.barSub}>{subtitle}</Text> : null}
          </View>
        </View>
        {right}
      </View>
    );
  }

  return (
    <View style={[styles.hero, { paddingTop: insets.top + space["4xl"] }]}>
      {onBack && (
        <PressableScale onPress={onBack} style={[styles.backBtn, { top: insets.top + space.lg }]}>
          <Icon name="back" size={22} color={colors.white} />
        </PressableScale>
      )}
      {right && <View style={[styles.rightAbs, { top: insets.top + space.lg }]}>{right}</View>}
      <View style={styles.heroCenter}>
        {icon && <IconBadge icon={icon} box={80} size={44} bg={colors.ink800} rounded="square" />}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink900, paddingHorizontal: space["2xl"], paddingVertical: space["4xl"] },
  heroCenter: { alignItems: "center", gap: space.lg },
  heroTitle: { fontSize: 34, fontWeight: "800", color: colors.white, letterSpacing: -0.5 },
  heroSub: { color: colors.ink400, fontSize: 13, fontWeight: "600", letterSpacing: 2 },
  backBtn: {
    position: "absolute",
    top: space["2xl"],
    left: space["2xl"],
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink800,
    alignItems: "center",
    justifyContent: "center",
  },
  rightAbs: { position: "absolute", top: space["2xl"], right: space["2xl"], zIndex: 10 },

  bar: {
    backgroundColor: colors.ink900,
    paddingHorizontal: space["2xl"],
    paddingVertical: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barLeft: { flexDirection: "row", alignItems: "center", gap: space.md },
  barTitle: { fontSize: 22, fontWeight: "800", color: colors.white },
  barSub: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
});
