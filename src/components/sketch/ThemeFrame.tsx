import { Image, Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { SketchStretch } from "./SketchStretch";
import { sketch } from "@/theme/sketchAssets";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  topic?: string;
  category?: string;
  /** 枠を持ち上げている猫を下に添える（テーマ発表で使う） */
  withCat?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * テーマ表示。手書きの角丸枠にお題とカテゴリを収める。
 * 主役はお題そのもの。カテゴリは分類なので小さく下に添える。
 *
 * 猫は枠の直下に隙間なく置く。素材は前足の先が上端になるよう
 * トリムされているので、これで爪先が枠の下辺にちょうど接する
 * （余白を入れると浮き、負のマージンを入れると枠に食い込む）。
 */
export function ThemeFrame({ topic, category, withCat, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.frame}>
        <SketchStretch name="frameTheme" height={115} style={StyleSheet.absoluteFill} />
        <View style={styles.inner}>
          <Text style={styles.topic} numberOfLines={2}>
            「{topic}」
          </Text>
          {!!category && (
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          )}
        </View>
      </View>

      {withCat && <Image source={sketch.artCatTheme} style={styles.cat} resizeMode="contain" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", maxWidth: 333, alignItems: "center" },
  frame: { width: "100%", height: 115, justifyContent: "center" },
  inner: { paddingHorizontal: space.xl, alignItems: "center", gap: space.xs },
  // お題は2行に折り返せる大きさに抑えてある（AI生成は最長15文字）
  topic: { ...type.title, fontSize: 21, lineHeight: 29, color: colors.ink, textAlign: "center" },
  category: { ...type.small, color: colors.inkSub, textAlign: "center" },
  cat: { width: 76, height: 148 },
});
