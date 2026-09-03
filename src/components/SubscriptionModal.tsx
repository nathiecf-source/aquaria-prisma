import React from "react";
import { motion } from "motion/react";
import { X, CalendarClock, Check, Star, RefreshCcw, ExternalLink, ArrowRight } from "lucide-react";
import { hasActiveAccess, formatAccessExpiry } from "../lib/access";
import { getPlanDisplayName, isPlanRecurring, MONTHLY_SUBSCRIPTION_URL } from "../lib/plans";

interface SubscriptionModalProps {
  userProfile: any;
  onClose: () => void;
}

const MAINTENANCE_BENEFITS = [
  "Chat Astrológico ilimitado",
  "Ciclos Planetários e trânsitos em tempo real",
  "Atualizações contínuas de leituras profundas",
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  userProfile,
  onClose,
}) => {
  const isPlus = hasActiveAccess(userProfile);
  const expiry = isPlus ? formatAccessExpiry(userProfile) : null;
  const currentPlanId = userProfile?.current_plan_id;
  const rawPlanName = getPlanDisplayName(currentPlanId);
  const planName = isPlus && rawPlanName === "Plano Gratuito"
    ? "Acesso PLUS"
    : rawPlanName;
  const recurring = isPlanRecurring(currentPlanId);

  const openMonthlyLink = () => {
    try {
      const url = new URL(MONTHLY_SUBSCRIPTION_URL);
      if (userProfile?.email) {
        url.searchParams.set("customer_email", userProfile.email);
      }
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      window.open(MONTHLY_SUBSCRIPTION_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="w-6 h-6 text-[#5c4d66]" />
          <h2 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-[#3c352d]">
            Sua Assinatura
          </h2>
        </div>

        <div className="space-y-5 text-sm text-[#3c352d]">
          {isPlus ? (
            <>
              {/* Estado: acesso ativo */}
              <div>
                <h3 className="font-serif text-lg tracking-wider uppercase text-[#3c352d] mb-4">
                  Seu Ciclo Ativo
                </h3>

                <div className="p-5 bg-[#ede9de]/40 border border-[#8c7f70]/10 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1">
                        Plano
                      </p>
                      <p className="text-base font-serif text-[#5c4d66]">{planName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider font-bold rounded-full">
                      <Star className="w-3 h-3" />
                      Ativo
                    </span>
                  </div>

                  {expiry && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-1">
                        Validade
                      </p>
                      <p className="text-[#3c352d]">
                        Seu acesso completo está garantido até{" "}
                        <span className="font-semibold">{expiry}</span>.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-[#6e6356] bg-[#f4f1eb] p-3 rounded-xl border border-[#e6e2d8]">
                    <Check className="w-4 h-4 text-[#8c6239] shrink-0 mt-0.5" />
                    <p>
                      {recurring
                        ? "Sua assinatura mensal de R$ 12,90 mantém os ciclos ativos. Você pode cancelar quando quiser."
                        : "Como este é um passe de acesso por tempo determinado, não há cobranças recorrentes ativas no seu cartão."}
                    </p>
                  </div>
                </div>
              </div>

              {!recurring && (
                <div className="p-4 bg-[#f4f1eb] border border-[#e6e2d8] rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-2">
                    Continuidade
                  </p>
                  <p className="text-xs text-[#6e6356] mb-4 leading-relaxed">
                    Quer garantir que seus ciclos permaneçam ativos sem depender da renovação de um passe?
                  </p>
                  <button
                    onClick={openMonthlyLink}
                    className="w-full py-3 px-4 rounded-xl border border-[#8c6239] text-[#8c6239] hover:bg-[#8c6239] hover:text-[#fbf9f5] font-sans text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Assinar manutenção R$ 12,90/mês
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Estado: acesso expirado */}
              <div>
                <h3 className="font-serif text-lg tracking-wider uppercase text-[#3c352d] mb-2">
                  Seu ciclo de imersão foi encerrado
                </h3>
                <p className="text-xs text-[#6e6356] leading-relaxed">
                  Seu período de acesso completo chegou ao fim. A interface e seus dados continuam
                  salvos, mas as leituras profundas e os trânsitos exigem a manutenção ativa.
                </p>
              </div>

              <div className="p-5 bg-[#ede9de]/40 border border-[#8c7f70]/10 rounded-2xl">
                <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold mb-3">
                  Continuar com os Ciclos Ativos
                </p>

                <div className="mb-4">
                  <p className="font-serif text-2xl font-bold text-[#8c6239]">R$ 12,90 / mês</p>
                  <p className="text-xs text-[#6e6356]">
                    Sem fidelidade, cancele quando quiser.
                  </p>
                </div>

                <ul className="space-y-2 mb-5">
                  {MAINTENANCE_BENEFITS.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#3c352d]">
                      <Check className="w-3.5 h-3.5 text-[#8c6239] shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={openMonthlyLink}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#8c6239] hover:bg-[#6b452b] text-[#fbf9f5] font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#8c6239]/10 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Reativar Ciclos por R$ 12,90/mês
                </button>
              </div>

              <div className="p-4 bg-[#f4f1eb] border border-[#e6e2d8] rounded-2xl text-center">
                <p className="text-xs text-[#6e6356] mb-3">
                  Prefere voltar a ter a experiência completa com os passes de longo prazo?
                </p>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/planos";
                  }}
                  className="inline-flex items-center gap-2 text-[#8c6239] hover:text-[#6b452b] font-sans text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Conheça os planos Anual e Semestral
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#3c352d] text-[#f4f1eb] text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-[#5c4d66] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
