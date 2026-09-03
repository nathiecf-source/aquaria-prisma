export const PLAN_METADATA: Record<
  string,
  {
    displayName: string;
    isRecurring: boolean;
    description?: string;
  }
> = {
  "annual-launch": {
    displayName: "Plano Anual — Lançamento",
    isRecurring: false,
  },
  "annual-official": {
    displayName: "Plano Anual Oficial",
    isRecurring: false,
  },
  semester: {
    displayName: "Passe Semestral",
    isRecurring: false,
  },
  monthly: {
    displayName: "Assinatura Mensal — R$ 12,90/mês",
    isRecurring: true,
    description: "Manutenção dos Ciclos Ativos",
  },
};

export function getPlanDisplayName(planId?: string | null): string {
  if (!planId) return "Plano Gratuito";
  return PLAN_METADATA[planId]?.displayName || planId;
}

export function isPlanRecurring(planId?: string | null): boolean {
  if (!planId) return false;
  return PLAN_METADATA[planId]?.isRecurring || false;
}

export const MONTHLY_SUBSCRIPTION_URL =
  typeof process !== "undefined"
    ? process.env.INFINITE_PAY_MONTHLY_URL || ""
    : import.meta.env.VITE_INFINITE_PAY_MONTHLY_URL || "";
