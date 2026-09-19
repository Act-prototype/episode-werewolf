import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import Purchases, { CustomerInfo, PRODUCT_CATEGORY, PurchasesStoreProduct } from "react-native-purchases";
import { topicProducts } from "./topicCatalog";
import type { BillingSnapshot } from "./billingTypes";

let listener: ((info: CustomerInfo) => void) | undefined;
const products = new Map<string, PurchasesStoreProduct>();
const apiKey = Platform.OS === "ios"
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
  : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const activeEntitlements = (info: CustomerInfo) => Object.keys(info.entitlements.active);
export function billingUnavailableReason(): string | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "購入・復元はストア版アプリでご利用ください。";
  if (!apiKey || apiKey.startsWith("test_")) return "ただいま販売準備中です。お題の試し読みをお楽しみください。";
  return null;
}
export async function initializeBilling(onUpdate: (ids: string[]) => void): Promise<BillingSnapshot> {
  if (billingUnavailableReason()) return { entitlements: [], products: [] };
  if (!(await Purchases.isConfigured())) Purchases.configure({ apiKey: apiKey! });
  stopBillingListener();
  listener = (info) => onUpdate(activeEntitlements(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  // A product-fetch failure must not discard a customer's existing entitlements.
  const [customer, storeProducts] = await Promise.allSettled([
    Purchases.getCustomerInfo(), Purchases.getProducts(topicProducts.map((product) => product.id), PRODUCT_CATEGORY.NON_SUBSCRIPTION),
  ]);
  if (customer.status === "fulfilled") onUpdate(activeEntitlements(customer.value));
  if (customer.status === "rejected") throw customer.reason;
  if (storeProducts.status === "rejected") throw storeProducts.reason;
  storeProducts.value.forEach((product) => products.set(product.identifier, product));
  return {
    entitlements: activeEntitlements(customer.value),
    products: storeProducts.value.map((product) => ({ id: product.identifier, formatted: product.priceString, amount: product.price, currency: product.currencyCode })),
  };
}
export function stopBillingListener() {
  if (listener) Purchases.removeCustomerInfoUpdateListener(listener);
  listener = undefined;
}
export async function purchaseTopicProduct(id: string): Promise<string[] | null> {
  const reason = billingUnavailableReason();
  if (reason) throw new Error(reason);
  const product = products.get(id);
  if (!product) throw new Error("この商品は現在購入できません。時間をおいてお試しください。");
  try {
    const result = await Purchases.purchaseStoreProduct(product);
    return activeEntitlements(result.customerInfo);
  } catch (error) {
    if (typeof error === "object" && error !== null && "userCancelled" in error && error.userCancelled) return null;
    throw error;
  }
}
export async function restoreTopicPurchases(): Promise<string[]> {
  const reason = billingUnavailableReason();
  if (reason) throw new Error(reason);
  return activeEntitlements(await Purchases.restorePurchases());
}
