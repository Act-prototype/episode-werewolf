import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { PressableScale } from "./PressableScale";
import { Icon } from "./Icon";
import { colors, radius, space, type } from "@/theme/tokens";
export function ShopLink({ bundles = false }: { bundles?: boolean }) {
  const router = useRouter();
  return <PressableScale accessibilityRole="button" accessibilityLabel={bundles ? "まとめ買いをショップで見る" : "トピックショップを開く"}
    onPress={() => router.push({ pathname: "/shop", params: { section: bundles ? "packs" : "topics" } })} style={styles.root}>
    <Icon name="shop" size={28} />
    <View style={styles.copy}><Text style={styles.title}>{bundles ? "まとめ買いでもっとお得に" : "トピックショップ"}</Text>
      {!bundles && <Text style={styles.note}>次の一戦が盛り上がるお題、見つけよう。</Text>}</View>
    <Icon name="forward" size={20} />
  </PressableScale>;
}
const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderWidth: 1, borderColor: colors.ink300, borderRadius: radius.lg, backgroundColor: colors.paperDeep },
  copy: { flex: 1, gap: space.xs }, title: { ...type.body, color: colors.ink }, note: { ...type.caption, color: colors.inkSub, lineHeight: 18 },
});
