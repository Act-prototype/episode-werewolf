import type { StorePrice } from "./billingTypes";
import { episodeThemes, FREE_CATEGORIES } from "./episodeThemes";

const slugs = ["blunders", "firsts", "honest", "relationships", "regrets", "values", "romance", "dreams", "friends", "school", "family", "work", "travel", "food", "secrets"];
const covers = ["#efd2ad", "#cbded9", "#e8c8bd", "#c8d9dc", "#d9cee4", "#cdd7bd", "#e9bcb9", "#c0d6df", "#e7d195", "#d6dcb5", "#edcfba", "#c6d3dd", "#c0dad2", "#e8c49b", "#d2c6dd"];
export const topics = episodeThemes.map((theme, index) => ({
  ...theme,
  id: slugs[index],
  entitlement: `topic_${slugs[index]}`,
  free: FREE_CATEGORIES.includes(theme.category),
  preview: theme.topics[0],
  color: covers[index],
}));
export type Topic = (typeof topics)[number];
export interface TopicProduct {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
  price: number;
  kind: "single" | "pack" | "all";
}
export const singleProducts: TopicProduct[] = topics.filter((topic) => !topic.free).map((topic) => ({
  id: `topic_${topic.id}`, title: topic.category, description: `${topic.topics.length}のお題を収録`,
  topicIds: [topic.id], price: 120, kind: "single",
}));
export const packs: TopicProduct[] = [
  { id: "pack_connections", title: "ぐっと近づくパック", description: "恋も友情も、もう一歩深い話。", topicIds: ["relationships", "romance", "friends"], price: 300, kind: "pack" },
  { id: "pack_memories", title: "あの頃の話パック", description: "懐かしさの中に、意外な素顔。", topicIds: ["regrets", "school", "family"], price: 300, kind: "pack" },
  { id: "pack_everyday", title: "日常の事件簿パック", description: "いつもの毎日が、いちばん面白い。", topicIds: ["work", "travel", "food"], price: 300, kind: "pack" },
  { id: "pack_inner", title: "知らない一面パック", description: "まだ知らない、あなたの内側。", topicIds: ["values", "dreams", "secrets"], price: 300, kind: "pack" },
];
export const allTopicsProduct: TopicProduct = {
  id: "all_topics_v1", title: "全部入りセット", description: "全12トピック・84のお題をまとめて。",
  topicIds: topics.filter((topic) => !topic.free).map((topic) => topic.id), price: 980, kind: "all",
};
export const topicProducts = [...singleProducts, ...packs, allTopicsProduct];
export function categoriesForEntitlements(entitlements: readonly string[]): string[] {
  return topics.filter((topic) => topic.free || entitlements.includes(topic.entitlement)).map((topic) => topic.category);
}
export function missingTopics(product: TopicProduct, availableCategories: readonly string[]): Topic[] {
  return topics.filter((topic) => product.topicIds.includes(topic.id) && !availableCategories.includes(topic.category));
}
/** Compare the remaining singles AND related packs, so repeat customers never see a false deal. */
export function remainingPurchaseCost(product: TopicProduct, availableCategories: readonly string[], prices: readonly StorePrice[] = []): number {
  const missing = missingTopics(product, availableCategories);
  const targetPrice = prices.find((price) => price.id === product.id);
  const cost = (item: TopicProduct) => {
    if (!prices.length) return item.price;
    const price = prices.find((entry) => entry.id === item.id && entry.currency === targetPrice?.currency);
    return price?.amount ?? Infinity;
  };
  const covered = new Set<string>();
  let price = 0;
  for (const pack of packs) {
    const members = missing.filter((topic) => pack.topicIds.includes(topic.id));
    const singles = members.reduce((sum, topic) => sum + cost(singleProducts.find((item) => item.topicIds[0] === topic.id)!), 0);
    price += members.length ? Math.min(singles, pack.id === product.id ? Infinity : cost(pack)) : 0;
    members.forEach((topic) => covered.add(topic.id));
  }
  return price + missing.filter((topic) => !covered.has(topic.id)).reduce((sum, topic) => sum + cost(singleProducts.find((item) => item.topicIds[0] === topic.id)!), 0);
}

export function productPriceLabel(product: TopicProduct, prices: readonly StorePrice[]): string {
  return prices.find((price) => price.id === product.id)?.formatted ?? `¥${product.price}`;
}
/** Only advertise numerical savings when every included price is known and in the same currency. */
export function productSavingsLabel(product: TopicProduct, prices: readonly StorePrice[]): string {
  if (!prices.length) return `単品より${product.topicIds.length * 120 - product.price}円お得（予定）`;
  const bundle = prices.find((price) => price.id === product.id);
  if (!bundle) return "関連するトピックをまとめて追加";
  const singles = product.topicIds.map((id) => prices.find((price) => price.id === `topic_${id}`));
  if (singles.some((price) => !price || price.currency !== bundle.currency)) return "関連するトピックをまとめて追加";
  const savings = singles.reduce((sum, price) => sum + price!.amount, 0) - bundle.amount;
  return savings > 0 ? `単品より${new Intl.NumberFormat("ja-JP", { style: "currency", currency: bundle.currency }).format(savings)}お得` : "関連するトピックをまとめて追加";
}

export function shouldBuySeparately(product: TopicProduct, availableCategories: readonly string[], prices: readonly StorePrice[] = []): boolean {
  if (product.kind === "single" || missingTopics(product, availableCategories).length === 0) return false;
  const amount = prices.find((price) => price.id === product.id)?.amount ?? product.price;
  return remainingPurchaseCost(product, availableCategories, prices) <= amount;
}
