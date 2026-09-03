import React from "react";
import { Loader2, ArrowRight, Trophy, ScrollText, Lock } from "lucide-react";

type ItemStatus = "pending" | "in_progress" | "completed";

interface AlicerceItem {
  id: string;
  label: string;
  status: ItemStatus;
  progress: string;
}

interface HouseItem {
  id: number;
  label: string;
  theme: string;
  sectionsRead: number;
  missingSections: string[];
  status: ItemStatus;
}

interface CaminhoItem {
  id: string;
  label: string;
  status: ItemStatus;
}

interface PlanetItem {
  id: string;
  label: string;
  status: ItemStatus;
}

interface Badge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

interface NextFrontier {
  title: string;
  description: string;
  targetId: string;
}

interface TimelineEntry {
  label: string;
  timestamp: string;
}

interface ProgressData {
  percent: number;
  level: string;
  alicerce: { items: AlicerceItem[]; completed: number; total: number };
  cenario: { houses: HouseItem[]; completed: number; total: number };
  caminhos: { items: CaminhoItem[]; completed: number; total: number };
  planetas: { items: PlanetItem[]; completed: number; total: number };
  badges: Badge[];
  nextFrontier: NextFrontier | null;
  timeline: TimelineEntry[];
}

interface EvolutionDashboardProps {
  userId: string | null;
  onNavigateToElement?: (elementId: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === "completed") return <span className="text-[#8c6239]">✦</span>;
  if (status === "in_progress") return <span className="text-[#5c4d66]">◐</span>;
  return <span className="text-[#8c7f70]/50">◯</span>;
}

const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({ userId, onNavigateToElement }) => {
  const [data, setData] = React.useState<ProgressData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openRing, setOpenRing] = React.useState<string | null>("alicerce");
  const [mobileSubTab, setMobileSubTab] = React.useState<"badges" | "timeline">("badges");
  const [timelineExpanded, setTimelineExpanded] = React.useState(false);
  const [badgesExpanded, setBadgesExpanded] = React.useState(false);

  const fetchProgress = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user-progress?userId=${userId}`);
      if (!res.ok) throw new Error("Falha ao buscar progresso.");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError("Não foi possível carregar sua evolução.");
      console.error("[EvolutionDashboard]", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const toggleRing = (ring: string) => {
    setOpenRing(prev => (prev === ring ? null : ring));
  };

  const navigate = (targetId: string) => {
    if (!targetId || !onNavigateToElement) return;
    if (targetId.startsWith("casa-")) {
      onNavigateToElement(targetId);
    } else {
      onNavigateToElement(targetId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-6 h-6 text-[#8c6239] animate-spin" />
        <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest animate-pulse">
          Calculando sua jornada...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-sans">
        {error || "Sem dados de progresso."}
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-4">
      {/* Hero de Expansão */}
      <div className="rounded-2xl border border-[#8c6239]/25 bg-gradient-to-br from-[#faf9f6] to-[#f4f1eb] px-5 py-5 space-y-4">
        <div>
          <p className="font-mono text-[9px] text-[#8c6239] uppercase tracking-[0.2em]">✦ Caminhar de Expansão</p>
          <h3 className="font-serif text-[#3c352d] text-lg tracking-wide mt-1">
            {data.level} <span className="text-[#8c6239] text-sm font-mono">({data.percent}%)</span>
          </h3>
          <div className="mt-2 h-2 w-full rounded-full bg-[#8c7f70]/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8c6239] to-[#a37c5c] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, data.percent))}%` }}
            />
          </div>
        </div>

        {data.nextFrontier && (
          <div className="rounded-xl bg-[#3c352d]/[0.03] border border-[#8c7f70]/15 px-4 py-3.5 space-y-2">
            <p className="font-mono text-[9px] text-[#5c4d66] uppercase tracking-[0.2em]">➔ Próxima Fronteira</p>
            <p className="font-serif text-[#3c352d] text-[13.5px] leading-relaxed">
              {data.nextFrontier.description}
            </p>
            {data.nextFrontier.targetId && (
              <button
                onClick={() => navigate(data.nextFrontier!.targetId)}
                className="inline-flex items-center gap-1.5 font-mono text-[9px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors"
              >
                Acessar Leitura <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mapeamento da Jornada */}
      <div className="space-y-2.5">
        <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em] px-1">Mapeamento da Jornada</p>

        {/* O Alicerce */}
        <RingAccordion
          title="1. O Alicerce"
          metric={`${data.alicerce.completed}/${data.alicerce.total} Concluído`}
          isComplete={data.alicerce.completed === data.alicerce.total}
          isOpen={openRing === "alicerce"}
          onToggle={() => toggleRing("alicerce")}
        >
          <div className="space-y-2">
            {data.alicerce.items.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id === "elementos" ? "petal-fire" : item.id === "qualidades" ? "petala-cardeal" : item.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 bg-[#faf9f6] hover:bg-[#f4f1eb] transition-colors text-left"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] text-[#3c352d]">
                  <StatusIcon status={item.status} /> {item.label}
                </span>
                <span className="font-mono text-[9px] text-[#8c7f70]">{item.progress}</span>
              </button>
            ))}
          </div>
        </RingAccordion>

        {/* O Cenário da Vida */}
        <RingAccordion
          title="2. O Cenário da Vida"
          metric={`${data.cenario.completed}/${data.cenario.total} Concluídas`}
          isComplete={data.cenario.completed === data.cenario.total}
          isOpen={openRing === "cenario"}
          onToggle={() => toggleRing("cenario")}
        >
          <div className="grid grid-cols-4 gap-2">
            {data.cenario.houses.map(house => (
              <button
                key={house.id}
                onClick={() => navigate(`casa-${house.id}`)}
                title={house.theme}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center font-mono text-[11px] transition-all ${
                  house.status === "completed"
                    ? "bg-[#8c6239]/15 border-2 border-[#8c6239] text-[#3c352d] font-bold"
                    : house.status === "in_progress"
                      ? "bg-transparent border-2 border-[#a8a8a8] text-[#5c544d]"
                      : "bg-[#8c7f70]/[0.06] border border-[#8c7f70]/15 text-[#8c7f70]/60"
                }`}
              >
                <span>{house.id}</span>
              </button>
            ))}
          </div>
        </RingAccordion>

        {/* O Cenário Planetário */}
        <RingAccordion
          title="3. O Cenário Planetário"
          metric={`${data.planetas.completed}/${data.planetas.total} Mapeados`}
          isComplete={data.planetas.completed === data.planetas.total}
          isOpen={openRing === "planetas"}
          onToggle={() => toggleRing("planetas")}
        >
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2">
            {data.planetas.items.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigateToElement?.(item.id)}
                title={item.label}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center font-mono text-[10px] leading-tight px-1 transition-all ${
                  item.status === "completed"
                    ? "bg-[#8c6239]/15 border-2 border-[#8c6239] text-[#3c352d] font-bold"
                    : "bg-[#8c7f70]/[0.06] border border-[#8c7f70]/15 text-[#8c7f70]/60"
                }`}
              >
                <span className="text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </RingAccordion>

        {/* Os Caminhos de Potência */}
        <RingAccordion
          title="4. Os Caminhos de Potência"
          metric={`${data.caminhos.completed}/${data.caminhos.total} Mapeados`}
          isComplete={data.caminhos.completed === data.caminhos.total}
          isOpen={openRing === "caminhos"}
          onToggle={() => toggleRing("caminhos")}
        >
          <div className="space-y-2">
            {data.caminhos.items.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-[#faf9f6] hover:bg-[#f4f1eb] transition-colors text-left"
              >
                <StatusIcon status={item.status} />
                <span className="font-sans text-[13px] text-[#3c352d]">{item.label}</span>
              </button>
            ))}
          </div>
        </RingAccordion>
      </div>

      {/* Bloco Duplo: Insígnias & Histórico */}
      <div className="rounded-2xl border border-[#8c7f70]/15 bg-[#faf9f6] overflow-hidden">
        {/* Seletor mobile */}
        <div className="flex md:hidden border-b border-[#8c7f70]/15">
          <button
            onClick={() => setMobileSubTab("badges")}
            className={`flex-1 py-3 font-mono text-[9px] uppercase tracking-widest ${mobileSubTab === "badges" ? "text-[#8c6239] border-b-2 border-[#8c6239]" : "text-[#8c7f70]"}`}
          >
            🏆 Selos Conquistados
          </button>
          <button
            onClick={() => setMobileSubTab("timeline")}
            className={`flex-1 py-3 font-mono text-[9px] uppercase tracking-widest ${mobileSubTab === "timeline" ? "text-[#8c6239] border-b-2 border-[#8c6239]" : "text-[#8c7f70]"}`}
          >
            📜 Linha do Tempo
          </button>
        </div>

        <div className="md:grid md:grid-cols-2 md:divide-x md:divide-[#8c7f70]/15">
          {/* Badges */}
          <div className={`p-4 space-y-3 ${mobileSubTab === "badges" ? "block" : "hidden"} md:block`}>
            <p className="hidden md:flex items-center gap-1.5 font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em]">
              <Trophy className="w-3.5 h-3.5" /> Selos Conquistados
            </p>
            {(() => {
              const sortedBadges = [...data.badges].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
              const visibleBadges = badgesExpanded ? sortedBadges : sortedBadges.slice(0, 4);
              return (
                <div className="space-y-3">
                  {visibleBadges.map(badge => (
                    <div
                      key={badge.id}
                      className={`rounded-lg px-3.5 py-3 border ${
                        badge.unlocked
                          ? "border-[#8c6239]/30 bg-[#8c6239]/[0.06]"
                          : "border-[#8c7f70]/10 bg-transparent opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {badge.unlocked ? <Trophy className="w-3.5 h-3.5 text-[#8c6239]" /> : <Lock className="w-3.5 h-3.5 text-[#8c7f70]" />}
                        <p className="font-serif text-[13px] text-[#3c352d]">{badge.label}</p>
                      </div>
                      <p className="font-sans text-[11px] text-[#8c7f70] mt-1 leading-relaxed">{badge.description}</p>
                    </div>
                  ))}
                  {data.badges.length > 4 && (
                    <button
                      onClick={() => setBadgesExpanded(prev => !prev)}
                      className="w-full pt-1 font-mono text-[9px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors"
                    >
                      {badgesExpanded ? "Mostrar menos" : `Mostrar mais (${data.badges.length - 4})`}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Timeline */}
          <div className={`p-4 space-y-2.5 ${mobileSubTab === "timeline" ? "block" : "hidden"} md:block`}>
            <p className="hidden md:flex items-center gap-1.5 font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em]">
              <ScrollText className="w-3.5 h-3.5" /> Linha do Tempo
            </p>
            {data.timeline.length === 0 ? (
              <p className="font-sans text-[12px] text-[#8c7f70]/70 italic">Nenhum registro ainda.</p>
            ) : (
              <div className="space-y-2">
                {(timelineExpanded ? data.timeline : data.timeline.slice(0, 10)).map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[12px]">
                    <span className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-wider mt-0.5 whitespace-nowrap">
                      {formatDate(entry.timestamp)}
                    </span>
                    <span className="font-sans text-[#3c352d] leading-snug">{entry.label}</span>
                  </div>
                ))}
                {data.timeline.length > 10 && (
                  <button
                    onClick={() => setTimelineExpanded(prev => !prev)}
                    className="w-full pt-1 font-mono text-[9px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors"
                  >
                    {timelineExpanded ? "Mostrar menos" : `Mostrar mais (${data.timeline.length - 10})`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RingAccordion: React.FC<{
  title: string;
  metric: string;
  isComplete: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, metric, isComplete, isOpen, onToggle, children }) => (
  <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6]/60 overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f4f1eb] transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="font-serif text-[#3c352d] text-[13.5px] tracking-wide">{title}</span>
        {isComplete && (
          <span className="font-mono text-[8px] text-[#8c6239] uppercase tracking-widest bg-[#8c6239]/10 px-2 py-0.5 rounded-full">
            ✦ Seção Integrada
          </span>
        )}
      </div>
      <span className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-widest">{metric}</span>
    </button>
    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="overflow-hidden">
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  </div>
);

export default EvolutionDashboard;
