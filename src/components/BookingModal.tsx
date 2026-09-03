import React from "react";
import { motion } from "motion/react";
import { X, CalendarHeart } from "lucide-react";

interface BookingModalProps {
  onClose: () => void;
}

const SERVICES = [
  {
    title: "Leitura Astrológica Pontual",
    duration: "1h20 de duração",
    price: "R$ 280,00",
    installment: "6x R$ 50,63",
  },
  {
    title: "Leitura Astrológica Profunda",
    duration: "2h de duração",
    price: "R$ 420,00",
    installment: "6x R$ 75,95",
  },
  {
    title: "Mentoria Alquímica",
    duration: "1 encontro de 2h por 3 meses",
    description: "Leitura profunda e transmutação de crenças",
    price: "R$ 1.080,00",
    installment: "6x R$ 195,30",
  },
];

export const BookingModal: React.FC<BookingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <CalendarHeart className="w-6 h-6 text-[#5c4d66]" />
          <h2 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-[#3c352d]">
            Agendar Consulta
          </h2>
        </div>

        <div className="space-y-4 text-sm text-[#3c352d]">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="p-4 bg-[#ede9de]/40 border border-[#8c7f70]/10 rounded-xl"
            >
              <h3 className="font-serif text-[#5c4d66] mb-1">{service.title}</h3>
              <p className="text-xs text-[#8c7f70]">
                {service.duration}
                {service.description ? ` • ${service.description}` : ""}
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-base font-semibold text-[#3c352d]">{service.price}</span>
                <span className="text-xs text-[#8c7f70]">em até {service.installment}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://wa.me/5562999571990?text=Ol%C3%A1%2C%20vim%20pela%20Aquar.IA%20Prisma%2C%20e%20gostaria%20de%20agendar%20uma%20consulta%20astrol%C3%B3gica%20com%20Nathie"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3c352d] text-[#f4f1eb] text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-[#5c4d66] transition-colors cursor-pointer"
          >
            <CalendarHeart className="w-4 h-4" />
            Agendar Consulta com Nathie
          </a>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#ede9de] text-[#3c352d] text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-[#e0dcd1] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
