import type { BillingSnapshot } from "./billingTypes";
export function billingUnavailableReason(): string | null { return "購入・復元はiOS / Androidアプリでご利用ください。"; }
export async function initializeBilling(_onUpdate: (ids: string[]) => void): Promise<BillingSnapshot> {
  return { entitlements: [], products: [] };
}
export function stopBillingListener() {}
export async function purchaseTopicProduct(_id: string): Promise<string[] | null> { throw new Error(billingUnavailableReason()!); }
export async function restoreTopicPurchases(): Promise<string[]> { throw new Error(billingUnavailableReason()!); }
