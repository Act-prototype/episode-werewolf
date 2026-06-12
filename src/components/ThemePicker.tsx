import { View, Text, StyleSheet } from "react-native";
import { PressableScale } from "./PressableScale";
import { Icon } from "./Icon";
import { episodeThemes, SHUFFLE_THEME } from "@/game/episodeThemes";
import { colors, radius } from "@/theme/tokens";

interface Props {
  selected: string;
  onSelect: (theme: string) => void;
}

/** エピソードテーマ選択グリッド（ランダム + 8カテゴリ）。 */
export function ThemePicker({ selected, onSelect }: Props) {
  const Chip = ({ label, value, full, icon }: { label: string; value: string; full?: boolean; icon?: "shuffle" }) => {
    const active = selected === value;
    return (
      <PressableScale
        haptic
        onPress={() => onSelect(value)}
        style={[
          styles.chip,
          full && styles.full,
          { backgroundColor: active ? colors.ink900 : colors.ink100 },
        ]}
      >
        <View style={styles.chipInner}>
          {icon && <Icon name={icon} size={16} color={active ? colors.white : colors.ink700} />}
          <Text style={[styles.chipText, { color: active ? colors.white : colors.ink700 }]}>{label}</Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.grid}>
      <Chip label="ランダム" value={SHUFFLE_THEME} full icon="shuffle" />
      {episodeThemes.map((t) => (
        <Chip key={t.category} label={t.category} value={t.category} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexGrow: 1,
    flexBasis: "47%",
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  full: { flexBasis: "100%" },
  chipInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipText: { fontSize: 14, fontWeight: "700" },
});
