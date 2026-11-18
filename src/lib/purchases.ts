// RevenueCat — compras in-app nativas, exclusivo do iOS (Capacitor).
// Na web/Android o checkout externo (InfinitePay) continua sendo o fluxo.
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { PurchasesOfferings, PurchasesPackage, CustomerInfo } from "@revenuecat/purchases-capacitor";
import { isIosApp } from "./isTwa";

export type { PurchasesOfferings, PurchasesPackage, CustomerInfo };

let configured = false;

async function ensureConfigured(): Promise<boolean> {
  if (!isIosApp()) return false;
  const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
  if (!apiKey) {
    console.warn("[RC] VITE_REVENUECAT_IOS_KEY não configurada.");
    return false;
  }
  if (configured) return true;
  try {
    await Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (err) {
    console.warn("[RC] Falha ao configurar RevenueCat:", err);
    return false;
  }
}

/** Vincula o usuário Supabase ao appUserID do RevenueCat (chamado no login). */
export async function purchasesLogIn(userId: string): Promise<void> {
  if (!(await ensureConfigured())) return;
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.warn("[RC] Falha no logIn:", err);
  }
}

/** Desvincula o appUserID no logout. */
export async function purchasesLogOut(): Promise<void> {
  if (!isIosApp() || !configured) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn("[RC] Falha no logOut:", err);
  }
}

/** Busca as Offerings configuradas no painel RevenueCat. */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!(await ensureConfigured())) return null;
  try {
    return await Purchases.getOfferings();
  } catch (err) {
    console.warn("[RC] Falha ao buscar offerings:", err);
    return null;
  }
}

/** Executa a compra nativa de um package. Retorna CustomerInfo ou null. */
export async function purchasePackage(aPackage: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const result = await Purchases.purchasePackage({ aPackage });
    return result.customerInfo;
  } catch (err: any) {
    if (!err?.userCancelled) console.warn("[RC] Falha na compra:", err);
    return null;
  }
}

/** Botão obrigatório da App Store: restaura compras do Apple ID. */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const result = await Purchases.restorePurchases();
    return result.customerInfo;
  } catch (err) {
    console.warn("[RC] Falha ao restaurar compras:", err);
    return null;
  }
}
