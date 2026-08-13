import { Text, View, StyleSheet } from "react-native";
import { Stepper } from "../Stepper";
import { SketchDivider } from "./SketchDivider";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

/** ラベル + 罫線 + 数量コントロール。モックの人数設定のかたまり。 */
export function SketchStepper({ label, value, min, max, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <SketchDivider weight="tiny" width={34} height={3} style={styles.rule} />
      <View style={styles.control}>
        <Stepper value={value} min={min} max={max} onChange={onChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center" },
  label: { ...type.body, color: colors.ink },
  rule: { marginTop: space.xs },
  control: { marginTop: space.sm },
});
