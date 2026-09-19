import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { billingUnavailableReason, initializeBilling, purchaseTopicProduct, restoreTopicPurchases, stopBillingListener } from "./purchases";
import { categoriesForEntitlements, missingTopics, TopicProduct } from "./topicCatalog";
import type { StorePrice } from "./billingTypes";

interface TopicStoreValue {
  ready: boolean;
  availableCategories: string[];
  prices: StorePrice[];
  unavailable: string | null;
  busy: boolean;
  buy: (product: TopicProduct) => Promise<string[] | null>;
  restore: () => Promise<number>;
  refresh: () => Promise<void>;
}
const TopicStore = createContext<TopicStoreValue | null>(null);
export function TopicStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [prices, setPrices] = useState<StorePrice[]>([]);
  const [unavailable, setUnavailable] = useState<string | null>(billingUnavailableReason());
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const loading = useRef<Promise<void> | null>(null);
  const availableCategories = categoriesForEntitlements(entitlements);
  const refresh = (): Promise<void> => {
    if (loading.current) return loading.current;
    loading.current = (async () => {
      try {
        const snapshot = await initializeBilling((ids) => { if (mounted.current) setEntitlements(ids); });
        if (!mounted.current) return;
        setEntitlements(snapshot.entitlements);
        setPrices(snapshot.products);
        setUnavailable(billingUnavailableReason());
      } catch {
        if (mounted.current) setUnavailable("ストアに接続できませんでした。通信を確認して再読み込みしてください。");
      } finally {
        if (mounted.current) setReady(true);
        loading.current = null;
      }
    })();
    return loading.current;
  };
  useEffect(() => {
    mounted.current = true;
    void refresh();
    // Let the free library remain playable even when the store is unreachable.
    const timeout = setTimeout(() => { if (mounted.current) setReady(true); }, 8000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    return () => { mounted.current = false; clearTimeout(timeout); subscription.remove(); stopBillingListener(); };
  }, []);
  const buy = async (product: TopicProduct) => {
    if (inFlight.current) return null;
    if (missingTopics(product, availableCategories).length === 0) return availableCategories;
    inFlight.current = true;
    setBusy(true);
    try {
      const ids = await purchaseTopicProduct(product.id);
      if (ids === null) return null;
      setEntitlements(ids);
      if (missingTopics(product, categoriesForEntitlements(ids)).length > 0) {
        throw new Error("購入の反映を確認しています。少し待って「購入を復元」をお試しください。");
      }
      return categoriesForEntitlements(ids);
    } finally { inFlight.current = false; setBusy(false); }
  };
  const restore = async () => {
    if (inFlight.current) throw new Error("処理が終わるまでお待ちください。");
    inFlight.current = true;
    setBusy(true);
    try {
      const ids = await restoreTopicPurchases();
      setEntitlements(ids);
      return categoriesForEntitlements(ids).length - 3;
    } finally { inFlight.current = false; setBusy(false); }
  };
  return <TopicStore.Provider value={{ ready, availableCategories, prices, unavailable, busy, buy, restore, refresh }}>{children}</TopicStore.Provider>;
}
export function useTopicStore() {
  const store = useContext(TopicStore);
  if (!store) throw new Error("TopicStoreProvider is required");
  return store;
}
