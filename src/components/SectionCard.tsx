import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { Icon, IconName } from "./Icon";
import { colors, space } from "@/theme/tokens";

interface Props {
  icon: IconName;
  title: string;
  /** 右側に出すピル表示（例: 「3人〜」） */
  pill?: ReactNode;
  children: ReactNode;
}

/** 見出し（アイコン + タイトル + 任意のピル）付きの設定カード。 */
export function SectionCard({ icon, title, pill, children }: Props) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.left}>
          <IconBadge icon={icon} box={40} size={20} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {pill}
      </View>
      {children}
    </Card>
  );
}

export function Pill({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <View style={styles.pill}>
      {icon && <Icon name={icon} size={14} color={colors.ink500} />}
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg },
  left: { flexDirection: "row", alignItems: "center", gap: space.md },
  title: { fontSize: 16, fontWeight: "800", color: colors.ink800 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.ink100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.ink500 },
});
