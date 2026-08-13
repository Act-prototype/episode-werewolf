import { Image, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameMenu } from "../GameMenu";
import { sketch } from "@/theme/sketchAssets";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  /** 何日目か。省略すると日付を出さずメニューだけになる（勝敗発表など日付が意味を持たない画面） */
  day?: number;
  mode?: "normal" | "card";
}

/**
 * ゲーム進行画面の共通ヘッダー。
 * 左に日の出＋「N日目」、右にメニュー。塗りも罫線も持たず紙の上に直接置く。
 */
export function GameHeader({ day, mode = "normal" }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      {/* 日付が無くてもメニューを右端に保つため、空でも要素は置く */}
      <View>
        {day !== undefined && (
          <>
            <Image source={sketch.iconSunrise} style={styles.sunrise} resizeMode="contain" />
            <Text style={styles.day}>{day}日目</Text>
          </>
        )}
      </View>
      <GameMenu mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingBottom: space.sm,
  },
  sunrise: { width: 40, height: 23 },
  day: { ...type.small, color: colors.ink, marginTop: 2 },
});
