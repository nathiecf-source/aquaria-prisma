import { Type } from "@google/genai";
import { CompleteAstrologicalProfile } from "./astrology";
import { buildChatSystemPrompt, ChatMessage } from "./chatPrompts";
import { formatNatalContext, ChartMode } from "./formatNatalContext";
import { getGeminiClient, callGeminiWithRetry } from "./geminiService";
import {
  calculateChatTransits,
  getAllPlanetPositions,
  getHouseForLongitude,
  getUpcomingCosmicEvents,
  SIGN_NAMES,
  UpcomingEvent,
} from "./transitEngine";

export interface ChatApiResponse {
  answer: string;
  suggestions: string[];
  astrologicalSource: string;
  activationKeywords: string;
}

export type TransitContext = UpcomingEvent;

const PLANET_NAMES = [
  "Sol",
  "Lua",
  "Mercúrio",
  "Vênus",
  "Marte",
  "Júpiter",
  "Saturno",
  "Urano",
  "Netuno",
  "Plutão",
];

const NATAL_BLOCKERS = ["meu", "minha", "natal", "nascimento"];

function removeDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extractDateFromMessage(message: string): Date | undefined {
  const lower = removeDiacritics(message.toLowerCase());
  const today = new Date();

  if (/\bhoje\b/.test(lower)) return today;
  if (/\bamanha\b/.test(lower)) return new Date(today.getTime() + 86400000);
  if (/\bontem\b/.test(lower)) return new Date(today.getTime() - 86400000);

  const numericMatch = lower.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10);
    let year = parseInt(numericMatch[3], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  const monthNames = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const monthMatch = lower.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{2,4}))?/);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthIdx = monthNames.indexOf(monthMatch[2]);
    const yearStr = monthMatch[3];
    let year = yearStr ? parseInt(yearStr, 10) : today.getFullYear();
    if (year < 100) year += year < 50 ? 2000 : 1900;
    if (monthIdx >= 0) {
      const d = new Date(year, monthIdx, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return undefined;
}

interface ParsedTransit {
  planet: string;
  sign: string;
  date?: Date;
}

/** Detecta se a consulente perguntou sobre um trânsito específico no texto livre. */
function parseUserTransitQuestion(message: string): ParsedTransit | null {
  if (!message || message.trim().length < 3) return null;

  const lower = removeDiacritics(message.toLowerCase());

  // Evita perguntas do tipo "quando X entra em Y?" (são sobre data, não leitura atual).
  if (/^quando\b/.test(lower) || /quando\s+(?:entra|vai|passa|fica|est[aá])\b/.test(lower)) {
    return null;
  }

  const tokens = lower.split(/[\s,;!?()[\]{}]+/).filter(Boolean);
  const signMap = new Map(SIGN_NAMES.map(s => [removeDiacritics(s).toLowerCase(), s]));
  const planetMap = new Map(PLANET_NAMES.map(p => [removeDiacritics(p).toLowerCase(), p]));

  for (let i = 0; i < tokens.length; i++) {
    const rawToken = tokens[i].replace(/[^a-z0-9]/g, "");
    if (!planetMap.has(rawToken)) continue;

    const planet = planetMap.get(rawToken)!;

    // Blocadores como "meu Júpiter" ou "meu mapa" antes do planeta indicam leitura natal.
    // Se a mensagem mencionar explicitamente "trânsito", o "meu" provavelmente é "meu trânsito".
    const hasTransitWord = tokens.some(t => /transit/.test(t.replace(/[^a-z]/g, "")));
    const prevTokens = tokens.slice(Math.max(0, i - 3), i);
    if (!hasTransitWord && prevTokens.some(t => NATAL_BLOCKERS.includes(t.replace(/[^a-z]/g, "")))) {
      continue;
    }

    // Procura o signo nos próximos tokens (com ou sem "em" / "para" no meio).
    for (let j = i + 1; j < Math.min(tokens.length, i + 7); j++) {
      const signRaw = tokens[j].replace(/[^a-z]/g, "");
      if (!signMap.has(signRaw)) continue;

      // Se houver blocador entre planeta e signo, descarta.
      const between = tokens.slice(i + 1, j).map(t => t.replace(/[^a-z]/g, ""));
      if (between.some(t => NATAL_BLOCKERS.includes(t))) continue;

      const sign = signMap.get(signRaw)!;
      const date = extractDateFromMessage(message);
      return { planet, sign, date };
    }
  }

  return null;
}

/** Tenta montar um TransitContext a partir de uma pergunta digitada pelo usuário. */
function resolveUserTransitContext(
  parsed: ParsedTransit,
  profile: CompleteAstrologicalProfile
): TransitContext | null {
  if (!profile.tropical_natal) return null;

  const targetDate = parsed.date ?? new Date();
  const positions = getAllPlanetPositions(targetDate, true);
  const planetLon = positions[parsed.planet];
  if (planetLon == null) return null;

  const signIdx = SIGN_NAMES.indexOf(parsed.sign);
  if (signIdx === -1) return null;

  const planetSignIdx = Math.floor(planetLon / 30);

  // Se o planeta já está no signo na data, usa a posição exata dele.
  if (planetSignIdx === signIdx) {
    return {
      event: `${parsed.planet} em ${parsed.sign}`,
      date: targetDate.toISOString(),
      type: "current",
      planet: parsed.planet,
      sign: parsed.sign,
      longitude: planetLon,
    } as TransitContext;
  }

  // Caso contrário, procura o próximo ingresso dentro de 60 dias.
  try {
    const events = getUpcomingCosmicEvents(targetDate, 60);
    const match = events.find((e) => e.planet === parsed.planet && e.sign === parsed.sign);
    if (match) return match as TransitContext;
  } catch (err) {
    console.warn("[ChatService] Falha ao buscar próximo ingresso:", err);
  }

  return null;
}

export async function generateChatResponse(
  userName: string,
  profile: CompleteAstrologicalProfile,
  message: string,
  mode: ChartMode,
  history: ChatMessage[] = [],
  transitContext?: TransitContext
): Promise<ChatApiResponse> {
  let effectiveTransitContext = transitContext;

  // Se o usuário digitou uma pergunta sobre trânsito no chat, tenta inferir o contexto.
  if (!effectiveTransitContext && profile.tropical_natal) {
    const parsedTransit = parseUserTransitQuestion(message);
    if (parsedTransit) {
      const resolved = resolveUserTransitContext(parsedTransit, profile);
      if (resolved) {
        console.log("[ChatService] Trânsito detectado na pergunta:", resolved);
        effectiveTransitContext = resolved;
      }
    }
  }

  // Eventos cósmicos são sempre calculados em referencial tropical.
  // Forçar o contexto natal tropical evita que o modelo se confunda
  // com dados sidereal, que não incluem cúspides de casas.
  const effectiveMode: ChartMode = effectiveTransitContext ? "tropical" : mode;
  const contextText = formatNatalContext(profile, effectiveMode, userName);

  let transitContextText: string | undefined;
  let eventHouseNumber: number | undefined;
  if (effectiveTransitContext && profile.tropical_natal?.houses) {
    try {
      const house = getHouseForLongitude(effectiveTransitContext.longitude, profile.tropical_natal.houses);
      eventHouseNumber = house?.house;
      const eventDate = new Date(effectiveTransitContext.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const houseDescription = house
        ? `${house.house}ª Casa do mapa natal (cúspide em ${house.sign} ${house.cuspDegree.toFixed(2)}°)`
        : "uma casa não identificada do mapa natal";

      const cuspJustification = house && house.nextCuspHouse
        ? `Justificativa: a longitude ${effectiveTransitContext.longitude.toFixed(2)}° (${effectiveTransitContext.sign}) está entre a cúspide absoluta da ${house.house}ª Casa (${house.cuspLongitude.toFixed(2)}° = ${house.sign} ${house.cuspDegree.toFixed(2)}°) e a cúspide absoluta da ${house.nextCuspHouse}ª Casa (${house.nextCuspLongitude?.toFixed(2)}° = ${house.nextCuspSign} ${house.nextCuspDegree?.toFixed(2)}°), portanto cai na ${house.house}ª Casa.`
        : "";

      transitContextText = `A consulente está perguntando sobre o evento cósmico: "${effectiveTransitContext.event}".`;
      transitContextText += `\nData aproximada: ${eventDate}.`;
      transitContextText += `\nO evento envolve ${effectiveTransitContext.planet ? `o planeta ${effectiveTransitContext.planet}` : "um corpo celeste"} em ${effectiveTransitContext.sign}, longitude ${effectiveTransitContext.longitude.toFixed(2)}°.`;
      transitContextText += `\nA CASA ASTROLÓGICA ATIVADA POR ESTE EVENTO É A ${houseDescription.toUpperCase()}.`;
      if (cuspJustification) {
        transitContextText += `\n${cuspJustification}`;
      }
      transitContextText += `\n\nREGRA ABSOLUTA: a resposta deve tratar este trânsito como ativando EXCLUSIVAMENTE a ${eventHouseNumber ?? "?"}ª Casa do mapa natal.`;
      transitContextText += ` Não escreva que o evento cai em outra casa, nem que ${effectiveTransitContext.sign} ou qualquer signo subsequente esteja na Casa 10. A Casa 10 deste mapa é uma cúspide separada.`;
      transitContextText += ` As casas dos planetas natais aspectados são pano de fundo; a casa central e prioritária é sempre a ${eventHouseNumber ?? "?"}ª Casa.`;
      transitContextText += `\nFaça uma leitura terapêutica focada em como a energia deste evento ativa os temas dessa casa e signo, sem jargões esotéricos, com a abordagem analítica e aprofundada da Aquar.IA. Ao final, conclua com uma pergunta reflexiva que convide a consulente a perceber como esse movimento aparece no dia a dia.`;

      // Enriquece com os aspectos exatos do planeta do evento na data
      const targetDate = new Date(effectiveTransitContext.date);
      const chatTransits = calculateChatTransits(profile.tropical_natal, targetDate);
      const allTransits = [...chatTransits.transitos_estruturais, ...chatTransits.transitos_dinamicos];
      const eventPlanet = effectiveTransitContext.planet;
      const relevant = eventPlanet
        ? allTransits.filter((t) => t.planeta_transito === eventPlanet)
        : allTransits;

      if (relevant.length > 0) {
        const aspectsText = relevant
          .map((t) => `${t.planeta_transito} em ${t.aspecto.toLowerCase()} com ${t.planeta_natal}`)
          .join("; ");
        transitContextText += `\n\nNa data do evento, ${eventPlanet ? `o ${eventPlanet}` : "o corpo celeste em destaque"} forma estes aspectos com planetas natais: ${aspectsText}. Esses aspectos são pano de fundo, mas a leitura central e obrigatória continua sendo a ${eventHouseNumber ?? "?"}ª Casa.`;
      }
    } catch (err) {
      console.warn("[ChatService] Falha ao calcular contexto de trânsito:", err);
    }
  }

  const systemInstruction = buildChatSystemPrompt(userName, contextText, history, effectiveMode, transitContextText);

  const formattedHistory = history
    .map((msg) => `${msg.role === "user" ? "Consulente" : "Aquar.IA"}: ${msg.text}`)
    .join("\n");

  const questionLine = eventHouseNumber
    ? `Pergunta da consulente (o evento "${effectiveTransitContext?.event}" ativa a ${eventHouseNumber}ª Casa do mapa natal): "${message}"`
    : `Pergunta da consulente: "${message}"`;

  const prompt = [
    formattedHistory
      ? `--- INÍCIO DO HISTÓRICO DA CONVERSA ATUAL ---\n${formattedHistory}\n--- FIM DO HISTÓRICO DA CONVERSA ATUAL ---`
      : "",
    questionLine,
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
