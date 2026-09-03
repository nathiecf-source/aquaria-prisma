import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Share2, Instagram, Loader2 } from "lucide-react";
import { ShareableStoryCanvas, StoryData } from "./ShareableStoryCanvas";
import {
  generatePngFromElement,
  dataUrlToFile,
  shareImageFile,
  downloadImage,
} from "./shareUtils";

interface StoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StoryData;
}

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl("");
      setShareError("");
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      if (!canvasRef.current) return;
      try {
        const url = await generatePngFromElement(canvasRef.current, {
          pixelRatio: 2,
          backgroundColor: "#f4f1eb",
        });
        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (err) {
        if (!cancelled) setShareError("Erro ao gerar a imagem do Story.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, data]);

  const handleDownload = () => {
    if (!previewUrl) return;
    downloadImage(previewUrl, "aquaria-prisma-story.png");
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    setShareError("");
    try {
      const file = dataUrlToFile(previewUrl, "aquaria-prisma-story.png");
      await shareImageFile(file, "Aquar.IA Prisma — Meu Diagnóstico");
    } catch (err: any) {
      setShareError(err?.message || "Não foi possível compartilhar. Tente baixar a imagem.");
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
              className="pointer-events-auto w-full max-w-sm bg-[#f4f1eb] rounded-2xl border border-[#8c7f70]/20 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#8c7f70]/15">
                <h3 className="font-serif text-sm tracking-[0.12em] uppercase text-[#3c352d]">
                  Prévia do Story
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
                {/* Hidden canvas for capture */}
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
                  <ShareableStoryCanvas ref={canvasRef} data={data} />
                </div>

                {/* Preview */}
                <div className="flex justify-center">
                  {isLoading ? (
                    <div className="h-[420px] w-[236px] bg-[#ede9de] rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#8c6239] animate-spin" />
                    </div>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Prévia do Story"
                      className="h-[420px] w-auto rounded-lg shadow-md border border-[#8c7f70]/10"
                    />
                  ) : (
                    <div className="h-[420px] w-[236px] bg-[#ede9de] rounded-lg flex items-center justify-center text-[10px] text-[#8c7f70] text-center px-4">
                      {shareError || "Não foi possível gerar a prévia."}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-[10px] sm:text-[11px] text-[#6e6356] font-sans font-light leading-relaxed">
                    Publique nos seus Stories marcando{" "}
                    <span className="text-[#8c6239] font-medium">@aquaria.app</span> para receber a
                    chave do PDF via Direct.
                  </p>
                </div>

                {shareError && (
                  <p className="text-[10px] text-red-700/80 text-center">{shareError}</p>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleShare}
                    disabled={!previewUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3c352d] text-[#faf9f6] text-[11px] font-sans font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#2a2520] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!previewUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#8c7f70]/30 text-[#3c352d] text-[11px] font-sans font-medium tracking-[0.08em] transition-colors hover:bg-[#ede9de]/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Imagem
                  </button>
                </div>

                <p className="flex items-center justify-center gap-1.5 text-[9px] text-[#8c7f70] text-center">
                  <Instagram className="w-3 h-3" />
                  Otimizado para Instagram / TikTok Stories
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
