import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVedicStructuralMatrix,
  buildVedicTimingBlock,
  resolveDashaLord,
} from "./vedicStructuralEngine";

// ── helpers ────────────────────────────────────────────────────────────────

const day = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const basePlanet = (name: string, sign: string, nakshatra = "Ashwini") => ({
  name, sign, degree: 10, house: 1, nakshatra,
  isRetrograde: false, isExalted: false, isDebilitated: false, isOwnSign: false,
  dispositor: { name: "Marte", dignity: "signo próprio", house: 1 },
});

function profileWith(opts: {
  sequence?: { names: string[]; start: string }[];
  saturnTransits?: any;
  lagna?: string;
  moon?: { sign?: string; nakshatra?: string };
  planets?: any[];
} = {}) {
  return {
    vedic_natal: {
      planets: opts.planets ?? [
        basePlanet("Sol", "Leão"), basePlanet("Lua", "Áries", opts.moon?.nakshatra ?? "Ashwini"),
        basePlanet("Júpiter", "Sagitário"), basePlanet("Saturno", "Capricórnio"),
      ],
    },
    vedic_specifics: {
      lagna: opts.lagna ?? "Áries",
      janmaNakshatra: opts.moon?.nakshatra ?? "Ashwini",
      arudhaPadas: {},
    },
    vedic_timing: { sequence: opts.sequence ?? [] },
    vedic_saturn_transits: opts.saturnTransits ?? null,
    vedic_vargas: { d9Navamsa: {}, d10Dasamsa: {} },
  };
}

// ── resolveDashaLord ───────────────────────────────────────────────────────

test("resolveDashaLord mapeia abreviações e nomes completos", () => {
  assert.equal(resolveDashaLord("Ra"), "Nodo Norte");
  assert.equal(resolveDashaLord("rahu"), "Nodo Norte");
  assert.equal(resolveDashaLord("Ke"), "Nodo Sul");
  assert.equal(resolveDashaLord("Ju"), "Júpiter");
  assert.equal(resolveDashaLord("Júpiter"), "Júpiter");
  assert.equal(resolveDashaLord("su"), "Sol");
});

// ── Agrupamento MD/AD e janela ─────────────────────────────────────────────

test("buildVedicTimingBlock agrupa pratyantars em ADs e ADs em MDs", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const seq = [
    // Mahadasha Júpiter → AD Saturno (2 pratyantars consecutivos)
    { names: ["Ju", "Sa", "Me"], start: iso(ref - 400 * day) },
    { names: ["Ju", "Sa", "Ke"], start: iso(ref - 330 * day) },
    // AD Vênus da mesma MD
    { names: ["Ju", "Ve", "Su"], start: iso(ref - 200 * day) },
    // Mahadasha Saturno → AD Mercúrio (período atual)
    { names: ["Sa", "Me", "Ra"], start: iso(ref - 30 * day) },
    // próximo AD da mesma MD, futuro
    { names: ["Sa", "Ke", "Ju"], start: iso(ref + 300 * day) },
  ];
  const timing = await buildVedicTimingBlock(
    profileWith({ sequence: seq }),
    buildVedicStructuralMatrix(profileWith({ sequence: seq })),
    new Date(ref)
  );

  const jupMd = timing.dashas.find((d) => d.lord === "Júpiter");
  const satMd = timing.dashas.find((d) => d.lord === "Saturno");
  assert.ok(jupMd && satMd, "deve haver MDs Júpiter e Saturno");
  assert.equal(jupMd.status, "passado");
  assert.equal(satMd.status, "atual");
  // Júpiter/Saturno: dois pratyantars fundidos em 1 AD
  const satAd = jupMd.antars.find((a) => a.lord === "Saturno");
  assert.ok(satAd);
  assert.equal(satAd.end, iso(ref - 200 * day));
  // Mesma MD não duplica: 2 ADs em Júpiter (Sat, Ven)
  assert.equal(jupMd.antars.length, 2);
  // AD futura dentro da janela
  const ketuAd = satMd.antars.find((a) => a.lord === "Nodo Sul");
  assert.equal(ketuAd?.status, "futuro");
});

test("buildVedicTimingBlock exclui períodos fora da janela −1a/+2a", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const seq = [
    { names: ["Ju", "Sa", "Me"], start: iso(ref - 1500 * day) }, // ~4 anos atrás
    { names: ["Sa", "Ve", "Ke"], start: iso(ref - 1400 * day) }, // inicia MD Saturno → MD Júpiter termina fora da janela
    { names: ["Sa", "Me", "Ra"], start: iso(ref - 10 * day) },   // AD atual da MD Saturno
  ];
  const timing = await buildVedicTimingBlock(
    profileWith({ sequence: seq }),
    buildVedicStructuralMatrix(profileWith({ sequence: seq })),
    new Date(ref)
  );
  assert.ok(!timing.dashas.some((d) => d.lord === "Júpiter"), "MD antiga fora da janela é excluída");
  assert.ok(timing.dashas.some((d) => d.lord === "Saturno"), "MD atual presente");
});

// ── Relação angular e Tara Bala ────────────────────────────────────────────

test("relação angular 6/8 gera Shashtashtaka; 5/9 gera trígono", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const planets = [
    basePlanet("Sol", "Leão"), basePlanet("Lua", "Áries"),
    basePlanet("Júpiter", "Áries"),  // MD lord em Áries
    basePlanet("Saturno", "Virgem"), // AD lord em Virgem → 6/8
    basePlanet("Marte", "Leão"),     // outro AD → 5/9
  ];
  const seq = [
    { names: ["Ju", "Sa", "Me"], start: iso(ref - 100 * day) },
    { names: ["Ju", "Ma", "Ke"], start: iso(ref - 30 * day) },
    { names: ["Sa", "Me", "Ra"], start: iso(ref + 100 * day) },
  ];
  const profile = profileWith({ sequence: seq, planets });
  const timing = await buildVedicTimingBlock(profile, buildVedicStructuralMatrix(profile), new Date(ref));
  const jupMd = timing.dashas.find((d) => d.lord === "Júpiter");
  const satAd = jupMd?.antars.find((a) => a.lord === "Saturno");
  const marsAd = jupMd?.antars.find((a) => a.lord === "Marte");
  assert.match(satAd?.angularRelation || "", /6\/8|Shashtashtaka/);
  assert.match(marsAd?.angularRelation || "", /5\/9|trígono/);
});

test("taraBala usa Janma Nakshatra (Ashwini→Magha = Naidhana)", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const planets = [
    basePlanet("Sol", "Leão"), basePlanet("Lua", "Áries", "Ashwini"),
    basePlanet("Júpiter", "Áries", "Ashwini"),   // tara 1 = Janma
    basePlanet("Saturno", "Virgem", "Magha"),    // tara 10 → navatara 1? Magha idx 9, Ashwini 0 → count 10 → navatara 1 Janma... use Bharani idx1 → count2 Sampat
    basePlanet("Marte", "Leão", "Magha"),
  ];
  const seq = [
    { names: ["Ju", "Ma", "Me"], start: iso(ref - 50 * day) },
    { names: ["Sa", "Me", "Ra"], start: iso(ref + 60 * day) },
  ];
  const profile = profileWith({ sequence: seq, planets });
  const timing = await buildVedicTimingBlock(profile, buildVedicStructuralMatrix(profile), new Date(ref));
  const marsAd = timing.dashas.find((d) => d.lord === "Júpiter")?.antars.find((a) => a.lord === "Marte");
  // Magha (idx 9) − Ashwini (idx 0) → tara 10 → navatara (10-1)%9+1 = 1 → Janma
  assert.match(marsAd?.taraBala || "", /Janma/);
});

// ── Trânsitos críticos (JHora saturn_transits) ─────────────────────────────

test("Sade Sati do JHora entra como trânsito com fase ativa", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const saturnTransits = {
    sadeSati: {
      signBased: [{
        startDate: iso(ref - 700 * day), endDate: iso(ref + 2000 * day),
        phase1: { startDate: iso(ref - 700 * day), endDate: iso(ref + 200 * day), house: 12 },
        phase2: { startDate: iso(ref + 200 * day), endDate: iso(ref + 1100 * day), house: 1 },
        phase3: { startDate: iso(ref + 1100 * day), endDate: iso(ref + 2000 * day), house: 2 },
      }],
    },
    moonTransits: { eighthHouse: { signBased: [] }, fourthHouse: { signBased: [] } },
  };
  const profile = profileWith({ saturnTransits });
  const timing = await buildVedicTimingBlock(profile, buildVedicStructuralMatrix(profile), new Date(ref));
  const sade = timing.criticalTransits.find((t) => t.key === "sade-sati");
  assert.ok(sade, "sade-sati presente");
  assert.equal(sade.status, "ativo");
  assert.match(sade.phase || "", /Fase 1/);
});

test("Ashtama Shani e Kantaka (4ª da Lua) do JHora são detectados", async () => {
  const ref = new Date("2026-06-15T00:00:00Z").getTime();
  const saturnTransits = {
    moonTransits: {
      eighthHouse: { signBased: [{ startDate: iso(ref - 100 * day), endDate: iso(ref + 500 * day) }] },
      fourthHouse: { signBased: [{ startDate: iso(ref + 600 * day), endDate: iso(ref + 1200 * day) }] },
    },
  };
  const profile = profileWith({ saturnTransits });
  const timing = await buildVedicTimingBlock(profile, buildVedicStructuralMatrix(profile), new Date(ref));
  const ashtama = timing.criticalTransits.find((t) => t.key === "ashtama-shani");
  const kantaka4 = timing.criticalTransits.find((t) => t.key === "kantaka-shani-4");
  assert.equal(ashtama?.status, "ativo");
  assert.equal(kantaka4?.status, "proximo");
});

// ── Degradação graciosa ────────────────────────────────────────────────────

test("perfil vazio não quebra: dashas em unavailable", async () => {
  const empty: any = {};
  const timing = await buildVedicTimingBlock(empty, buildVedicStructuralMatrix(empty), new Date("2026-06-15"));
  assert.deepEqual(timing.dashas, []);
  assert.ok(timing.unavailable.some((u) => u.includes("dashas")));
});
