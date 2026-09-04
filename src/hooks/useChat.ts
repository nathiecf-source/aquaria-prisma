import { useCallback, useState } from "react";

export type ChatMessageRole = "user" | "bot";

export interface ChatMessage {
  role: ChatMessageRole;
  text: string;
  suggestions?: string[];
  astrologicalSource?: string;
  activationKeywords?: string;
}

export type ChartMode = "tropical" | "sidereal";

export interface TransitContext {
  event: string;
  date: string;
  type: "ingress" | "new_moon" | "full_moon" | "solar_eclipse" | "lunar_eclipse";
  planet?: string;
  sign: string;
  longitude: number;
}

export interface SendMessageOptions {
  transitContext?: TransitContext;
  invisible?: boolean;
}

export function useChat(userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mode, setMode] = useState<ChartMode>("tropical");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TransitContext[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch("/api/chat/upcoming-events");
      const data = await res.json();
      if (res.ok && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        console.warn("[useChat] Resposta inesperada de /api/chat/upcoming-events:", data);
      }
    } catch (err: any) {
      console.error("[useChat] Erro ao carregar eventos cósmicos:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, options?: SendMessageOptions) => {
      if (!userId || !text.trim()) return;

      const trimmedText = text.trim();
      const userMsg: ChatMessage = { role: "user", text: trimmedText };

      if (!options?.invisible) {
        setMessages((prev) => [...prev, userMsg]);
      }
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            message: trimmedText,
            mode,
            history: messages,
            transitContext: options?.transitContext,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao consultar o oráculo.");
        }

        if (typeof data.remaining === "number") {
          setRemaining(data.remaining);
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: data.answer,
            suggestions: data.suggestions,
            astrologicalSource: data.astrologicalSource,
            activationKeywords: data.activationKeywords,
          },
        ]);
      } catch (err: any) {
        const message = err?.message || "Erro ao consultar o oráculo.";
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Perdão, houve uma interferência em nossa conexão cósmica. Poderia tentar novamente?",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, mode, messages]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setRemaining(null);
    setMode("tropical");
    setError(null);
    setEvents([]);
    setIsLoadingEvents(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    remaining,
    mode,
    setMode,
    error,
    events,
    isLoadingEvents,
    fetchEvents,
    sendMessage,
    reset,
  };
}
