import { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

/**
 * 勝利時の紙吹雪（純JSの react-native-confetti-cannon を使用＝Expo Goでも動作）。
 * 画面上部の左右からはじけさせ、タッチは透過する。Web では Confetti.web.tsx の no-op。
 */
export function Celebrate({ colors, count = 120 }: { colors?: string[]; count?: number }) {
  const { width } = useMemo(() => Dimensions.get("window"), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ConfettiCannon
        count={count}
        origin={{ x: width * 0.15, y: -10 }}
        autoStart
        fadeOut
        explosionSpeed={360}
        fallSpeed={2800}
        colors={colors}
      />
      <ConfettiCannon
        count={count}
        origin={{ x: width * 0.85, y: -10 }}
        autoStart
        autoStartDelay={150}
        fadeOut
        explosionSpeed={360}
        fallSpeed={2800}
        colors={colors}
      />
    </View>
  );
}
