import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, space, type } from "@/theme/tokens";

interface Props {
  children: ReactNode;
  tone?: "neutral" | "danger";
  align?: "center" | "left";
}

/** 紙の上の注記。塗らずにインクの細枠だけで囲む。 */
export function InfoNote({ children, tone = "neutral", align = "center" }: Props) {
  const danger = tone === "danger";
  return (
    <View style={[styles.note, { borderColor: danger ? colors.wolf : colors.ink300 }]}>
      <Text
        style={[styles.text, { textAlign: align, color: danger ? colors.wolf : colors.inkSub }]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { borderRadius: radius.lg, padding: space.lg, borderWidth: 1 },
  text: { ...type.small, lineHeight: 20 },
});
