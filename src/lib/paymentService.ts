import { supabase } from "./supabaseClient";

export interface CheckoutSessionOptions {
  userId: string;
  userEmail: string;
  fullName: string;
}

/**
 * Serviço de gateway de pagamentos (preparado para integração Stripe Checkout ou Pix).
 */
export const paymentService = {
  /**
   * Simula a criação de uma sessão de checkout.
   * Em produção, isso bateria em uma API (/api/create-checkout-session) para retornar uma URL do Stripe.
   * Aqui, simulamos o fluxo de sucesso dando upgrade direto no Supabase para 'PLUS' para testes rápidos!
   */
  async createCheckoutSession(options: CheckoutSessionOptions): Promise<{ url: string; success: boolean }> {
    console.log(`[PaymentService] Inicializando checkout para o usuário ${options.userId} (${options.fullName})`);
    
    // Simula atraso na rede
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      // Faz o upgrade direto do perfil do usuário para PLUS para fins de teste no MVP
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_tier: "PLUS", updated_at: new Date().toISOString() })
        .eq("id", options.userId);
        
      if (error) {
        throw error;
      }
      
      console.log(`[PaymentService] Assinatura PLUS ativada com sucesso via simulação.`);
      return {
        url: "#payment-success",
        success: true
      };
    } catch (err) {
      console.error("[PaymentService] Erro ao atualizar nível de assinatura:", err);
      throw err;
    }
  }
};
