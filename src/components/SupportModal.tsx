import React from "react";
import { motion } from "motion/react";
import { X, MessageCircle, Mail, ShieldCheck, FileText, ArrowLeft, LifeBuoy } from "lucide-react";

export const SupportCard: React.FC = () => {
  return (
    <div className="relative w-full max-w-md bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <LifeBuoy className="w-6 h-6 text-[#5c4d66]" />
        <h2 className="text-lg sm:text-xl font-serif tracking-[0.12em] uppercase text-[#3c352d]">
          Central de Suporte — Aquar.IA
        </h2>
      </div>

      <p className="text-sm text-[#6e6356] leading-relaxed mb-6">
        Precisa de ajuda com seu mapa astral, conta ou assinatura Aquar.IA Plus?
        Entre em contato conosco pelos canais oficiais abaixo:
      </p>

      <div className="space-y-3">
        <a
          href="https://wa.me/5562985857402"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#e6e2d8] bg-white hover:bg-[#ede9de] transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-[#8c6239]" />
          <div>
            <p className="text-sm font-medium text-[#3c352d]">WhatsApp</p>
            <p className="text-[10px] text-[#6e6356]">Atendimento direto pelo WhatsApp.</p>
          </div>
        </a>

        <a
          href="mailto:aquariaprisma@gmail.com"
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#e6e2d8] bg-white hover:bg-[#ede9de] transition-colors"
        >
          <Mail className="w-5 h-5 text-[#5c4d66]" />
          <div>
            <p className="text-sm font-medium text-[#3c352d]">E-mail</p>
            <p className="text-[10px] text-[#6e6356]">aquariaprisma@gmail.com</p>
          </div>
        </a>
      </div>

      <div className="flex items-center justify-center gap-x-4 gap-y-2 mt-6 pt-5 border-t border-[#e6e2d8] text-[11px] text-[#8c7f70]">
        <a
          href="#privacidade"
          className="inline-flex items-center gap-1.5 hover:text-[#3c352d] transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Política de Privacidade
        </a>
        <span className="text-[#e6e2d8]">•</span>
        <a
          href="#termos"
          className="inline-flex items-center gap-1.5 hover:text-[#3c352d] transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Termos de Uso
        </a>
      </div>
    </div>
  );
};

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
        <SupportCard />
      </motion.div>
    </div>
  );
};

export const SupportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#3c352d] font-sans flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <SupportCard />
        <a
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-widest text-[#5c4d66] hover:text-[#3c352d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </a>
      </div>
    </div>
  );
};
