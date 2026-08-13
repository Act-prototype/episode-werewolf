import { TextInput, View, StyleSheet } from "react-native";
import { AppButton } from "../AppButton";
import { colors, radius, space, type } from "@/theme/tokens";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

/**
 * AIにお題を作らせる入力欄。
 * 「もっと面白く」のような相対的な指示も通るよう、送信側で現在のお題を添えている
 * （src/game/aiTheme.ts を参照）。
 */
export function AiThemeBox({ value, onChangeText, onSubmit, loading }: Props) {
  return (
    <View style={styles.root}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="例: 食べ物に関するテーマ、もっと面白く"
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <AppButton
        size="sm"
        loading={loading}
        label={loading ? "生成中..." : "AIで生成"}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", gap: space.md },
  input: {
    ...type.body,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink300,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
