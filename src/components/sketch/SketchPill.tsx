import { Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { PressableScale } from "../PressableScale";
import { SketchStretch, sketchHeight } from "./SketchStretch";
import { colors, type } from "@/theme/tokens";

interface Props {
  label: string;
  onPress: () => void;
  /** 選択中は黒塗りの素材に差し替え、文字を紙色で抜く */
  selected?: boolean;
  /** AI生成用。キラキラ付きの素材を使う */
  ai?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * テーマ選択などに使う手書きピル。
 * 未選択＝線画、選択中＝黒塗り、AI＝キラキラ付き、と素材そのものを差し替える。
 */
export function SketchPill({ label, onPress, selected = false, ai = false, disabled, style }: Props) {
  const name = selected ? "pillSelected" : ai ? "pillAi" : "pill";
  const h = sketchHeight("pill");
  // キラキラが左端に入るぶん、AIピルだけ文字を右へ寄せる
  const padLeft = ai ? 34 : 12;

  return (
    // 幅は外側のViewで受ける（PressableScaleのstyleは内側のViewに渡るため）
    <View style={style}>
      <PressableScale onPress={onPress} disabled={disabled} style={{ height: h }}>
        <SketchStretch name={name} height={h} style={StyleSheet.absoluteFill} />
        <View style={[styles.center, { height: h, paddingLeft: padLeft }]}>
          <Text style={[styles.label, selected && { color: colors.onInk }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingRight: 12 },
  label: { ...type.small, color: colors.ink },
});
