import React, { useState, useEffect, useRef, useCallback } from "react";

interface AlchemyJournalProps {
  userId: string;
  pathId: string;
  initialText: string;
}

export function AlchemyJournal({ userId, pathId, initialText }: AlchemyJournalProps) {
  const [text, setText] = useState(initialText);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Sync initialText when it changes (e.g., on mount after fetch)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setText(initialText);
  }, [initialText]);

  const saveJournal = useCallback(async (journalText: string) => {
    setSaveStatus("saving");
    try {
      await fetch("/api/meditation/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pathId, journalText }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[AlchemyJournal] Erro ao salvar:", err);
      setSaveStatus("idle");
    }
  }, [userId, pathId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Debounce auto-save (1.5s)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveJournal(newText);
    }, 1500);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-[11px] tracking-[0.1em] uppercase text-[#8c7f70] font-medium">
          Meu Diário Alquímico
        </p>
        {saveStatus === "saving" && (
          <span className="font-sans text-[10px] text-[#8c7f70] italic">Salvando...</span>
        )}
        {saveStatus === "saved" && (
          <span className="font-sans text-[10px] text-emerald-700/80">Salvo ✓</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Registre seus insights e revelações..."
        className="w-full min-h-[120px] p-3 rounded-lg border border-[#8c7f70]/10 bg-white/60 font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30 transition-colors"
      />
    </div>
  );
}
