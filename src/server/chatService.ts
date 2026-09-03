import { Type } from "@google/genai";
import { CompleteAstrologicalProfile } from "./astrology";
import { buildChatSystemPrompt, ChatMessage } from "./chatPrompts";
import { formatNatalContext, ChartMode } from "./formatNatalContext";
import { getGeminiClient, callGeminiWithRetry } from "./geminiService";

export interface ChatApiResponse {
  answer: string;
  suggestions: string[];
  astrologicalSource: string;
  activationKeywords: string;
}

export async function generateChatResponse(
  userName: string,
  profile: CompleteAstrologicalProfile,
  message: string,
  mode: ChartMode,
  history: ChatMessage[] = []
): Promise<ChatApiResponse> {
  const contextText = formatNatalContext(profile, mode, userName);
  const systemInstruction = buildChatSystemPrompt(userName, contextText, history, mode);

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
      model: "gemini-1.5-flash",
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
