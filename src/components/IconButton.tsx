import { StyleSheet } from "react-native";
import { PressableScale } from "./PressableScale";
import { Icon, IconName } from "./Icon";
import { colors, radius } from "@/theme/tokens";

interface Props {
  icon: IconName;
  onPress: () => void;
  size?: number;
  box?: number;
  bg?: string;
  color?: string;
}

/** ヘッダー等で使う単機能のアイコンボタン（角丸の濃グレー地）。 */
export function IconButton({
  icon,
  onPress,
  size = 20,
  box = 38,
  bg = colors.ink800,
  color = colors.white,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.btn, { width: box, height: box, backgroundColor: bg }]}
    >
      <Icon name={icon} size={size} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
