import React, { useEffect } from "react";
import { Lock, Sparkles, CreditCard, X, ArrowRight } from "lucide-react";
import { trackEvent } from "../lib/analytics";

interface PaywallBarrierProps {
  subscriptionTier: "FREE" | "PLUS";
  userId: string;
  userEmail: string;
  fullName: string;
  onUpgradeSuccess: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  standalone?: boolean;
  onClose?: () => void;
}

export const PaywallBarrier: React.FC<PaywallBarrierProps> = ({
  subscriptionTier,
  children,
  title = "PASSE DE EXPANSÃO",
  description = "Desbloqueie todas as leituras profundas e meditações, tenha acesso ao diário alquímico e chat astrológico, além da leitura dos seus trânsitos astrológicos.",
  standalone = false,
  onClose,
}) => {
  useEffect(() => {
    if (subscriptionTier !== "PLUS") {
      trackEvent("view_paywall");
    }
  }, []);

  if (subscriptionTier === "PLUS") {
    return <>{children}</>;
  }

  const handleUnlock = () => {
    window.location.href = "/planos";
  };

  const cardContent = (
    <div className="max-w-md w-full bg-[#fbf9f5]/95 border border-[#8c7f70]/15 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#3c352d]/10 text-[#3c352d] flex flex-col items-center relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-[#8c7f70] hover:text-[#3c352d] hover:bg-[#8c7f70]/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Icon */}
      <div className="relative mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[#8c6239]/10 border border-[#8c6239]/20">
        <Lock className="w-6 h-6 text-[#8c6239]" />
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#8c6239] animate-pulse" />
      </div>

      <h3 className="font-serif text-lg sm:text-xl font-light tracking-wider uppercase mb-2 text-center">
        {title}
      </h3>

      <p className="font-sans text-xs sm:text-sm text-[#6e6356] leading-relaxed mb-6 font-light text-center">
        {description}
      </p>

      {/* Pricing Highlight */}
      <div className="mb-6 inline-flex flex-col items-center px-5 py-3 bg-[#8c6239] text-[#fbf9f5] rounded-2xl shadow-lg shadow-[#8c6239]/15">
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-90">Acesso a partir de</span>
        <span className="text-2xl sm:text-3xl font-serif font-bold">6x de R$ 26,66</span>
      </div>

      {/* Upgrade Button */}
      <button
        onClick={handleUnlock}
        className="relative overflow-hidden w-full bg-[#8c6239] hover:bg-[#6b452b] text-[#fbf9f5] py-3.5 px-6 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#8c6239]/10 active:scale-95 flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        <span>Ver Planos de Acesso</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="font-mono text-[9px] text-[#8c7f70] mt-3 uppercase tracking-widest flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        <span>Pagamento seguro via InfinitePay • Pix e Cartão</span>
      </p>
    </div>
  );

  if (standalone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3c352d]/15 backdrop-blur-sm transition-all duration-500 animate-fadeIn">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#8c7f70]/10 bg-[#fbf9f5]/50">
      {/* Blurred background content */}
      <div className="blur-sm select-none pointer-events-none scale-[0.99] transition-all duration-300">
        {children}
      </div>

      {/* Light Paywall Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#f4f1eb]/70 backdrop-blur-md transition-all duration-500 animate-fadeIn">
        {cardContent}
      </div>
    </div>
  );
};
