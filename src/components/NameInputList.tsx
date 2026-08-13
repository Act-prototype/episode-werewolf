import { View, TextInput, StyleSheet } from "react-native";
import { SketchBox } from "./sketch/SketchBox";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  names: string[];
  onChange: (index: number, name: string) => void;
}

/** プレイヤー名の入力リスト。器は手書きのボックス素材。 */
export function NameInputList({ names, onChange }: Props) {
  return (
    <View style={{ gap: space.md }}>
      {names.map((name, index) => (
        <SketchBox key={index}>
          <TextInput
            value={name}
            onChangeText={(t) => onChange(index, t)}
            placeholder={`PLAYER ${index + 1}`}
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            maxLength={12}
            returnKeyType="done"
          />
        </SketchBox>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 手書きの枠が高さを担うので、入力自体は枠なし・透明背景で重ねる
  input: { ...type.title, color: colors.ink, padding: 0 },
});
