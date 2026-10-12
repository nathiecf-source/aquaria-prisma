import React, { useEffect, useRef, useState } from "react";
import { X, Send, FileDown, Loader2, ChevronDown } from "lucide-react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useChat, ChartMode, ChatMessage, TransitContext } from "../hooks/useChat";
import { exportChatToPdf } from "../lib/chatPdfExport";
import { useTranslation } from "react-i18next";
import { planetKey, signKey } from "../i18n/canonical";
import { normalizeLang } from "../lib/lang";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  userName?: string;
}

type ChatTab = "tropical" | "sidereal" | "ciclos";

const CHAT_TABS: ChatTab[] = ["tropical", "sidereal", "ciclos"];

/** Converte quebras de linha simples em hard-breaks do Markdown para preservá-las. */
function preProcessForMarkdown(text: string): string {
  return text.replace(/\n/g, "  \n");
}

const ChatMarkdown: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="leading-relaxed">
      <Markdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#4a3f35]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          br: () => <br />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#8c6239] hover:text-[#4a3f35]"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {preProcessForMarkdown(text)}
      </Markdown>
    </div>
  );
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

  const { t, i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);
  const [activeTab, setActiveTab] = useState<ChatTab>("tropical");
  const [selectedEvent, setSelectedEvent] = useState<TransitContext | null>(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);

  const welcomeMessage: ChatMessage = { role: "bot", text: t("chat.welcome") };
  const messagesWithWelcome = activeTab === "ciclos" ? messages : [welcomeMessage, ...messages];

  const eventLabel = (event: TransitContext): string => {
    const typeKey = `chat.events.types.${event.type}`;
    const pKey = planetKey(event.planet);
    const sKey = signKey(event.sign);
    if (!sKey) return event.event;
    const planet = pKey ? t(`planets.${pKey}`) : event.planet || "";
    const rendered = t(typeKey, {
      planet,
      sign: t(`signs.${sKey}`),
      defaultValue: "",
    });
    return rendered || event.event;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onClose();
    // Não reseta a conversa ao fechar, apenas ao desmontar
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setActiveTab("tropical");
      setSelectedEvent(null);
      setShowEventsSheet(false);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesWithWelcome, isLoading]);

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
    setShowEventsSheet(false);
    sendMessage(event.event, { transitContext: event, invisible: true });
  };

  const handleSavePdf = async () => {
    if (!containerRef.current) return;
    try {
      await exportChatToPdf(containerRef.current, userName);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      alert(t("chat.pdfError"));
    }
  };

  const formatEventDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(lang, {
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
                ? t("chat.remaining", { count: remaining })
                : t("chat.loadingLimit")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/60 rounded-lg p-0.5 border border-[#d9d4c7]">
              {CHAT_TABS.map((tab) => (
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
                  {t(`chat.tabs.${tab}`)}
                </button>
              ))}
            </div>

            <button
              onClick={handleSavePdf}
              title={t("chat.savePdf")}
              className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              aria-label={t("chat.closeChat")}
              className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {isCiclos && (
            <div className="hidden md:flex w-56 lg:w-64 border-b md:border-b-0 md:border-r border-[#d9d4c7] bg-[#f4f1eb] flex-col">
              <div className="px-4 py-3 border-b border-[#d9d4c7]">
                <h3 className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold">
                  {t("chat.events.next30")}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-6 text-[#8c7f70]">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">{t("chat.events.calculating")}</span>
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-xs text-[#8c7f70] text-center py-4">
                    {t("chat.events.none")}
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
                        {eventLabel(event)}
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
            {isCiclos && (
              <div className="md:hidden mb-4">
                <button
                  type="button"
                  onClick={() => setShowEventsSheet(true)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#d9d4c7] bg-white/60 text-xs text-[#4a3f35] hover:bg-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {selectedEvent ? (
                      <>
                        <span className="text-[#8c7f70]">{t("chat.events.skyNow")}</span>
                        <span className="font-light truncate max-w-[180px]">{eventLabel(selectedEvent)}</span>
                      </>
                    ) : (
                      <span className="text-[#8c7f70]">{t("chat.events.pickEvent")}</span>
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#8c7f70] shrink-0" />
                </button>
              </div>
            )}

            {messagesWithWelcome.map((msg, idx) => {
              const isBot = msg.role === "bot";

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
                    <ChatMarkdown text={msg.text} />

                    {isBot &&
                      (msg.astrologicalSource || msg.activationKeywords) && (
                        <div className="mt-3 pt-3 border-t border-[#d9d4c7] text-xs text-[#8c7f70] space-y-1">
                          {msg.astrologicalSource && (
                            <p>
                              <span className="text-[#8c7f70] font-medium">{t("chat.source")}:</span>{" "}
                              {msg.astrologicalSource}
                            </p>
                          )}
                          {msg.activationKeywords && (
                            <p>
                              <span className="text-[#8c7f70] font-medium">{t("chat.keys")}:</span>{" "}
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
                {t("chat.events.selected")}
              </span>
              <span className="text-xs bg-[#8c6239]/10 text-[#8c6239] px-2 py-0.5 rounded-full border border-[#8c6239]/30 truncate max-w-[200px]">
                {eventLabel(selectedEvent)}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label={t("chat.events.clear")}
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
            {activeTab === "ciclos" && (
              <button
                type="button"
                onClick={() =>
                  setInput(t("chat.suggestion"))
                }
                disabled={isLoading}
                className="mb-2 w-full text-left text-xs px-3 py-2 rounded-xl border border-[#d9d4c7] bg-white/60 text-[#4a3f35] hover:bg-white hover:border-[#c5a880] transition-colors disabled:opacity-50"
              >
                {t("chat.suggestion")}
              </button>
            )}
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
                placeholder={t("chat.placeholder")}
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
              {t("chat.pdfNote")}
            </p>
          </form>
        </div>

        {/* Mobile events bottom sheet */}
        {showEventsSheet && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center md:hidden">
            <div
              className="absolute inset-0 bg-[#4a3f35]/40 backdrop-blur-sm"
              onClick={() => setShowEventsSheet(false)}
            />
            <div className="relative w-full max-h-[70vh] bg-[#f4f1eb] rounded-t-2xl border-t border-[#d9d4c7] shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#d9d4c7]">
                <h3 className="text-[10px] uppercase tracking-widest text-[#8c7f70] font-semibold">
                  {t("chat.events.sheetTitle")}
                </h3>
                <button
                  onClick={() => setShowEventsSheet(false)}
                  className="p-1 rounded-full text-[#8c7f70] hover:text-[#4a3f35]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-6 text-[#8c7f70]">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">{t("chat.events.calculating")}</span>
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-xs text-[#8c7f70] text-center py-4">
                    {t("chat.events.none")}
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
                        {eventLabel(event)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
