import { supabase } from "./supabaseClient";

export async function trackEvent(eventName: string) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      console.warn("[Analytics] Sem sessão ativa, pulando evento:", eventName);
      return;
    }

    const res = await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event_name: eventName }),
    });

    if (!res.ok) {
      console.warn("[Analytics] Erro ao rastrear:", res.status);
    }
  } catch (err) {
    console.error("[Analytics] Erro:", err);
  }
}
