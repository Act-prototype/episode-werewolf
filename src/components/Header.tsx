import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { Icon, IconName } from "./Icon";
import { SketchDivider } from "./sketch/SketchDivider";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  icon?: IconName;
  /** アイコンの代わりに手書きイラストなどを置く（指定時は icon より優先） */
  art?: ReactNode;
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
 * 紙の上に置くヘッダー。塗りは持たず、手書きの罫線だけで本文と切る。
 * 戻る/メニューは両端にオーバーレイして縦の専有を最小化する。
 */
export function Header({ icon, art, title, subtitle, onBack, right, variant = "hero", children }: Props) {
  const insets = useSafeAreaInsets();

  if (variant === "bar") {
    return (
      <View style={[styles.base, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.barRow}>
          <View style={styles.barLeft}>
            {art ?? (icon && <Icon name={icon} size={20} color={colors.ink} />)}
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.barTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? <Text style={styles.barSub}>{subtitle}</Text> : null}
            </View>
          </View>
          {right}
        </View>
        <SketchDivider weight="hair" height={4} />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, { paddingTop: insets.top + space.sm, paddingBottom: space.md }]}>
      <View style={styles.navRow}>
        {/* PressableScaleはstyleを内側のViewに渡すため、絶対配置は外側のViewで行う */}
        {onBack && (
          <View style={styles.backSlot}>
            <PressableScale onPress={onBack} style={styles.backBtn}>
              <Icon name="back" size={20} color={colors.ink} />
            </PressableScale>
          </View>
        )}

        <View style={styles.brand}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {right && <View style={styles.right}>{right}</View>}
      </View>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <SketchDivider weight="hair" height={4} style={styles.rule} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: space.xl },

  navRow: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: space.sm, maxWidth: "72%" },
  // 英字混じりの画面名もあるので日本語書体で統一しておく
  title: { ...type.title, color: colors.ink },
  // サブタイトルは NORMAL MODE / CARD MODE のような英字表記
  sub: { ...type.overlineEn, color: colors.inkSub, textAlign: "center", marginTop: 2 },
  rule: { marginTop: space.sm },
  backSlot: { position: "absolute", left: 0, top: 2 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  right: { position: "absolute", right: 0 },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: space.md,
    gap: space.md,
  },
  barLeft: { flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 1 },
  barTitle: { ...type.h2, color: colors.ink },
  barSub: { ...type.small, color: colors.inkSub },
});
