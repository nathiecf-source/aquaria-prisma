import React from "react";
import { CalendarDays, Loader2, Lock, MapPin, Sparkles } from "lucide-react";
import tzlookup from "tz-lookup";
import SolarReturnModal, { SolarReturnResult } from "./SolarReturnModal";

interface Place {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface SolarReturnCardProps {
  profile: any;
  userId?: string | null;
  subscriptionTier: "FREE" | "PLUS";
}

export default function SolarReturnCard({ profile, userId, subscriptionTier }: SolarReturnCardProps) {
  const initialPlace = profile?.birthData?.birthPlace as Place | undefined;
  const [query, setQuery] = React.useState(initialPlace?.name || "");
  const [selectedPlace, setSelectedPlace] = React.useState<Place | null>(initialPlace || null);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SolarReturnResult | null>(null);

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

  const generate = async () => {
    if (!selectedPlace || !userId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cycles/solar-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, userId, location: selectedPlace }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || "Não foi possível calcular a Revolução Solar.");
      setResult(body);
    } catch (err: any) {
      setError(err?.message || "Não foi possível calcular a Revolução Solar.");
    } finally {
      setLoading(false);
    }
  };

  if (subscriptionTier !== "PLUS") {
    return (
      <div className="mt-6 rounded-2xl border border-[#8c7f70]/15 bg-[#faf9f6] px-5 py-5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#8c7f70] mt-0.5" />
        <div><h3 className="font-serif text-[#3c352d]">Revolução Solar</h3><p className="mt-1 text-xs text-[#8c7f70] leading-relaxed">A leitura anual completa está disponível para assinantes do Passe de Expansão.</p></div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 rounded-2xl border border-[#8c6239]/25 bg-gradient-to-br from-[#faf9f6] to-[#ede9de]/70 px-5 py-5 space-y-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-[#8c6239] mt-0.5" />
          <div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c6239]">Mapa anual tropical</p><h3 className="font-serif text-lg text-[#3c352d]">Sua Revolução Solar</h3><p className="mt-1 text-xs text-[#6f655b] leading-relaxed">Escolha a cidade onde você passou ou passará seu aniversário. As coordenadas desse lugar definem o Ascendente e as casas do seu novo ciclo.</p></div>
        </div>

        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7f70]" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelectedPlace(null); setError(null); }}
              placeholder="Digite a cidade do aniversário"
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

        <button onClick={generate} disabled={!selectedPlace || loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#5c4d66] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#4a3e53] disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Calculando o céu do seu ano..." : "Calcular minha Revolução Solar"}
        </button>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
      </div>
      {result && <SolarReturnModal result={result} userName={profile?.birthData?.name || "Seu mapa"} onClose={() => setResult(null)} />}
    </>
  );
}
