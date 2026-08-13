import { Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Quote } from "@/game/quotes";
import { colors, space, type } from "@/theme/tokens";

interface Props {
  quote: Quote;
  style?: StyleProp<ViewStyle>;
}

/** 画面下部に添える引用。本文は鉤括弧、著者は右寄せでダッシュ付き。 */
export function SketchQuote({ quote, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Text style={styles.text}>「{quote.text}」</Text>
      <Text style={styles.author}>——{quote.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 2 },
  text: { ...type.small, color: colors.inkSub, textAlign: "center" },
  author: { ...type.small, color: colors.inkSub, textAlign: "right", paddingRight: space.lg },
});
