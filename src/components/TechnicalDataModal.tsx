import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Star, Award, Map, Navigation } from "lucide-react";

interface TechnicalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

const SIGNS_ORDER = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

export default function TechnicalDataModal({
  isOpen,
  onClose,
  profile
}: TechnicalDataModalProps) {
  const [activeTab, setActiveTab] = React.useState<"tropical" | "vedic">("tropical");

  // Format decimal degree (e.g. 12.34) into DD°MM' format
  const formatDegree = (deg: number): string => {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return `${String(d).padStart(2, "0")}°${String(m).padStart(2, "0")}'`;
  };

  // Proteção contra cópia dos dados técnicos (visíveis, mas não extraíveis)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!profile) return null;

  // 1. Tropical Calculations
  const tropicalHouses = [...(profile.tropical_natal?.houses || [])].sort((a: any, b: any) => a.house - b.house);
  const tropicalPlanets = profile.tropical_natal?.planets || [];

  // 2. Vedic / Sideral Calculations
  const vedicPlanets = profile.vedic_natal?.planets || [];
  const lagnaSign = profile.vedic_specifics?.lagna || "Áries";
  const lagnaIndex = SIGNS_ORDER.indexOf(lagnaSign);

  // JHora supplies exact planetary houses; do not manufacture sidereal cusp degrees.
  const vedicHouses = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    return {
      house: houseNum,
      sign: SIGNS_ORDER[(lagnaIndex + i) % 12],
      cuspDegree: null as number | null
    };
  });

  // Helper to map Karakas dynamically
  const getKarakaLabel = (planetName: string): string => {
    const karakas = profile.vedic_specifics?.karakas;
    if (!karakas) return "—";
    if (karakas.atmakaraka === planetName) return "Atmakaraka (AK) • Alma";
    if (karakas.amatyakaraka === planetName) return "Amatyakaraka (AmK) • Caminho";
    if (karakas.darakaraka === planetName) return "Darakaraka (DK) • Parcerias";
    return "—";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            id="tech-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3c352d] z-50 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-10 pointer-events-none">
            <motion.div
              id="technical-data-modal"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-4xl bg-[#f4f1eb] text-[#3c352d] rounded-2xl border border-[#8c7f70]/20 shadow-2xl flex flex-col pointer-events-auto overflow-hidden max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#8c7f70]/10 bg-[#ede9de]/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#8c6239]/10 text-[#8c6239]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg tracking-[0.05em] uppercase text-[#4a3f35] font-light">
                      Auditoria de Dados do Mapa
                    </h2>
                    <p className="font-mono text-[9px] tracking-wider uppercase text-[#8c7f70]">
                      Transparência • Coordenadas Astrológicas Reais
                    </p>
                  </div>
                </div>

                <button
                  id="close-tech-modal"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-[#8c7f70]/10 text-[#8c7f70] transition-colors focus:outline-none"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-[#8c7f70]/15 bg-[#ede9de]/15 px-6">
                <button
                  id="tab-tropical-btn"
                  onClick={() => setActiveTab("tropical")}
                  className={`py-3 text-[11px] font-sans tracking-widest uppercase font-semibold border-b-2 transition-all mr-6 flex items-center gap-2 ${
                    activeTab === "tropical"
                      ? "border-[#8c6239] text-[#8c6239]"
                      : "border-transparent text-[#8c7f70] hover:text-[#4a3f35]"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Dinâmica Psíquica (Tropical)
                </button>
                <button
                  id="tab-vedic-btn"
                  onClick={() => setActiveTab("vedic")}
                  className={`py-3 text-[11px] font-sans tracking-widest uppercase font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "vedic"
                      ? "border-[#8c6239] text-[#8c6239]"
                      : "border-transparent text-[#8c7f70] hover:text-[#4a3f35]"
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Estrutural da Alma (Sideral Védico)
                </button>
              </div>

              {/* Content Block */}
              <div
                className="flex-grow overflow-y-auto p-6 space-y-8 select-none"
                style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
                onContextMenu={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
              >
                {activeTab === "tropical" ? (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Tropical Houses Section */}
                    <div id="tropical-houses-section" className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-[#8c7f70]/10 pb-2">
                        <Star className="w-4 h-4 text-[#8c6239]/70 shrink-0" />
                        <h3 className="font-serif text-sm tracking-wider uppercase text-[#4a3f35]">
                          Seção A: Casas Astrológicas
                        </h3>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#8c7f70]/10 bg-[#fbf9f5] shadow-inner-sm">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-[#ede9de]/45 border-b border-[#8c7f70]/10 text-[#8c7f70] font-mono uppercase text-[9px] tracking-widest">
                              <th className="py-3 px-4 font-normal">Casa</th>
                              <th className="py-3 px-4 font-normal">Signo Ocupante</th>
                              <th className="py-3 px-4 font-normal text-right">Graus Exatos da Cúspide</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#8c7f70]/5">
                            {tropicalHouses.map((houseObj: any) => (
                              <tr key={`trop-house-${houseObj.house}`} className="hover:bg-[#ede9de]/10 transition-colors">
                                <td className="py-3 px-4 font-mono font-medium text-[#8c6239]">
                                  {String(houseObj.house).padStart(2, "0")}
                                </td>
                                <td className="py-3 px-4 font-semibold text-[#4a3f35]">
                                  {houseObj.sign}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#8c7f70] font-medium">
                                  {houseObj.cuspDegree == null ? "—" : formatDegree(houseObj.cuspDegree)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tropical Planets Section */}
                    <div id="tropical-planets-section" className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-[#8c7f70]/10 pb-2">
                        <Award className="w-4 h-4 text-[#8c6239]/70 shrink-0" />
                        <h3 className="font-serif text-sm tracking-wider uppercase text-[#4a3f35]">
                          Seção B: Posicionamentos Planetários
                        </h3>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#8c7f70]/10 bg-[#fbf9f5] shadow-inner-sm">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-[#ede9de]/45 border-b border-[#8c7f70]/10 text-[#8c7f70] font-mono uppercase text-[9px] tracking-widest">
                              <th className="py-3 px-4 font-normal">Planeta / Ponto</th>
                              <th className="py-3 px-4 font-normal">Signo</th>
                              <th className="py-3 px-4 font-normal">Casa Ocupada</th>
                              <th className="py-3 px-4 font-normal text-right">Graus Exatos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#8c7f70]/5">
                            {tropicalPlanets.map((planetObj: any) => (
                              <tr key={`trop-planet-${planetObj.name}`} className="hover:bg-[#ede9de]/10 transition-colors">
                                <td className="py-3 px-4 font-semibold text-[#4a3f35] flex items-center gap-1.5">
                                  {planetObj.name}
                                  {planetObj.isRetrograde && (
                                    <span className="text-[9px] font-mono px-1 rounded bg-[#a25151]/10 text-[#a25151] font-bold">
                                      R
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-[#6b5e53]">
                                  {planetObj.sign}
                                </td>
                                <td className="py-3 px-4 text-[#6b5e53] font-mono">
                                  Casa {planetObj.house}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#8c7f70] font-medium">
                                  {formatDegree(planetObj.degree)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Vedic Houses Section */}
                    <div id="vedic-houses-section" className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-[#8c7f70]/10 pb-2">
                        <Star className="w-4 h-4 text-[#8c6239]/70 shrink-0" />
                        <h3 className="font-serif text-sm tracking-wider uppercase text-[#4a3f35]">
                          Seção A: Casas Astrológicas
                        </h3>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#8c7f70]/10 bg-[#fbf9f5] shadow-inner-sm">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-[#ede9de]/45 border-b border-[#8c7f70]/10 text-[#8c7f70] font-mono uppercase text-[9px] tracking-widest">
                              <th className="py-3 px-4 font-normal">Casa</th>
                              <th className="py-3 px-4 font-normal">Signo Sideral Ocupante</th>
                              <th className="py-3 px-4 font-normal text-right">Graus Exatos da Cúspide</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#8c7f70]/5">
                            {vedicHouses.map((houseObj) => (
                              <tr key={`vedic-house-${houseObj.house}`} className="hover:bg-[#ede9de]/10 transition-colors">
                                <td className="py-3 px-4 font-mono font-medium text-[#8c6239]">
                                  {String(houseObj.house).padStart(2, "0")}
                                </td>
                                <td className="py-3 px-4 font-semibold text-[#4a3f35] flex items-center gap-2">
                                  {houseObj.sign}
                                  {houseObj.house === 1 && (
                                    <span className="text-[8px] font-mono px-1 rounded bg-[#8c6239]/15 text-[#8c6239] font-semibold tracking-wider uppercase">
                                      Lagna / ASC
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#8c7f70] font-medium">
                                  {houseObj.cuspDegree == null ? "—" : formatDegree(houseObj.cuspDegree)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Vedic Planets Section */}
                    <div id="vedic-planets-section" className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-[#8c7f70]/10 pb-2">
                        <Award className="w-4 h-4 text-[#8c6239]/70 shrink-0" />
                        <h3 className="font-serif text-sm tracking-wider uppercase text-[#4a3f35]">
                          Seção B: Posicionamentos Planetários, Nakshatras e Karakas
                        </h3>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#8c7f70]/10 bg-[#fbf9f5] shadow-inner-sm">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-[#ede9de]/45 border-b border-[#8c7f70]/10 text-[#8c7f70] font-mono uppercase text-[9px] tracking-widest">
                              <th className="py-3 px-4 font-normal">Planeta / Ponto</th>
                              <th className="py-3 px-4 font-normal">Signo Sideral</th>
                              <th className="py-3 px-4 font-normal">Casa</th>
                              <th className="py-3 px-4 font-normal">Graus</th>
                              <th className="py-3 px-4 font-normal">Mansão Lunar (Nakshatra)</th>
                              <th className="py-3 px-4 font-normal text-right">Função de Alma (Chara Karaka)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#8c7f70]/5">
                            {vedicPlanets.map((planetObj: any) => {
                              const karakaLabel = getKarakaLabel(planetObj.name);
                              const isKaraka = karakaLabel !== "—";
                              return (
                                <tr key={`vedic-planet-${planetObj.name}`} className="hover:bg-[#ede9de]/10 transition-colors">
                                  <td className="py-3 px-4 font-semibold text-[#4a3f35] flex items-center gap-1.5 whitespace-nowrap">
                                    {planetObj.name}
                                    {planetObj.isRetrograde && (
                                      <span className="text-[9px] font-mono px-1 rounded bg-[#a25151]/10 text-[#a25151] font-bold">
                                        R
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-[#6b5e53]">
                                    {planetObj.sign}
                                  </td>
                                  <td className="py-3 px-4 text-[#6b5e53] font-mono">
                                    Casa {planetObj.house}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[#8c7f70]">
                                    {formatDegree(planetObj.degree)}
                                  </td>
                                  <td className="py-3 px-4 text-[#6b5e53] italic whitespace-nowrap">
                                    {planetObj.nakshatra} <span className="text-[10px] font-mono text-[#8c7f70] not-italic">(Pada {planetObj.pada})</span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                                    {isKaraka ? (
                                      <span className="px-2 py-0.5 rounded-full bg-[#8c6239]/10 text-[#8c6239] font-medium text-[10px]">
                                        {karakaLabel}
                                      </span>
                                    ) : (
                                      <span className="text-[#8c7f70]/40 font-light">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer details */}
              <div className="px-6 py-4 bg-[#ede9de]/30 border-t border-[#8c7f70]/10 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-[#8c7f70] tracking-wider uppercase gap-2">
                <div>
                  Calculado deterministicamente • Ayanamsha Lahiri 24°00&apos;00&quot;
                </div>
                <div>
                  AQUAR.IA PRISMA • A luz que revela sua potência original
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
