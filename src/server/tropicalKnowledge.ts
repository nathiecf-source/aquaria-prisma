import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const KNOWLEDGE_ROOT = path.resolve(process.cwd(), "src", "knowledge", "tropical");
const MAX_DOCUMENT_CHARACTERS = 2_000;

type KnowledgeCategory = "casas" | "planetas" | "signos";

interface KnowledgeDocument {
  category: KnowledgeCategory;
  slug: string;
  title: string;
  content: string;
}

let knowledgeCache: KnowledgeDocument[] | null = null;

const normalizeSlug = (value: string): string => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "-");

const categoryDirectories: Record<KnowledgeCategory, string> = {
  casas: "casas",
  planetas: "planetas",
  signos: "signos"
};

const loadCategory = async (category: KnowledgeCategory): Promise<KnowledgeDocument[]> => {
  const directory = path.join(KNOWLEDGE_ROOT, categoryDirectories[category]);

  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));

    return Promise.all(markdownFiles.map(async (entry) => {
      const content = await readFile(path.join(directory, entry.name), "utf8");
      const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || entry.name.replace(/\.md$/, "");

      return {
        category,
        slug: normalizeSlug(entry.name.replace(/\.md$/, "")),
        title,
        content: content.trim()
      };
    }));
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
};

const loadKnowledge = async (): Promise<KnowledgeDocument[]> => {
  if (!knowledgeCache) {
    const collections = await Promise.all(
      (Object.keys(categoryDirectories) as KnowledgeCategory[]).map(loadCategory)
    );
    knowledgeCache = collections.flat();
  }

  return knowledgeCache;
};

const findDocument = (
  documents: KnowledgeDocument[],
  category: KnowledgeCategory,
  value: string | undefined
): KnowledgeDocument | undefined => {
  if (!value || value === "Desconhecido") return undefined;
  return documents.find((document) => document.category === category && document.slug === normalizeSlug(value));
};

export async function getTropicalHouseKnowledge(input: {
  house: number;
  cuspSign: string;
  ruler: string;
  rulerSign: string;
  occupants: string[];
}): Promise<string> {
  const documents = await loadKnowledge();
  const selected = [
    findDocument(documents, "casas", `casa-${input.house}`),
    findDocument(documents, "signos", input.cuspSign),
    findDocument(documents, "planetas", input.ruler),
    findDocument(documents, "signos", input.rulerSign),
    ...input.occupants.map((occupant) => findDocument(documents, "planetas", occupant))
  ].filter((document): document is KnowledgeDocument => Boolean(document));

  const uniqueDocuments = Array.from(new Map(selected.map((document) => [`${document.category}:${document.slug}`, document])).values());

  if (uniqueDocuments.length === 0) return "";

  return uniqueDocuments
    .map((document) => `[BASE PRIMÁRIA LOCAL — ${document.category.toUpperCase()} — ${document.title}]\n${document.content.slice(0, MAX_DOCUMENT_CHARACTERS)}`)
    .join("\n\n");
}
