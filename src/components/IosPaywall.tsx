import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, RefreshCcw, Star } from "lucide-react";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "../lib/purchases";
import GlobalBanner from "./GlobalBanner";

const BENEFITS = [
  "Mandala Completa: Revele o potencial da sua alma — compreenda a raiz dos seus padrões e liberte os seus dons e virtudes.",
  "Ciclos Ativos: Clareza e direção para navegar os trânsitos que estão moldando o seu presente.",
  "Chat Astrológico: Uma inteligência pronta para traduzir suas questões pontuais e dúvidas através da lente do seu mapa.",
  "Diário Alquímico: Sua ferramenta de elaboração para ancorar aprendizados e materializar suas transformações.",
];

function hasActiveEntitlement(customerInfo: any): boolean {
  const active = customerInfo?.entitlements?.active;
  return !!active && Object.keys(active).length > 0;
}

/**
 * Bloco de compra nativa iOS (RevenueCat) — botões das Offerings/Packages e
 * "Restaurar Compras" (obrigatório pela Apple). Só renderizar quando
 * Capacitor.getPlatform() === "ios".
 */
export const IosPackages: React.FC = () => {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getOfferings()
      .then(setOfferings)
      .finally(() => setLoading(false));
  }, []);

  const packages: PurchasesPackage[] =
    offerings?.current?.availablePackages ?? [];

  const finishWithSuccess = () => {
    setMessage({
      kind: "ok",
      text: "Compra confirmada! Seu acesso será liberado em instantes.",
    });
    setTimeout(() => window.location.reload(), 2500);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setBusy(pkg.identifier);
    setMessage(null);
    const info = await purchasePackage(pkg);
    setBusy(null);
    if (info) {
      if (hasActiveEntitlement(info)) {
        finishWithSuccess();
      } else {
        setMessage({ kind: "ok", text: "Compra registrada. Atualizando seu acesso..." });
        setTimeout(() => window.location.reload(), 2500);
      }
    }
  };

  const handleRestore = async () => {
    setBusy("__restore__");
    setMessage(null);
    const info = await restorePurchases();
    setBusy(null);
    if (info && hasActiveEntitlement(info)) {
      finishWithSuccess();
    } else if (info) {
      setMessage({ kind: "err", text: "Nenhuma compra ativa encontrada neste Apple ID." });
    } else {
      setMessage({ kind: "err", text: "Não foi possível restaurar as compras. Tente novamente." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#8c6239]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {packages.length === 0 && (
        <p className="text-xs text-[#6e6356] leading-relaxed text-center">
          As opções de assinatura ainda estão sendo preparadas. Tente novamente em instantes.
        </p>
      )}

      {packages.map((pkg) => (
        <button
          key={pkg.identifier}
          onClick={() => handlePurchase(pkg)}
          disabled={busy !== null}
          className="w-full py-3.5 px-6 rounded-xl bg-[#8c6239] hover:bg-[#6b452b] disabled:opacity-70 text-[#fbf9f5] font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#8c6239]/10 flex items-center justify-center gap-2"
        >
          {busy === pkg.identifier ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>
              {pkg.product.title} — {pkg.product.priceString}
            </span>
          )}
        </button>
      ))}

      {message && (
        <p
          className={`text-xs text-center leading-relaxed ${
            message.kind === "ok" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        onClick={handleRestore}
        disabled={busy !== null}
        className="w-full py-2.5 px-4 rounded-xl border border-[#8c7f70]/30 text-[#6e6356] hover:bg-[#8c7f70]/10 font-sans text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy === "__restore__" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <RefreshCcw className="w-3.5 h-3.5" />
            Restaurar Compras
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Página completa de planos para iOS nativo — substitui o grid InfinitePay.
 */
export const IosPlanosPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] p-4 md:p-8">
    <GlobalBanner />
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#8c7f70] hover:text-[#3c352d] text-xs uppercase tracking-widest font-semibold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl tracking-[0.15em] uppercase text-[#3c352d] mb-3">
          Escolha o seu ciclo de expansão
        </h1>
        <p className="text-sm text-[#6e6356] leading-relaxed">
          Acesso irrestrito a todas as leituras profundas, meditações personalizadas,
          trânsitos, diário alquímico e chat astrológico.
        </p>
      </div>

      <div className="bg-[#fbf9f5] border-2 border-[#8c6239] rounded-2xl p-6 shadow-[0_16px_50px_-12px_rgba(140,98,57,0.22)] mb-6">
        <div className="flex items-center justify-center gap-1 mb-4 text-[#8c6239]">
          <Star className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Passe de Expansão</span>
        </div>
        <ul className="space-y-3 mb-6">
          {BENEFITS.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#3c352d] leading-relaxed">
              <Check className="w-3.5 h-3.5 text-[#8c6239] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <IosPackages />
      </div>

      <p className="text-center text-[10px] text-[#8c7f70] uppercase tracking-widest">
        Assinatura gerenciada pela App Store • Cancele quando quiser
      </p>
    </div>
  </div>
);
