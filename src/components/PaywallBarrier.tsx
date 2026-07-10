import React, { useState } from "react";
import { Lock, Sparkles, Loader2, CreditCard } from "lucide-react";
import { paymentService } from "../lib/paymentService";

interface PaywallBarrierProps {
  subscriptionTier: "FREE" | "PLUS";
  userId: string;
  userEmail: string;
  fullName: string;
  onUpgradeSuccess: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const PaywallBarrier: React.FC<PaywallBarrierProps> = ({
  subscriptionTier,
  userId,
  userEmail,
  fullName,
  onUpgradeSuccess,
  children,
  title = "Leitura Profunda Bloqueada",
  description = "Acesse o Mapa Sideral Védico, os Caminhos Ocultos e análises astrológicas profundas sintetizadas com IA."
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (subscriptionTier === "PLUS") {
    return <>{children}</>;
  }

  const handleUnlock = async () => {
    setIsUpgrading(true);
    try {
      const result = await paymentService.createCheckoutSession({
        userId,
        userEmail,
        fullName
      });

      if (result.success) {
        setSuccessMsg("Pagamento Aprovado! Desbloqueando portal...");
        setTimeout(() => {
          onUpgradeSuccess();
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Erro no upgrade do paywall:", err);
      alert("Houve um erro simulado ao processar o checkout. Tente novamente.");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#8c7f70]/10 bg-[#fbf9f5]/50">
      {/* Blurred background content */}
      <div className="blur-md select-none pointer-events-none scale-[0.99] filter duration-300">
        {children}
      </div>

      {/* Glassmorphism Paywall Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#1c1815]/40 backdrop-blur-md transition-all duration-500 animate-fadeIn">
        <div className="max-w-md bg-[#2a241f]/95 border border-[#d4af37]/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-[#e8e4db] flex flex-col items-center">
          
          {/* Animated Glowing Icon */}
          <div className="relative mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30">
            <Lock className="w-6 h-6 text-[#d4af37]" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#d4af37] animate-pulse" />
          </div>

          <h3 className="font-serif text-[#e8e4db] text-lg sm:text-xl font-light tracking-wider uppercase mb-2">
            {title}
          </h3>
          
          <p className="font-sans text-xs sm:text-sm text-[#c0b4a4] leading-relaxed mb-6 font-light">
            {description}
          </p>

          {/* Pricing Highlight */}
          <div className="mb-6 flex items-baseline gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-[#8c7f70] font-mono">Acesso Vitalício</span>
            <span className="text-xl font-serif font-semibold text-[#d4af37]">R$ 29,90</span>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={handleUnlock}
            disabled={isUpgrading || !!successMsg}
            className="relative overflow-hidden w-full bg-[#d4af37] hover:bg-[#b08d24] disabled:bg-[#d4af37]/50 text-[#1c1815] py-3.5 px-6 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#d4af37]/10 active:scale-95 flex items-center justify-center gap-2"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando Checkout...</span>
              </>
            ) : successMsg ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse text-[#1c1815]" />
                <span>{successMsg}</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Desbloquear Leitura Profunda</span>
              </>
            )}
          </button>

          <p className="font-mono text-[9px] text-[#8c7f70] mt-3 uppercase tracking-widest">
            Simulador de pagamento ativo • Liberação instantânea
          </p>
        </div>
      </div>
    </div>
  );
};
