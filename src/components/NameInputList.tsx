import { View, TextInput, StyleSheet } from "react-native";
import { SketchBox } from "./sketch/SketchBox";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  names: string[];
  onChange: (index: number, name: string) => void;
}

/** 未入力のプレイヤーに割り当てる連番の名前。表示・保存の両方でこれを正とする */
export const defaultPlayerName = (index: number) => `プレイヤー${index + 1}`;

/**
 * プレイヤー名の入力リスト。器は手書きのボックス素材。
 *
 * 既定の「プレイヤーN」はそのまま使う人が多く、書き換える人は全消ししてから
 * 打ち直すことになる。そのためフォーカス時に既定値のままなら空にして、
 * すぐ打ち始められるようにする。空のまま離れたら既定値に戻す。
 */
export function NameInputList({ names, onChange }: Props) {
  return (
    <View style={{ gap: space.md }}>
      {names.map((name, index) => (
        <SketchBox key={index}>
          <TextInput
            value={name}
            onChangeText={(t) => onChange(index, t)}
            onFocus={() => {
              if (name === defaultPlayerName(index)) onChange(index, "");
            }}
            onBlur={() => {
              if (name.trim() === "") onChange(index, defaultPlayerName(index));
            }}
            placeholder={defaultPlayerName(index)}
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
