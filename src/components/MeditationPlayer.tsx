import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Download, Volume2, VolumeX } from "lucide-react";

interface MeditationPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  userId?: string;
  pathId?: string;
  title?: string;
  gender?: "masculino" | "feminino";
  genderPreference?: "feminino" | "masculino" | "neutro_estrutural" | "neutro_direto";
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Configuração do temporizador de respiração (60s, igual ao PresencePauseCard das casas)
const BREATH_TOTAL_SECONDS = 60;
const BREATH_PHASE_DURATIONS = [4, 4, 4, 4];
const BREATH_PHASE_LABELS = ["Inspire", "Retenha o ar", "Solte", "Retenha o ar"];
const BREATH_PHASE_SCALE = [1.25, 1.25, 1, 1];
const BACKGROUND_AUDIO_URL = "/assets/audio/background-meditation.mp3";

export function MeditationPlayer({ audioUrl, isLoading, onGenerate, userId, pathId, title, gender, genderPreference }: MeditationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const effectiveGender = genderPreference === "neutro_estrutural" || genderPreference === "neutro_direto"
    ? "neutro"
    : (gender === "feminino" ? "feminino" : "masculino");
  const desaceleradx = effectiveGender === "feminino" ? "desacelerada" : effectiveGender === "masculino" ? "desacelerado" : "desacelerade";

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Música de fundo durante o carregamento
  const [soundOn, setSoundOn] = useState(true);

  // Timer de respiração (sempre 60s, independente do carregamento do áudio)
  const [elapsed, setElapsed] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [skippedToPlayer, setSkippedToPlayer] = useState(false);

  // Barra de progresso simulada durante a geração
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // Áudio de fundo
  useEffect(() => {
    const audio = new Audio(BACKGROUND_AUDIO_URL);
    audio.loop = true;
    audio.volume = 0.7;
    backgroundAudioRef.current = audio;

    return () => {
      audio.pause();
      backgroundAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = backgroundAudioRef.current;
    if (!audio) return;
    if (isLoading && soundOn && !skippedToPlayer) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isLoading, soundOn, skippedToPlayer]);

  // Inicia/reset timer e progresso quando entra em carregamento
  useEffect(() => {
    if (isLoading) {
      setElapsed(0);
      setLoadingProgress(0);
      setTimerStarted(true);
      setTimerFinished(false);
      setSkippedToPlayer(false);
    }
  }, [isLoading]);

  // Timer de respiração com requestAnimationFrame — sempre 60s
  useEffect(() => {
    if (!timerStarted || timerFinished) return;

    const start = performance.now();
    const tick = () => {
      const now = performance.now();
      const nextElapsed = Math.min((now - start) / 1000, BREATH_TOTAL_SECONDS);
      setElapsed(nextElapsed);
      if (nextElapsed >= BREATH_TOTAL_SECONDS) {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setTimerFinished(true);
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [timerStarted, timerFinished]);

  const { phaseIndex, phaseProgress, phaseLabel } = useMemo(() => {
    const cycleDuration = BREATH_PHASE_DURATIONS.reduce((a, b) => a + b, 0);
    const cycleElapsed = elapsed % cycleDuration;
    let cumulative = 0;
    let idx = 0;
    for (let i = 0; i < BREATH_PHASE_DURATIONS.length; i++) {
      if (cycleElapsed < cumulative + BREATH_PHASE_DURATIONS[i]) {
        idx = i;
        break;
      }
      cumulative += BREATH_PHASE_DURATIONS[i];
    }
    const progress = Math.min(1, Math.max(0, (cycleElapsed - cumulative) / BREATH_PHASE_DURATIONS[idx]));
    return {
      phaseIndex: idx,
      phaseProgress: progress,
      phaseLabel: elapsed >= BREATH_TOTAL_SECONDS ? "Concluído" : BREATH_PHASE_LABELS[idx],
    };
  }, [elapsed]);

  const scale = useMemo(() => {
    const from = BREATH_PHASE_SCALE[phaseIndex];
    const to = BREATH_PHASE_SCALE[(phaseIndex + 1) % BREATH_PHASE_SCALE.length];
    return from + (to - from) * phaseProgress;
  }, [phaseIndex, phaseProgress]);

  const remaining = Math.max(0, BREATH_TOTAL_SECONDS - elapsed);

  // Barra de progresso simulada
  useEffect(() => {
    if (!isLoading) return;

    const interval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) return 95;
        let step = 0.6;
        if (prev > 70) step = 0.15;
        else if (prev > 45) step = 0.3;
        else if (prev > 25) step = 0.5;
        return Math.min(95, prev + step);
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  // Completa a barra quando o áudio chega
  useEffect(() => {
    if (!isLoading && audioUrl) {
      setLoadingProgress(100);
    }
  }, [isLoading, audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleDownload = useCallback(async () => {
    if (!userId || !pathId || !audioUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/meditation/download?userId=${encodeURIComponent(userId)}&pathId=${encodeURIComponent(pathId)}`);
      if (!res.ok) {
        throw new Error(`Erro ${res.status}`);
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const match = contentDisposition.match(/filename[^;\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = match?.[1]?.replace(/['"]/g, "") || `meditacao-${(title || pathId).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp3`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("[MeditationPlayer] Erro ao baixar:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [audioUrl, userId, pathId, title]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const isPlayerVisible = !!audioUrl && (timerFinished || skippedToPlayer);
  const isTimerVisible = !isPlayerVisible && (isLoading || (timerStarted && !timerFinished));
  const isButtonVisible = !isPlayerVisible && !isTimerVisible;

  const handleSkip = useCallback(() => {
    setSkippedToPlayer(true);
    setTimerFinished(true);
  }, []);

  // Estado: sem áudio e não carregando → botão de gerar
  if (isButtonVisible) {
    return (
      <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5 text-center">
        <p className="font-sans text-[11px] tracking-[0.1em] uppercase text-[#8c7f70] mb-3">
          Meditação Alquímica Guiada
        </p>
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5c4d66] to-[#8c6239] text-white font-sans text-xs font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          Gerar Meditação
        </button>
      </div>
    );
  }

  // Estado: timer de respiração + música de fundo + barra de progresso
  if (isTimerVisible) {
    const showPreparing = isLoading && timerFinished;
    const canSkip = !!audioUrl && !timerFinished && !skippedToPlayer;

    return (
      <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-serif text-sm sm:text-base tracking-[0.2em] uppercase text-[#3c352d]">
              <span className="mr-1.5">✦</span>
              Meditação Alquímica Guiada
            </h3>
            <p className="font-sans text-[10px] text-[#8c7f70] mt-1 leading-relaxed">
              comece regulando sua respiração enquanto seu áudio é carregado
            </p>
          </div>
          <button
            onClick={() => setSoundOn((prev) => !prev)}
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

        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div
            className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full"
            style={{ transform: `scale(${scale})` }}
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
                strokeDashoffset={289.5 * (1 - elapsed / BREATH_TOTAL_SECONDS)}
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

          {showPreparing ? (
            <div className="flex items-center gap-2 text-[#5c4d66]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-sans text-xs">Preparando áudio...</span>
            </div>
          ) : canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#5c4d66]/10 text-[#5c4d66] border border-[#5c4d66]/20 font-sans text-xs tracking-wide hover:bg-[#5c4d66]/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8c6239]" />
              pular respiração, já estou {desaceleradx}
            </button>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-[#e8e2dc] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#5c4d66] to-[#8c6239] transition-[width] duration-200"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="font-sans text-[10px] text-[#8c7f70] text-center">
            {Math.round(loadingProgress)}% carregado
          </p>
        </div>
      </div>
    );
  }

  // Estado: player ativo
  return (
    <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-5">
      <p className="font-sans text-[11px] tracking-[0.1em] uppercase text-[#8c7f70] mb-4 text-center">
        Meditação Alquímica Guiada
      </p>

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#5c4d66] to-[#8c6239] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div
            className="h-1.5 rounded-full bg-[#e8e2dc] cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#5c4d66] to-[#b8860b]/70 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-[10px] text-[#8c7f70]">{formatTime(currentTime)}</span>
            <span className="font-sans text-[10px] text-[#8c7f70]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-[#8c7f70]/10 text-[#5c4d66] flex items-center justify-center hover:bg-[#8c7f70]/20 transition-colors disabled:opacity-50"
          aria-label="Baixar meditação"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
