import { Type } from "@google/genai";
import { CompleteAstrologicalProfile } from "./astrology";
import { buildChatSystemPrompt, ChatMessage } from "./chatPrompts";
import { formatNatalContext, ChartMode } from "./formatNatalContext";
import { getGeminiClient, callGeminiWithRetry } from "./geminiService";
import { calculateChatTransits, getHouseForLongitude, UpcomingEvent } from "./transitEngine";

export interface ChatApiResponse {
  answer: string;
  suggestions: string[];
  astrologicalSource: string;
  activationKeywords: string;
}

export type TransitContext = UpcomingEvent;

export async function generateChatResponse(
  userName: string,
  profile: CompleteAstrologicalProfile,
  message: string,
  mode: ChartMode,
  history: ChatMessage[] = [],
  transitContext?: TransitContext
): Promise<ChatApiResponse> {
  const contextText = formatNatalContext(profile, mode, userName);

  let transitContextText: string | undefined;
  if (transitContext && profile.tropical_natal?.houses) {
    try {
      const house = getHouseForLongitude(transitContext.longitude, profile.tropical_natal.houses);
      const eventDate = new Date(transitContext.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const houseDescription = house
        ? `${house.house}ª Casa do mapa natal (cúspide em ${house.sign} ${house.cuspDegree.toFixed(2)}°)`
        : "uma casa não identificada do mapa natal";

      transitContextText = `A consulente está perguntando sobre o evento cósmico: "${transitContext.event}".`;
      transitContextText += `\nData aproximada: ${eventDate}.`;
      transitContextText += `\nO evento envolve ${transitContext.planet ? `o planeta ${transitContext.planet}` : "um corpo celeste"} em ${transitContext.sign}, longitude ${transitContext.longitude.toFixed(2)}°.`;
      transitContextText += `\nO servidor calculou que este ponto zodiacal cai na ${houseDescription}.`;
      transitContextText += `\nFaça uma leitura terapêutica focada em como a energia deste evento ativa os temas dessa casa e signo, sem jargões esotéricos, com a abordagem analítica e aprofundada da Aquar.IA. Ao final, conclua com uma pergunta reflexiva que convide a consulente a perceber como esse movimento aparece no dia a dia.`;

      // Enriquece com os aspectos exatos do planeta do evento na data
      const targetDate = new Date(transitContext.date);
      const chatTransits = calculateChatTransits(profile.tropical_natal, targetDate);
      const allTransits = [...chatTransits.transitos_estruturais, ...chatTransits.transitos_dinamicos];
      const eventPlanet = transitContext.planet;
      const relevant = eventPlanet
        ? allTransits.filter((t) => t.planeta_transito === eventPlanet)
        : allTransits;

      if (relevant.length > 0) {
        const aspectsText = relevant
          .map((t) => `${t.planeta_transito} em ${t.aspecto.toLowerCase()} com ${t.planeta_natal} (casa natal ${t.casa_natal ?? "?"})`)
          .join("; ");
        transitContextText += `\n\nNa data do evento, ${eventPlanet ? `o ${eventPlanet}` : "o corpo celeste em destaque"} forma estes aspectos com planetas natais: ${aspectsText}. Use-os como pano de fundo, mas a leitura central deve ser sobre a casa astrológica afetada.`;
      }
    } catch (err) {
      console.warn("[ChatService] Falha ao calcular contexto de trânsito:", err);
    }
  }

  const systemInstruction = buildChatSystemPrompt(userName, contextText, history, mode, transitContextText);

  const formattedHistory = history
    .map((msg) => `${msg.role === "user" ? "Consulente" : "Aquar.IA"}: ${msg.text}`)
    .join("\n");

  const prompt = [
    formattedHistory
      ? `--- INÍCIO DO HISTÓRICO DA CONVERSA ATUAL ---\n${formattedHistory}\n--- FIM DO HISTÓRICO DA CONVERSA ATUAL ---`
      : "",
    `Pergunta da consulente: "${message}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = getGeminiClient();
  const response = await callGeminiWithRetry(
    client,
    {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            astrologicalSource: { type: Type.STRING },
            activationKeywords: { type: Type.STRING },
          },
          required: [
            "answer",
            "suggestions",
            "astrologicalSource",
            "activationKeywords",
          ],
        },
      },
    },
    3,
    1500
  );

  const rawText = (response.text || "").trim();
  const cleanedText = rawText
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    console.error("[ChatService] Falha ao fazer parse do JSON:", rawText);
    throw new Error("A resposta do oráculo não foi entendida. Tente reformular.");
  }

  if (
    typeof parsed.answer !== "string" ||
    !Array.isArray(parsed.suggestions) ||
    typeof parsed.astrologicalSource !== "string" ||
    typeof parsed.activationKeywords !== "string"
  ) {
    throw new Error("Resposta da IA em formato inesperado.");
  }

  return {
    answer: parsed.answer.trim(),
    suggestions: parsed.suggestions.map((s: any) => String(s).trim()),
    astrologicalSource: parsed.astrologicalSource.trim(),
    activationKeywords: parsed.activationKeywords.trim(),
  };
}
