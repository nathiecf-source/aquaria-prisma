import { ReadingData } from "../data/mockReadings";

const normalizeCoherenceDashboard = (text: string): string => text
  .replace(/\\n/g, "\n")
  .replace(/\r\n/g, "\n")
  .replace(/^\s*CHAVES DE COERÊNCIA\s*/i, "")
  .replace(/\s*(?=(?:[1-7][️⃣]?\.\s*(?:Compasso Interno|Compasso Relacional|Compasso Kármico|Compasso da Realização|Compasso da Manifestação|Compasso da Transformação|Sombra e Escudo|Bússola Somática|Princípio Orientador|Virtude Nativa|Sabedoria da Alma|Pulso de Criação|Pulso de Consciência|Pulso de Assimilação|Pulso de Integração|Pulso de Transcendência|Pulso de Conexão|Pulso de Concretização|Pulso de Manifestação|Pulso de Transmutação|Código de Ancoragem):))/g, "\n\n")
  .replace(/\s*(?=(?:👤\s*)?Sombra Primária:)/g, "\n")
  .replace(/\s*(?=(?:🛡️\s*)?Escudo de Proteção:)/g, "\n")
  .replace(/\s*(?=(?:🔴\s*)?Em desarmonia(?: \(Performando\))?:)/g, "\n")
  .replace(/\s*(?=(?:🟢\s*)?Em harmonia(?: \(Autêntica\))?:)/g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

export function parseGeminiAnalysis(markdown: string): Record<string, Partial<ReadingData>> {
  const result: Record<string, Partial<ReadingData>> = {};
  
  const mappings: Record<string, string> = {
    "caminho-assimilacao": "Caminho de Integração",
    "eixo-ic": "Caminho de Consciência",
    "caminho-transformacao": "Caminho de Transformação",
    "eixo-asc": "Caminho da Autenticidade",
    "caminho-manifestacao": "Caminho da Manifestação",
    "eixo-mc": "Caminho da Realização",
    "eixo-dsc": "Caminho de Reconexão"
  };

  const normalizePathName = (name: string): string =>
    name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(de|da|do)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // 1. Check if the response is a JSON string
  try {
    let cleanText = markdown.trim();
    if (cleanText.startsWith("```")) {
      // Remove starting ```json or ``` and ending ```
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    if (cleanText.startsWith("{") && cleanText.endsWith("}")) {
      const parsedJson = JSON.parse(cleanText);
      const caminhos = parsedJson.caminhos || parsedJson.caminho;
      if (caminhos && Array.isArray(caminhos)) {
        for (const caminho of caminhos) {
          const title = caminho.nome_caminho || "";
          
          // Match with existing IDs
          const matchEntry = Object.entries(mappings).find(([_, mappedTitle]) => {
            const normTitle = normalizePathName(title);
            const normMapped = normalizePathName(mappedTitle);
            return normTitle.includes(normMapped) || normMapped.includes(normTitle);
          });

          if (!matchEntry) continue;
          const matchedId = matchEntry[0];

          result[matchedId] = {
            id: matchedId,
            title: title,
            energySubtitle: caminho.subtitulo_energia || undefined,
            anchorPhrase: caminho.frase_didatica || undefined,
            evolutionaryTension: caminho.tensao_evolucionaria || undefined,
            integration: caminho.integracao || undefined,
            trap: caminho.armadilha || undefined,
            gift: caminho.dom || undefined,
            coherenceDashboard: caminho.chaves_coerencia
              ? normalizeCoherenceDashboard(caminho.chaves_coerencia)
              : undefined,
            astrologicalSource: caminho.fonte_astrologica || undefined
          } as any;
        }
        
        // Return structured result if we have parsed items successfully
        if (Object.keys(result).length > 0) {
          return result;
        }
      }
    }
  } catch (e) {
    console.warn("Could not parse Gemini response as JSON, falling back to legacy Markdown parsing:", e);
  }

  // 2. Fallback to Markdown splitting and parsing
  const sections = markdown.split(/(?=##\s+)/);

  for (const section of sections) {
    const lines = section.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const headingLine = lines[0];
    if (!headingLine.startsWith("##")) continue;
    const title = headingLine.replace(/^##\s+/, "").trim();

    const matchEntry = Object.entries(mappings).find(([_, mappedTitle]) => {
      const normTitle = normalizePathName(title);
      const normMapped = normalizePathName(mappedTitle);
      return normTitle.includes(normMapped) || normMapped.includes(normTitle);
    });

    if (!matchEntry) continue;
    const matchedId = matchEntry[0];

    let energySubtitle = "";
    let anchorPhrase = "";
    let evolutionaryTension = "";
    let integration = "";
    let trap = "";
    let gift = "";
    let astrologicalSource = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for custom formatting markers
      if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
        energySubtitle = line.substring(1, line.length - 1).trim();
      } else if (line.startsWith("**") && line.endsWith("**")) {
        anchorPhrase = line.substring(2, line.length - 2).trim();
      } else if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\./)) {
        const cleanLine = line.replace(/^[-*\d.]+\s*/, "").trim();
        
        if (cleanLine.toLowerCase().includes("tensao") || cleanLine.toLowerCase().includes("consolidada")) {
          evolutionaryTension = cleanLine.replace(/^[^:]+:\s*/, "").trim();
        } else if (cleanLine.toLowerCase().includes("integracao")) {
          integration = cleanLine.replace(/^[^:]+:\s*/, "").trim();
        } else if (cleanLine.toLowerCase().includes("armadilha")) {
          trap = cleanLine.replace(/^[^:]+:\s*/, "").trim();
        } else if (cleanLine.toLowerCase().includes("dom")) {
          gift = cleanLine.replace(/^[^:]+:\s*/, "").trim();
        } else if (cleanLine.toLowerCase().includes("fonte")) {
          astrologicalSource = cleanLine.replace(/^[^:]+:\s*/, "").trim();
        }
      } else {
        if (!energySubtitle && line.startsWith("*") && !line.startsWith("**")) {
          energySubtitle = line.replace(/^\*+/, "").replace(/\*+$/, "").trim();
        } else if (!anchorPhrase && line.startsWith("**")) {
          anchorPhrase = line.replace(/^\*\*+/, "").replace(/\*\*+$/, "").trim();
        }
      }
    }

    result[matchedId] = {
      id: matchedId,
      title,
      energySubtitle: energySubtitle || undefined,
      anchorPhrase: anchorPhrase || undefined,
      evolutionaryTension: evolutionaryTension || undefined,
      integration: integration || undefined,
      trap: trap || undefined,
      gift: gift || undefined,
      astrologicalSource: astrologicalSource || undefined
    };
  }

  return result;
}
