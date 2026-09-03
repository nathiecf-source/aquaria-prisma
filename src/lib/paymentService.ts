import { supabase } from "./supabaseClient";

export interface CheckoutSessionOptions {
  planId: string;
  couponCode?: string;
}

export const paymentService = {
  /**
   * Cria uma sessão de checkout na InfinitePay.
   * Requer `planId`: "annual-launch", "semester" ou "annual-official".
   */
  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<{ url: string; order_nsu?: string; success: boolean }> {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session?.access_token) {
      throw new Error("Você precisa estar logada para prosseguir com o pagamento.");
    }

    const response = await fetch("/api/checkout/infinitepay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        planId: options.planId,
        coupon_code: options.couponCode,
      }),
    });

    const result = await response.json().catch(() => ({}) as any);

    if (!response.ok || !result.url) {
      console.error("[PaymentService] Erro ao criar checkout:", result);
      throw new Error(result.error || "Erro ao gerar link de pagamento.");
    }

    return {
      url: result.url,
      order_nsu: result.order_nsu,
      success: true,
    };
  },
};
