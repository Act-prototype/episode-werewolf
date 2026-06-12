import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "./IconButton";
import { IconBadge } from "./IconBadge";
import { IconName } from "./Icon";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** 右側の操作（GameControls など） */
  right?: ReactNode;
  /** ヘッダー下に差し込む要素（チップ行など） */
  children?: ReactNode;
  /** トップ/ブランド画面向けの中央寄せ表示（戻るが無い画面で使う） */
  center?: boolean;
}

/**
 * 濃色のヘッダー。
 * 既定は Material の Top App Bar 風に左寄せ（戻る → アイコン → タイトル、操作は右端）。
 * center=true のときはブランド表示として中央寄せにする。
 * ステータスバー下までは濃色で満たす。
 */
export function Header({ icon, title, subtitle, onBack, right, children, center }: Props) {
  const insets = useSafeAreaInsets();

  if (center) {
    return (
      <View style={[styles.base, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.centerRow}>
          {icon && <IconBadge icon={icon} box={36} size={20} bg={colors.ink800} />}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        {subtitle ? <Text style={[styles.sub, styles.subCenter]} numberOfLines={1}>{subtitle}</Text> : null}
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.row}>
        {onBack && <IconButton icon="back" onPress={onBack} />}
        {icon && <IconBadge icon={icon} box={36} size={20} bg={colors.ink800} />}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={{ flex: 1 }} />
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.ink900, paddingHorizontal: space.xl, paddingBottom: space.md },
  row: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: space.sm },
  centerRow: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  titleWrap: { flexShrink: 1 },
  title: { ...type.h1, color: colors.white },
  sub: { ...type.small, fontWeight: "700", color: colors.ink400, marginTop: 1 },
  subCenter: { textAlign: "center", letterSpacing: 2 },
});
