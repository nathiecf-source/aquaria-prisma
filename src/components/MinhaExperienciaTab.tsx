import React from "react";
import { Loader2, BookOpen, Pencil, X, Save } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import EvolutionDashboard from "./EvolutionDashboard";

interface Insight {
  id: string | number;
  insight_text: string;
  created_at: string;
  category?: string | null;
  transit_key?: string | null;
}

interface JournalEntry {
  path_id: string;
  path_title: string | null;
  journal_text: string;
  updated_at: string;
}

interface MinhaExperienciaTabProps {
  userId: string | null;
  userName?: string;
  onNavigateToElement?: (elementId: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface JournalNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const DiarioAlquimico: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [journals, setJournals] = React.useState<JournalEntry[]>([]);
  const [notes, setNotes] = React.useState<JournalNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"todos" | "pausa" | "ciclos" | "diario">("todos");
  const [editing, setEditing] = React.useState<{ pathId: string; text: string; saving: boolean } | null>(null);
  const [editingNote, setEditingNote] = React.useState<{ id: string; text: string; saving: boolean } | null>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insightsPromise = (async () => {
        if (isSupabaseConfigured && userId) {
          const { data, error: sbErr } = await (supabase as any)
            .from("user_insights")
            .select("id, insight_text, category, transit_key, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
          if (sbErr) throw sbErr;
          return (data || []) as Insight[];
        }
        return JSON.parse(localStorage.getItem("user_insights") || "[]") as Insight[];
      })();

      const journalsPromise = (async () => {
        if (!userId) return [] as JournalEntry[];
        const res = await fetch(`/api/meditation/journal/list?userId=${userId}`);
        if (!res.ok) return [] as JournalEntry[];
        const json = await res.json();
        return (json.entries || []) as JournalEntry[];
      })();

      const notesPromise = (async () => {
        if (!userId) return [] as JournalNote[];
        const res = await fetch(`/api/journal/notes?userId=${userId}`);
        if (!res.ok) return [] as JournalNote[];
        const json = await res.json();
        return (json.notes || []) as JournalNote[];
      })();

      const [insightsData, journalsData, notesData] = await Promise.all([insightsPromise, journalsPromise, notesPromise]);
      setInsights(insightsData);
      setJournals(journalsData);
      setNotes(notesData);
    } catch (err: any) {
      setError("Não foi possível carregar o diário.");
      console.error("[DiarioAlquimico]", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveJournalEdit = async (pathId: string) => {
    if (!editing || !userId) return;
    setEditing((prev) => (prev ? { ...prev, saving: true } : null));
    try {
      const res = await fetch("/api/meditation/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pathId, journalText: editing.text }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      await fetchAll();
      setEditing(null);
    } catch (err) {
      console.error("[DiarioAlquimico] Erro ao editar nota:", err);
      setError("Não foi possível salvar a edição.");
    } finally {
      setEditing((prev) => (prev ? { ...prev, saving: false } : null));
    }
  };

  const saveNoteEdit = async (id: string) => {
    if (!editingNote || !userId) return;
    setEditingNote((prev) => (prev ? { ...prev, saving: true } : null));
    try {
      const res = await fetch(`/api/journal/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: editingNote.text }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      await fetchAll();
      setEditingNote(null);
    } catch (err) {
      console.error("[DiarioAlquimico] Erro ao editar nota:", err);
      setError("Não foi possível salvar a edição.");
    } finally {
      setEditingNote((prev) => (prev ? { ...prev, saving: false } : null));
    }
  };

  const combinedEntries = React.useMemo(() => {
    const insightEntries = insights.map(insight => ({
      key: `insight-${insight.id}`,
      timestamp: insight.created_at,
      text: insight.insight_text,
      categoryLabel: (() => {
        if (insight.category?.startsWith("casa-") && insight.category?.endsWith("-pausa")) {
          const num = insight.category.replace("casa-", "").replace("-pausa", "");
          return `Casa ${num} — Pausa de Presença`;
        }
        if (insight.transit_key || insight.category?.startsWith("transit-")) return "Ciclos Ativos";
        return "Registro";
      })(),
      filterKey: insight.category?.startsWith("casa-") && insight.category?.endsWith("-pausa")
        ? "pausa"
        : (insight.transit_key || insight.category?.startsWith("transit-")) ? "ciclos" : "todos",
    }));

    const journalEntries = journals.map(journal => ({
      key: `journal-${journal.path_id}`,
      pathId: journal.path_id,
      timestamp: journal.updated_at,
      text: journal.journal_text,
      categoryLabel: `${journal.path_title || journal.path_id} — Diário Alquímico`,
      filterKey: "diario" as const,
      kind: "path" as const,
    }));

    const noteEntries = notes.map(note => ({
      key: `note-${note.id}`,
      noteId: note.id,
      timestamp: note.updated_at !== note.created_at ? note.updated_at : note.created_at,
      text: note.content,
      categoryLabel: "Diário Alquímico — Nota",
      filterKey: "diario" as const,
      kind: "note" as const,
    }));

    return [...insightEntries, ...journalEntries, ...noteEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [insights, journals, notes]);

  const filtered = combinedEntries.filter(entry => activeFilter === "todos" || entry.filterKey === activeFilter);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest">
          Suas reflexões, percepções e registros
        </p>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c6239]/10 disabled:opacity-40"
        >
          {loading ? "Carregando..." : "↺ Atualizar"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
        {[
          { key: "todos", label: "Todos" },
          { key: "diario", label: "Diário dos Caminhos" },
          { key: "pausa", label: "Pausa de Presença" },
          { key: "ciclos", label: "Ciclos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key as typeof activeFilter)}
            className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
              activeFilter === f.key
                ? "bg-[#5c4d66] text-[#f4f1eb] border-[#5c4d66]"
                : "bg-transparent text-[#8c7f70] border-[#8c7f70]/25 hover:border-[#8c7f70]/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-6 h-6 text-[#8c6239] animate-spin" />
          <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest animate-pulse">
            Buscando seus registros...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-sans">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <BookOpen className="w-8 h-8 text-[#8c7f70]/40" />
          <p className="font-serif text-[#8c7f70] text-sm leading-relaxed max-w-xs">
            Nenhum registro ainda. Explore as Casas, os Caminhos ou os Ciclos para começar seu diário.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isPathJournal = (entry as any).kind === "path";
            const isNote = (entry as any).kind === "note";
            const isEditable = isPathJournal || isNote;
            const isEditingPath = isPathJournal && editing?.pathId === (entry as any).pathId;
            const isEditingNote = isNote && editingNote?.id === (entry as any).noteId;
            const isEditing = isEditingPath || isEditingNote;

            return (
              <div key={entry.key} className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-widest">
                    {formatDate(entry.timestamp)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[9px] text-[#5c4d66] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5c4d66]/10">
                      {entry.categoryLabel}
                    </span>
                    {isEditable && !isEditing && (
                      <button
                        onClick={() => {
                          if (isPathJournal) {
                            setEditing({ pathId: (entry as any).pathId, text: entry.text, saving: false });
                          } else {
                            setEditingNote({ id: (entry as any).noteId, text: entry.text, saving: false });
                          }
                        }}
                        className="p-1 text-[#8c7f70] hover:text-[#5c4d66] transition-colors"
                        aria-label="Editar nota"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={isEditingPath ? editing!.text : editingNote!.text}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isEditingPath) {
                          setEditing((prev) => (prev ? { ...prev, text: value } : prev));
                        } else {
                          setEditingNote((prev) => (prev ? { ...prev, text: value } : prev));
                        }
                      }}
                      className="w-full min-h-[100px] p-3 rounded-lg border border-[#e6e2d8] bg-white/60 text-sm text-[#4a3f35] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => (isEditingPath ? setEditing(null) : setEditingNote(null))}
                        disabled={isEditingPath ? editing!.saving : editingNote!.saving}
                        className="px-3 py-1.5 rounded-lg border border-[#e6e2d8] text-[#8c7f70] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ede9de] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => (isEditingPath ? saveJournalEdit((entry as any).pathId) : saveNoteEdit((entry as any).noteId))}
                        disabled={
                          isEditingPath
                            ? editing!.saving || !editing!.text.trim() || editing!.text === entry.text
                            : editingNote!.saving || !editingNote!.text.trim() || editingNote!.text === entry.text
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8c6239] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#6b4a2b] transition-colors disabled:opacity-50"
                      >
                        {(isEditingPath ? editing!.saving : editingNote!.saving)
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Save className="w-3.5 h-3.5" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-[13.5px] text-[#3c352d] leading-relaxed whitespace-pre-wrap">
                    {entry.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MinhaExperienciaTab: React.FC<MinhaExperienciaTabProps> = ({ userId, userName, onNavigateToElement }) => {
  const [view, setView] = React.useState<"diario" | "evolucao">("evolucao");

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="font-serif text-[#3c352d] text-base tracking-widest uppercase px-1">
          Minha Experiência
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-2 px-1">
        <button
          onClick={() => setView("diario")}
          className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
            view === "diario"
              ? "bg-[#5c4d66] text-[#f4f1eb]"
              : "bg-[#8c7f70]/10 text-[#8c7f70] hover:bg-[#8c7f70]/20"
          }`}
        >
          📝 Diário Alquímico
        </button>
        <button
          onClick={() => setView("evolucao")}
          className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
            view === "evolucao"
              ? "bg-[#5c4d66] text-[#f4f1eb]"
              : "bg-[#8c7f70]/10 text-[#8c7f70] hover:bg-[#8c7f70]/20"
          }`}
        >
          🌌 Minha Evolução
        </button>
      </div>

      {view === "diario" ? (
        <DiarioAlquimico userId={userId} />
      ) : (
        <EvolutionDashboard userId={userId} userName={userName} onNavigateToElement={onNavigateToElement} />
      )}
    </div>
  );
};

export default MinhaExperienciaTab;
