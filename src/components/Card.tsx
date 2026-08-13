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

/**
 * 紙の上の面。手書き基調に合わせて影は使わず、細いインクの罫線だけで区切る。
 * 手書きの囲みが必要な箇所は SketchFrame を直接使う。
 */
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
  card: { backgroundColor: "transparent", borderRadius: radius["3xl"] },
  padded: { padding: space.xl },
  bordered: { borderWidth: 1, borderColor: colors.ink300 },
});
