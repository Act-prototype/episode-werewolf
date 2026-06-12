import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

interface Props {
  children: ReactNode;
  tone?: "neutral" | "danger";
  align?: "center" | "left";
}

/** 薄いグレー（または赤）の説明ノート。Web版の bg-gray-100 rounded-xl 注記相当。 */
export function InfoNote({ children, tone = "neutral", align = "center" }: Props) {
  const danger = tone === "danger";
  return (
    <View
      style={[
        styles.note,
        {
          backgroundColor: danger ? "rgba(220,38,38,0.18)" : colors.ink100,
          borderColor: danger ? colors.wolfBorder : colors.ink200,
        },
      ]}
    >
      <Text style={[styles.text, { textAlign: align, color: danger ? colors.white : colors.ink600 }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { borderRadius: radius.lg, padding: space.lg, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: "500", lineHeight: 20 },
});
