export type AppLanguage = "pt-BR" | "en" | "es";

const STORAGE_KEY = "aquaria.lang";

const SUPPORTED: AppLanguage[] = ["pt-BR", "en", "es"];

/**
 * Normaliza um código de idioma para um dos suportados.
 * Ex.: "pt" -> "pt-BR", "en-US" -> "en", "es-MX" -> "es".
 */
export function normalizeLang(value: string | undefined | null): AppLanguage {
  if (!value) return "pt-BR";
  const lower = value.toLowerCase();

  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";

  return "pt-BR";
}

/**
 * Retorna o idioma armazenado no localStorage, se válido.
 */
export function getStoredLang(): AppLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as AppLanguage)) {
      return stored as AppLanguage;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Persiste o idioma no localStorage.
 */
export function setStoredLang(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/**
 * Detecta o idioma preferido do navegador.
 */
export function getBrowserLang(): AppLanguage {
  const nav = navigator.language || (navigator as any).userLanguage || "pt-BR";
  return normalizeLang(nav);
}

/**
 * Retorna o idioma efetivo: salvo → navegador → padrão.
 */
export function getPreferredLang(): AppLanguage {
  return getStoredLang() || getBrowserLang();
}
