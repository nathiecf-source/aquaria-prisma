import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, FileText, Loader2, Download } from "lucide-react";
import { NakshatraPdfCanvas, NakshatraPdfData } from "./NakshatraPdfCanvas";
import {
  validateNakshatraKey,
  setNakshatraUnlocked,
  isNakshatraUnlocked,
  generatePdfFromElement,
} from "./shareUtils";

interface PdfUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: any;
  fullName?: string;
}

export const PdfUnlockModal: React.FC<PdfUnlockModalProps> = ({
  isOpen,
  onClose,
  profile,
  fullName,
}) => {
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pdfData, setPdfData] = useState<NakshatraPdfData | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnlocked(isNakshatraUnlocked());
      setInputKey("");
      setError("");
      setPdfError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && unlocked && !pdfData && profile) {
      loadNakshatraContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unlocked, pdfData, profile]);

  const loadNakshatraContent = async () => {
    setIsGeneratingContent(true);
    setPdfError("");
    try {
      const response = await fetch("/api/generate-nakshatra-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o conteúdo das Nakshatras.");
      }

      const result = await response.json();
      if (result.reading) {
        setPdfData(result.reading as NakshatraPdfData);
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    } catch (err: any) {
      setPdfError(err?.message || "Não foi possível carregar o conteúdo do PDF.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleValidate = () => {
    setError("");
    if (validateNakshatraKey(inputKey)) {
      setNakshatraUnlocked(true);
      setUnlocked(true);
    } else {
      setError("Senha incorreta. Verifique a mensagem enviada pelo Manychat.");
    }
  };

  const handleGeneratePdf = async () => {
    if (!canvasRef.current) return;
    setIsGeneratingPdf(true);
    setPdfError("");
    try {
      await generatePdfFromElement(canvasRef.current, "estrelas-guias-aquaria.pdf");
    } catch (err: any) {
      setPdfError(err?.message || "Erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-md bg-[#f4f1eb] rounded-2xl border border-[#8c7f70]/20 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#8c7f70]/15">
                <h3 className="font-serif text-sm tracking-[0.12em] uppercase text-[#3c352d]">
                  {unlocked ? "Estrelas-Guia" : "Desbloquear PDF"}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-[#8c7f70] hover:bg-[#ede9de] transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {!unlocked ? (
                  <>
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ede9de] flex items-center justify-center">
                        <Lock className="w-5 h-5 text-[#8c6239]" />
                      </div>
                      <p className="text-xs sm:text-sm text-[#6e6356] font-sans font-light leading-relaxed">
                        Insira a senha enviada pelo Manychat após você compartilhar a leitura
                        nos Stories marcando{" "}
                        <span className="text-[#8c6239] font-medium">@aquaria.app</span>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                        placeholder="Digite a senha"
                        className="w-full px-4 py-3 rounded-lg bg-white/60 border border-[#8c7f70]/20 text-[#3c352d] placeholder:text-[#8c7f70]/60 text-sm font-sans focus:outline-none focus:border-[#8c6239]/50 focus:ring-1 focus:ring-[#8c6239]/20 uppercase"
                      />
                      {error && (
                        <p className="text-[11px] text-red-700/80 text-center">{error}</p>
                      )}
                      <button
                        onClick={handleValidate}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3c352d] text-[#faf9f6] text-[11px] font-sans font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#2a2520]"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Desbloquear PDF
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm text-[#6e6356] font-sans font-light leading-relaxed text-center">
                      PDF exclusivo com as leituras costuradas entre planeta, signo e Nakshatra.
                    </p>

                    {pdfData && (
                      <div
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: 0,
                          height: 0,
                          overflow: "hidden",
                          opacity: 0,
                          pointerEvents: "none",
                          zIndex: -1,
                        }}
                      >
                        <NakshatraPdfCanvas ref={canvasRef} data={pdfData} userName={fullName} />
                      </div>
                    )}

                    {isGeneratingContent && (
                      <div className="flex flex-col items-center gap-2 py-6 text-[#8c6239]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[11px] font-sans uppercase tracking-wider">
                          Costurando suas estrelas-guias...
                        </span>
                      </div>
                    )}

                    {pdfError && (
                      <p className="text-[11px] text-red-700/80 text-center">{pdfError}</p>
                    )}

                    <button
                      onClick={handleGeneratePdf}
                      disabled={!pdfData || isGeneratingContent || isGeneratingPdf}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3c352d] text-[#faf9f6] text-[11px] font-sans font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#2a2520] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF das Estrelas-Guia"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
