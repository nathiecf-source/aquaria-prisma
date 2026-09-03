import React, { useEffect, useState } from "react";
import { X, RefreshCcw } from "lucide-react";
import { MONTHLY_SUBSCRIPTION_URL } from "../lib/plans";

interface RenewalPopupProps {
  userProfile?: any;
}

function getDismissKeys(expiresAt: string) {
  return {
    pre: `renewal_pre_${expiresAt}`,
    expired: `renewal_expired_${expiresAt}`,
  };
}

export const RenewalPopup: React.FC<RenewalPopupProps> = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!userProfile?.access_expires_at) return;

    // Só exibe para quem teve PLUS (tem data de vencimento) ou ainda é PLUS.
    const isOrWasPlus =
      userProfile.subscription_tier === "PLUS" || userProfile.has_access === true;
    if (!isOrWasPlus) return;

    const expiresAt = new Date(userProfile.access_expires_at);
    const now = new Date();
    const expired = expiresAt.getTime() <= now.getTime();
    const daysUntil = expired
      ? 0
      : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const keys = getDismissKeys(userProfile.access_expires_at);

    if (!expired) {
      // Pré-vencimento: entre 1 e 15 dias
      if (daysUntil < 1 || daysUntil > 15) return;
      if (sessionStorage.getItem(keys.pre)) return;
    } else {
      // Pós-vencimento
      if (sessionStorage.getItem(keys.expired)) return;
    }

    setIsExpired(expired);

    const timeout = setTimeout(() => setIsOpen(true), 1200);
    return () => clearTimeout(timeout);
  }, [userProfile]);

  const handleClose = () => {
    if (!userProfile?.access_expires_at) {
      setIsOpen(false);
      return;
    }
    const keys = getDismissKeys(userProfile.access_expires_at);
    if (isExpired) {
      sessionStorage.setItem(keys.expired, "true");
    } else {
      sessionStorage.setItem(keys.pre, "true");
    }
    setIsOpen(false);
  };

  const handleOpenMonthly = () => {
    try {
      const url = new URL(MONTHLY_SUBSCRIPTION_URL);
      if (userProfile?.email) {
        url.searchParams.set("customer_email", userProfile.email);
      }
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      window.open(MONTHLY_SUBSCRIPTION_URL, "_blank", "noopener,noreferrer");
    }
    handleClose();
  };

  if (!isOpen) return null;

  const expiresAt = new Date(userProfile?.access_expires_at || Date.now());
  const now = new Date();
  const days = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const title = isExpired
    ? "Seu acesso foi encerrado"
    : "Continuidade do seu acesso";

  const body = isExpired ? (
    <>
      Seu plano venceu. Para retomar a leitura dos ciclos e o uso do chat
      astrológico, você pode fazer uma assinatura mensal.
    </>
  ) : (
    <>
      Você usufruiu de um profundo mergulho em seu mapa! Seu plano vence em{" "}
      <strong className="text-[#8c6239]">
        {days} {days === 1 ? "dia" : "dias"}
      </strong>
      . Para manter a leitura dos ciclos e o uso do chat astrológico, você pode
      agora fazer uma assinatura mensal.
    </>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#3c352d]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg sm:text-xl font-serif tracking-[0.1em] uppercase text-[#3c352d] mb-4 pr-8">
          {title}
        </h2>

        <p className="text-sm text-[#5c544d] leading-relaxed mb-6">{body}</p>

        <button
          onClick={handleOpenMonthly}
          className="w-full py-3.5 px-6 rounded-xl bg-[#8c6239] hover:bg-[#6b452b] text-[#fbf9f5] font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#8c6239]/10 flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Clique para renovar
        </button>
      </div>
    </div>
  );
};
