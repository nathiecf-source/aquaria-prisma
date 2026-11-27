/**
 * Detecta se o app está rodando como aplicativo instalado (TWA no Android ou
 * PWA em modo standalone), em oposição a uma aba normal de navegador.
 *
 * Usado para esconder fluxos de pagamento externos dentro do app distribuído
 * pela Google Play (política de pagamentos exige Play Billing para bens
 * digitais; o site na web segue usando o checkout externo normalmente).
 */
import { Capacitor } from "@capacitor/core";

/** Retorna true apenas quando roda dentro do app nativo iOS (Capacitor). */
export function isIosApp(): boolean {
  try {
    return Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

/** Retorna true apenas quando roda dentro do app nativo Android (Capacitor). */
export function isAndroidApp(): boolean {
  try {
    return Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

/** True em qualquer app nativo Capacitor (iOS ou Android), false na web/TWA. */
export function isNativeMobileApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isRunningAsApp(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as any)?.standalone === true;
  const androidAppReferrer =
    typeof document !== "undefined" &&
    typeof document.referrer === "string" &&
    document.referrer.startsWith("android-app://");
  return Boolean(standalone || androidAppReferrer);
}
