import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ThemePill } from "./sketch/ThemePill";
import { ThemePicker } from "./ThemePicker";
import { CustomThemeEditor } from "./CustomThemeEditor";
import { AppButton } from "./AppButton";
import { CUSTOM_THEME, normalizeCustomTopic } from "@/game/episodeThemes";
import { space } from "@/theme/tokens";
export function GameThemeControls({ selected, customTopic, onShuffle, onChange }: {
  selected: string; customTopic?: string; onShuffle: () => void;
  onChange: (category: string, customTopic?: string, availableCategories?: string[]) => void;
}) {
  const [panel, setPanel] = useState<"topics" | "custom" | null>(null);
  const [draft, setDraft] = useState(customTopic ?? "");
  return <View style={styles.root}>
    <View style={styles.row}>
      <ThemePill label={selected === CUSTOM_THEME ? "別のお題を選ぶ" : "お題を変更"} onPress={selected === CUSTOM_THEME ? () => setPanel("topics") : onShuffle} />
      <ThemePill label="自分でつくる" onPress={() => setPanel(panel === "custom" ? null : "custom")} />
    </View>
    {panel === "custom" && <View style={styles.root}>
      <CustomThemeEditor value={draft} onChangeText={setDraft} />
      <AppButton size="sm" label="このテーマで遊ぶ" disabled={!normalizeCustomTopic(draft)}
        onPress={() => { onChange(CUSTOM_THEME, normalizeCustomTopic(draft)); setPanel(null); }} />
    </View>}
    <AppButton variant="outline" size="sm" label={panel === "topics" ? "トピックを閉じる" : "トピックを選ぶ"}
      onPress={() => setPanel(panel === "topics" ? null : "topics")} />
    {panel === "topics" && <ThemePicker mode="play" selected={selected} onSelect={(category, availableCategories) => { onChange(category, undefined, availableCategories); setPanel(null); }} />}
  </View>;
}
const styles = StyleSheet.create({ root: { width: "100%", gap: space.md }, row: { flexDirection: "row", justifyContent: "center", gap: space.lg } });
