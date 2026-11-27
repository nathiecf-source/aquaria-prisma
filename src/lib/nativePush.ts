// Push nativo Android (Capacitor): FCM nativo via @capacitor/push-notifications.
// Exclusivo da plataforma android — iOS mantém seu fluxo próprio e a web usa
// Web Push via service worker. Todos os pontos de entrada são gated por
// isAndroidApp(), então chamar fora do nativo é no-op seguro.
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isAndroidApp } from "./isTwa";
import { saveDeviceToken, deleteDeviceToken } from "./pushTokens";

let listenersBound = false;
let lastUserId: string | null = null;
let lastToken: string | null = null;
let notifIdSeq = 1;
let pendingRegistration: { resolve: (t: string | null) => void; timer: ReturnType<typeof setTimeout> } | null = null;

/** Vincula os listeners uma única vez (idempotente). */
async function bindListeners(): Promise<void> {
  if (listenersBound) return;
  listenersBound = true;

  await PushNotifications.addListener("registration", async (token) => {
    lastToken = token.value;
    console.info("[Push] Token nativo registrado.");
    if (lastUserId) {
      await saveDeviceToken(lastUserId, token.value, "android");
    }
    pendingRegistration?.resolve(token.value);
    if (pendingRegistration) clearTimeout(pendingRegistration.timer);
    pendingRegistration = null;
  });

  await PushNotifications.addListener("registrationError", (err) => {
    console.warn("[Push] registrationError:", err?.error || err);
    pendingRegistration?.resolve(null);
    if (pendingRegistration) clearTimeout(pendingRegistration.timer);
    pendingRegistration = null;
  });

  // Foreground: o Android não exibe push de app aberto — mostramos como
  // notificação local para o usuário ver mesmo com o app em primeiro plano.
  await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifIdSeq++,
            title: notification.title || "Aquar.IA",
            body: notification.body || "",
            extra: notification.data || {},
          },
        ],
      });
    } catch (err) {
      console.warn("[Push] Falha ao exibir notificação em foreground:", err);
    }
  });

  // Toque na notificação abre o app por padrão. Não navegamos para a URL do
  // payload: ela aponta para o site remoto (sem plugins nativos) e rotas SPA
  // não existem como arquivos no WebView local.
  await PushNotifications.addListener("pushNotificationActionPerformed", () => {});
}

/**
 * Pede permissão de notificações e registra o dispositivo no FCM nativo.
 * Resolve com o token quando o evento `registration` chega (timeout 10s).
 */
export async function registerNativePush(userId?: string | null): Promise<string | null> {
  if (!isAndroidApp()) return null;
  if (userId) lastUserId = userId;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      console.info("[Push] Permissão nativa:", perm.receive);
      return null;
    }
    await bindListeners();

    const tokenPromise = new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingRegistration = null;
        resolve(lastToken);
      }, 10000);
      pendingRegistration = { resolve, timer };
    });
    await PushNotifications.register();
    return await tokenPromise;
  } catch (err) {
    console.warn("[Push] Falha ao registrar push nativo:", err);
    return null;
  }
}

/** Garante listeners ligados (idempotente — uso no bootstrap pós-login). */
export async function ensureNativePushListeners(userId?: string | null): Promise<void> {
  if (!isAndroidApp()) return;
  if (userId) lastUserId = userId;
  try {
    await bindListeners();
  } catch (err) {
    console.warn("[Push] Falha ao ligar listeners nativos:", err);
  }
}

/** Desregistra o dispositivo e remove o token no logout. */
export async function unregisterNativePush(userId?: string | null): Promise<void> {
  if (!isAndroidApp()) return;
  const uid = userId || lastUserId;
  try {
    await PushNotifications.removeAllListeners();
    listenersBound = false;
    await PushNotifications.unregister().catch(() => {});
    if (uid) await deleteDeviceToken(uid, lastToken || undefined, "android");
    lastToken = null;
    lastUserId = null;
  } catch (err) {
    console.warn("[Push] Falha ao desregistrar push nativo:", err);
  }
}
