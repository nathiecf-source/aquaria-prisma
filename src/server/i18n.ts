export type AppLanguage = "pt-BR" | "en" | "es";

export function normalizeLang(value: string | undefined | null): AppLanguage {
  if (!value) return "pt-BR";
  const lower = String(value).toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  return "pt-BR";
}

export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  "pt-BR": "português brasileiro",
  en: "English",
  es: "español",
};

/** Locale BCP-47 para Intl.DateTimeFormat e afins. */
export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  "pt-BR": "pt-BR",
  en: "en-US",
  es: "es-ES",
};

/**
 * Bloco de instrução de idioma para os system prompts do Gemini.
 * Retorna string vazia para pt-BR (comportamento original inalterado).
 */
export function languageDirective(lang: AppLanguage): string {
  if (lang === "pt-BR") return "";
  const name = LANGUAGE_NAMES[lang];
  const genderNote =
    lang === "es"
      ? "\n- Adapta la concordancia de género según el perfil de la persona consultante; si el género es desconocido, utiliza recursos narrativos neutros."
      : "";
  return `

[IDIOMA DE SAÍDA — REGRA ABSOLUTA]
- TODA a resposta deve ser escrita em ${name}, do início ao fim, incluindo títulos, subtítulos, rótulos e o texto final.
- Não copie frases em português do material de entrada; traduza os fatos para ${name}.
- Preserve EXATAMENTE a estrutura de títulos/seções e o formato exigido pelo prompt.${genderNote}
- Mantenha o mesmo tom, profundidade e regras de estilo; apenas o idioma muda.`;
}

/**
 * Títulos canônicos das seções da leitura de Dashas, por idioma.
 * O parser do frontend reconhece estas variantes exatas.
 */
export const DASHA_SECTION_TITLES: Record<
  AppLanguage,
  { phase: string; ocean: string; current: string; wave: string; challenge: string; synthesis: string }
> = {
  "pt-BR": {
    phase: "Sua fase atual",
    ocean: "O Grande Oceano",
    current: "A Correnteza",
    wave: "A onda",
    challenge: "O desafio",
    synthesis: "A síntese",
  },
  en: {
    phase: "Your current phase",
    ocean: "The Great Ocean",
    current: "The Current",
    wave: "The Wave",
    challenge: "The Challenge",
    synthesis: "The Synthesis",
  },
  es: {
    phase: "Tu fase actual",
    ocean: "El Gran Océano",
    current: "La Corriente",
    wave: "La Ola",
    challenge: "El Desafío",
    synthesis: "La Síntesis",
  },
};

export const DASHA_MAIN_TITLE: Record<AppLanguage, string> = {
  "pt-BR": "A tríade do tempo cósmico",
  en: "The triad of cosmic time",
  es: "La tríada del tiempo cósmico",
};

/** Template do subtítulo de geografia: "{planet}" é substituído. */
export const DASHA_GEOGRAPHY_TITLE: Record<AppLanguage, string> = {
  "pt-BR": "A geografia de {planet} no mapa natal",
  en: "The geography of {planet} in the natal chart",
  es: "La geografía de {planet} en la carta natal",
};

/**
 * Diretiva extra para a leitura de Dashas: além do idioma, os títulos das
 * seções precisam sair exatamente nestas variantes para o parser do frontend.
 */
export function dashaLanguageDirective(lang: AppLanguage): string {
  const base = languageDirective(lang);
  if (!base) return "";
  const t = DASHA_SECTION_TITLES[lang];
  const geo = DASHA_GEOGRAPHY_TITLE[lang];
  return `${base}
- Para os títulos das seções, use EXATAMENTE estes textos (nesta ordem): "### ${DASHA_MAIN_TITLE[lang]}" como título principal, e os subtítulos em negrito: "${t.phase}", "${t.ocean}", "${t.current}", "${t.wave}", "${t.challenge}", "${t.synthesis}". O subtítulo de geografia deve ser "${geo.replace("{planet}", "[Planet]")}".`;
}
