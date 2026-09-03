import React from "react";
import { Loader2, BookOpen } from "lucide-react";
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

const DiarioAlquimico: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [journals, setJournals] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"todos" | "pausa" | "ciclos" | "diario">("todos");

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

      const [insightsData, journalsData] = await Promise.all([insightsPromise, journalsPromise]);
      setInsights(insightsData);
      setJournals(journalsData);
    } catch (err: any) {
      setError("Não foi possível carregar o diário.");
      console.error("[DiarioAlquimico]", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

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
      timestamp: journal.updated_at,
      text: journal.journal_text,
      categoryLabel: `${journal.path_title || journal.path_id} — Diário Alquímico`,
      filterKey: "diario" as const,
    }));

    return [...insightEntries, ...journalEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [insights, journals]);

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
          {filtered.map((entry) => (
            <div key={entry.key} className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] px-5 py-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-widest">
                  {formatDate(entry.timestamp)}
                </p>
                <span className="font-sans text-[9px] text-[#5c4d66] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5c4d66]/10">
                  {entry.categoryLabel}
                </span>
              </div>
              <p className="font-sans text-[13.5px] text-[#3c352d] leading-relaxed whitespace-pre-wrap">
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MinhaExperienciaTab: React.FC<MinhaExperienciaTabProps> = ({ userId, onNavigateToElement }) => {
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
        <EvolutionDashboard userId={userId} onNavigateToElement={onNavigateToElement} />
      )}
    </div>
  );
};

export default MinhaExperienciaTab;
