import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { episodeThemes, CUSTOM_THEME, SHUFFLE_THEME } from "@/game/episodeThemes";
import { topics, singleProducts, TopicProduct } from "@/game/topicCatalog";
import { useTopicStore } from "@/game/TopicStore";
import { colors, radius, space, type } from "@/theme/tokens";
import { Icon } from "./Icon";
import { ShopLink } from "./ShopLink";
import { TopicPurchaseSheet } from "./TopicPurchaseSheet";
interface Props {
  selected: string;
  onSelect: (theme: string, availableCategories?: string[]) => void;
  mode?: "setup" | "play";
}
export function ThemePicker({ selected, onSelect, mode = "setup" }: Props) {
  const store = useTopicStore();
  const [product, setProduct] = useState<TopicProduct | null>(null);
  const canPurchase = mode === "setup";
  const visibleTopics = canPurchase ? topics : topics.filter((topic) => store.availableCategories.includes(topic.category));
  const actualSelected = selected === CUSTOM_THEME || selected === SHUFFLE_THEME || store.availableCategories.includes(selected) ? selected : episodeThemes[0].category;
  return <View style={styles.root}>
    {canPurchase && <Text style={styles.note}>無料の3つからスタート。気になるトピックを追加しよう。</Text>}
    <View style={styles.grid}>
      {[{ category: SHUFFLE_THEME, id: "shuffle", free: true }, ...visibleTopics].map((topic) => {
        const locked = !topic.free && !store.availableCategories.includes(topic.category);
        const active = actualSelected === topic.category && !locked;
        return <Pressable key={topic.id} accessibilityRole="button" accessibilityState={{ selected: active, disabled: !store.ready }}
          accessibilityLabel={`${topic.category === SHUFFLE_THEME ? "ランダム" : topic.category}${locked ? "、ロック中、購入画面を開く" : ""}`}
          disabled={!store.ready} onPress={() => locked ? setProduct(singleProducts.find((item) => item.topicIds[0] === topic.id)!) : onSelect(topic.category)}
          style={[styles.cell, active && styles.active]}>
          {locked && <Icon name="lock" size={16} color={colors.inkSub} />}
          <Text style={[styles.label, active && styles.activeText]}>{topic.category === SHUFFLE_THEME ? "ランダム" : topic.category}</Text>
        </Pressable>;
      })}
    </View>
    <Text style={styles.note}>ランダムは無料・購入済みのトピックから出題します。</Text>
    {canPurchase && <ShopLink bundles />}
    {canPurchase && <TopicPurchaseSheet product={product} onClose={() => setProduct(null)} showShopLink
      onPurchased={(availableCategories) => { if (product) onSelect(topics.find((topic) => topic.id === product.topicIds[0])!.category, availableCategories); }} />}
  </View>;
}
const styles = StyleSheet.create({
  root: { width: "100%", gap: space.md }, grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  cell: { width: "48%", minHeight: 52, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: space.sm, gap: space.xs, borderWidth: 1, borderColor: colors.ink300, borderRadius: radius.md },
  active: { backgroundColor: colors.ink, borderColor: colors.ink }, activeText: { color: colors.onInk },
  label: { ...type.small, color: colors.ink, flexShrink: 1 },
  note: { ...type.caption, color: colors.inkSub, lineHeight: 18 },
});
