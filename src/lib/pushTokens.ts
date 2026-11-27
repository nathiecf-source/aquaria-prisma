// Persistência de tokens push na tabela user_devices (Supabase).
// Regra de deduplicação: ao registrar um token NATIVO, todos os tokens
// anteriores do usuário são removidos (o app passa a ser o canal único
// naquele aparelho); ao registrar um token WEB, apenas os tokens web
// anteriores do usuário são removidos (preserva um eventual token nativo).
import { supabase } from "./supabaseClient";

export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: "web" | "android" | "ios" = "web"
): Promise<void> {
  try {
    const { error } = await supabase.from("user_devices").upsert(
      {
        user_id: userId,
        fcm_token: token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fcm_token" }
    );
    if (error) console.warn("[Push] Erro ao salvar token:", error.message);

    let query = supabase
      .from("user_devices")
      .delete()
      .eq("user_id", userId)
      .neq("fcm_token", token);
    if (platform === "web") query = query.eq("platform", "web");
    const { error: dedupError } = await query;
    if (dedupError) console.warn("[Push] Falha ao deduplicar tokens do usuário:", dedupError.message);
  } catch (err) {
    console.warn("[Push] Falha ao salvar token:", err);
  }
}

/** Remove o token do dispositivo no logout (por token ou por plataforma). */
export async function deleteDeviceToken(
  userId: string,
  token?: string | null,
  platform?: string
): Promise<void> {
  try {
    let query = supabase.from("user_devices").delete().eq("user_id", userId);
    if (token) query = query.eq("fcm_token", token);
    if (platform) query = query.eq("platform", platform);
    const { error } = await query;
    if (error) console.warn("[Push] Falha ao remover token:", error.message);
  } catch (err) {
    console.warn("[Push] Falha ao remover token:", err);
  }
}
