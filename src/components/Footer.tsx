import React, { useState } from "react";
import { FileText, Instagram, Users } from "lucide-react";
import { AboutModal } from "./AboutModal";
import { SubscriptionModal } from "./SubscriptionModal";
import { FAQModal } from "./FAQModal";
import { BookingModal } from "./BookingModal";

interface FooterProps {
  userProfile?: any;
}

export const Footer: React.FC<FooterProps> = ({ userProfile }) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <footer className="max-w-3xl mx-auto text-center mt-6 sm:mt-10 py-6 border-t border-[#e6e2d8]">
        <p className="text-[10px] text-[#8c7f70] tracking-wider font-mono mb-3">
          Copyright (2026 Aquar.IA. Todos os direitos reservados.)
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#8c7f70]">
          <a
            href="https://www.instagram.com/aquaria.app"
            target="_blank"
            rel="noopener noreferrer"
            title="@aquaria.app"
            className="inline-flex items-center gap-1 hover:text-[#3c352d] transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">@aquaria.app</span>
          </a>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <a
            href="https://www.instagram.com/nathieterapeuta"
            target="_blank"
            rel="noopener noreferrer"
            title="Idealizadora @nathieterapeuta"
            className="inline-flex items-center gap-1 hover:text-[#3c352d] transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">@nathieterapeuta</span>
          </a>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <button
            onClick={() => setShowAbout(true)}
            className="hover:text-[#3c352d] transition-colors cursor-pointer"
          >
            Sobre
          </button>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <button
            onClick={() => setShowFAQ(true)}
            className="hover:text-[#3c352d] transition-colors cursor-pointer"
          >
            Dúvidas Frequentes
          </button>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <a
            href="https://wa.me/5562985857402"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#3c352d] transition-colors"
          >
            Suporte
          </a>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <a
            href="https://chat.whatsapp.com/BuQ0JxIqiBQK4nf9upmYth"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#3c352d] transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Comunidade
          </a>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <button
            onClick={() => setShowSubscription(true)}
            className="hover:text-[#3c352d] transition-colors cursor-pointer"
          >
            Sua Assinatura
          </button>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <a
            href="#termos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#3c352d] transition-colors"
          >
            <FileText className="w-3 h-3" />
            Termos de uso
          </a>

          <span className="hidden sm:inline text-[#e6e2d8]">•</span>

          <button
            onClick={() => setShowBooking(true)}
            className="hover:text-[#3c352d] transition-colors cursor-pointer"
          >
            Agendar consulta
          </button>
        </nav>
      </footer>

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {showSubscription && (
        <SubscriptionModal
          userProfile={userProfile}
          onClose={() => setShowSubscription(false)}
        />
      )}

      {showFAQ && (
        <FAQModal onClose={() => setShowFAQ(false)} />
      )}

      {showBooking && (
        <BookingModal onClose={() => setShowBooking(false)} />
      )}
    </>
  );
};
