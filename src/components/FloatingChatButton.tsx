import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Lock, MessageCircle, Feather, X } from "lucide-react";

interface FloatingChatButtonProps {
  onChat: () => void;
  onJournal: () => void;
  isVisible?: boolean;
  isLocked?: boolean;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onChat,
  onJournal,
  isVisible = true,
  isLocked = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isVisible) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => {
              setOpen(false);
              onChat();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f4f1eb] text-[#3c352d] border border-[#d9d4c7] shadow-lg text-xs font-medium tracking-wide hover:bg-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#8c6239]" />
            Oráculo no Chat
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onJournal();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f4f1eb] text-[#3c352d] border border-[#d9d4c7] shadow-lg text-xs font-medium tracking-wide hover:bg-white transition-colors"
          >
            <Feather className="w-4 h-4 text-[#5c4d66]" />
            Diário Alquímico
          </button>
        </div>
      )}

      <button
        onClick={() => {
          if (isLocked) {
            onChat();
          } else {
            setOpen((prev) => !prev);
          }
        }}
        aria-label={isLocked ? "Chat exclusivo para assinantes PLUS" : "Abrir menu rápido"}
        title={isLocked ? "Chat exclusivo para assinantes PLUS" : "Abrir menu rápido"}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#8c6239] to-[#6b4a2b] text-white shadow-2xl shadow-black/40 border border-[#c5a880]/30 hover:scale-105 active:scale-95 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2 focus:ring-offset-[#0c0a09]"
      >
        {isLocked ? (
          <>
            <Lock className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#3c352d] border border-[#c5a880]/40 shadow-md">
              <Lock className="w-3 h-3 text-[#fbf9f5]" />
            </span>
          </>
        ) : open ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
