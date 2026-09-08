import React, { useEffect, useState } from "react";
import { Star, MessageSquareHeart } from "lucide-react";

interface Feedback {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}

interface FeedbackSectionProps {
  userId?: string;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ userId }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/feedbacks/public")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        setFeedbacks(data.feedbacks || []);
      })
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="max-w-3xl mx-auto mt-10 sm:mt-14 p-5 sm:p-8 rounded-2xl border border-[#e6e2d8] bg-[#faf9f6] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareHeart className="w-5 h-5 text-[#8c6239]" />
        <h2 className="font-serif text-sm sm:text-base tracking-[0.2em] uppercase text-[#3c352d]">
          Avaliação
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-[#6e6356] leading-relaxed mb-6">
        Se você está gostando do app, que tal deixar um retorno? Além de me ajudar a entender sua experiência, seu comentário também ajuda o app a ganhar mais visibilidade e a ser reconhecido por outras pessoas que também amam astrologia. É um gesto simples, mas faz uma grande diferença. Obrigada por fazer parte dessa jornada!
      </p>

      {feedbacks.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-[#8c7f70] mb-3">O que outras pessoas estão dizendo</p>
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
                    className={`w-6 h-6 ${i < rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#e6e2d8] hover:text-[#d4af37]/50"}`}
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
              className="w-full min-h-[100px] p-3 rounded-lg border border-[#e6e2d8] bg-white/60 text-sm text-[#4a3f35] placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving || rating === 0 || !content.trim()}
            className="px-5 py-2.5 rounded-lg bg-[#3c352d] text-[#faf9f6] text-xs font-bold uppercase tracking-widest hover:bg-[#2a2520] transition-colors disabled:opacity-50"
          >
            {saving ? "Enviando..." : saved ? "Enviado ✓" : "Enviar avaliação"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-[#8c7f70]">Entre para deixar sua avaliação.</p>
      )}
    </div>
  );
};
