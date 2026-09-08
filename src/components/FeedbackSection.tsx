import React, { useEffect, useState } from "react";
import { X, Star, MessageSquareHeart } from "lucide-react";

interface Feedback {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}

interface FeedbackSectionProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ userId, isOpen, onClose }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/feedbacks/public")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        setFeedbacks(data.feedbacks || []);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setContent("");
      setSaved(false);
    }
  }, [isOpen]);

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
        setContent("");
        setRating(0);
      }
    } catch (err) {
      console.error("[FeedbackSection] Erro ao enviar:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <MessageSquareHeart className="w-6 h-6 text-[#8c6239]" />
          <h2 className="font-serif text-xl tracking-[0.12em] uppercase text-[#3c352d]">
            Avaliação
          </h2>
        </div>

        <p className="text-sm text-[#6e6356] leading-relaxed mb-6">
          Se você está gostando do app, que tal deixar um retorno? Além de me ajudar a entender sua experiência, seu comentário também ajuda o app a ganhar mais visibilidade. Obrigada por fazer parte dessa jornada!
        </p>

        {feedbacks.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] mb-3">
              O que outras pessoas estão dizendo
            </p>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#c5a880] scrollbar-track-transparent">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="snap-start shrink-0 w-64 sm:w-80 p-4 rounded-xl border border-[#e6e2d8] bg-white/60"
                >
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < fb.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#e6e2d8]"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#4a3f35] leading-relaxed line-clamp-6">
                    {fb.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {userId ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] mb-2">Como está sendo sua experiência?</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="p-1 transition-colors"
                    aria-label={`${i + 1} estrelas`}
                  >
                    <Star
                      className={`w-7 h-7 ${i < rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#e6e2d8] hover:text-[#d4af37]/50"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Deixe suas impressões, sugestões ou o que mais está sentindo com o app..."
                className="w-full min-h-[120px] p-3 rounded-lg border border-[#e6e2d8] bg-white/60 text-sm text-[#4a3f35] placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving || rating === 0 || !content.trim()}
                className="flex-1 px-5 py-2.5 rounded-lg bg-[#3c352d] text-[#faf9f6] text-xs font-bold uppercase tracking-widest hover:bg-[#5c4d66] transition-colors disabled:opacity-50"
              >
                {saving ? "Enviando..." : saved ? "Enviado ✓" : "Enviar avaliação"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-2.5 rounded-lg border border-[#8c7f70]/40 text-[#3c352d] text-xs font-bold uppercase tracking-widest hover:bg-[#ede9de]/50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-[#8c7f70]">Entre para deixar sua avaliação.</p>
        )}
      </div>
    </div>
  );
};
