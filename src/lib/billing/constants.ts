export const BUILD_FEE_CENTS = 19900;
export const MAINTENANCE_CENTS = 1900;
export const BILLING_CURRENCY = "usd";

export const BUILD_FEE_LABEL = "One-time build fee";
export const MAINTENANCE_LABEL = "Monthly maintenance subscription";

export type BillingChargeType = "build_fee" | "maintenance";

export function amountForChargeType(type: BillingChargeType) {
  return type === "build_fee" ? BUILD_FEE_CENTS : MAINTENANCE_CENTS;
}

export function labelForChargeType(type: BillingChargeType) {
  return type === "build_fee" ? BUILD_FEE_LABEL : MAINTENANCE_LABEL;
}
