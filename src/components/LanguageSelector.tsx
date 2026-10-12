import React from "react";
import { useTranslation } from "react-i18next";
import { normalizeLang, setStoredLang, AppLanguage } from "../lib/lang";

const OPTIONS: { value: AppLanguage; labelKey: "ptBR" | "en" | "es" }[] = [
  { value: "pt-BR", labelKey: "ptBR" },
  { value: "en", labelKey: "en" },
  { value: "es", labelKey: "es" },
];

export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const current = normalizeLang(i18n.language);

  return (
    <div
      className="flex items-center bg-white/60 rounded-lg p-0.5 border border-[#d9d4c7]"
      role="group"
      aria-label={t("lang.label")}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setStoredLang(opt.value);
            i18n.changeLanguage(opt.value);
          }}
          className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors ${
            current === opt.value
              ? "bg-[#8c6239] text-white"
              : "text-[#8c7f70] hover:text-[#4a3f35]"
          }`}
        >
          {t(`lang.${opt.labelKey}`)}
        </button>
      ))}
    </div>
  );
};
