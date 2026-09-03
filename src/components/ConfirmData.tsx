import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, ArrowLeft, User, Calendar, Clock, MapPin, Sparkles, FileText } from "lucide-react";

interface ConfirmDataProps {
  name: string;
  genderPreferenceLabel: string;
  birthDate: string;
  birthTime: string;
  birthPlaceName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading: boolean;
}

export default function ConfirmData({
  name,
  genderPreferenceLabel,
  birthDate,
  birthTime,
  birthPlaceName,
  latitude,
  longitude,
  timezone,
  onConfirm,
  onEdit,
  isLoading,
}: ConfirmDataProps) {
  const formatDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const alreadyAccepted = localStorage.getItem("aquaria_terms_accepted") === "true";
    setAcceptedTerms(alreadyAccepted);
  }, []);

  const handleConfirm = () => {
    if (!acceptedTerms) return;
    localStorage.setItem("aquaria_terms_accepted", "true");
    onConfirm();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto bg-[#f4f1eb]/95 border border-[#8c7f70]/15 rounded-2xl shadow-[0_20px_50px_rgba(74,63,53,0.12)] p-8 sm:p-10 relative overflow-hidden backdrop-blur-md"
    >
      <div className="text-center mb-8 relative z-10">
        <img
          src="/logo.png"
          alt="AQUAR.IA"
          className="w-12 h-12 object-contain mb-4 mx-auto"
        />
        <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.1em] text-[#3c352d] uppercase">
          Confirme seus dados
        </h1>
        <p className="mt-2 font-serif italic text-sm text-[#8c7f70]">
          Revise com atenção antes de gerar sua matriz astrológica integral.
        </p>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-start gap-3 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl">
          <User className="w-4 h-4 text-[#8c6239] mt-0.5 shrink-0" />
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">Nome completo</p>
            <p className="font-sans text-sm text-[#3c352d] leading-relaxed">{name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl">
          <Sparkles className="w-4 h-4 text-[#8c6239] mt-0.5 shrink-0" />
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">Como gosta de ser chamado</p>
            <p className="font-sans text-sm text-[#3c352d] leading-relaxed">{genderPreferenceLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl">
            <Calendar className="w-4 h-4 text-[#8c6239] mt-0.5 shrink-0" />
            <div>
              <p className="font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">Data</p>
              <p className="font-sans text-sm text-[#3c352d] leading-relaxed">{formatDate(birthDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl">
            <Clock className="w-4 h-4 text-[#8c6239] mt-0.5 shrink-0" />
            <div>
              <p className="font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">Hora</p>
              <p className="font-sans text-sm text-[#3c352d] leading-relaxed">{birthTime}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl">
          <MapPin className="w-4 h-4 text-[#8c6239] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-sans text-[10px] tracking-widest uppercase text-[#8c7f70] font-semibold">Local de nascimento</p>
            <p className="font-sans text-sm text-[#3c352d] leading-relaxed break-words">{birthPlaceName}</p>
            <p className="font-sans text-[10px] text-[#8c7f70] mt-1 font-mono uppercase tracking-wider">
              LAT {latitude.toFixed(4)} • LON {longitude.toFixed(4)} • {timezone}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-[#ede9de]/30 border border-[#8c7f70]/10 rounded-xl flex items-start gap-3 relative z-10">
        <input
          id="acceptTerms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#5c4d66] shrink-0 cursor-pointer"
        />
        <label htmlFor="acceptTerms" className="text-xs text-[#3c352d] leading-relaxed cursor-pointer">
          Ao fazer o login, declaro que estou ciente e de acordo com o{" "}
          <a
            href="#termos"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#5c4d66] hover:text-[#3c352d] transition-colors inline-flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            termo de aceite
          </a>
          .
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
        <button
          type="button"
          onClick={onEdit}
          disabled={isLoading}
          className="py-4 px-4 bg-[#ede9de] text-[#3c352d] font-sans tracking-[0.15em] uppercase rounded-lg hover:bg-[#e0dcd1] active:scale-[0.98] transition-all duration-300 shadow-sm font-medium text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar e editar
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading || !acceptedTerms}
          className="py-4 px-4 bg-[#3c352d] text-[#f4f1eb] font-sans tracking-[0.15em] uppercase rounded-lg hover:bg-[#5c4d66] active:scale-[0.98] transition-all duration-300 shadow-md font-medium text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-[#f4f1eb]/30 border-t-[#f4f1eb] rounded-full animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar e gerar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
