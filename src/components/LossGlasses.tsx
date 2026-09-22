import { Image, View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, space, type } from "@/theme/tokens";

// 小さい画面でも数が読み取れるよう、6杯までを積み、残りは数字で示す。
const POSITIONS = [[28, 0], [0, 0], [56, 0], [14, 24], [42, 24], [28, 48]];
const beerGlass = require("../../assets/sketch/art-beer-glass.png");

export function LossGlasses({ points, added = false }: { points: number; added?: boolean }) {
  const visible = Math.min(points, POSITIONS.length);
  const height = visible > 5 ? 76 : visible > 3 ? 52 : 28;
  return (
    <View style={styles.root} accessible accessibilityLabel={`負けポイント${points}点、ビールグラス${points}杯${added ? "。今回1杯追加" : ""}`}>
      {added && <Text style={styles.added}>+1杯</Text>}
      <View style={[styles.stack, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {visible === 0 ? <Text style={styles.empty}>—</Text> : POSITIONS.slice(0, visible).map(([left, bottom], i) => (
          <Animated.View key={i} entering={added && i === visible - 1 ? FadeInDown.duration(350) : undefined} style={{ position: "absolute", left, bottom }}>
            <Image source={beerGlass} style={styles.glass} resizeMode="contain" accessible={false} />
          </Animated.View>
        ))}
      </View>
      {points > visible && <Text style={styles.extra}>ほか{points - visible}杯</Text>}
      <Text style={styles.total}>累計 {points}杯</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: space.xs },
  stack: { width: 84, alignItems: "center", justifyContent: "center" },
  // 原画の透過余白を含めて32pxで描き、輪郭は従来と同じ約28pxに収める。
  glass: { width: 32, height: 32, marginHorizontal: -2, marginVertical: -2 },
  added: { ...type.small, color: colors.wolf },
  empty: { ...type.title, color: colors.inkFaint },
  extra: { ...type.caption, color: colors.inkSub },
  total: { ...type.small, color: colors.ink },
});
