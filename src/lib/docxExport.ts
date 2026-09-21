import type { SolarReturnResult } from "../components/SolarReturnModal";

export type ReadingBundle = Record<string, any>;

export type ExportDocumentKey = "alicerce" | "cenario" | "planetas" | "caminhos";

interface ExportBlock {
  title: string;
  sections: Array<{ title?: string; text: string }>;
}

const ELEMENTS = [
  ["petal-fire", "Elemento Fogo"],
  ["petal-earth", "Elemento Terra"],
  ["petal-air", "Elemento Ar"],
  ["petal-water", "Elemento Água"],
] as const;

const QUALITIES = [
  ["petala-cardeal", "Qualidade Cardeal"],
  ["petala-fixo", "Qualidade Fixa"],
  ["petala-mutavel", "Qualidade Mutável"],
] as const;

const PATHS = [
  ["eixo-asc", "Caminho da Autenticidade"],
  ["eixo-ic", "Caminho da Consciência"],
  ["eixo-dsc", "Caminho da Reconexão"],
  ["eixo-mc", "Caminho da Realização"],
  ["caminho-assimilacao", "Caminho da Integração"],
  ["caminho-manifestacao", "Caminho da Manifestação"],
  ["caminho-transformacao", "Caminho da Transformação"],
] as const;

const PLANETS = [
  ["sol", "Sol"], ["lua", "Lua"], ["mercurio", "Mercúrio"], ["venus", "Vênus"],
  ["marte", "Marte"], ["jupiter", "Júpiter"], ["saturno", "Saturno"], ["urano", "Urano"],
  ["netuno", "Netuno"], ["plutao", "Plutão"], ["nodo-norte", "Nodo Norte"],
  ["nodo-sul", "Nodo Sul"], ["quiron", "Quíron"], ["lilith", "Lilith"],
  ["fortuna", "Roda da Fortuna"], ["asc", "Ascendente"], ["mc", "Meio do Céu"],
] as const;

const HOUSE_THEMES: Record<number, string> = {
  1: "Identidade e Presença", 2: "Valor e Recursos", 3: "Comunicação e Mente",
  4: "O Alicerce e a Memória", 5: "Criatividade e Prazer", 6: "Rotina e Corpo",
  7: "Relacionamentos e o Outro", 8: "Transformação e Sombra", 9: "Expansão e Crenças",
  10: "Missão e Realização", 11: "Comunidade e Futuro", 12: "Dissolução e Espírito",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Título", energySubtitle: "Energia", functionText: "Função Essencial",
  shadowText: "Sombra e Integração", structuralText: "Dinâmica Estrutural",
  fonte_astrologica: "Fonte Astrológica", nome_caminho: "", subtitulo_energia: "Energia",
  frase_didatica: "Síntese", tensao_evolucionaria: "O Desafio Evolutivo",
  integracao: "A Integração de Força", armadilha: "Ponto de Atenção", dom: "O Dom Manifestado",
  resumo_basico: "Visão Essencial", leitura_psicologica: "Dinâmica Psíquica",
  dinamica_mundo_interno: "Movimento Interior", leitura_karmica: "Fundação da Alma",
  qualidades_e_drishtis: "Qualidades Estruturais e Influências",
  texto: "Síntese", moonBirthPhase: "Fase Lunar", moonBirthTitle: "Missão Lunar",
  moonBirthAnalysis: "Leitura da Lua Natal", vetorTitle: "Diretriz",
  vetorAnalysis: "Leitura", vetorType: "Tipo", vetorScore: "Pontuação",
};

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function flattenPayload(payload: any, ignoredKeys = new Set<string>()): Array<{ title?: string; text: string }> {
  if (!payload || typeof payload !== "object") return [];
  const sections: Array<{ title?: string; text: string }> = [];
  const visit = (value: any, key: string) => {
    if (ignoredKeys.has(key) || value == null || value === "") return;
    if (typeof value === "string" || typeof value === "number") {
      const text = cleanText(value);
      if (text) sections.push({ title: FIELD_LABELS[key] ?? key.replace(/_/g, " "), text });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "object" && item?.interpretation) {
          const aspect = [item.planet1, item.type, item.planet2].filter(Boolean).join(" — ");
          sections.push({ title: aspect || "Aspecto", text: cleanText(item.interpretation) });
        } else if (typeof item === "string") {
          sections.push({ text: cleanText(item) });
        }
      });
      return;
    }
    Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
  };
  Object.entries(payload).forEach(([key, value]) => visit(value, key));
  return sections;
}

function getPlanetPayload(readings: ReadingBundle, id: string): any {
  return readings[`planeta-v4-${id}-tropical`] || readings[`planeta-${id}-tropical`];
}

function buildBlocks(key: ExportDocumentKey, readings: ReadingBundle): ExportBlock[] {
  if (key === "alicerce") {
    return [
      ...ELEMENTS.map(([id, title]) => ({ title, sections: flattenPayload(readings[id]) })),
      ...QUALITIES.map(([id, title]) => ({ title, sections: flattenPayload(readings[id]) })),
      { title: "Lua Natal", sections: flattenPayload(readings["lua-natal"]) },
    ].filter(block => block.sections.length > 0);
  }

  if (key === "cenario") {
    return Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      const sections = [
        { title: "Dinâmica Psíquica", payload: readings[`casa-${house}-tropical`] },
        { title: "Fundação da Alma", payload: readings[`casa-${house}-vedic`] },
        { title: "Síntese", payload: readings[`casa-${house}-sintese`] },
      ].flatMap(item => flattenPayload(item.payload, new Set(["title", "energySubtitle"])).map(section => ({
        ...section,
        title: section.title ? `${item.title} — ${section.title}` : item.title,
      })));
      return { title: `Casa ${house} — ${HOUSE_THEMES[house]}`, sections };
    }).filter(block => block.sections.length > 0);
  }

  if (key === "planetas") {
    return PLANETS.map(([id, title]) => {
      const tropical = flattenPayload(getPlanetPayload(readings, id), new Set(["title", "energySubtitle"]));
      const vedic = flattenPayload(readings[`vedic-structural-v3-${id}`]);
      return {
        title,
        sections: [
          ...tropical.map(section => ({ ...section, title: section.title ? `Leitura Tropical — ${section.title}` : "Leitura Tropical" })),
          ...vedic.map(section => ({ ...section, title: section.title ? `Dinâmica Estrutural — ${section.title}` : "Dinâmica Estrutural" })),
        ],
      };
    }).filter(block => block.sections.length > 0);
  }

  return PATHS.map(([id, title]) => ({
    title,
    sections: flattenPayload(readings[id], new Set(["nome_caminho"])),
  })).filter(block => block.sections.length > 0);
}

const DOCUMENT_TITLES: Record<ExportDocumentKey, string> = {
  alicerce: "O Alicerce",
  cenario: "O Cenário da Vida",
  planetas: "O Cenário Planetário",
  caminhos: "Os Caminhos de Potência",
};

function textRuns(text: string, TextRun: any): any[] {
  const runs: any[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) runs.push(new TextRun(text.slice(lastIndex, match.index)));
    runs.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) runs.push(new TextRun(text.slice(lastIndex)));
  return runs.length ? runs : [new TextRun(text)];
}

async function loadLogoData(): Promise<Uint8Array | null> {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function downloadReadingDocument(
  key: ExportDocumentKey,
  readings: ReadingBundle,
  userName: string,
): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = await import("docx");
  const blocks = buildBlocks(key, readings);
  if (!blocks.length) throw new Error("Nenhuma leitura foi encontrada para este documento.");

  const title = DOCUMENT_TITLES[key];
  const logoData = await loadLogoData();
  const children: any[] = [
    ...(logoData ? [new Paragraph({
      children: [new ImageRun({ data: logoData, transformation: { width: 96, height: 96 }, type: "png" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })] : []),
    new Paragraph({
      text: "AQUAR.IA PRISMA",
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { after: 160 },
    }),
    new Paragraph({
      text: title,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: userName || "Seu mapa astrológico",
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),
  ];

  blocks.forEach((block, blockIndex) => {
    if (blockIndex > 0) children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(new Paragraph({
      text: block.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 220 },
    }));
    block.sections.forEach(section => {
      if (section.title) children.push(new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 },
      }));
      section.text.split(/\n\s*\n|\n/).filter(Boolean).forEach(line => {
        const bulletMatch = line.match(/^[-•]\s+(.+)/);
        children.push(new Paragraph({
          children: textRuns((bulletMatch?.[1] || line).replace(/^#{1,6}\s*/, ""), TextRun),
          bullet: bulletMatch ? { level: 0 } : undefined,
          spacing: { after: 140, line: 320 },
        }));
      });
    });
  });

  const doc = new Document({
    creator: "Aquar.IA Prisma",
    title: `${title} — ${userName}`,
    description: "Leitura astrológica pessoal gerada pela Aquar.IA Prisma",
    sections: [{
      properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = (userName || "leitura").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  anchor.href = url;
  anchor.download = `aquaria-${key}-${safeName || "leitura"}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadSolarReturnDocument(result: SolarReturnResult, userName: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = await import("docx");
  const logoData = await loadLogoData();
  const reading = result.reading;
  const children: any[] = [];
  if (logoData) children.push(new Paragraph({ children: [new ImageRun({ data: logoData, transformation: { width: 96, height: 96 }, type: "png" })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
  children.push(
    new Paragraph({ text: "AQUAR.IA PRISMA", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
    new Paragraph({ text: `Revolução Solar ${result.solarReturnYear}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ text: userName || "Seu mapa astrológico", alignment: AlignmentType.CENTER }),
    new Paragraph({ text: result.analysis.location.name, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
  );

  const addText = (text?: string, heading?: string) => {
    if (!text) return;
    if (heading) children.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 80 } }));
    text.split(/\n\s*\n|\n/).filter(Boolean).forEach(line => children.push(new Paragraph({ children: textRuns(line.replace(/^[-•]\s*/, ""), TextRun), spacing: { after: 130, line: 320 } })));
  };
  const addSection = (number: number, title: string, intro: string, bullets: Array<[string, string]>) => {
    children.push(new Paragraph({ text: `${number}. ${title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 160 } }));
    addText(intro);
    bullets.filter(([, text]) => !!text).forEach(([label, text]) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), ...textRuns(text, TextRun)], bullet: { level: 0 }, spacing: { after: 150, line: 320 } }));
    });
  };

  addText(reading.opening);
  addSection(1, reading.ascendant.title, reading.ascendant.introduction, [["A Atmosfera do Ciclo", reading.ascendant.atmosphere], ["Ajuste de Ritmo", reading.ascendant.rhythmAdjustment], ["A Ativação", reading.ascendant.activation], ["A Bússola do Ano", reading.ascendant.compass]]);
  if (reading.stellium?.title) addSection(2, reading.stellium.title, reading.stellium.introduction, [["O Espelho Alquímico", reading.stellium.mirror], ["A Válvula de Escape", reading.stellium.bucketHandle]]);
  addSection(3, reading.lunarPhase.title, reading.lunarPhase.introduction, [["O Clima Instintivo", reading.lunarPhase.instinctiveClimate], ["Alquimia Emocional", reading.lunarPhase.emotionalAlchemy]]);
  addSection(4, reading.midheaven.title, reading.midheaven.introduction, [["A Entrega", reading.midheaven.delivery]]);
  if (reading.majorCycles?.items?.length) addSection(5, "Marcas do Tempo: Os Ciclos Maiores Ativos", reading.majorCycles.introduction, reading.majorCycles.items.map(item => [item.title, item.text]));

  children.push(new Paragraph({ text: "A Síntese do Ciclo", heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 180 } }));
  reading.synthesisRows.forEach((row, index) => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true }),
        new TextRun({ text: `${row.point}`, bold: true }),
        new TextRun({ text: ` — ${row.placement}: ` }),
        ...textRuns(row.compass, TextRun),
      ],
      spacing: { after: 140, line: 320 },
    }));
  });
  children.push(new Paragraph({ children: [new TextRun({ text: reading.closing, italics: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 120 } }));

  const doc = new Document({
    creator: "Aquar.IA Prisma",
    title: `Revolução Solar ${result.solarReturnYear} — ${userName}`,
    sections: [{ properties: { page: { margin: { top: 900, right: 800, bottom: 900, left: 800 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = (userName || "leitura").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  anchor.href = url;
  anchor.download = `aquaria-revolucao-solar-${result.solarReturnYear}-${safeName || "leitura"}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
