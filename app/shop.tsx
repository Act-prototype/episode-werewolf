import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { AppButton } from "@/components/AppButton";
import { TopicPurchaseSheet } from "@/components/TopicPurchaseSheet";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { useTopicStore } from "@/game/TopicStore";
import { allTopicsProduct, missingTopics, packs, singleProducts, TopicProduct, topics, productSavingsLabel } from "@/game/topicCatalog";
import { colors, radius, space, type } from "@/theme/tokens";

export default function Shop() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState(params.section === "packs" ? "packs" : "topics");
  const [selected, setSelected] = useState<TopicProduct | null>(null);
  const [notice, setNotice] = useState("");
  const store = useTopicStore();
  const owned = (product: TopicProduct) => missingTopics(product, store.availableCategories).length === 0;
  const price = (product: TopicProduct) => store.prices.find((item) => item.id === product.id)?.formatted ?? `¥${product.price}`;
  const restore = async () => {
    setNotice("");
    try { const count = await store.restore(); setNotice(count ? `${count}トピックの購入を復元しました。` : "復元できる購入はありませんでした。"); }
    catch { setNotice("購入を復元できませんでした。購入時のストアアカウントと通信状況をご確認ください。"); }
  };
  return <Screen scroll contentContainerStyle={styles.content}>
    <View style={styles.nav}>
      <Pressable accessibilityRole="button" accessibilityLabel="前の画面に戻る" hitSlop={12} onPress={() => router.canGoBack() ? router.back() : router.replace("/mode-select")} style={styles.back}><Icon name="back" /></Pressable>
      <Text style={styles.heading}>TOPIC SHOP</Text><Icon name="shop" />
    </View>
    <View style={styles.intro}><Text style={styles.title}>次の一戦に、ひとつまみの秘密。</Text>
      <Text style={styles.note}>思わず話したくなるお題を、試し読み。{"\n"}気になるトピックを、本棚に追加しよう。</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="全部入りセットを見る" onPress={() => setSelected(allTopicsProduct)} style={styles.hero}>
      <Text style={styles.heroLabel}>COMPLETE COLLECTION</Text>
      <Text style={styles.heroTitle}>ぜんぶの話で、遊ぼう。</Text>
      <Text style={styles.heroCopy}>12トピック / 84のお題 / ずっと遊べる</Text>
      <View style={styles.heroBottom}><View><Text style={styles.heroPrice}>{owned(allTopicsProduct) ? "購入済み" : price(allTopicsProduct)}</Text>
        <Text style={styles.heroCopy}>{productSavingsLabel(allTopicsProduct, store.prices)}</Text></View><View style={styles.arrow}><Icon name="forward" color={colors.onInk} /></View></View>
    </Pressable>
    <View style={styles.tabs}>
      {[['topics', 'トピック'], ['packs', 'お得なパック']].map(([id, label]) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}
        onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}><Text style={[styles.tabText, tab === id && styles.tabSelected]}>{label}</Text></Pressable>)}
    </View>
    {tab === "topics" ? <>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>気になる話を、ひとつずつ</Text><Text style={styles.note}>{store.prices.length ? "買い切り" : "各120円（予定）"}</Text></View>
      <View style={styles.grid}>{singleProducts.map((product, index) => {
        const topic = topics.find((item) => item.id === product.topicIds[0])!;
        return <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`${product.title}、${owned(product) ? "購入済み" : price(product)}、試し読み`}
          onPress={() => setSelected(product)} style={styles.book}>
          <View style={[styles.cover, { backgroundColor: topic.color }]}><Text style={styles.issue}>EPISODE / {String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.bookTitle}>{topic.category}</Text><SketchDivider weight="fine" width={80} height={3} />
            <Text style={styles.preview}>「{topic.preview}」</Text><Text style={styles.coverFoot}>この話、ほんと？</Text></View>
          <View style={styles.bookBottom}><Text style={styles.count}>{topic.topics.length}のお題</Text><Text style={styles.bookPrice}>{owned(product) ? "購入済み" : price(product)}</Text></View>
        </Pressable>;
      })}</View>
      <Text style={styles.sectionTitle}>はじめの3つは、ずっと無料</Text>
      <View style={styles.free}>{topics.filter((topic) => topic.free).map((topic) => <View key={topic.id} style={styles.freeRow}><Icon name="check" size={17} /><Text style={styles.note}>{topic.category}</Text><Text style={styles.freeLabel}>無料</Text></View>)}</View>
    </> : <>
      <Text style={styles.sectionTitle}>話がつながる、3つのセット</Text>
      <Text style={styles.note}>{store.prices.length ? "気の合うトピックをまとめて、お得に。" : "単品なら360円のところ、パックなら300円（予定）。"}</Text>
      {packs.map((pack) => <Pressable key={pack.id} accessibilityRole="button" accessibilityLabel={`${pack.title}、${price(pack)}`} onPress={() => setSelected(pack)} style={styles.pack}>
        <View style={styles.packTop}><Text style={styles.packTitle}>{pack.title}</Text><Text style={styles.packPrice}>{owned(pack) ? "購入済み" : price(pack)}</Text></View>
        <Text style={styles.note}>{pack.description}</Text>
        <Text style={styles.note}>{productSavingsLabel(pack, store.prices)}</Text>
        <View style={styles.spines}>{pack.topicIds.map((id) => { const topic = topics.find((item) => item.id === id)!; return <View key={id} style={[styles.spine, { backgroundColor: topic.color }]}><Text style={styles.spineLabel}>{topic.category}</Text></View>; })}</View>
        <Text style={styles.packFoot}>21のお題を収録　・　試し読みする →</Text>
      </Pressable>)}
    </>}
    <View style={styles.footer}><Text style={styles.note}>買い切り・追加料金なし。購入したトピックは両モードで何度でも遊べます。全部入りは現在の12トピックが対象です。</Text>
      {!!store.unavailable && <Text style={styles.note}>{store.unavailable}</Text>}
      {!store.prices.length && <Text style={styles.note}>表示価格は予定価格です。販売開始後はストアの価格が表示されます。</Text>}
      <AppButton label="購入を復元" variant="outline" size="sm" disabled={!!store.unavailable} loading={store.busy} onPress={restore} />
      {!!store.unavailable && <AppButton label="ストアを再読み込み" variant="outline" size="sm" onPress={() => { void store.refresh(); }} />}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.note}>{notice}</Text>}
    </View>
    <TopicPurchaseSheet product={selected} onClose={() => setSelected(null)} onPurchased={() => setNotice("トピックを追加しました。前の画面に戻って遊べます。")} />
  </Screen>;
}
const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: space['3xl'], gap: space.xl }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { minHeight: 44, justifyContent: "center" }, heading: { ...type.displaySm, color: colors.ink },
  intro: { gap: space.md }, title: { ...type.title, fontSize: 21, lineHeight: 32, color: colors.ink }, note: { ...type.small, lineHeight: 22, color: colors.inkSub },
  hero: { backgroundColor: "#d8e2cc", borderWidth: 1, borderColor: colors.ink, borderRadius: radius.lg, padding: space.xl, gap: space.md }, heroLabel: { ...type.overlineEn, color: colors.inkSub }, heroTitle: { ...type.title, fontSize: 26, color: colors.ink }, heroCopy: { ...type.caption, color: colors.inkSub, lineHeight: 19 }, heroBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.md }, heroPrice: { ...type.display, fontSize: 35, color: colors.ink }, arrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: colors.ink300 }, tab: { flex: 1, paddingVertical: space.md, alignItems: "center" }, tabActive: { borderBottomWidth: 3, borderColor: colors.ink }, tabText: { ...type.body, color: colors.inkSub }, tabSelected: { color: colors.ink },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }, sectionTitle: { ...type.h2, color: colors.ink, flexShrink: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.xl }, book: { width: "47.5%", gap: space.sm }, cover: { minHeight: 220, padding: space.md, borderRadius: 3, borderLeftWidth: 4, borderColor: "rgba(21,21,21,0.15)", gap: space.md }, issue: { ...type.overlineEn, fontSize: 9, color: colors.inkSub }, bookTitle: { ...type.h2, color: colors.ink, lineHeight: 27 }, preview: { ...type.body, color: colors.ink, lineHeight: 23, flex: 1 }, coverFoot: { ...type.caption, color: colors.inkSub }, bookBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.xs }, count: { ...type.caption, color: colors.inkSub }, bookPrice: { ...type.body, color: colors.ink },
  free: { gap: space.md }, freeRow: { flexDirection: "row", gap: space.sm, alignItems: "center" }, freeLabel: { ...type.caption, marginLeft: "auto", color: colors.inkSub },
  pack: { padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.ink300, borderRadius: radius.md }, packTop: { flexDirection: "row", gap: space.sm, justifyContent: "space-between", alignItems: "center" }, packTitle: { ...type.h2, color: colors.ink, flex: 1 }, packPrice: { ...type.title, color: colors.ink }, spines: { flexDirection: "row", gap: 6 }, spine: { flex: 1, minHeight: 88, padding: space.sm, justifyContent: "center", borderLeftWidth: 3, borderColor: "rgba(21,21,21,0.15)" }, spineLabel: { ...type.small, color: colors.ink, lineHeight: 21 }, packFoot: { ...type.caption, color: colors.inkSub }, footer: { gap: space.md, borderTopWidth: 1, borderColor: colors.ink300, paddingTop: space.xl },
});
