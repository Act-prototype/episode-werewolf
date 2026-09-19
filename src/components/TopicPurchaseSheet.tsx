import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppButton } from "./AppButton";
import { Icon } from "./Icon";
import { useTopicStore } from "@/game/TopicStore";
import { missingTopics, shouldBuySeparately, TopicProduct, topics } from "@/game/topicCatalog";
import { colors, radius, space, type } from "@/theme/tokens";

export function TopicPurchaseSheet({ product, onClose, onPurchased, showShopLink = false }: {
  product: TopicProduct | null; onClose: () => void; onPurchased?: (availableCategories: string[]) => void; showShopLink?: boolean;
}) {
  const store = useTopicStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  useEffect(() => { setMessage(""); }, [product?.id]);
  if (!product) return null;
  const included = topics.filter((topic) => product.topicIds.includes(topic.id));
  const remaining = missingTopics(product, store.availableCategories);
  const price = store.prices.find((item) => item.id === product.id);
  const owned = remaining.length === 0;
  const overlap = included.length - remaining.length;
  const cheaperSeparately = shouldBuySeparately(product, store.availableCategories, store.prices);
  const buy = async () => {
    setMessage("");
    try {
      const availableCategories = await store.buy(product);
      if (availableCategories) { onPurchased?.(availableCategories); onClose(); }
    } catch (error) {
      setMessage(error instanceof Error && error.message.startsWith("購入の反映") ? error.message : "購入を完了できませんでした。承認待ちの場合は承認後に反映されます。時間をおいて再試行、または購入を復元してください。");
    }
  };
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!store.busy) onClose(); }}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!store.busy) onClose(); }} accessibilityLabel="購入画面を閉じる" accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.xl) }]} accessibilityViewIsModal>
        <View style={styles.header}><Text style={styles.eyebrow}>TOPIC SHOP / 試し読み</Text>
          <Pressable accessibilityLabel="閉じる" accessibilityRole="button" disabled={store.busy} onPress={onClose} hitSlop={10}><Icon name="close" /></Pressable></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{product.title}</Text><Text style={styles.note}>{product.description}</Text>
          {included.map((topic) => <View key={topic.id} style={[styles.preview, { backgroundColor: topic.color }]}>
            <Text style={styles.eyebrow}>{topic.category} ・ {topic.topics.length}のお題</Text>
            <Text style={styles.quote}>「{topic.preview}」</Text>
            <Text style={styles.note}>{store.availableCategories.includes(topic.category) ? "購入済み" : "この続きは、みんなのエピソードで。"}</Text>
          </View>)}
          <Text style={styles.note}>一度の購入で、何度でも遊べます。両方のゲームモードで利用できます。</Text>
          {overlap > 0 && !owned && <Text style={styles.note}>{included.length}トピック中{overlap}つは購入済み。新たに{remaining.length}つ追加されます。購入済み分の差額返金はありません。</Text>}
          {cheaperSeparately && !owned && <Text style={styles.note}>残りのトピックは、単品やほかのパックで同額以下で揃えられます。</Text>}
          {!!store.unavailable && <Text style={styles.note}>{store.unavailable}</Text>}
          {!!message && <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text>}
          <AppButton label={owned ? "購入済み" : cheaperSeparately ? "残りをショップで選ぶ" : `${price?.formatted ?? `¥${product.price}`}で購入`}
            disabled={owned || (!cheaperSeparately && (!price || !!store.unavailable))} loading={store.busy}
            onPress={cheaperSeparately ? () => { onClose(); if (showShopLink) router.push("/shop"); } : buy} />
          {!price && !owned && <Text style={styles.note}>表示価格は予定価格です。販売開始後はストアの価格が表示されます。</Text>}
          {showShopLink && !owned && <AppButton label="お得なまとめ買いを見る" variant="outline" size="sm" disabled={store.busy}
            onPress={() => { onClose(); router.push({ pathname: "/shop", params: { section: "packs" } }); }} />}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", backgroundColor: colors.scrim },
  sheet: { width: "100%", maxWidth: 480, maxHeight: "90%", padding: space.xl, backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg },
  content: { gap: space.lg, paddingBottom: space.sm }, eyebrow: { ...type.caption, color: colors.inkSub },
  title: { ...type.title, fontSize: 25, color: colors.ink }, note: { ...type.small, color: colors.inkSub, lineHeight: 21 },
  preview: { padding: space.lg, borderRadius: radius.md, gap: space.md }, quote: { ...type.h2, color: colors.ink, lineHeight: 28 },
  error: { ...type.small, color: colors.wolf, lineHeight: 22 },
});
