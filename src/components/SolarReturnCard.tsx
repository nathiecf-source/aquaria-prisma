import React from "react";
import { CalendarDays, Loader2, Lock, MapPin, Sparkles, Star } from "lucide-react";
import tzlookup from "tz-lookup";
import SolarReturnModal, { SolarReturnResult } from "./SolarReturnModal";

interface Place {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface SolarReturnCycle {
  year: number;
  age: number;
  startsAt: string;
  endsAt?: string;
}

interface SolarReturnCycles {
  currentCycle: SolarReturnCycle;
  nextCycle: SolarReturnCycle;
  unlockDate: string;
  isNextCycleUnlocked: boolean;
}

interface SolarReturnStatus {
  cycles: SolarReturnCycles;
  readings: Record<string, SolarReturnResult | null>;
}

interface SolarReturnCardProps {
  profile: any;
  userId?: string | null;
  subscriptionTier: "FREE" | "PLUS";
}

const longDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const unlockDateFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export default function SolarReturnCard({ profile, userId, subscriptionTier }: SolarReturnCardProps) {
  const [status, setStatus] = React.useState<SolarReturnStatus | null>(null);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"current" | "next">("current");

  const [query, setQuery] = React.useState("");
  const [selectedPlace, setSelectedPlace] = React.useState<Place | null>(null);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SolarReturnResult | null>(null);

  React.useEffect(() => {
    if (subscriptionTier !== "PLUS" || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/cycles/solar-return/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, userId }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error || "Não foi possível consultar a Revolução Solar.");
        if (!cancelled) setStatus(body);
      } catch (err: any) {
        if (!cancelled) setStatusError(err?.message || "Não foi possível consultar a Revolução Solar.");
      }
    })();
    return () => { cancelled = true; };
  }, [subscriptionTier, userId]);

  React.useEffect(() => {
    if (!query || query.length < 3 || selectedPlace?.name === query) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=pt`);
        setSuggestions(response.ok ? await response.json() : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query, selectedPlace]);

  const selectPlace = (suggestion: any) => {
    const latitude = Number(suggestion.lat);
    const longitude = Number(suggestion.lon);
    let timezone: string;
    try {
      timezone = tzlookup(latitude, longitude);
    } catch {
      setError("Não foi possível identificar o fuso horário desta cidade.");
      return;
    }
    const place = { name: suggestion.display_name, latitude, longitude, timezone };
    setSelectedPlace(place);
    setQuery(place.name);
    setSuggestions([]);
    setError(null);
  };

  const activeCycle: SolarReturnCycle | null = !status ? null : activeTab === "current" ? status.cycles.currentCycle : status.cycles.nextCycle;
  const activeReading = activeCycle ? status?.readings?.[String(activeCycle.year)] ?? null : null;
  const nextLocked = activeTab === "next" && status ? !status.cycles.isNextCycleUnlocked : false;

  const generate = async () => {
    if (!selectedPlace || !userId || !activeCycle || loading) return;
    setConfirming(false);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cycles/solar-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, userId, location: selectedPlace, targetYear: activeCycle.year }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || "Não foi possível calcular a Revolução Solar.");
      setStatus((prev) => prev ? { ...prev, readings: { ...prev.readings, [String(activeCycle.year)]: body } } : prev);
      setResult(body);
    } catch (err: any) {
      setError(err?.message || "Não foi possível calcular a Revolução Solar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuery("");
    setSelectedPlace(null);
    setSuggestions([]);
    setError(null);
  };

  if (subscriptionTier !== "PLUS") {
    return (
      <div className="mt-6 rounded-2xl border border-[#8c7f70]/15 bg-[#faf9f6] px-5 py-5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#8c7f70] mt-0.5" />
        <div><h3 className="font-serif text-[#3c352d]">Revolução Solar</h3><p className="mt-1 text-xs text-[#8c7f70] leading-relaxed">A leitura anual completa está disponível para assinantes do Passe de Expansão.</p></div>
      </div>
    );
  }

  const cityForm = (
    <>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7f70]" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSelectedPlace(null); setError(null); }}
            placeholder={activeTab === "current" ? "Onde você passou seu último aniversário?" : "Onde você passará o próximo aniversário?"}
            className="w-full rounded-xl border border-[#8c7f70]/25 bg-white/70 py-3 pl-10 pr-10 text-sm text-[#3c352d] outline-none focus:border-[#8c6239]/60"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#8c6239]" />}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-[#8c7f70]/20 bg-[#faf9f6] shadow-xl overflow-hidden">
            {suggestions.map((suggestion, index) => <button key={`${suggestion.place_id}-${index}`} type="button" onClick={() => selectPlace(suggestion)} className="w-full px-4 py-3 text-left text-xs text-[#4a423a] hover:bg-[#ede9de] border-b border-[#8c7f70]/10 last:border-0">{suggestion.display_name}</button>)}
          </div>
        )}
      </div>

      <button onClick={() => setConfirming(true)} disabled={!selectedPlace || loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#5c4d66] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#4a3e53] disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Calculando o céu do seu ano..." : "Mapear Revolução"}
      </button>
    </>
  );

  return (
    <>
      <div className="mt-6 rounded-2xl border border-[#8c6239]/25 bg-gradient-to-br from-[#faf9f6] to-[#ede9de]/70 px-5 py-5 space-y-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-[#8c6239] mt-0.5" />
          <div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c6239]">Mapa anual tropical</p><h3 className="font-serif text-lg text-[#3c352d]">Sua Revolução Solar</h3><p className="mt-1 text-xs text-[#6f655b] leading-relaxed">Cada aniversário abre um novo ciclo. A cidade onde você está no instante exato do retorno do Sol define o Ascendente e as casas do seu ano.</p></div>
        </div>

        {statusError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{statusError}</p>}
        {!status && !statusError && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#8c6239]" /></div>}

        {status && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab("current"); resetForm(); }}
                className={`rounded-xl border px-3 py-3 text-left transition ${activeTab === "current" ? "border-[#8c6239]/50 bg-[#8c6239]/10" : "border-[#8c7f70]/20 bg-white/40 hover:bg-white/70"}`}
              >
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#8c6239] flex items-center gap-1"><Star className="w-3 h-3" /> Ciclo atual ({status.cycles.currentCycle.age} anos)</p>
                <p className="mt-1 text-[10px] text-[#6f655b]">Válido de {longDate.format(new Date(status.cycles.currentCycle.startsAt))} a {longDate.format(new Date(status.cycles.currentCycle.endsAt || status.cycles.nextCycle.startsAt))}</p>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("next"); resetForm(); }}
                className={`rounded-xl border px-3 py-3 text-left transition ${activeTab === "next" ? "border-[#8c6239]/50 bg-[#8c6239]/10" : "border-[#8c7f70]/20 bg-white/40 hover:bg-white/70"}`}
              >
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#8c6239] flex items-center gap-1">{!status.cycles.isNextCycleUnlocked && <Lock className="w-3 h-3" />} Próximo ciclo ({status.cycles.nextCycle.age} anos)</p>
                <p className="mt-1 text-[10px] text-[#6f655b]">Inicia em {longDate.format(new Date(status.cycles.nextCycle.startsAt))}</p>
              </button>
            </div>

            {activeReading ? (
              <button onClick={() => setResult(activeReading)} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#5c4d66] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#4a3e53]">
                <Sparkles className="w-4 h-4" /> Ver leitura do ciclo
              </button>
            ) : nextLocked ? (
              <div className="rounded-xl border border-[#8c7f70]/20 bg-[#ede9de]/60 px-4 py-4 flex items-start gap-3 opacity-80">
                <Lock className="w-4 h-4 text-[#8c7f70] mt-0.5" />
                <p className="text-xs text-[#6f655b] leading-relaxed">O mapa do seu próximo ano está em repouso. A leitura será liberada a partir de <strong>{unlockDateFormat.format(new Date(status.cycles.unlockDate))}</strong> (60 dias antes do seu aniversário).</p>
              </div>
            ) : (
              <>
                {activeTab === "next" && (
                  <p className="rounded-xl border border-[#8c6239]/20 bg-[#8c6239]/10 px-4 py-3 text-xs text-[#5c4d66] leading-relaxed">Seu aniversário está se aproximando. A prévia do seu próximo ciclo de vida já está disponível.</p>
                )}
                {cityForm}
              </>
            )}

            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
          </>
        )}
      </div>

      {confirming && selectedPlace && (
        <div className="fixed inset-0 z-[130] bg-[#1f1b18]/70 backdrop-blur-sm p-4 flex items-center justify-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(false); }}>
          <div role="alertdialog" aria-modal="true" aria-label="Confirme o local do seu aniversário" className="w-full max-w-md bg-[#f7f4ee] rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="font-serif text-lg text-[#3c352d]">Confirme o local do seu aniversário</h2>
            <p className="text-sm text-[#4a423a] leading-relaxed">Essa leitura é gerada apenas uma vez e a cidade não poderá ser alterada posteriormente. Você confirma que passou ou passará seu aniversário em <strong>{selectedPlace.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 rounded-xl border border-[#8c7f70]/30 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#6f655b] hover:bg-[#8c7f70]/10">Cancelar e voltar</button>
              <button onClick={generate} className="flex-1 rounded-xl bg-[#5c4d66] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#4a3e53]">Sim, confirmar cidade</button>
            </div>
          </div>
        </div>
      )}

      {result && <SolarReturnModal result={result} userName={profile?.birthData?.name || "Seu mapa"} onClose={() => setResult(null)} />}
    </>
  );
}
