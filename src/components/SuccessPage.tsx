import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import GlobalBanner from "./GlobalBanner";
import { trackEvent } from "../lib/analytics";

interface SuccessPageProps {
  onAccessGranted?: () => void;
}

type VerifyStatus = "verifying" | "success" | "error";

export default function SuccessPage({ onAccessGranted }: SuccessPageProps) {
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState<string>("Confirmando seu pagamento com a InfinitePay...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get("order_nsu");
    const transactionNsu = params.get("transaction_nsu");
    const slug = params.get("slug") || params.get("invoice_slug");

    if (!orderNsu || !transactionNsu || !slug) {
      setStatus("error");
      setMessage("Parâmetros de retorno incompletos. Verifique o link recebido.");
      return;
    }

    let cancelled = false;

    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_nsu: orderNsu,
        transaction_nsu: transactionNsu,
        slug: slug,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({} as any));
        if (cancelled) return;

        if (res.ok && data.success) {
          trackEvent("checkout_completed");
          setStatus("success");
          setMessage("Pagamento confirmado! Seu acesso PLUS está ativo.");
          onAccessGranted?.();
        } else {
          setStatus("error");
          setMessage(data.message || "Não conseguimos confirmar o pagamento ainda.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[SuccessPage] Erro na verificação:", err);
        setStatus("error");
        setMessage("Erro ao verificar pagamento. Tente atualizar a página.");
      });

    return () => {
      cancelled = true;
    };
  }, [onAccessGranted]);

  const icon =
    status === "verifying" ? (
      <Loader2 className="w-12 h-12 text-[#8c6239] animate-spin mx-auto" />
    ) : status === "success" ? (
      <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
    ) : (
      <XCircle className="w-12 h-12 text-red-600 mx-auto" />
    );

  const title =
    status === "verifying"
      ? "Aguarde um instante"
      : status === "success"
      ? "Bem-vinda ao Passe de Expansão"
      : "Algo aconteceu";

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] flex items-center justify-center p-4 md:p-8">
      <GlobalBanner />
      <div className="max-w-md w-full bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-8 md:p-10 shadow-[0_20px_60px_rgba(60,53,45,0.08)] text-center">
        <div className="mb-5">{icon}</div>

        <h1 className="font-serif text-xl md:text-2xl tracking-[0.12em] uppercase text-[#3c352d] mb-3">
          {title}
        </h1>

        <p className="text-sm text-[#6e6356] leading-relaxed mb-8">{message}</p>

        {status === "success" && (
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-[#8c6239] hover:bg-[#6b452b] text-[#fbf9f5] py-3.5 px-6 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8c6239]/10"
          >
            <Sparkles className="w-4 h-4" />
            Entrar no Portal
          </button>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => (window.location.href = "/planos")}
              className="w-full bg-[#3c352d] hover:bg-[#5c4d66] text-[#fbf9f5] py-3.5 px-6 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Planos
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-[10px] uppercase tracking-widest text-[#8c7f70] hover:text-[#3c352d] transition-colors py-2"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
