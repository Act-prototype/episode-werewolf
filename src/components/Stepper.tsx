import { Image, View, StyleSheet } from "react-native";
import { PressableScale } from "./PressableScale";
import { SketchNumber } from "./sketch/SketchNumber";
import { haptics } from "./haptics";
import { sketch } from "@/theme/sketchAssets";
import { space } from "@/theme/tokens";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

/**
 * 数量コントロール。−／数字／＋ すべて手書き素材で組む。
 * 素材のインクは小さいので、押しやすさはタップ領域（44pt）で確保する。
 */
export function Stepper({ value, onChange, min = -Infinity, max = Infinity }: Props) {
  const canDec = value > min;
  const canInc = value < max;

  const step = (delta: number, allowed: boolean) => {
    if (!allowed) return;
    haptics.select();
    onChange(value + delta);
  };

  return (
    <View style={styles.row}>
      <PressableScale haptic={false} disabled={!canDec} onPress={() => step(-1, canDec)} style={styles.hit}>
        <Image source={sketch.stepperMinus} style={styles.minus} resizeMode="contain" />
      </PressableScale>

      <SketchNumber value={value} height={38} style={styles.number} />

      <PressableScale haptic={false} disabled={!canInc} onPress={() => step(1, canInc)} style={styles.hit}>
        <Image source={sketch.stepperPlus} style={styles.plus} resizeMode="contain" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space["2xl"] },
  hit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  minus: { width: 24, height: 8 },
  plus: { width: 20, height: 18 },
  number: { minWidth: 30, justifyContent: "center" },
});
