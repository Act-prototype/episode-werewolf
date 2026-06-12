import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

interface Props {
  names: string[];
  onChange: (index: number, name: string) => void;
}

/** 番号バッジ付きのプレイヤー名入力リスト。 */
export function NameInputList({ names, onChange }: Props) {
  return (
    <View style={{ gap: 10 }}>
      {names.map((name, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{index + 1}</Text>
          </View>
          <TextInput
            value={name}
            onChangeText={(t) => onChange(index, t)}
            placeholder={`プレイヤー${index + 1}`}
            placeholderTextColor={colors.ink400}
            style={styles.input}
            maxLength={12}
            returnKeyType="done"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: "center" },
  badge: {
    position: "absolute",
    left: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  input: {
    height: 50,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.ink200,
    backgroundColor: colors.ink50,
    paddingLeft: 52,
    paddingRight: space.lg,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink900,
  },
});
