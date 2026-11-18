// Firebase Cloud Messaging — push notifications via FCM Web Push.
// Substitui o OneSignal: funciona no navegador e dentro do TWA (o Android
// exibe as notificações como nativas via o service worker do app).
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { supabase } from "./supabaseClient";

const firebaseConfig = {
  apiKey: "AIzaSyBW8mMJf7JiksMLGW8bO7ARtBZAX4NWr-w",
  authDomain: "aquaria-2bc50.firebaseapp.com",
  projectId: "aquaria-2bc50",
  storageBucket: "aquaria-2bc50.firebasestorage.app",
  messagingSenderId: "745535854634",
  appId: "1:745535854634:web:b4f36bf1fc9e6d1c0a0b53",
  measurementId: "G-ZR6S1C1JN2",
};

export const firebaseApp = initializeApp(firebaseConfig);

const VAPID_KEY =
  (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) ||
  "BATAfZ3nCLbxov7OkmBCB31F5hxhBV6Q6NjpPXy-04gFlyFME3osvCt5R2tdMmqu2vBxFDvVPSrhPbW-80CoUcM";

let messagingPromise: Promise<Messaging | null> | null = null;
function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  messagingPromise ??= isSupported().then((ok) => (ok ? getMessaging(firebaseApp) : null));
  return messagingPromise;
}

async function getSwRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.getRegistration("/");
}

async function saveFcmToken(userId: string, token: string) {
  try {
    const { error } = await supabase.from("user_devices").upsert(
      {
        user_id: userId,
        fcm_token: token,
        platform: "web",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fcm_token" }
    );
    if (error) console.warn("[FCM] Erro ao salvar token:", error.message);
  } catch (err) {
    console.warn("[FCM] Falha ao salvar token:", err);
  }
}

/** Obtém o token e salva no Supabase (sem pedir permissão — só se já concedida). */
export async function fetchAndStoreFcmToken(userId?: string | null): Promise<string | null> {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging || !VAPID_KEY || Notification.permission !== "granted") return null;
    const registration = await getSwRegistration();
    if (!registration) return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (token && userId) await saveFcmToken(userId, token);
    return token;
  } catch (err) {
    console.warn("[FCM] Falha ao obter token:", err);
    return null;
  }
}

/** Pede permissão de notificação e, se concedida, registra o token FCM. */
export async function requestPushPermissionAndToken(userId?: string | null): Promise<string | null> {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.info("[FCM] Messaging não suportado neste contexto.");
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[FCM] Permissão de notificação:", permission);
      return null;
    }
    return await fetchAndStoreFcmToken(userId);
  } catch (err) {
    console.warn("[FCM] Erro ao ativar notificações:", err);
    return null;
  }
}

let foregroundBound = false;
/** Exibe notificação também quando o app está aberto (foreground). */
export async function listenForegroundMessages(): Promise<void> {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging || foregroundBound) return;
    foregroundBound = true;
    onMessage(messaging, async (payload) => {
      try {
        const registration = await getSwRegistration();
        const n = payload.notification || {};
        await registration?.showNotification(n.title || "AquarIA", {
          body: n.body,
          icon: "/icon-192.png",
          data: { url: payload.data?.url || "/" },
        });
      } catch (err) {
        console.warn("[FCM] Falha ao exibir notificação em foreground:", err);
      }
    });
  } catch (err) {
    console.warn("[FCM] Falha ao registrar onMessage:", err);
  }
}

/** Remove o token do dispositivo (logout). */
export async function removeFcmToken(userId?: string | null): Promise<void> {
  try {
    const messaging = await getMessagingIfSupported();
    const registration = await getSwRegistration();
    let token: string | null = null;
    if (messaging && registration && VAPID_KEY) {
      token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration }).catch(() => null);
      await deleteToken(messaging).catch(() => {});
    }
    if (userId && token) {
      await supabase.from("user_devices").delete().eq("fcm_token", token);
    }
  } catch (err) {
    console.warn("[FCM] Falha ao remover token:", err);
  }
}
