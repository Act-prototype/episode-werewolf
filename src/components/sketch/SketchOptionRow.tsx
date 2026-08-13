import { Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { PressableScale } from "../PressableScale";
import { SketchStretch } from "./SketchStretch";
import { colors, type } from "@/theme/tokens";

interface Props {
  label: string;
  onPress: () => void;
  /** 選択中は黒塗りの素材に差し替え、文字を紙色で抜く */
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 一覧から1つ選ぶ行。投票の候補やダウト相手の選択に使う。
 * 未選択＝線画の器、選択中＝黒塗り、と素材そのものを差し替える。
 */
export function SketchOptionRow({ label, onPress, selected = false, disabled, style }: Props) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} haptic={false} style={[styles.row, style]}>
      <SketchStretch
        name={selected ? "buttonBlack" : "box"}
        height={46}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.text, selected && { color: colors.onInk }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { height: 46, justifyContent: "center", paddingHorizontal: 20 },
  text: { ...type.title, color: colors.ink },
});
