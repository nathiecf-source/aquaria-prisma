import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeLang,
  languageDirective,
  dashaLanguageDirective,
  LANGUAGE_LOCALES,
  DASHA_SECTION_TITLES,
} from "./i18n";
import {
  planetKey,
  signKey,
  aspectKey,
  parseAspectToNatal,
  natureKey,
  dignityInfo,
  dignityShortKey,
  houseTypeKey,
  restructuringCycleKey,
  dashaSectionKey,
} from "../i18n/canonical";

test("normalizeLang: fallback para pt-BR em valores ausentes/inválidos", () => {
  assert.equal(normalizeLang(undefined), "pt-BR");
  assert.equal(normalizeLang(null), "pt-BR");
  assert.equal(normalizeLang(""), "pt-BR");
  assert.equal(normalizeLang("fr"), "pt-BR");
  assert.equal(normalizeLang("de-CH"), "pt-BR");
  assert.equal(normalizeLang(42 as any), "pt-BR");
});

test("normalizeLang: mapeia variantes para idiomas suportados", () => {
  assert.equal(normalizeLang("pt-BR"), "pt-BR");
  assert.equal(normalizeLang("pt"), "pt-BR");
  assert.equal(normalizeLang("pt-PT"), "pt-BR");
  assert.equal(normalizeLang("en"), "en");
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(normalizeLang("es"), "es");
  assert.equal(normalizeLang("es-MX"), "es");
});

test("languageDirective: vazio em pt-BR, presente em en/es", () => {
  assert.equal(languageDirective("pt-BR"), "");
  assert.match(languageDirective("en"), /English/);
  assert.match(languageDirective("es"), /español/);
  // Espanhol recebe nota de concordância de gênero
  assert.match(languageDirective("es"), /g[eé]nero/i);
  assert.doesNotMatch(languageDirective("en"), /g[eé]nero/i);
});

test("dashaLanguageDirective: inclui títulos canônicos no idioma alvo", () => {
  const en = dashaLanguageDirective("en");
  for (const t of Object.values(DASHA_SECTION_TITLES.en)) {
    assert.ok(en.includes(t), `faltou título EN: ${t}`);
  }
  assert.equal(dashaLanguageDirective("pt-BR"), "");
});

test("LANGUAGE_LOCALES cobre todos os idiomas suportados", () => {
  assert.equal(LANGUAGE_LOCALES["pt-BR"], "pt-BR");
  assert.equal(LANGUAGE_LOCALES.en, "en-US");
  assert.equal(LANGUAGE_LOCALES.es, "es-ES");
});

test("planetKey mapeia nomes PT/EN/ES para chaves canônicas", () => {
  assert.equal(planetKey("Saturno"), "saturn");
  assert.equal(planetKey("Saturn"), "saturn");
  assert.equal(planetKey("Mercúrio"), "mercury");
  assert.equal(planetKey("Mercury"), "mercury");
  assert.equal(planetKey("Mercurio"), "mercury");
  assert.equal(planetKey("Vênus"), "venus");
  assert.equal(planetKey("Luna"), "moon");
  assert.equal(planetKey("Neptuno"), "neptune");
  assert.equal(planetKey("Plutón"), "pluto");
  assert.equal(planetKey("X"), null);
  assert.equal(planetKey(null), null);
});

test("signKey mapeia nomes PT/EN/ES para chaves canônicas", () => {
  assert.equal(signKey("Escorpião"), "scorpio");
  assert.equal(signKey("Scorpio"), "scorpio");
  assert.equal(signKey("Escorpio"), "scorpio");
  assert.equal(signKey("Sagitário"), "sagittarius");
  assert.equal(signKey("Sagittarius"), "sagittarius");
  assert.equal(signKey("Capricórnio"), "capricorn");
  assert.equal(signKey("Acuario"), "aquarius");
  assert.equal(signKey("Peixes"), "pisces");
  assert.equal(signKey("Piscis"), "pisces");
  assert.equal(signKey("nada"), null);
});

test("aspectKey e parseAspectToNatal extraem chaves de frases PT", () => {
  assert.equal(aspectKey("Quadratura"), "square");
  assert.equal(aspectKey("Oposición"), "opposition");
  assert.equal(aspectKey("Trígono"), "trine");
  const parsed = parseAspectToNatal("Quadratura com Marte Natal");
  assert.equal(parsed.aspect, "square");
  assert.equal(parsed.natalPlanet, "mars");
  const none = parseAspectToNatal("texto livre");
  assert.equal(none.aspect, null);
});

test("natureKey classifica rótulos PT/EN", () => {
  assert.equal(natureKey("Terreno Favorável"), "favorable");
  assert.equal(natureKey("Favorable Terrain"), "favorable");
  assert.equal(natureKey("Terreno Restritivo"), "restrictive");
  assert.equal(natureKey("Restrictive Terrain"), "restrictive");
  assert.equal(natureKey("Terreno Neutro"), "neutral");
  assert.equal(natureKey(undefined), "neutral");
});

test("dignityInfo e dignityShortKey mapeiam dignidades", () => {
  const d = dignityInfo("Domicílio em Leão");
  assert.equal(d.key, "domicile");
  assert.equal(d.sign, "leo");
  assert.equal(dignityInfo("Exaltação em Touro").key, "exaltation");
  assert.equal(dignityShortKey("Peregrino"), "peregrine");
  assert.equal(dignityShortKey("Queda"), "detriment");
});

test("houseTypeKey extrai chave de rótulo com parênteses", () => {
  assert.equal(houseTypeKey("Kendra (ângulo de manifestação)"), "kendra");
  assert.equal(houseTypeKey("Dusthana (casa de cura)"), "dusthana");
  assert.equal(houseTypeKey("outra coisa"), "neutra");
});

test("restructuringCycleKey mapeia nomes de ciclos PT", () => {
  assert.equal(restructuringCycleKey("Retorno de Saturno"), "saturnReturn");
  assert.equal(restructuringCycleKey("Shani Sade Sati — Fase de Pico"), "sadeSatiPeak");
  assert.equal(restructuringCycleKey("Ashtama Shani da Lua"), "ashtamaMoon");
  assert.equal(restructuringCycleKey("ciclo desconhecido"), null);
});

test("dashaSectionKey reconhece títulos em 3 idiomas", () => {
  assert.equal(dashaSectionKey("sua fase atual"), "phase");
  assert.equal(dashaSectionKey("the great ocean"), "ocean");
  assert.equal(dashaSectionKey("la sintesis"), "synthesis");
  assert.equal(dashaSectionKey("introducao"), "intro");
  assert.equal(dashaSectionKey("qualquer outra coisa"), null);
});
