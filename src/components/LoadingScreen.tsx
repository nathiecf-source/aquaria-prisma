import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";

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

        {/* Central logo */}
        <div className="relative z-10">
          <img
            src="/logo.png"
            alt="AQUAR.IA"
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Orbiting star */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full flex items-start justify-center"
        >
          <Star className="w-3.5 h-3.5 text-[#8c6239] -mt-1.5" />
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
