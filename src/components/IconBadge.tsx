import { View, StyleSheet } from "react-native";
import { Icon, IconName } from "./Icon";
import { colors, radius } from "@/theme/tokens";

interface Props {
  icon: IconName;
  size?: number;
  /** 角丸四角の一辺 */
  box?: number;
  bg?: string;
  color?: string;
  rounded?: "square" | "circle";
}

/** アイコンを乗せた角丸/円形のチップ。Web版の bg-gray-800 rounded-2xl + icon 相当。 */
export function IconBadge({
  icon,
  size = 24,
  box = 48,
  bg = colors.ink800,
  color = colors.white,
  rounded = "square",
}: Props) {
  return (
    <View
      style={[
        styles.base,
        { width: box, height: box, backgroundColor: bg, borderRadius: rounded === "circle" ? radius.full : radius.xl },
      ]}
    >
      <Icon name={icon} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});
