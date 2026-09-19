export interface StorePrice { id: string; formatted: string; amount: number; currency: string }
export interface BillingSnapshot { entitlements: string[]; products: StorePrice[] }
