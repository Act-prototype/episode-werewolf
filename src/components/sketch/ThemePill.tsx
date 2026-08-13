import { Text, StyleSheet } from "react-native";
import { PressableScale } from "../PressableScale";
import { SketchStretch } from "./SketchStretch";
import { colors, type } from "@/theme/tokens";

interface Props {
  label: string;
  onPress: () => void;
  /** キラキラ付きの素材を使う（AI生成用） */
  ai?: boolean;
}

/** テーマ操作の小さいピル（テーマを変更 / AIでつくる）。 */
export function ThemePill({ label, onPress, ai }: Props) {
  return (
    <PressableScale onPress={onPress} style={styles.pill}>
      <SketchStretch name={ai ? "pillAi" : "pill"} height={32} style={StyleSheet.absoluteFill} />
      {/* キラキラが左端に入るぶん、AIピルだけ文字を右へ寄せる */}
      <Text style={[styles.text, ai && { paddingLeft: 18 }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: { height: 32, minWidth: 140, alignItems: "center", justifyContent: "center" },
  text: { ...type.small, color: colors.ink },
});
