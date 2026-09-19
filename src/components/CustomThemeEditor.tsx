import { Text, TextInput, View, StyleSheet } from "react-native";
import { CUSTOM_TOPIC_MAX_LENGTH } from "@/game/episodeThemes";
import { colors, radius, space, type } from "@/theme/tokens";

export function CustomThemeEditor({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.root}>
    <Text style={styles.label}>みんなに話してほしいお題を自由に</Text>
    <TextInput accessibilityLabel="自分でつくるテーマ" value={value} onChangeText={onChangeText}
      placeholder="例：今だから笑える、あの日の失敗" placeholderTextColor={colors.inkSub}
      maxLength={CUSTOM_TOPIC_MAX_LENGTH} style={styles.input} multiline textAlignVertical="top" />
    <Text style={styles.count}>{value.length} / {CUSTOM_TOPIC_MAX_LENGTH}文字 ・ 無料</Text>
  </View>;
}
const styles = StyleSheet.create({
  root: { width: "100%", gap: space.sm },
  label: { ...type.small, color: colors.inkSub },
  input: { ...type.body, color: colors.ink, minHeight: 88, borderWidth: 1, borderColor: colors.ink300, borderRadius: radius.md, padding: space.md, backgroundColor: colors.paper },
  count: { ...type.caption, color: colors.inkSub, textAlign: "right" },
});
