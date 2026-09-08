import React, { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { AlchemyJournal } from "./AlchemyJournal";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaved?: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, userId, onSaved }) => {
  const [initialText, setInitialText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchJournal = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meditation/journal?userId=${encodeURIComponent(userId)}&pathId=floating-journal`);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setInitialText(data.journalText || "");
      } else {
        setInitialText("");
      }
    } catch (err) {
      console.error("[JournalModal] Erro ao carregar diário:", err);
      setInitialText("");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchJournal();
    }
  }, [isOpen, fetchJournal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#4a3f35]/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#d9d4c7] bg-[#f4f1eb]/95 shadow-2xl shadow-[#4a3f35]/10 p-5 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#4a3f35]">
              Diário Alquímico
            </h2>
            <p className="text-xs text-[#8c7f70] font-light">
              Registre insights, sonhos e revelações do seu mapa.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar diário"
            className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#8c7f70] text-sm">
            Carregando suas notas...
          </div>
        ) : (
          <AlchemyJournal
            userId={userId}
            pathId="floating-journal"
            initialText={initialText}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );
};
