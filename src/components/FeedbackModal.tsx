import React, { useState } from "react";
import { X, Star } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onGoToFeedback: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  userId,
  onClose,
  onGoToFeedback,
}) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !content.trim() || rating === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rating, content }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      console.error("[FeedbackModal] Erro ao enviar:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg sm:text-xl font-serif tracking-[0.12em] uppercase text-[#3c352d] mb-3">
          Deixe um retorno
        </h2>

        <p className="text-sm text-[#6e6356] leading-relaxed mb-6">
          Se você está gostando do app, que tal deixar um retorno? Sua opinião é muito valiosa!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] mb-2">Sua nota</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-7 h-7 ${i < rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#e6e2d8] hover:text-[#d4af37]/50"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conte um pouco sobre sua experiência..."
            className="w-full min-h-[100px] p-3 rounded-lg border border-[#e6e2d8] bg-white/60 text-sm text-[#4a3f35] placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || rating === 0 || !content.trim()}
              className="flex-1 px-5 py-2.5 bg-[#3c352d] text-[#f4f1eb] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#5c4d66] transition-colors disabled:opacity-50"
            >
              {saving ? "Enviando..." : saved ? "Enviado ✓" : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToFeedback();
              }}
              className="flex-1 px-5 py-2.5 border border-[#8c7f70]/40 text-[#3c352d] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#ede9de]/50 transition-colors"
            >
              Ver sessão Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
