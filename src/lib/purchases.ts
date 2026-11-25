// RevenueCat — compras in-app nativas, exclusivo do iOS (Capacitor).
// Na web/Android o checkout externo (InfinitePay) continua sendo o fluxo.
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { PurchasesOfferings, PurchasesPackage, CustomerInfo } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
import { isNativeMobileApp } from "./isTwa";
import { supabase } from "./supabaseClient";

export type { PurchasesOfferings, PurchasesPackage, CustomerInfo };

let configured = false;

/** Chave pública RevenueCat por plataforma nativa (appl_ iOS / goog_ Android). */
function getRevenueCatApiKey(): string | undefined {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined;
  }
  return undefined;
}

async function ensureConfigured(): Promise<boolean> {
  if (!isNativeMobileApp()) return false;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RC] Chave pública RevenueCat não configurada para esta plataforma.");
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
  if (!isNativeMobileApp() || !configured) return;
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

/**
 * Garante que o appUserID do RevenueCat bate com o usuário logado no Supabase
 * antes de comprar — evita vincular a compra a um appUserID anônimo ou de
 * outro usuário (idempotente: logIn com o mesmo ID é no-op).
 */
async function syncPurchasesUserBeforePurchase(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (uid) {
      await Purchases.logIn({ appUserID: uid });
    }
  } catch (err) {
    console.warn("[RC] Falha ao sincronizar appUserID antes da compra:", err);
  }
}

/** Executa a compra nativa de um package. Retorna CustomerInfo ou null. */
export async function purchasePackage(aPackage: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    await syncPurchasesUserBeforePurchase();
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
