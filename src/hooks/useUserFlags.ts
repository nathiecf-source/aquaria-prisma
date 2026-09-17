import { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

type FlagKey = "has_seen_onboarding" | "has_seen_community" | "has_seen_feedback" | "has_seen_pwa";

const LOCAL_KEY_MAP: Record<FlagKey, string> = {
  has_seen_onboarding: "has_seen_onboarding",
  has_seen_community: "community_popup_dismissed",
  has_seen_feedback: "aquaria_feedback_dismissed",
  has_seen_pwa: "aquaria_pwa_dismissed",
};

const FIRST_ACCESS_KEY = "aquaria_first_access_at";

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

  const getFirstAccessedAt = useCallback(
    (userProfile?: any): string | null => {
      return userProfile?.first_accessed_at || localStorage.getItem(FIRST_ACCESS_KEY) || null;
    },
    []
  );

  const markFirstAccess = useCallback(
    async (userProfile?: any) => {
      const existing = getFirstAccessedAt(userProfile);
      if (existing) return existing;

      const now = new Date().toISOString();
      try {
        localStorage.setItem(FIRST_ACCESS_KEY, now);
      } catch {}

      if (userId) {
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ first_accessed_at: now })
            .eq("id", userId);
          if (error) {
            console.warn("[UserFlags] Erro ao salvar first_accessed_at no Supabase:", error);
          }
        } catch (err) {
          console.warn("[UserFlags] Falha ao salvar first_accessed_at:", err);
        }
      }
      return now;
    },
    [userId, getFirstAccessedAt]
  );

  const getCurrentDay = useCallback(
    (userProfile?: any): number => {
      const firstAccess = getFirstAccessedAt(userProfile);
      if (!firstAccess) return 1;

      const start = new Date(firstAccess).getTime();
      const now = new Date().getTime();
      if (isNaN(start) || now < start) return 1;

      const diffMs = now - start;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    },
    [getFirstAccessedAt]
  );

  return { markFlagAsSeen, isFlagSeen, markFirstAccess, getCurrentDay, getFirstAccessedAt };
}
