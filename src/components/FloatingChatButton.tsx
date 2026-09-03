import React from "react";
import { Sparkles, Lock } from "lucide-react";

interface FloatingChatButtonProps {
  onClick: () => void;
  isVisible?: boolean;
  isLocked?: boolean;
  label?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onClick,
  isVisible = true,
  isLocked = false,
  label,
}) => {
  if (!isVisible) return null;

  const blockMessage = label || (isLocked ? "Chat exclusivo para assinantes PLUS" : "Abrir chat astrológico");

  return (
    <button
      id="tour-floating-chat-button"
      onClick={onClick}
      aria-label={blockMessage}
      title={blockMessage}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#8c6239] to-[#6b4a2b] text-white shadow-2xl shadow-black/40 border border-[#c5a880]/30 hover:scale-105 active:scale-95 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2 focus:ring-offset-[#0c0a09]"
    >
      {isLocked ? (
        <>
          <Lock className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#3c352d] border border-[#c5a880]/40 shadow-md">
            <Lock className="w-3 h-3 text-[#fbf9f5]" />
          </span>
        </>
      ) : (
        <Sparkles className="w-6 h-6" />
      )}
    </button>
  );
};
