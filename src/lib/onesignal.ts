declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<((OneSignal: any) => void)>;
  }
}

export function promptOneSignalPush() {
  try {
    if (typeof window === "undefined") return;
    if (window.OneSignal?.Slidedown) {
      window.OneSignal.Slidedown.promptPush();
    } else if (window.OneSignal?.registerForPushNotifications) {
      window.OneSignal.registerForPushNotifications();
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OneSignal: any) => {
        OneSignal.Slidedown.promptPush();
      });
    }
  } catch (err) {
    console.warn("[OneSignal] Erro ao solicitar notificações:", err);
  }
}

export function oneSignalLogin(userId: string) {
  try {
    if (typeof window === "undefined" || !userId) return;
    if (window.OneSignal?.login) {
      window.OneSignal.login(userId);
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OneSignal: any) => {
        OneSignal.login(userId);
      });
    }
  } catch (err) {
    console.warn("[OneSignal] Erro ao fazer login:", err);
  }
}

export function oneSignalLogout() {
  try {
    if (typeof window === "undefined") return;
    if (window.OneSignal?.logout) {
      window.OneSignal.logout();
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OneSignal: any) => {
        OneSignal.logout();
      });
    }
  } catch (err) {
    console.warn("[OneSignal] Erro ao fazer logout:", err);
  }
}
