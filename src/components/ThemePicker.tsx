import { View, StyleSheet } from "react-native";
import { SketchPill } from "./sketch/SketchPill";
import { episodeThemes, SHUFFLE_THEME } from "@/game/episodeThemes";
import { space } from "@/theme/tokens";

interface Props {
  selected: string;
  onSelect: (theme: string) => void;
}

/**
 * エピソードテーマ選択グリッド（ランダム + 8カテゴリ）。
 * モックに合わせて手書きピルの2列並びにし、選択中は黒塗りの素材へ差し替える。
 */
export function ThemePicker({ selected, onSelect }: Props) {
  const options = [SHUFFLE_THEME, ...episodeThemes.map((t) => t.category)];

  return (
    <View style={styles.grid}>
      {options.map((value) => (
        <SketchPill
          key={value}
          label={value === SHUFFLE_THEME ? "ランダム" : value}
          selected={selected === value}
          onPress={() => onSelect(value)}
          style={styles.cell}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "space-between" },
  // 2列。gapぶんを差し引いた幅にして端を揃える
  cell: { width: "48%" },
});
