export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  valid: boolean;
  planId?: string | null;
  error?: string;
}

export function formatCents(cents: number): string {
  const value = (cents / 100).toFixed(2);
  return value.replace(".", ",");
}

export function calculateInstallment(cents: number, months: number): string {
  if (!months || months <= 0) return `R$ ${formatCents(cents)}`;
  const installment = Math.floor(cents / months);
  return `${months}x de R$ ${formatCents(installment)}`;
}

export function calculatePixPrice(cents: number): string {
  return formatCents(cents);
}

export function applyDiscount(originalCents: number, coupon: Coupon | null): number {
  if (!coupon || !coupon.valid) return originalCents;

  let discounted = originalCents;
  if (coupon.discountType === "percentage") {
    discounted = Math.round(originalCents * (1 - coupon.discountValue / 100));
  } else if (coupon.discountType === "fixed") {
    const fixedCents = Math.round(coupon.discountValue * 100);
    discounted = Math.max(0, originalCents - fixedCents);
  }

  return Math.max(0, discounted);
}

export function discountLabel(coupon: Coupon): string {
  if (!coupon || !coupon.valid) return "";
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% OFF`;
  }
  return `R$ ${formatCents(coupon.discountValue * 100)} OFF`;
}

export async function validateCouponCode(
  code: string,
  planId?: string
): Promise<Coupon> {
  const res = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, plan_id: planId }),
  });

  const result = (await res.json().catch(() => ({}))) as Coupon;

  if (!res.ok) {
    return {
      code: code.toUpperCase().trim(),
      discountType: "percentage",
      discountValue: 0,
      valid: false,
      error: result.error || "Erro ao validar cupom.",
    };
  }

  return result;
}
