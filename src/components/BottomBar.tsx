import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SketchDivider } from "./sketch/SketchDivider";
import { space } from "@/theme/tokens";

/** 画面下部に固定するアクションバー（セーフエリア下部を考慮）。 */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      {/* 紙のまま続けたいので塗りは置かず、手書きの罫線だけで本文と切る */}
      <SketchDivider weight="hair" height={4} style={styles.rule} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.xl, paddingTop: space.lg },
  rule: { marginBottom: space.lg },
});
