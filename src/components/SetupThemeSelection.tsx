import { useCallback } from "react";
import { BackHandler, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "./Screen";
import { PressableScale } from "./PressableScale";
import { ThemePicker } from "./ThemePicker";
import { GameMenu } from "./GameMenu";
import { SketchFrame } from "./sketch/SketchFrame";
import { SketchDivider } from "./sketch/SketchDivider";
import { colors, space, type } from "@/theme/tokens";

/** 設定値を保持したまま、テーマ一覧だけを表示する画面。 */
export function SetupThemeSelection({ selected, onSelect, onBack }: {
  selected: string; onSelect: (category: string) => void; onBack: () => void;
}) {
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { onBack(); return true; });
    return () => subscription.remove();
  }, [onBack]));
  return <Screen scroll contentContainerStyle={styles.content}>
    <View style={styles.nav}>
      <PressableScale accessibilityRole="button" accessibilityLabel="設定に戻る" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ 設定に戻る</Text>
      </PressableScale>
      <GameMenu mode="normal" />
    </View>
    <SketchFrame contentStyle={styles.frame}>
      <View style={styles.heading}>
        <Text style={styles.title}>エピソードテーマ</Text>
        <SketchDivider weight="medium" width={161} height={5} />
      </View>
      <ThemePicker selected={selected} onSelect={onSelect} />
    </SketchFrame>
  </Screen>;
}
const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.md },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { minHeight: 44, justifyContent: "center" },
  backText: { ...type.small, color: colors.ink },
  frame: { paddingVertical: space.lg, gap: space.lg },
  heading: { alignItems: "center", gap: space.xs },
  title: { ...type.h2, color: colors.ink },
});
