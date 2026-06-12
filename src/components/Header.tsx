import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { IconBadge } from "./IconBadge";
import { Icon, IconName } from "./Icon";
import { colors, space, sizing, type } from "@/theme/tokens";

interface Props {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** hero=中央寄せのブランド型 / bar=左寄せコンパクト */
  variant?: "hero" | "bar";
  /** hero の下に差し込む要素（チップ行など） */
  children?: ReactNode;
}

/**
 * 濃紺グレーのヘッダー。
 * モバイルで圧迫しないよう余白とアイコンを抑え、ステータスバー下までは濃色で満たす。
 */
export function Header({ icon, title, subtitle, onBack, right, variant = "hero", children }: Props) {
  const insets = useSafeAreaInsets();

  if (variant === "bar") {
    return (
      <View style={[styles.base, { paddingTop: insets.top + space.md }]}>
        <View style={styles.barRow}>
          <View style={styles.barLeft}>
            {icon && <IconBadge icon={icon} box={38} size={22} bg={colors.ink800} />}
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.barTitle} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.barSub}>{subtitle}</Text> : null}
            </View>
          </View>
          {right}
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, styles.hero, { paddingTop: insets.top + space.md }]}>
      <View style={styles.heroTop}>
        {onBack ? (
          <PressableScale onPress={onBack} style={styles.iconBtn}>
            <Icon name="back" size={20} color={colors.white} />
          </PressableScale>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={{ flex: 1 }} />
        {right ?? <View style={styles.spacer} />}
      </View>

      <View style={styles.heroCenter}>
        {icon && <IconBadge icon={icon} box={sizing.heroIcon} size={28} bg={colors.ink800} />}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.ink900, paddingHorizontal: space.xl },

  hero: { paddingBottom: space.xl, gap: space.md },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroCenter: { alignItems: "center", gap: space.sm, marginTop: space.xs },
  heroTitle: { ...type.display, color: colors.white },
  heroSub: { ...type.caption, color: colors.ink400, letterSpacing: 2 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.ink800,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { width: 38, height: 38 },

  barRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: space.md, gap: space.md },
  barLeft: { flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 1 },
  barTitle: { ...type.h2, color: colors.white },
  barSub: { ...type.small, fontWeight: "700", color: "rgba(255,255,255,0.75)" },
});
