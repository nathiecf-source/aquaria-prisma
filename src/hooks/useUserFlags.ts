import { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

type FlagKey = "has_seen_onboarding" | "has_seen_community" | "has_seen_feedback" | "has_seen_pwa";

const LOCAL_KEY_MAP: Record<FlagKey, string> = {
  has_seen_onboarding: "has_seen_onboarding",
  has_seen_community: "community_popup_dismissed",
  has_seen_feedback: "aquaria_feedback_dismissed",
  has_seen_pwa: "aquaria_pwa_dismissed",
};

export function useUserFlags(userId: string | undefined) {
  const markFlagAsSeen = useCallback(async (key: FlagKey) => {
    try {
      localStorage.setItem(LOCAL_KEY_MAP[key], "true");
    } catch {}

    if (userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ [key]: true })
          .eq("id", userId);
        if (error) {
          console.warn(`[UserFlags] Erro ao salvar ${key} no Supabase:`, error);
        }
      } catch (err) {
        console.warn(`[UserFlags] Falha ao atualizar ${key}:`, err);
      }
    }
  }, [userId]);

  const isFlagSeen = useCallback(
    (key: FlagKey, userProfile?: any) => {
      if (userProfile?.[key] === true) return true;
      try {
        return localStorage.getItem(LOCAL_KEY_MAP[key]) === "true";
      } catch {
        return false;
      }
    },
    []
  );

  return { markFlagAsSeen, isFlagSeen };
}
