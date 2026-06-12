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
}

/**
 * Material の Top App Bar 風、左寄せのヘッダー。
 * 戻る → アイコン → タイトルを左から一列に並べ、操作は右端に置く。
 * ステータスバー下までは濃色で満たす。
 */
export function Header({ icon, title, subtitle, onBack, right, children }: Props) {
  const insets = useSafeAreaInsets();

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
  titleWrap: { flexShrink: 1 },
  title: { ...type.h1, color: colors.white },
  sub: { ...type.small, fontWeight: "700", color: colors.ink400, marginTop: 1 },
});
