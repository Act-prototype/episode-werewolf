import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { IconBadge } from "./IconBadge";
import { Icon, IconName } from "./Icon";
import { colors, space, type } from "@/theme/tokens";

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
 * hero でもナビバー相当の高さに抑え、戻る/メニューは両端にオーバーレイして
 * 縦の専有を最小化する。ステータスバー下までは濃色で満たす。
 */
export function Header({ icon, title, subtitle, onBack, right, variant = "hero", children }: Props) {
  const insets = useSafeAreaInsets();

  if (variant === "bar") {
    return (
      <View style={[styles.base, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.barRow}>
          <View style={styles.barLeft}>
            {icon && <IconBadge icon={icon} box={36} size={20} bg={colors.ink800} />}
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
    <View style={[styles.base, { paddingTop: insets.top + space.sm, paddingBottom: space.md }]}>
      <View style={styles.navRow}>
        {onBack && (
          <PressableScale onPress={onBack} style={styles.backBtn}>
            <Icon name="back" size={20} color={colors.white} />
          </PressableScale>
        )}

        <View style={styles.brand}>
          {icon && <IconBadge icon={icon} box={32} size={18} bg={colors.ink800} />}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {right && <View style={styles.right}>{right}</View>}
      </View>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.ink900, paddingHorizontal: space.xl },

  navRow: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: space.sm, maxWidth: "72%" },
  title: { ...type.h1, color: colors.white },
  sub: { ...type.caption, color: colors.ink400, letterSpacing: 2, textAlign: "center", marginTop: 2 },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ink800,
    alignItems: "center",
    justifyContent: "center",
  },
  right: { position: "absolute", right: 0 },

  barRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: space.md, gap: space.md },
  barLeft: { flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 1 },
  barTitle: { ...type.h2, color: colors.white },
  barSub: { ...type.small, fontWeight: "700", color: "rgba(255,255,255,0.75)" },
});
