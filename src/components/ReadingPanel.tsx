import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, BookOpen, Compass, ShieldAlert, Loader2 } from "lucide-react";
import { ReadingData } from "../data/mockReadings";
import { PaywallBarrier } from "./PaywallBarrier";

interface ReadingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReadingData | null;
  isLoading?: boolean;
  subscriptionTier: "FREE" | "PLUS";
  userId: string;
  userEmail: string;
  fullName: string;
  onUpgradeSuccess: () => void;
}

const ASTRO_TERMS = [
  "Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão",
  "Nodo Norte", "Nodo Sul", "Rahu", "Ketu",
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
  "Casa 10", "Casa 11", "Casa 12", "Casa 1", "Casa 2", "Casa 3", "Casa 4", "Casa 5", "Casa 6", "Casa 7", "Casa 8", "Casa 9",
  "Ascendente", "Meio do Céu", "Fundo do Céu", "Descendente", "Dusthanas",
  "Atmakaraka", "Amatyakaraka", "Darakaraka", "Janma Nakshatra", "Nakshatra", "Upapada Lagna", "Dhana Yogas", "D10 Dasamsa", "Lagna", "Lagnesha",
  "Ashvini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
].sort((a, b) => b.length - a.length);

const AstrologicalSourceFooter: React.FC<{ source: string }> = ({ source }) => {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract individual concepts from the source string
  const termRegex = new RegExp(ASTRO_TERMS.join('|'), 'gi');
  const matchedTerms = Array.from(new Set(
    (source.match(termRegex) || []).map(t => {
      // Normalize capitalization to match our list
      const exactMatch = ASTRO_TERMS.find(term => term.toLowerCase() === t.toLowerCase());
      return exactMatch || t;
    })
  ));

  const handleFragmentClick = async (fragment: string) => {
    if (activeTerm === fragment) {
      setActiveTerm(null);
      setDefinition(null);
      return;
    }

    setActiveTerm(fragment);
    setIsLoading(true);
    setDefinition(null);

    try {
      const response = await fetch("/api/generate-glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: fragment })
      });
      const data = await response.json();
      if (data.definition) {
        setDefinition(data.definition);
      } else {
        setDefinition("Não foi possível gerar a definição.");
      }
    } catch (error) {
      console.error(error);
      setDefinition("Erro ao carregar o glossário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-8 sm:px-12 py-6 bg-[#ede9de]/40 border-t border-[#8c7f70]/10 text-center relative">
      <div className="flex flex-wrap justify-center gap-3">
        {matchedTerms.map((fragment, idx) => (
          <button
            key={idx}
            onClick={() => handleFragmentClick(fragment)}
            className={`font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all border cursor-pointer ${activeTerm === fragment ? 'bg-[#8c6239] text-[#f4f1eb] border-[#8c6239]' : 'bg-transparent text-[#a19688] hover:text-[#8c6239] border-[#a19688]/30 hover:border-[#8c6239]/50'}`}
          >
            {fragment}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeTerm && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 right-0 mx-auto w-full max-w-sm mb-4 bg-[#f4f1eb] border border-[#8c7f70]/20 rounded-lg p-5 shadow-xl text-left z-20"
          >
            <div className="flex justify-between items-start mb-3 border-b border-[#8c7f70]/10 pb-2">
              <h4 className="font-serif text-[#3c352d] text-sm uppercase tracking-wider">
                Glossário Filosófico
              </h4>
              <button onClick={() => setActiveTerm(null)} className="text-[#8c7f70] hover:text-[#3c352d] p-1 rounded-full hover:bg-[#8c7f70]/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-[#8c6239] animate-spin" />
              </div>
            ) : (
              <div className="font-sans text-xs text-[#5c544d] leading-relaxed">
                {definition?.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            )}
            
            {/* Triangle pointing down */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#f4f1eb] border-b border-r border-[#8c7f70]/20 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReadingPanel({
  isOpen,
  onClose,
  data,
  isLoading,
  subscriptionTier,
  userId,
  userEmail,
  fullName,
  onUpgradeSuccess
}: ReadingPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"tropical" | "vedic" | "sintese">("tropical");

  React.useEffect(() => {
    setActiveTab("tropical");
  }, [data?.id]);

  return (
    <AnimatePresence>
      {isOpen && data && (
        <>
          {/* Backdrop Overlay for mobile screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3c352d] z-40 lg:hidden"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            id="reading-drawer"
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] md:w-[520px] lg:w-[42vw] lg:max-w-2xl bg-[#f4f1eb]/98 backdrop-blur-md z-50 shadow-[-15px_0_45px_rgba(74,63,53,0.14)] border-l border-[#8c7f70]/15 flex flex-col"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-8 sm:px-12 py-6 border-b border-[#8c7f70]/10">
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8c7f70] font-semibold">
                {data.id.startsWith("casa-") ? "Casa Astrológica • Análise Alquímica" : "Diretrizes de Força • Análise Individual"}
              </span>
              <button
                id="close-drawer-button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#8c7f70]/10 text-[#8c7f70] hover:text-[#5c4d66] transition-colors focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            {/* Tabs Selector (Only for houses) */}
            {data.id.startsWith("casa-") && !isLoading && (
              <div className="flex border-b border-[#8c7f70]/10 bg-[#ede9de]/20 px-8 sm:px-12">
                <button
                  onClick={() => setActiveTab("tropical")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
                    activeTab === "tropical"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Dinâmica Psíquica
                </button>
                <button
                  onClick={() => setActiveTab("vedic")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
                    activeTab === "vedic"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Estrutural da Alma (Sideral)
                </button>
                <button
                  onClick={() => setActiveTab("sintese")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "sintese"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Síntese
                </button>
              </div>
            )}

            {/* Scrollable Content Container */}
            <div className="flex-grow overflow-y-auto px-8 py-10 sm:px-12 sm:py-12">
              {isLoading ? (
                /* Premium Skeleton Loader */
                <div className="space-y-8 animate-pulse">
                  <div>
                    <div className="h-7 bg-[#8c7f70]/20 rounded-md w-3/4 mb-3" />
                    <div className="h-4 bg-[#8c7f70]/10 rounded-md w-1/2" />
                  </div>
                  <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                    <div className="h-4 bg-[#8c7f70]/15 rounded-md w-5/6" />
                  </div>
                  <div className="space-y-6">
                    <div className="pl-4 border-l border-[#8c6239]/20 space-y-2">
                      <div className="h-3 bg-[#8c6239]/20 rounded w-1/4" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-full" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-5/6" />
                    </div>
                    <div className="pl-4 border-l border-[#5c4d66]/20 space-y-2">
                      <div className="h-3 bg-[#5c4d66]/20 rounded w-1/4" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-full" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  key={`${data.id}-${activeTab}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Title Section */}
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-[0.15em] uppercase text-[#3c352d] leading-snug">
                      {data.title}
                    </h2>
                    <p className="mt-2 font-serif italic text-xs sm:text-sm text-[#8c6239] leading-relaxed">
                      {data.isVetorReading
                        ? data.energySubtitle
                        : data.isHouseReading && activeTab === "tropical" && data.tropical?.resumo_basico
                        ? data.tropical.resumo_basico
                        : data.energySubtitle}
                    </p>
                  </div>

                  {/* Custom Vetor de Força or Moon Reading or 3-Tab Layout for Houses */}
                  {data.isMoonReading ? (
                    <div className="space-y-6">
                      <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                        <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                          Lua de Nascimento — Destaque
                        </span>
                        <p className="font-sans text-xs sm:text-[14px] font-medium tracking-[0.05em] uppercase text-[#4a3f35] leading-relaxed">
                          {data.moonBirthTitle}
                        </p>
                      </div>

                      <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                        <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                          Missão e Vetor de Propósito
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                          {data.moonBirthAnalysis}
                        </p>
                      </div>

                      {data.moonGlossary && data.moonGlossary.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[#8c7f70]/15 space-y-4">
                          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239] block mb-3">
                            Glossário das Fases Complementares (Referência)
                          </span>
                          <div className="space-y-3">
                            {data.moonGlossary.map((g: any, index: number) => (
                              <div key={index} className="p-3 bg-[#ede9de]/30 rounded-lg border border-[#8c7f70]/10 flex flex-col gap-1">
                                <span className="font-sans text-xs font-semibold text-[#8c6239]">
                                  • Lua {g.phase}
                                </span>
                                <p className="font-sans text-[11px] sm:text-xs text-[#5c4d66] leading-relaxed font-light">
                                  {g.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : data.isVetorReading ? (
                    <div className="space-y-6">
                      <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                        <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                          Diretriz de Força — {data.vetorType === "domínio" ? "Domínio Ativo" : "Potencial de Desenvolvimento"}
                        </span>
                        <p className="font-sans text-xs sm:text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                          {data.vetorTitle}
                        </p>
                      </div>

                      <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                        <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                          Análise Alquímica Editorial
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                          {data.vetorAnalysis}
                        </p>
                      </div>

                      <div className="p-4 bg-[#ede9de]/30 rounded-lg border border-[#8c7f70]/15 mt-4 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#8c6239] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#6e6356] font-sans font-light leading-relaxed">
                          Esta diretriz de força revela o fluxo de energia sutil no seu mapa natal. A contagem revela <strong>{data.vetorScore} {data.vetorScore === 1 ? "planeta/ponto" : "planetas/pontos"}</strong> nesta diretriz de força.
                        </p>
                      </div>
                    </div>
                  ) : data.id.startsWith("casa-") ? (
                    <>
                      {activeTab === "tropical" && (
                        <div className="space-y-6">
                          <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                              Foco Comportamental
                            </span>
                            <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                              {data.anchorPhrase}
                            </p>
                          </div>

                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              Leitura Psicológica e Dinâmica do Regente
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {data.isHouseReading && data.tropical?.leitura_psicologica
                                ? data.tropical.leitura_psicologica
                                : "Com base no signo presente na cúspide desta casa, há uma coloração psicológica singular que molda como você se expressa. Rastreando o regente desta casa, sua posição no mapa direciona o foco da sua energia vital."}
                            </p>
                          </div>
                          
                          {!data.isHouseReading && (
                            <div className="p-4 bg-[#ede9de]/30 rounded-lg border border-[#8c7f70]/15 mt-4 flex items-start gap-2.5">
                              <ShieldAlert className="w-4 h-4 text-[#8c6239] shrink-0 mt-0.5" />
                              <p className="text-[11px] text-[#6e6356] font-sans font-light leading-relaxed">
                                <strong>Análise de Fallback Ativa:</strong> A chave de API do Gemini ainda não gerou ou falhou em preencher a leitura profunda do regente para este mapa específico.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "vedic" && (
                        <PaywallBarrier
                          subscriptionTier={subscriptionTier}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title="Ancoragem de Alma Sideral"
                          description="Desbloqueie a análise estrutural evolutiva da alma védica sideral sob os Drishtis e Dusthanas."
                        >
                          <div className="space-y-6">
                            <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                              <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#5c4d66] block mb-1">
                                Foco Estrutural
                              </span>
                              <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                                O PROPÓSITO INICIÁTICO E A ANCORAGEM DE ALMA NESTE SETOR
                              </p>
                            </div>

                            <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-2">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                                Leitura Estrutural da Alma
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                {data.isHouseReading && data.vedic?.leitura_karmica
                                  ? data.vedic.leitura_karmica
                                  : "A Dinâmica Estrutural da Alma analisa este setor sob o prisma do karma de evolução pessoal. A força sutil presente aqui serve como um ponto de ancoragem e propósito."}
                              </p>
                            </div>

                            <div className="relative pl-4 border-l border-[#8c7f70]/20 space-y-2">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c7f70]">
                                Qualidades Estruturais e Influências (Drishtis)
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                {data.isHouseReading && data.vedic?.qualidades_e_drishtis
                                  ? data.vedic.qualidades_e_drishtis
                                  : "Esta casa possui uma função de sustentação evolutiva. Não há condenações ou punições; mesmo as áreas de maior regeneração (Dusthanas) operam como verdadeiros laboratórios de cura e poder oculto sob as influências energéticas que as cercam."}
                              </p>
                            </div>
                          </div>
                        </PaywallBarrier>
                      )}

                      {activeTab === "sintese" && (
                        <PaywallBarrier
                          subscriptionTier={subscriptionTier}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title="Síntese Alquímica Integrativa"
                          description="Acesse o fechamento alquímico unificado da casa, mapeando as tensões, maya e dons integrados."
                        >
                          <div className="space-y-6">
                            <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                              <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                                Alquimia Integrativa
                              </span>
                              <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                                {data.isHouseReading && data.sintese?.pedido_integracao
                                  ? data.sintese.pedido_integracao
                                  : `Pedido de coerência: ${data.anchorPhrase}`}
                              </p>
                            </div>

                            {/* Bloco 1: A tensão evolucionária */}
                            <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                                A Tensão Evolucionária / Força Consolidada
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.isHouseReading && data.sintese?.tensao_evolucionaria
                                  ? data.sintese.tensao_evolucionaria
                                  : data.evolutionaryTension}
                              </p>
                            </div>

                            {/* Bloco 2: A integração */}
                            <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                                A Integração de Força
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.isHouseReading && data.sintese?.integracao
                                  ? data.sintese.integracao
                                  : data.integration}
                              </p>
                            </div>

                            {/* Bloco 3: A armadilha */}
                            <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                                A Armadilha Psíquica (Maya)
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.isHouseReading && data.sintese?.armadilha
                                  ? data.sintese.armadilha
                                  : data.trap}
                              </p>
                            </div>

                            {/* Bloco 4: O dom */}
                            <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                                O Dom Manifestado
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.isHouseReading && data.sintese?.dom
                                  ? data.sintese.dom
                                  : data.gift}
                              </p>
                            </div>
                          </div>
                        </PaywallBarrier>
                      )}
                    </>
                  ) : data.id.startsWith("caminho-") ? (
                    /* Locked Caminhos Layout */
                    <PaywallBarrier
                      subscriptionTier={subscriptionTier}
                      userId={userId}
                      userEmail={userEmail}
                      fullName={fullName}
                      onUpgradeSuccess={onUpgradeSuccess}
                      title="Caminhos Ocultos Bloqueados"
                      description="Desbloqueie a análise do fluxo energético sutil dos Caminhos da Assimilação, Transformação e Manifestação."
                    >
                      <div className="space-y-6">
                        {/* Anchor Phrase */}
                        <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                          <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                            Propósito do Caminho
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                            {data.anchorPhrase}
                          </p>
                        </div>

                        {/* Body Blocks - Editorial style */}
                        <div className="space-y-6">
                          {/* Bloco 1: A tensão evolucionária */}
                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              A Tensão Evolucionária
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.evolutionaryTension}
                            </p>
                          </div>

                          {/* Bloco 2: A integração */}
                          <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                              A Integração de Força
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.integration}
                            </p>
                          </div>

                          {/* Bloco 3: A armadilha */}
                          <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                              A Armadilha Psíquica
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.trap}
                            </p>
                          </div>

                          {/* Bloco 4: O dom */}
                          <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                              O Dom Manifestado
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.gift}
                            </p>
                          </div>
                        </div>
                      </div>
                    </PaywallBarrier>
                  ) : (
                    /* Classic Single-Tab Layout for Eixos / Other Points (FREE/PLUS with granular logic) */
                    <>
                      {/* Anchor Phrase */}
                      <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                        <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                          Propósito Geral
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                          {data.anchorPhrase}
                        </p>
                      </div>

                      {/* Body Blocks - Editorial style */}
                      {(data.id === "eixo-ic" || data.id === "eixo-mc") ? (
                        <PaywallBarrier
                          subscriptionTier={subscriptionTier}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title={`${data.title} Bloqueado`}
                          description={`Desbloqueie a análise estrutural evolutiva profunda do seu ${data.title} no portal PLUS.`}
                        >
                          <div className="space-y-6">
                            {/* Bloco 1: A tensão evolucionária */}
                            <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                                A Tensão Evolucionária
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.evolutionaryTension}
                              </p>
                            </div>

                            {/* Bloco 2: A integração */}
                            <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                                A Integração de Força
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.integration}
                              </p>
                            </div>

                            {/* Bloco 3: A armadilha */}
                            <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                                A Armadilha Psíquica
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.trap}
                              </p>
                            </div>

                            {/* Bloco 4: O dom */}
                            <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                                O Dom Manifestado
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.gift}
                              </p>
                            </div>
                          </div>
                        </PaywallBarrier>
                      ) : (
                        <div className="space-y-6">
                          {/* Bloco 1: A tensão evolucionária */}
                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              A Tensão Evolucionária
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.evolutionaryTension}
                            </p>
                          </div>

                          {/* Bloco 2: A integração */}
                          <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                              A Integração de Força
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.integration}
                            </p>
                          </div>

                          {/* Bloco 3: A armadilha */}
                          <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                              A Armadilha Psíquica
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.trap}
                            </p>
                          </div>

                          {/* Bloco 4: O dom */}
                          <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                              O Dom Manifestado
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.gift}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer with Technical Validation */}
            {(data.astrologicalSource || data.fonte_astrologica) && <AstrologicalSourceFooter source={data.astrologicalSource || data.fonte_astrologica || ""} />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
