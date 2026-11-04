import React from "react";
import tzlookup from "tz-lookup";
import {
  Scroll, Search, Loader2, User, UserPlus, Trash2, Copy, Check,
  ChevronLeft, RefreshCw, MapPin, Calendar, Clock, AlertCircle,
} from "lucide-react";
import { VedicKundli } from "../VedicKundli";

interface VedicReportPanelProps {
  getToken: () => Promise<string | null>;
}

interface ReportListItem {
  id: string;
  client_name: string;
  client_email: string | null;
  target_user_id: string | null;
  source: string;
  created_at: string;
}

interface PlanetSection {
  planet: string;
  forcaEssencial: string;
  funcaoCondicao: string;
  posicaoDesafios: string;
  interacoes: string;
  sintese: string;
}

interface HouseSection {
  house: number;
  ocupantesDrishti: string;
  bhaveshaKaraka: string;
  argalas: string;
  sintese: string;
}

interface ReportPayload {
  summary: string;
  planets: PlanetSection[];
  houses: HouseSection[];
}

interface FullReport {
  id: string;
  client_name: string;
  client_email: string | null;
  target_user_id: string | null;
  gender: string;
  birth_data: any;
  profile_snapshot: any;
  structural: any;
  report: ReportPayload;
  source: string;
  created_at: string;
}

type Mode = "user" | "external";

const PLANET_BLOCK_LABELS: [keyof PlanetSection, string][] = [
  ["forcaEssencial", "1 · Força Essencial, Dignidade & Micro-Zodiacal"],
  ["funcaoCondicao", "2 · Função & Condição Física"],
  ["posicaoDesafios", "3 · Posição no Ambiente & Desafios"],
  ["interacoes", "4 · Interações, Aspectos & Intervenção"],
];

const HOUSE_BLOCK_LABELS: [keyof HouseSection, string][] = [
  ["ocupantesDrishti", "1 · Ocupantes, Drishti & SAV"],
  ["bhaveshaKaraka", "2 · Senhor da Casa & Karaka"],
  ["argalas", "3 · Argalas Incidentes"],
];

function reportToMarkdown(r: FullReport): string {
  const lines: string[] = [
    `# Relatório Védico Estrutural — ${r.client_name}`,
    ``,
    `**Data/Hora:** ${r.birth_data?.birthDate || "?"} ${r.birth_data?.birthTime || ""} · **Local:** ${r.birth_data?.birthPlace?.name || "?"}`,
    `**Fonte dos dados:** ${r.source}`,
    ``,
    `## Visão Geral`,
    r.report.summary,
    ``,
    `## Diagnóstico dos 9 Planetas`,
  ];
  for (const p of r.report.planets || []) {
    lines.push(`### ${p.planet}`);
    for (const [key, label] of PLANET_BLOCK_LABELS) {
      lines.push(`**${label}:** ${p[key]}`);
    }
    lines.push(`**Síntese:** ${p.sintese}`, ``);
  }
  lines.push(`## Diagnóstico das 12 Casas`);
  for (const h of r.report.houses || []) {
    lines.push(`### Casa ${h.house}`);
    for (const [key, label] of HOUSE_BLOCK_LABELS) {
      lines.push(`**${label}:** ${h[key]}`);
    }
    lines.push(`**Síntese:** ${h.sintese}`, ``);
  }
  return lines.join("\n");
}

export const VedicReportPanel: React.FC<VedicReportPanelProps> = ({ getToken }) => {
  const [mode, setMode] = React.useState<Mode>("user");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Lista de relatórios salvos
  const [reports, setReports] = React.useState<ReportListItem[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  const [active, setActive] = React.useState<FullReport | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Modo usuário
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [foundUsers, setFoundUsers] = React.useState<any[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);

  // Modo externo
  const [extName, setExtName] = React.useState("");
  const [extEmail, setExtEmail] = React.useState("");
  const [extGender, setExtGender] = React.useState("neutro");
  const [extDate, setExtDate] = React.useState("");
  const [extTime, setExtTime] = React.useState("");
  const [placeQuery, setPlaceQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = React.useState<any | null>(null);
  const [searchingPlace, setSearchingPlace] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const authHeaders = async () => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const loadReports = React.useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/vedic-reports", { headers: await authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setReports(data.reports || []);
    } catch (e) {
      console.error("[VedicReport] Erro ao listar:", e);
    } finally {
      setListLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => { loadReports(); }, [loadReports]);

  // Fecha dropdown de cidades ao clicar fora
  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Autocomplete Nominatim (mesmo padrão do BirthForm)
  React.useEffect(() => {
    if (!placeQuery || placeQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    if (selectedPlace && selectedPlace.name === placeQuery) return;
    const t = setTimeout(async () => {
      setSearchingPlace(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeQuery)}&limit=5&addressdetails=1&accept-language=pt`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch (e) {
        console.error("[VedicReport] Erro no autocomplete:", e);
      } finally {
        setSearchingPlace(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [placeQuery, selectedPlace]);

  const pickPlace = (s: any) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    let timezone = "America/Sao_Paulo";
    try { timezone = tzlookup(lat, lon); } catch { /* mantém default */ }
    setSelectedPlace({ name: s.display_name, latitude: lat, longitude: lon, timezone });
    setPlaceQuery(s.display_name);
    setShowDropdown(false);
  };

  const doSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/search", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ email: searchEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFoundUsers(data.users || []);
        if ((data.users || []).length === 1) setSelectedUser(data.users[0]);
        if ((data.users || []).length === 0) setError("Nenhum usuário encontrado.");
      } else {
        setError(data.error || "Erro ao buscar usuários.");
      }
    } catch {
      setError("Erro ao buscar usuários.");
    } finally {
      setSearchLoading(false);
    }
  };

  const generate = async () => {
    setError(null);
    let body: any;
    if (mode === "user") {
      if (!selectedUser) { setError("Selecione um usuário."); return; }
      body = { mode: "user", userId: selectedUser.id };
    } else {
      if (!extName || !extDate || !extTime || !selectedPlace) {
        setError("Preencha nome, data, hora e selecione uma cidade da lista.");
        return;
      }
      body = {
        mode: "external",
        client: {
          name: extName,
          email: extEmail || undefined,
          gender: extGender,
          birthDate: extDate,
          birthTime: extTime,
          birthPlace: selectedPlace,
        },
      };
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vedic-reports", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadReports();
        if (data.id) await openReport(data.id);
      } else {
        setError(data.error || "Erro ao gerar relatório.");
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  };

  const openReport = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vedic-reports/${id}`, { headers: await authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.report) setActive(data.report);
      else setError(data.error || "Erro ao abrir relatório.");
    } catch {
      setError("Erro ao abrir relatório.");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Excluir este relatório permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/vedic-reports/${id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (res.ok) {
        if (active?.id === id) setActive(null);
        loadReports();
      }
    } catch (e) {
      console.error("[VedicReport] Erro ao excluir:", e);
    }
  };

  const copyReport = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(reportToMarkdown(active));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full rounded-lg border border-[#e6e2d8] bg-white px-3 py-2 text-sm text-[#3c352d] focus:outline-none focus:ring-1 focus:ring-[#8c6239]";
  const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#6e6356] mb-1";

  // ─── Visualização do relatório aberto ──────────────────────────────────
  if (active) {
    const kundliPlanets = (active.structural?.planets || []).map((p: any) => ({
      name: p.name, sign: p.sign, degree: p.degree,
      isRetrograde: p.isRetrograde,
    }));
    const sortedPlanets = [...(active.report.planets || [])].sort(
      (a, b) => ["Sol", "Lua", "Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno", "Rahu", "Ketu"].indexOf(a.planet)
                - ["Sol", "Lua", "Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno", "Rahu", "Ketu"].indexOf(b.planet)
    );
    const sortedHouses = [...(active.report.houses || [])].sort((a, b) => a.house - b.house);

    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <button onClick={() => setActive(null)} className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8c6239] hover:underline">
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar à lista
              </button>
              <h2 className="font-serif text-2xl text-[#3c352d]">{active.client_name}</h2>
              <p className="mt-1 text-xs text-[#8c7f70]">
                {active.birth_data?.birthDate} · {active.birth_data?.birthTime} · {active.birth_data?.birthPlace?.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <span className="rounded bg-[#ede9de] px-2 py-1 uppercase tracking-wider text-[#6e6356]">
                  {active.target_user_id ? "Usuário do app" : "Cliente externo"}
                </span>
                <span className="rounded bg-[#ede9de] px-2 py-1 uppercase tracking-wider text-[#6e6356]">
                  Fonte: {active.source}
                </span>
                <span className="rounded bg-[#ede9de] px-2 py-1 uppercase tracking-wider text-[#6e6356]">
                  {new Date(active.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyReport} className="flex items-center gap-1.5 rounded-lg border border-[#e6e2d8] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6e6356] hover:bg-[#f4f1eb]">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar relatório"}
              </button>
              <button onClick={() => deleteReport(active.id)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
            <h3 className="mb-4 text-xs uppercase tracking-widest text-[#6e6356]">Kundli · Rasi (D-1)</h3>
            <VedicKundli planets={kundliPlanets} lagna={active.structural?.lagna} />
            {!!active.structural?.unavailable?.length && (
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[#a19688]">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Blocos sem dado: {active.structural.unavailable.join(", ")}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
            <h3 className="mb-4 text-xs uppercase tracking-widest text-[#6e6356]">Visão Geral Integrada</h3>
            <div className="space-y-3 text-sm leading-relaxed text-[#5c544d]">
              {active.report.summary?.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
          <h3 className="mb-5 text-xs uppercase tracking-widest text-[#6e6356]">Diagnóstico Integrado dos 9 Planetas</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {sortedPlanets.map((p) => (
              <div key={p.planet} className="rounded-xl border border-[#e6e2d8] bg-white/60 p-4">
                <h4 className="font-serif text-base text-[#3c352d]">{p.planet}</h4>
                <div className="mt-3 space-y-2.5">
                  {PLANET_BLOCK_LABELS.map(([key, label]) =>
                    p[key] ? (
                      <div key={key}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#8c6239]">{label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#5c544d]">{p[key]}</p>
                      </div>
                    ) : null
                  )}
                  <div className="rounded-lg bg-[#f4f1eb] p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#3c352d]">Síntese de Cruzamento</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#3c352d]">{p.sintese}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
          <h3 className="mb-5 text-xs uppercase tracking-widest text-[#6e6356]">Diagnóstico Integrado das 12 Casas</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {sortedHouses.map((h) => {
              const meta = active.structural?.houses?.find((x: any) => x.house === h.house);
              return (
                <div key={h.house} className="rounded-xl border border-[#e6e2d8] bg-white/60 p-4">
                  <h4 className="font-serif text-base text-[#3c352d]">
                    Casa {h.house}
                    {meta?.theme ? <span className="ml-2 text-xs font-sans font-normal text-[#8c7f70]">{meta.theme}</span> : null}
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    {HOUSE_BLOCK_LABELS.map(([key, label]) =>
                      h[key] ? (
                        <div key={key}>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[#8c6239]">{label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#5c544d]">{h[key]}</p>
                        </div>
                      ) : null
                    )}
                    <div className="rounded-lg bg-[#f4f1eb] p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#3c352d]">Síntese Estrutural</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#3c352d]">{h.sintese}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ─── Lista + geração ────────────────────────────────────────────────────
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6e6356]">
            <Scroll className="h-4 w-4" /> Relatório Védico Estrutural
          </h2>
          <p className="mt-2 text-xs text-[#8c7f70]">
            Geração sob demanda via JHora · diagnóstico integrado de 9 grahas e 12 bhavas · relatórios ficam salvos
          </p>
        </div>

        <div className="mb-5 flex gap-2">
          {([["user", "Usuário do app", User], ["external", "Cliente externo", UserPlus]] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                mode === m ? "border-[#8c6239] bg-[#8c6239] text-white" : "border-[#e6e2d8] text-[#6e6356] hover:bg-[#f4f1eb]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === "user" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="E-mail da usuária cadastrada..."
                className={inputCls}
              />
              <button onClick={doSearch} disabled={searchLoading || !searchEmail.trim()} className="flex items-center gap-1.5 rounded-lg bg-[#2b3c5c] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50">
                {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Buscar
              </button>
            </div>
            {foundUsers.length > 0 && (
              <div className="space-y-2">
                {foundUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full rounded-lg border p-3 text-left text-xs transition-colors ${
                      selectedUser?.id === u.id ? "border-[#8c6239] bg-[#8c6239]/5" : "border-[#e6e2d8] hover:bg-[#f4f1eb]"
                    }`}
                  >
                    <p className="font-medium text-[#3c352d]">{u.profile?.full_name || u.email}</p>
                    <p className="text-[#8c7f70]">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome do cliente</label>
              <input type="text" value={extName} onChange={(e) => setExtName(e.target.value)} className={inputCls} placeholder="Nome completo ou como gosta de ser chamado(a)" />
            </div>
            <div>
              <label className={labelCls}>E-mail (opcional)</label>
              <input type="email" value={extEmail} onChange={(e) => setExtEmail(e.target.value)} className={inputCls} placeholder="cliente@email.com" />
            </div>
            <div>
              <label className={labelCls}>Forma de tratamento</label>
              <select value={extGender} onChange={(e) => setExtGender(e.target.value)} className={inputCls}>
                <option value="feminino">Ela</option>
                <option value="masculino">Ele</option>
                <option value="neutro">Neutro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Data de nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7f70]/60" />
                <input type="date" value={extDate} onChange={(e) => setExtDate(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Hora de nascimento</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7f70]/60" />
                <input type="time" value={extTime} onChange={(e) => setExtTime(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div className="relative sm:col-span-2" ref={dropdownRef}>
              <label className={labelCls}>Local de nascimento</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7f70]/60" />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => {
                    setPlaceQuery(e.target.value);
                    if (selectedPlace && selectedPlace.name !== e.target.value) setSelectedPlace(null);
                  }}
                  placeholder="Digite a cidade e selecione na lista..."
                  className={`${inputCls} pl-9 pr-9`}
                />
                {searchingPlace && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#8c6239]" />}
                {!searchingPlace && selectedPlace && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />}
              </div>
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-52 w-full divide-y divide-[#e6e2d8] overflow-y-auto rounded-lg border border-[#e6e2d8] bg-white shadow-xl">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => pickPlace(s)} className="w-full px-3 py-2.5 text-left text-xs text-[#3c352d] hover:bg-[#f4f1eb]">
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
              {selectedPlace && (
                <p className="mt-1 rounded bg-[#ede9de]/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8c7f70]">
                  {selectedPlace.latitude.toFixed(4)} · {selectedPlace.longitude.toFixed(4)} · {selectedPlace.timezone}
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

        <button
          onClick={generate}
          disabled={loading || (mode === "user" ? !selectedUser : !(extName && extDate && extTime && selectedPlace))}
          className="mt-5 w-full rounded-lg bg-[#3c352d] py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#5c4d66] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando JHora e redigindo relatório (pode levar ~1 min)...
            </span>
          ) : "Gerar Relatório Védico"}
        </button>
      </div>

      <div className="rounded-2xl border border-[#e6e2d8] bg-[#fbf9f5] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-[#6e6356]">Relatórios Salvos</h3>
          <button onClick={loadReports} disabled={listLoading} className="flex items-center gap-1 rounded-lg border border-[#e6e2d8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6e6356] hover:bg-[#f4f1eb]">
            <RefreshCw className={`h-3 w-3 ${listLoading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-[#a19688]">Nenhum relatório gerado ainda.</p>
        ) : (
          <div className="divide-y divide-[#e6e2d8]">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <button onClick={() => openReport(r.id)} className="flex-1 text-left">
                  <p className="text-sm font-medium text-[#3c352d] hover:text-[#8c6239]">{r.client_name}</p>
                  <p className="text-[11px] text-[#8c7f70]">
                    {r.client_email || "—"} · {r.target_user_id ? "app" : "externo"} · {new Date(r.created_at).toLocaleString("pt-BR")}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded bg-[#ede9de] px-2 py-1 text-[9px] uppercase tracking-wider text-[#6e6356] sm:block">{r.source}</span>
                  <button onClick={() => deleteReport(r.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VedicReportPanel;
