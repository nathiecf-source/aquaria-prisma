import React, { useEffect, useRef, useState } from "react";
import { X, Send, FileDown, Loader2 } from "lucide-react";
import { useChat, ChartMode, ChatMessage, TransitContext } from "../hooks/useChat";
import { exportChatToPdf } from "../lib/chatPdfExport";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  userName?: string;
}

type ChatTab = "tropical" | "sidereal" | "ciclos";

const WELCOME_MESSAGE: ChatMessage = {
  role: "bot",
  text: "Olá. Sou a Aquar.IA. Estou aqui para refletir com você o que seu mapa astral revela neste momento. Pergunte o seu mapa.",
};

const TAB_LABELS: Record<ChatTab, string> = {
  tropical: "Tropical",
  sidereal: "Sideral",
  ciclos: "Ciclos",
};

const TypedMessage: React.FC<{
  text: string;
  speed?: number;
  onComplete: () => void;
}> = ({ text, speed = 45, onComplete }) => {
  const [displayed, setDisplayed] = useState("");
  const wordsRef = useRef<string[]>(text.split(/(\s+)/));
  const [index, setIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (index >= wordsRef.current.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        setDisplayed(text);
        onComplete();
      }
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed((prev) => prev + wordsRef.current[index]);
      setIndex((prev) => prev + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [index, speed, text, onComplete]);

  return <span>{displayed}</span>;
};

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const {
    messages,
    input,
    setInput,
    isLoading,
    remaining,
    mode,
    setMode,
    sendMessage,
    reset,
    events,
    isLoadingEvents,
    fetchEvents,
  } = useChat(userId);

  const [activeTab, setActiveTab] = useState<ChatTab>("tropical");
  const [selectedEvent, setSelectedEvent] = useState<TransitContext | null>(null);

  const messagesWithWelcome = [WELCOME_MESSAGE, ...messages];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typedIndexes, setTypedIndexes] = useState<Set<number>>(new Set());

  const handleClose = () => {
    onClose();
    // Não reseta a conversa ao fechar, apenas ao desmontar
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setTypedIndexes(new Set());
      setActiveTab("tropical");
      setSelectedEvent(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesWithWelcome, typedIndexes]);

  useEffect(() => {
    if (activeTab === "ciclos" && events.length === 0) {
      fetchEvents();
    }
  }, [activeTab, events, fetchEvents]);

  const handleTabClick = (tab: ChatTab) => {
    setActiveTab(tab);
    if (tab !== "ciclos") {
      setMode(tab as ChartMode);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input, { transitContext: selectedEvent || undefined });
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text, { transitContext: selectedEvent || undefined });
  };

  const handleEventClick = (event: TransitContext) => {
    setSelectedEvent(event);
    sendMessage(event.event, { transitContext: event, invisible: true });
  };

  const handleSavePdf = async () => {
    if (!containerRef.current) return;
    try {
      await exportChatToPdf(containerRef.current, userName);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      alert("Não foi possível salvar o PDF agora. Tente novamente.");
    }
  };

  const formatEventDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  if (!isOpen) return null;

  const isCiclos = activeTab === "ciclos";
  const modalMaxWidth = isCiclos ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#4a3f35]/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className={`relative flex flex-col w-full ${modalMaxWidth} max-h-[85vh] rounded-2xl border border-[#d9d4c7] bg-[#f4f1eb]/95 shadow-2xl shadow-[#4a3f35]/10 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d9d4c7] bg-[#f4f1eb]">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#4a3f35]">
              Aquar.IA Chat
            </h2>
            <p className="text-xs text-[#8c7f70] font-light">
              {remaining !== null
                ? `${remaining} pergunta${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""} este mês`
                : "Carregando limite..."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/60 rounded-lg p-0.5 border border-[#d9d4c7]">
              {(["tropical", "sidereal", "ciclos"] as ChatTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                    activeTab === tab
                      ? "bg-[#8c6239] text-white"
                      : "text-[#8c7f70] hover:text-[#4a3f35]"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            <button
              onClick={handleSavePdf}
              title="Salvar conversa em PDF"
              className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              aria-label="Fechar chat"
              className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {isCiclos && (
            <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-[#d9d4c7] bg-[#f4f1eb] flex flex-col">
              <div className="px-4 py-3 border-b border-[#d9d4c7]">
                <h3 className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold">
                  Próximos 30 dias
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-40 md:max-h-none">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-6 text-[#8c7f70]">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Calculando ciclos...</span>
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-xs text-[#8c7f70] text-center py-4">
                    Nenhum evento encontrado.
                  </p>
                ) : (
                  events.map((event, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEventClick(event)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors group ${
                        selectedEvent?.event === event.event &&
                        selectedEvent?.date === event.date
                          ? "bg-[#8c6239]/10 border-[#8c6239]/40"
                          : "bg-white/40 border-[#d9d4c7] hover:bg-white/80 hover:border-[#c5a880]"
                      }`}
                    >
                      <span className="block text-[9px] text-[#8c7f70] uppercase tracking-wider mb-0.5">
                        {formatEventDate(event.date)}
                      </span>
                      <span className="text-xs text-[#4a3f35] font-light leading-snug group-hover:text-[#8c6239] transition-colors">
                        {event.event}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-[#c5a880] scrollbar-track-transparent"
          >
            {messagesWithWelcome.map((msg, idx) => {
              const isBot = msg.role === "bot";
              const isLastBot =
                isBot &&
                idx ===
                  messagesWithWelcome.map((m) => m.role).lastIndexOf("bot");
              const shouldType = isLastBot && !typedIndexes.has(idx);

              return (
                <div
                  key={idx}
                  className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isBot
                        ? "bg-white text-[#4a3f35] border border-[#d9d4c7] rounded-tl-sm"
                        : "bg-[#c5a880] text-[#4a3f35] rounded-tr-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {isBot && shouldType ? (
                        <TypedMessage
                          text={msg.text}
                          speed={40}
                          onComplete={() =>
                            setTypedIndexes((prev) => new Set(prev).add(idx))
                          }
                        />
                      ) : (
                        msg.text
                      )}
                    </div>

                    {isBot &&
                      (msg.astrologicalSource || msg.activationKeywords) && (
                        <div className="mt-3 pt-3 border-t border-[#d9d4c7] text-xs text-[#8c7f70] space-y-1">
                          {msg.astrologicalSource && (
                            <p>
                              <span className="text-[#8c7f70] font-medium">Fonte:</span>{" "}
                              {msg.astrologicalSource}
                            </p>
                          )}
                          {msg.activationKeywords && (
                            <p>
                              <span className="text-[#8c7f70] font-medium">Chaves:</span>{" "}
                              {msg.activationKeywords}
                            </p>
                          )}
                        </div>
                      )}

                    {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-full border border-[#8c6239]/30 text-[#8c6239] hover:bg-[#8c6239]/10 transition-colors disabled:opacity-50 text-left"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-[#8c7f70] rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 bg-[#8c6239] rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-[#8c6239] rounded-full animate-pulse delay-150" />
                  <span className="w-2 h-2 bg-[#8c6239] rounded-full animate-pulse delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Selected event chip + Input */}
        <div className="border-t border-[#d9d4c7] bg-[#f4f1eb]">
          {selectedEvent && (
            <div className="px-5 py-2 flex items-center gap-2 border-b border-[#d9d4c7]/50">
              <span className="text-[9px] text-[#8c7f70] uppercase tracking-wider">
                Evento selecionado
              </span>
              <span className="text-xs bg-[#8c6239]/10 text-[#8c6239] px-2 py-0.5 rounded-full border border-[#8c6239]/30 truncate max-w-[200px]">
                {selectedEvent.event}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label="Limpar evento"
                className="p-1 rounded-full text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="px-5 py-4"
          >
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Pergunte o seu mapa astral"
                disabled={isLoading}
                className="flex-1 bg-white border border-[#d9d4c7] rounded-xl px-4 py-3 text-sm text-[#4a3f35] placeholder:text-[#8c7f70] focus:outline-none focus:border-[#8c6239] focus:ring-1 focus:ring-[#8c6239]/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-xl bg-[#8c6239] text-white hover:bg-[#6b4a2b] transition-colors disabled:opacity-50 disabled:hover:bg-[#8c6239]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-[#8c7f70] text-center">
              A conversa não é salva no banco. Você pode exportar para PDF quando
              quiser.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
