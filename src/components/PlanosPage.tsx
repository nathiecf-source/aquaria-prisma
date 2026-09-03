import React, { useEffect, useState } from "react";
import { ArrowLeft, Star, Check, Loader2, Lock, Tag } from "lucide-react";
import { paymentService } from "../lib/paymentService";
import { hasPlusAccess, getDaysUntilExpiry } from "../lib/access";
import { MONTHLY_SUBSCRIPTION_URL } from "../lib/plans";
import { trackEvent } from "../lib/analytics";
import GlobalBanner from "./GlobalBanner";
import {
  Coupon,
  applyDiscount,
  calculateInstallment,
  calculatePixPrice,
  discountLabel,
  validateCouponCode,
} from "../lib/coupons";

interface PlanosPageProps {
  userProfile?: any;
  onBack?: () => void;
}

const BENEFITS = [
  "Mandala Completa: Revele o potencial da sua alma — compreenda a raiz dos seus padrões e liberte os seus dons e virtudes.",
  "Ciclos Ativos: Clareza e direção para navegar os trânsitos que estão moldando o seu presente.",
  "Chat Astrológico: Uma inteligência pronta para traduzir suas questões pontuais e dúvidas através da lente do seu mapa.",
  "Diário Alquímico: Sua ferramenta de elaboração para ancorar aprendizados e materializar suas transformações.",
];

interface PlanData {
  id: string;
  title: string;
  badge?: string;
  call?: string;
  basePriceCents: number;
  installmentMonths: number;
  priceNote?: string;
  highlight: boolean;
  buttonText: string;
}

interface CouponInputState {
  code: string;
  coupon: Coupon | null;
  loading: boolean;
  error: string | null;
}

const PLANS: PlanData[] = [
  {
    id: "semester",
    title: "Plano Semestral",
    basePriceCents: 16000,
    installmentMonths: 6,
    highlight: false,
    buttonText: "Escolher o Semestral",
  },
  {
    id: "annual-launch",
    title: "Plano Anual",
    badge: "Valor de Lançamento",
    call: "Dobre o seu tempo de acesso por menos de R$ 10 a mais por mês.",
    basePriceCents: 21600,
    installmentMonths: 6,
    priceNote: "sem juros",
    highlight: true,
    buttonText: "Assinar Plano Anual",
  },
];

function emptyCouponState(): CouponInputState {
  return { code: "", coupon: null, loading: false, error: null };
}

export default function PlanosPage({ userProfile, onBack }: PlanosPageProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutActive, setCheckoutActive] = useState(true);
  const [coupons, setCoupons] = useState<Record<string, CouponInputState>>(() =>
    PLANS.reduce((acc, plan) => {
      acc[plan.id] = emptyCouponState();
      return acc;
    }, {} as Record<string, CouponInputState>)
  );

  const isActive = hasPlusAccess(userProfile);
  const daysToExpiry = getDaysUntilExpiry(userProfile);
  const showRenewalBanner = isActive && daysToExpiry !== null && daysToExpiry <= 15;

  useEffect(() => {
    trackEvent("view_plans");

    fetch("/api/settings")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => setCheckoutActive(data.checkout_active !== false))
      .catch((err) => console.warn("[PlanosPage] Erro ao carregar settings:", err));

    const params = new URLSearchParams(window.location.search);
    const code = params.get("cupom") || params.get("ref");
    if (code) {
      PLANS.forEach((plan) => {
        setCoupons((prev) => ({
          ...prev,
          [plan.id]: { ...prev[plan.id], code: code.toUpperCase() },
        }));
        applyCoupon(plan.id, code);
      });
    }
  }, []);

  async function applyCoupon(planId: string, code: string) {
    setCoupons((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], code, loading: true, error: null },
    }));

    try {
      const result = await validateCouponCode(code, planId);
      if (result.valid) {
        setCoupons((prev) => ({
          ...prev,
          [planId]: {
            ...prev[planId],
            loading: false,
            coupon: result,
            error: null,
          },
        }));
      } else {
        setCoupons((prev) => ({
          ...prev,
          [planId]: {
            ...prev[planId],
            loading: false,
            coupon: null,
            error: result.error || "Cupom inválido.",
          },
        }));
      }
    } catch (err: any) {
      console.error("[PlanosPage] Erro ao validar cupom:", err);
      setCoupons((prev) => ({
        ...prev,
        [planId]: {
          ...prev[planId],
          loading: false,
          coupon: null,
          error: "Erro ao validar cupom. Tente novamente.",
        },
      }));
    }
  }

  const handleApplyCoupon = (
    planId: string,
    e?: React.FormEvent<HTMLFormElement>
  ) => {
    e?.preventDefault();
    const code = coupons[planId]?.code;
    if (!code?.trim()) return;
    applyCoupon(planId, code);
  };

  const handleSelect = async (planId: string) => {
    trackEvent("checkout_initiated");
    setLoadingPlan(planId);
    setError(null);
    try {
      const result = await paymentService.createCheckoutSession({
        planId,
        couponCode: coupons[planId]?.coupon?.code,
      });
      window.location.href = result.url;
    } catch (err: any) {
      console.error("[PlanosPage] Erro no checkout:", err);
      setError(err.message || "Erro ao gerar link de pagamento. Tente novamente.");
      setLoadingPlan(null);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] p-4 md:p-8">
      <GlobalBanner />
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#8c7f70] hover:text-[#3c352d] text-xs uppercase tracking-widest font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-10">
          <h1 className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase text-[#3c352d] mb-3">
            Escolha o seu ciclo de expansão
          </h1>
          <p className="text-sm text-[#6e6356] max-w-md mx-auto leading-relaxed">
            Acesso irrestrito a todas as leituras profundas, meditações personalizadas, trânsitos, diário alquímico e chat astrológico.
          </p>
        </div>

        {showRenewalBanner && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-emerald-800 text-sm">
            <p className="mb-2">
              Seu acesso vence em <strong>{daysToExpiry} {daysToExpiry === 1 ? "dia" : "dias"}</strong>.
              Para manter o acesso contínuo, renove sua assinatura mensal.
            </p>
            {MONTHLY_SUBSCRIPTION_URL && (
              <a
                href={MONTHLY_SUBSCRIPTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-[#8c6239] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#6b452b] transition-colors"
              >
                Assinatura Mensal
              </a>
            )}
          </div>
        )}

        {!checkoutActive && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl text-center text-amber-800 text-sm">
            Manutenção Temporária — o checkout está pausado. Tente novamente mais tarde.
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const planCoupon = coupons[plan.id];
            const originalCents = plan.basePriceCents;
            const discountedCents = applyDiscount(
              originalCents,
              planCoupon?.coupon || null
            );
            const installment = calculateInstallment(
              discountedCents,
              plan.installmentMonths
            );
            const originalInstallment = calculateInstallment(
              originalCents,
              plan.installmentMonths
            );
            const pixPrice = calculatePixPrice(discountedCents);
            const originalPix = calculatePixPrice(originalCents);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 md:p-8 transition-all ${
                  plan.highlight
                    ? "bg-[#fbf9f5] border-2 border-[#8c6239] shadow-[0_16px_50px_-12px_rgba(140,98,57,0.22)] md:scale-[1.02] z-10"
                    : "bg-[#fbf9f5] border border-[#e6e2d8] shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#8c6239] text-[#fbf9f5] text-[10px] uppercase tracking-widest font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <h2 className="font-serif text-lg md:text-xl tracking-wider uppercase text-[#3c352d] mb-1">
                  {plan.title}
                </h2>

                {plan.call && (
                  <p className="text-xs text-[#6e6356] leading-relaxed mb-4">
                    {plan.call}
                  </p>
                )}

                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  {planCoupon?.coupon?.valid && (
                    <span className="text-sm text-[#8c7f70] line-through">
                      {originalInstallment}
                    </span>
                  )}
                  <span className="font-serif text-3xl md:text-4xl font-bold text-[#8c6239]">
                    {installment}
                  </span>
                  {plan.priceNote && (
                    <span className="text-sm text-[#8c7f70]">{plan.priceNote}</span>
                  )}
                </div>

                <p className="text-xs text-[#8c7f70] mb-6">
                  sem juros no cartão ou R$ {pixPrice} à vista no Pix
                  {planCoupon?.coupon?.valid && (
                    <>
                      {" "}
                      <span className="line-through">(R$ {originalPix})</span>
                    </>
                  )}
                  .
                </p>

                <ul className="space-y-3 mb-6 flex-grow">
                  {BENEFITS.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#3c352d] leading-relaxed"
                    >
                      <Check className="w-3.5 h-3.5 text-[#8c6239] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={(e) => handleApplyCoupon(plan.id, e)}
                  className="mb-4 bg-white/60 border border-[#e6e2d8] rounded-xl p-3"
                >
                  <label
                    htmlFor={`coupon-${plan.id}`}
                    className="block text-[10px] uppercase tracking-widest text-[#6e6356] mb-1.5"
                  >
                    Cupom de desconto
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c7f70]" />
                      <input
                        id={`coupon-${plan.id}`}
                        type="text"
                        value={planCoupon?.code || ""}
                        onChange={(e) =>
                          setCoupons((prev) => ({
                            ...prev,
                            [plan.id]: {
                              ...prev[plan.id],
                              code: e.target.value.toUpperCase(),
                              error: null,
                            },
                          }))
                        }
                        placeholder="EX: LUNAR10"
                        className="w-full pl-8 pr-2.5 py-2 bg-white border border-[#d6d2c8] rounded-lg text-xs text-[#3c352d] placeholder-[#8c7f70] focus:outline-none focus:border-[#8c6239] transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={planCoupon?.loading || !planCoupon?.code?.trim()}
                      className="px-3 py-2 bg-[#3c352d] text-[#fbf9f5] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#2a251f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {planCoupon?.loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </button>
                  </div>

                  {planCoupon?.coupon?.valid && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700">
                      <Check className="w-3 h-3" />
                      <span>
                        Cupom {planCoupon.coupon.code} aplicado ({discountLabel(planCoupon.coupon)})
                      </span>
                    </div>
                  )}

                  {planCoupon?.error && (
                    <p className="mt-2 text-[10px] text-red-600">{planCoupon.error}</p>
                  )}
                </form>

                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={!!loadingPlan || !checkoutActive}
                  className={`w-full py-3.5 px-6 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-[#8c6239] hover:bg-[#6b452b] text-[#fbf9f5] shadow-lg shadow-[#8c6239]/10"
                      : "bg-transparent border-2 border-[#3c352d] text-[#3c352d] hover:bg-[#3c352d] hover:text-[#fbf9f5]"
                  } ${loadingPlan === plan.id ? "opacity-80 cursor-wait" : ""} ${
                    !checkoutActive
                      ? "bg-amber-100 text-amber-800 border-amber-200 cursor-not-allowed hover:bg-amber-100 hover:text-amber-800"
                      : ""
                  }`}
                >
                  {!checkoutActive ? (
                    <span>Manutenção Temporária</span>
                  ) : loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando link...</span>
                    </>
                  ) : (
                    <span>{plan.buttonText}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[10px] text-[#8c7f70] uppercase tracking-widest flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Pagamento processado com segurança pela InfinitePay • Pix e Cartão</span>
        </p>
      </div>
    </div>
  );
}
