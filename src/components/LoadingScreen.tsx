import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Sparkles } from "lucide-react";

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  const loadingSteps = [
    "Mapeando coordenadas planetárias...",
    "Cruzando diretrizes de força sideral...",
    "Sincronizando Dinâmica Psíquica e Estrutural da Alma...",
    "Calculando períodos planetários (Dashas)...",
    "Estruturando os 7 caminhos com o Gemini API...",
    "Sintetizando autoconhecimento evolutivo...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-lg mx-auto text-center px-4">
      {/* Astrological circle spinner details */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-8">
        {/* Outer orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-dashed border-[#8c7f70]/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border border-dotted border-[#8c6239]/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 border border-[#5c4d66]/15 rounded-full"
        />

        {/* Inner rotating compass */}
        <div className="p-5 bg-[#f4f1eb] rounded-full shadow-[0_10px_30px_rgba(74,63,53,0.08)] border border-[#8c7f70]/10 flex items-center justify-center relative z-10">
          <Compass className="w-10 h-10 text-[#8c6239] stroke-[1.15] animate-pulse" />
        </div>

        {/* Little sparks orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full flex items-start justify-center"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#5c4d66] -mt-1.5" />
        </motion.div>
      </div>

      {/* Loading Editorial Status */}
      <div className="h-16 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif italic text-base sm:text-lg text-[#8c6239] tracking-wide"
          >
            {loadingSteps[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtitle details */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1, duration: 1 }}
        className="font-mono text-[9px] text-[#a19688] tracking-[0.25em] uppercase mt-4 block"
      >
        AQUAR.IA • Processando Matriz de Força
      </motion.span>
    </div>
  );
}
