// Botão Voltar do Android (@capacitor/app) — exclusivo do app nativo Android.
// Hierarquia: (a) fecha overlay no topo da pilha; (b) rota especial volta à raiz;
// (c) na raiz, exige duplo toque em 2s para sair (App.exitApp).
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

type BackHandler = { id: number; close: () => void };

const stack: BackHandler[] = [];
let nextId = 1;

/** Registra um overlay na pilha do botão Voltar. Retorna função de remoção. */
export function pushAndroidBackHandler(close: () => void): () => void {
  const id = nextId++;
  stack.push({ id, close });
  return () => {
    const idx = stack.findIndex((h) => h.id === id);
    if (idx >= 0) stack.splice(idx, 1);
  };
}

function closeTopOverlay(): boolean {
  const top = stack.pop();
  if (!top) return false;
  top.close();
  return true;
}

let toastEl: HTMLDivElement | null = null;
let lastBackPressAt = 0;

function showExitToast() {
  if (toastEl) toastEl.remove();
  toastEl = document.createElement("div");
  toastEl.textContent = "Pressione voltar novamente para sair";
  toastEl.style.cssText =
    "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);" +
    "background:rgba(60,53,45,0.92);color:#f4f1eb;padding:10px 18px;border-radius:999px;" +
    "font:500 12px/1.4 Inter,system-ui,sans-serif;letter-spacing:0.02em;z-index:99999;" +
    "pointer-events:none;opacity:0;transition:opacity .18s ease";
  document.body.appendChild(toastEl);
  requestAnimationFrame(() => {
    if (toastEl) toastEl.style.opacity = "1";
  });
  setTimeout(() => {
    if (toastEl) {
      toastEl.style.opacity = "0";
      setTimeout(() => toastEl?.remove(), 200);
      toastEl = null;
    }
  }, 1800);
}

/** Registra o listener do botão Voltar — não faz nada fora do Android nativo. */
export function initAndroidBackButton(): void {
  if (Capacitor.getPlatform() !== "android") return;

  App.addListener("backButton", () => {
    // (a) Modal, drawer, menu ou paywall aberto → fecha o topo da pilha.
    if (closeTopOverlay()) return;

    // (b) Fora da tela raiz (rota especial / hash) → volta uma etapa.
    if (window.location.pathname !== "/" || window.location.hash) {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }

    // (c) Tela raiz → duplo toque em 2s para encerrar.
    const now = Date.now();
    if (now - lastBackPressAt < 2000) {
      lastBackPressAt = 0;
      App.exitApp();
    } else {
      lastBackPressAt = now;
      showExitToast();
    }
  });
}
