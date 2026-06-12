import { View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";
import { PressableScale } from "./PressableScale";
import { Icon } from "./Icon";
import { haptics } from "./haptics";
import { colors, radius, shadow, sizing } from "@/theme/tokens";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

/** 大きな数字 + ＋/− の数量コントロール。Setup/CardSetup で共通利用。 */
export function Stepper({ value, onChange, min = -Infinity, max = Infinity }: Props) {
  const canDec = value > min;
  const canInc = value < max;
  const pop = useSharedValue(1);
  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  useEffect(() => {
    pop.value = 1.18;
    pop.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [value]);

  const step = (delta: number, allowed: boolean) => {
    if (!allowed) return;
    haptics.select();
    onChange(value + delta);
  };

  return (
    <View style={styles.row}>
      <PressableScale
        haptic={false}
        disabled={!canDec}
        onPress={() => step(-1, canDec)}
        style={styles.btn}
      >
        <Icon name="remove" size={26} color={colors.white} />
      </PressableScale>

      <Animated.View style={[styles.display, shadow.raised, numStyle]}>
        <Text style={styles.value}>{value}</Text>
      </Animated.View>

      <PressableScale
        haptic={false}
        disabled={!canInc}
        onPress={() => step(1, canInc)}
        style={styles.btn}
      >
        <Icon name="add" size={26} color={colors.white} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  btn: {
    width: sizing.stepperBtn,
    height: sizing.stepperBtn,
    borderRadius: radius.lg,
    backgroundColor: colors.ink800,
    alignItems: "center",
    justifyContent: "center",
  },
  display: {
    width: sizing.stepperBox,
    height: sizing.stepperBox,
    borderRadius: radius["2xl"],
    backgroundColor: colors.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { color: colors.white, fontSize: 38, fontWeight: "800" },
});
