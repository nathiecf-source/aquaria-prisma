import React, { useState, useEffect, useCallback } from "react";
import { Save } from "lucide-react";

interface AlchemyJournalProps {
  userId: string;
  pathId: string;
  initialText: string;
  onSaved?: () => void;
}

export function AlchemyJournal({ userId, pathId, initialText, onSaved }: AlchemyJournalProps) {
  const [text, setText] = useState(initialText);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedText, setLastSavedText] = useState(initialText);

  // Sincroniza quando o texto inicial muda externamente
  useEffect(() => {
    setText(initialText);
    setLastSavedText(initialText);
    setSaveStatus("idle");
  }, [initialText]);

  const hasChanges = text.trim() !== lastSavedText.trim();

  const saveJournal = useCallback(async () => {
    if (!hasChanges) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/meditation/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pathId, journalText: text }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setSaveStatus("saved");
      setLastSavedText(text);
      onSaved?.();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[AlchemyJournal] Erro ao salvar:", err);
      setSaveStatus("error");
    }
  }, [userId, pathId, text, hasChanges, onSaved]);

  return (
    <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-[11px] tracking-[0.1em] uppercase text-[#8c7f70] font-medium">
          Meu Diário Alquímico
        </p>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="font-sans text-[10px] text-[#8c7f70] italic">Salvando...</span>
          )}
          {saveStatus === "saved" && (
            <span className="font-sans text-[10px] text-emerald-700/80">Salvo ✓</span>
          )}
          {saveStatus === "error" && (
            <span className="font-sans text-[10px] text-red-600">Erro ao salvar</span>
          )}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Registre seus insights e revelações..."
        className="w-full min-h-[160px] p-3 rounded-lg border border-[#8c7f70]/10 bg-white/60 font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30 transition-colors"
      />

      <p className="mt-2 text-[10px] text-[#8c7f70] font-light">
        Escreva com calma. Clique em <strong>Salvar nota</strong> quando quiser guardar o registro.
      </p>

      <div className="mt-4 flex justify-end">
        <button
          onClick={saveJournal}
          disabled={!hasChanges || saveStatus === "saving" || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8c6239] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#6b4a2b] transition-colors disabled:opacity-50 disabled:hover:bg-[#8c6239]"
        >
          <Save className="w-4 h-4" />
          Salvar nota
        </button>
      </div>
    </div>
  );
}
