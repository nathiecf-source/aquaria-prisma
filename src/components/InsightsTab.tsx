import React from "react";
import { Loader2, BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface Insight {
  id: string | number;
  insight_text: string;
  created_at: string;
  category?: string | null;
  transit_key?: string | null;
}

interface InsightsTabProps {
  userId: string | null;
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

const InsightsTab: React.FC<InsightsTabProps> = ({ userId }) => {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"todos" | "pausa" | "ciclos">("todos");

  const fetchInsights = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && userId) {
        const { data, error: sbErr } = await (supabase as any)
          .from("user_insights")
          .select("id, insight_text, category, transit_key, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (sbErr) throw sbErr;
        setInsights(data || []);
      } else {
        const stored: Insight[] = JSON.parse(localStorage.getItem("user_insights") || "[]");
        setInsights(stored);
      }
    } catch (err: any) {
      setError("Não foi possível carregar os insights.");
      console.error("[InsightsTab]", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => { fetchInsights(); }, [fetchInsights]);

  return (
    <div className="w-full py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="font-serif text-[#3c352d] text-base tracking-widest uppercase">
            Meus Insights
          </h2>
          <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest mt-0.5">
            O que você acessou ao longo da jornada
          </p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c6239]/10 disabled:opacity-40"
        >
          {loading ? "Carregando..." : "↺ Atualizar"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
        {[
          { key: "todos", label: "Todos" },
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

      {/* Estados */}
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
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <BookOpen className="w-8 h-8 text-[#8c7f70]/40" />
          <p className="font-serif text-[#8c7f70] text-sm leading-relaxed max-w-xs">
            Nenhum insight registrado ainda. Explore as Casas na aba Síntese ou os Ciclos e registre o que acessou.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights
            .filter((insight) => {
              if (activeFilter === "todos") return true;
              if (activeFilter === "pausa") return insight.category?.startsWith("casa-") && insight.category?.endsWith("-pausa");
              if (activeFilter === "ciclos") return !!insight.transit_key || insight.category?.startsWith("transit-");
              return true;
            })
            .map((insight) => {
              const categoryLabel = (() => {
                if (insight.category?.startsWith("casa-") && insight.category?.endsWith("-pausa")) {
                  const num = insight.category.replace("casa-", "").replace("-pausa", "");
                  return `Casa ${num} — Pausa de Presença`;
                }
                if (insight.transit_key || insight.category?.startsWith("transit-")) {
                  return "Ciclos Ativos";
                }
                return "Registro";
              })();
              return (
                <div
                  key={insight.id}
                  className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] px-5 py-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-widest">
                      {formatDate(insight.created_at)}
                    </p>
                    <span className="font-sans text-[9px] text-[#5c4d66] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5c4d66]/10">
                      {categoryLabel}
                    </span>
                  </div>
                  <p className="font-sans text-[13.5px] text-[#3c352d] leading-relaxed whitespace-pre-wrap">
                    {insight.insight_text}
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default InsightsTab;
