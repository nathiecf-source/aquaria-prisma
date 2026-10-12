import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getPreferredLang, setStoredLang, normalizeLang } from "../lib/lang";
import ptBR from "./locales/pt-BR";
import en from "./locales/en";
import es from "./locales/es";

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: getPreferredLang(),
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", (lng) => {
  setStoredLang(normalizeLang(lng));
});

export default i18n;
