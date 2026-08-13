import { useEffect } from "react";
import { Image, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { sketch } from "@/theme/sketchAssets";

/**
 * 素材の実測値。
 * dialX/dialY は文字盤（透明な内円）の中心を素材サイズで割った比率。
 * 針は「丸い頭＝回転軸」「矢先＝先端」で、素の向きは右下（103.2°）を指している。
 * いずれも assets/sketch の実データから測った値なので、素材を差し替えたら測り直す。
 */
const WATCH = { width: 487, height: 560, dialX: 0.535, dialY: 0.523 };
const HAND = { width: 36, height: 89, pivotX: 25.3, pivotY: 9.3, baseAngle: 103.2 };

/** 素の向きを12時に合わせるための補正角 */
const BASE_OFFSET = -90 - HAND.baseAngle;

interface Props {
  /** 時計の幅（高さは縦横比から決まる） */
  size?: number;
  /** 針を回すか */
  running?: boolean;
  /** 針が一周する秒数 */
  secondsPerTurn?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 手書きのストップウォッチ。針が一定速度で回り続ける。
 *
 * 針の回転軸は画像の中心ではなく丸い頭の位置なので、
 * 「軸を中心に持つ正方形の器」を作ってその器を回す（RNの回転はビュー中心が軸）。
 */
export function SketchClock({ size = 250, running = true, secondsPerTurn = 60, style }: Props) {
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!running) {
      cancelAnimation(spin);
      return;
    }
    spin.value = 0;
    spin.value = withRepeat(
      withTiming(360, { duration: secondsPerTurn * 1000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(spin);
  }, [running, secondsPerTurn]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${BASE_OFFSET + spin.value}deg` }],
  }));

  const scale = size / WATCH.width;
  const height = (size * WATCH.height) / WATCH.width;
  // 軸から四辺までの最大距離を半径とする正方形。これで器の中心＝回転軸になる
  const box =
    2 *
    Math.max(
      HAND.pivotX,
      HAND.width - HAND.pivotX,
      HAND.pivotY,
      HAND.height - HAND.pivotY
    ) *
    scale;

  return (
    <View style={[{ width: size, height }, style]}>
      <Image source={sketch.artStopwatch} style={{ width: size, height }} resizeMode="contain" />

      <Animated.View
        style={[
          styles.hand,
          {
            width: box,
            height: box,
            left: WATCH.dialX * size - box / 2,
            top: WATCH.dialY * height - box / 2,
          },
          handStyle,
        ]}
        pointerEvents="none"
      >
        <Image
          source={sketch.artPinArrow}
          style={{
            position: "absolute",
            width: HAND.width * scale,
            height: HAND.height * scale,
            left: box / 2 - HAND.pivotX * scale,
            top: box / 2 - HAND.pivotY * scale,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hand: { position: "absolute" },
});
