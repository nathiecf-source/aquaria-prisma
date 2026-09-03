import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Volume2, VolumeX, Edit3, Loader2, Play, RotateCcw } from "lucide-react";

export interface HouseSynthesisContext {
  texto?: string;
  tensao_evolucionaria?: string;
  integracao?: string;
  armadilha?: string;
  dom?: string;
}

interface PresencePauseCardProps {
  houseId: string;
  synthesisContext: HouseSynthesisContext;
  userId?: string | null;
  profile?: any;
}

const AUDIO_URL = "/assets/audio/background-meditation.mp3";
const TOTAL_SECONDS = 60;
const PHASE_DURATIONS = [4, 4, 4, 4];
const PHASE_LABELS = ["Inspire", "Retenha o ar", "Solte", "Retenha o ar"];
const PHASE_SCALE = [1.25, 1.25, 1, 1];

const HOUSE_FALLBACK_QUESTION: Record<number, string> = {
  1: "O que você está defendendo sobre quem você é, quando ninguém está olhando?",
  2: "A busca por segurança que surge nesta área da sua vida reflete uma necessidade real do agora ou o eco de uma antiga defesa da sua história?",
  3: "Que história mental você conta sobre si mesmo quando o silêncio chega?",
  4: "Qual parte sua ainda espera ser abrigada antes de poder descansar?",
  5: "O que ainda precisa ser jogado fora para que a criança criativa em você possa respirar?",
  6: "O ritmo do seu corpo está pedindo uma reorganização silenciosa?",
  7: "Onde você está se doando demais para manter uma paz que ainda não é sua?",
  8: "Que verdade você evita sentir, sabendo que ela o transformaria?",
  9: "Qual crença sobre a vida você herdou e ainda não questionou no silêncio?",
  10: "A realização que você persegue é sua, ou é uma forma de provar algo que ninguém mais está pedindo?",
  11: "Onde você sente que não pertence, mesmo estando rodeado de pessoas?",
  12: "Que parte da sua sombra pede para ser reconhecida, sem pressa de ser resolvida?",
};

function getHouseNumber(houseId: string): number {
  const match = houseId.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function normalizeQuestionCase(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 5) return trimmed;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  const upperLetters = letters.replace(/[^A-Z]/g, "");
  const isAllCaps = trimmed === trimmed.toUpperCase();
  const isMostlyCaps = letters.length > 0 && upperLetters.length / letters.length > 0.4;

  if (isAllCaps || isMostlyCaps) {
    const lowered = trimmed.toLowerCase();
    return lowered.charAt(0).toUpperCase() + lowered.slice(1);
  }
  return trimmed;
}

export function PresencePauseCard({ houseId, synthesisContext, userId, profile }: PresencePauseCardProps) {
  const houseNumber = getHouseNumber(houseId);

  // Extract sign and planets from the full profile for the meditation generator
  const tropical = profile?.tropical_natal;
  const houseCusp = tropical?.houses?.find((h: any) => h.house === houseNumber);
  const houseSign = houseCusp?.sign || "";
  const housePlanets = (tropical?.planets || [])
    .filter((p: any) => typeof p.house === "number" && p.house === houseNumber)
    .map((p: any) => `${p.name}${p.isRetrograde ? " (R)" : ""}${p.sign ? ` em ${p.sign}` : ""}`)
    .join(", ") || "";

  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const [question, setQuestion] = useState<string>("");
  const [meditation, setMeditation] = useState<string>("");
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);

  // Load presence question and written meditation
  useEffect(() => {
    let cancelled = false;
    setLoadingQuestion(true);
    setQuestion("");
    setMeditation("");

    fetch("/api/house-presence-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        houseId,
        synthesisContext,
        houseNumber,
        houseSign,
        housePlanets,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
      .then((data) => {
        if (cancelled) return;
        if (data?.question) {
          setQuestion(normalizeQuestionCase(data.question));
        } else {
          throw new Error("Resposta sem pergunta");
        }
        if (data?.meditation) {
          setMeditation(data.meditation);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[PresencePauseCard] Fallback para pergunta estática:", err);
        setQuestion(normalizeQuestionCase(HOUSE_FALLBACK_QUESTION[houseNumber] || HOUSE_FALLBACK_QUESTION[1]));
        setMeditation("");
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestion(false);
      });

    return () => {
      cancelled = true;
    };
  }, [houseId, synthesisContext, userId, houseNumber, houseSign, housePlanets]);

  // Audio element
  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.volume = 0.7;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [soundOn]);

  // Attenuate audio when sheet opens
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = sheetOpen ? 0.12 : 0.7;
  }, [sheetOpen]);

  // Breathing timer
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = () => {
      const now = performance.now();
      const nextElapsed = Math.min((now - start) / 1000, TOTAL_SECONDS);
      setElapsed(nextElapsed);
      if (nextElapsed >= TOTAL_SECONDS) {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setRunning(false);
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [running]);

  const { phaseIndex, phaseProgress, phaseLabel } = useMemo(() => {
    const cycleDuration = PHASE_DURATIONS.reduce((a, b) => a + b, 0);
    const cycleElapsed = elapsed % cycleDuration;
    let cumulative = 0;
    let idx = 0;
    for (let i = 0; i < PHASE_DURATIONS.length; i++) {
      if (cycleElapsed < cumulative + PHASE_DURATIONS[i]) {
        idx = i;
        break;
      }
      cumulative += PHASE_DURATIONS[i];
    }
    const progress = Math.min(1, Math.max(0, (cycleElapsed - cumulative) / PHASE_DURATIONS[idx]));
    return {
      phaseIndex: idx,
      phaseProgress: progress,
      phaseLabel: elapsed >= TOTAL_SECONDS ? "Concluído" : PHASE_LABELS[idx],
    };
  }, [elapsed]);

  const scale = useMemo(() => {
    const from = PHASE_SCALE[phaseIndex];
    const to = PHASE_SCALE[(phaseIndex + 1) % PHASE_SCALE.length];
    return from + (to - from) * phaseProgress;
  }, [phaseIndex, phaseProgress]);

  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => !prev);
  }, []);

  return (
    <div className="mt-10 rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-serif text-sm sm:text-base tracking-[0.2em] uppercase text-[#3c352d]">
            <span className="mr-1.5">✦</span>
            Pausa de Presença — Casa {houseNumber}
          </h3>
          <p className="font-sans text-[10px] text-[#8c7f70] mt-1 leading-relaxed">
            60 segundos de respiração e observação.
          </p>
        </div>
        <button
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-sans tracking-wider uppercase transition-colors border ${
            soundOn
              ? "bg-[#5c4d66]/10 text-[#5c4d66] border-[#5c4d66]/20"
              : "bg-[#ede9de]/60 text-[#8c7f70] border-[#8c7f70]/15 hover:border-[#8c7f70]/30"
          }`}
          aria-label={soundOn ? "Desligar som de fundo" : "Ligar som de fundo"}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Som de Fundo</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div
          className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#e8e2dc"
              strokeWidth="1.5"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#a8a29e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={289.5}
              strokeDashoffset={289.5 * (1 - elapsed / TOTAL_SECONDS)}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <div className="text-center z-10">
            <p className="font-mono text-xs sm:text-sm tracking-widest text-[#5c4d66]">
              {formatTime(remaining)}
            </p>
            <p className="font-sans text-[9px] sm:text-[10px] tracking-[0.05em] text-[#8c7f70] mt-1">
              {phaseLabel}
            </p>
          </div>
        </div>

        {!running && (
          <button
            onClick={() => {
              if (elapsed >= TOTAL_SECONDS) {
                setElapsed(0);
              }
              setRunning(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5c4d66] text-white font-sans text-xs font-medium tracking-wide hover:bg-[#4a3f53] transition-colors"
          >
            {elapsed >= TOTAL_SECONDS ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Recomeçar
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Iniciar respiração
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <h4 className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66] mb-2">
            Presença & Respiração
          </h4>
          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
            Desacelere o ritmo do pensamento. Inspire profundamente, sinta a pausa no topo da
            respiração e solte o ar lentamente, abrindo espaço para a observação neutra.
          </p>
        </div>

        {meditation && (
          <div>
            <h4 className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66] mb-2">
              Sugestão de Meditação
            </h4>
            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light italic normal-case whitespace-pre-line">
              {meditation}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66] mb-2">
            Pergunta de Presença
          </h4>
          {loadingQuestion ? (
            <div className="flex items-center gap-2 text-[#8c7f70]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="font-sans text-xs italic">Buscando a indagação desta casa...</span>
            </div>
          ) : (
            <p className="font-serif text-sm sm:text-base text-[#3c352d] leading-relaxed italic normal-case">
              “{question}”
            </p>
          )}
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          disabled={!question || loadingQuestion}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#8c6239]/30 bg-[#8c6239]/10 text-[#8c6239] font-sans text-xs tracking-[0.1em] uppercase hover:bg-[#8c6239]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Registre suas percepções
        </button>
      </div>

      <PresenceJournalSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        houseId={houseId}
        houseNumber={houseNumber}
        userId={userId}
        question={question}
      />
    </div>
  );
}

interface PresenceJournalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  houseId: string;
  houseNumber: number;
  userId?: string | null;
  question: string;
}

function PresenceJournalSheet({
  isOpen,
  onClose,
  houseId,
  houseNumber,
  userId,
  question,
}: PresenceJournalSheetProps) {
  const [text, setText] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load previous insight for this house
  useEffect(() => {
    if (!isOpen) {
      setInitialLoaded(true);
      return;
    }
    setInitialLoaded(false);
    if (!userId) {
      setText("");
      setInitialLoaded(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
      return;
    }
    fetch(`/api/house-insight?userId=${encodeURIComponent(userId)}&houseId=${encodeURIComponent(houseId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setText(data?.insight?.insight_text || "");
      })
      .catch(() => {
        setText("");
      })
      .finally(() => {
        setInitialLoaded(true);
        setTimeout(() => textareaRef.current?.focus(), 100);
      });
  }, [isOpen, houseId, userId]);

  const saveInsight = useCallback(async () => {
    if (!userId) return;
    setSaveStatus("saving");
    try {
      await fetch("/api/house-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, houseId, insightText: text }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[PresenceJournalSheet] Erro ao salvar:", err);
      setSaveStatus("idle");
    }
  }, [userId, houseId, text]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[#3c352d]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#f4f1eb] rounded-t-2xl shadow-[0_-10px_40px_rgba(74,63,53,0.18)] border-t border-[#8c7f70]/15 flex flex-col max-h-[85vh] sm:max-h-[600px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#8c7f70]/10">
          <div>
            <h3 className="font-serif text-sm tracking-[0.2em] uppercase text-[#3c352d]">
              Meu Diário Alquímico
            </h3>
            <p className="font-sans text-[10px] text-[#8c7f70] mt-0.5">
              Casa {houseNumber} — Pausa de Presença
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#8c7f70]/10 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
            aria-label="Fechar"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-lg border border-[#5c4d66]/10 bg-[#5c4d66]/5 p-4">
            <p className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66] mb-1.5">
              Pergunta de Presença
            </p>
            <p className="font-serif text-sm text-[#3c352d] italic leading-relaxed normal-case">
              “{question}”
            </p>
          </div>

          {!initialLoaded ? (
            <div className="py-8 flex items-center justify-center text-[#8c7f70]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="font-sans text-xs">Carregando registro anterior...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="O que se fez claro ao pausar e respirar nesta pergunta?"
              className="w-full min-h-[180px] p-4 rounded-lg border border-[#8c7f70]/15 bg-white/60 font-sans text-sm text-[#4a3f35] leading-relaxed placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30 transition-colors"
            />
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#8c7f70]/10 flex items-center justify-between">
          <div className="text-[10px] font-sans text-[#8c7f70]">
            {saveStatus === "saving" && <span>Salvando...</span>}
            {saveStatus === "saved" && <span className="text-emerald-700/80">Salvo ✓</span>}
            {saveStatus === "idle" && <span>&nbsp;</span>}
          </div>
          <button
            onClick={() => {
              saveInsight().then(() => onClose());
            }}
            disabled={!initialLoaded || saveStatus === "saving"}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5c4d66] to-[#8c6239] text-white font-sans text-xs font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </>
  );
}
