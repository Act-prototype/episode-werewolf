import { ReactNode } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, radius, shadow, space } from "@/theme/tokens";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 影の強さ */
  elevation?: "card" | "raised" | "none";
  /** 罫線を出すか（既定 true） */
  bordered?: boolean;
  padded?: boolean;
}

/** 白い角丸カード。Web版の rounded-3xl shadow-lg border 相当。 */
export function Card({
  children,
  style,
  elevation = "card",
  bordered = true,
  padded = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        bordered && styles.bordered,
        elevation !== "none" && shadow[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius["3xl"] },
  padded: { padding: space["2xl"] },
  bordered: { borderWidth: 1, borderColor: colors.ink200 },
});
