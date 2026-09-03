import { CompleteAstrologicalProfile, translateSignName } from "./astrology";

export function getDigBalaStatus(planetName: string, house: number): string {
  const digBalaFull: Record<string, number[]> = {
    "Sol": [10],
    "Marte": [10],
    "Júpiter": [1],
    "Mercúrio": [1],
    "Saturno": [7],
    "Lua": [4],
    "Vênus": [4],
  };

  const digBalaWeak: Record<string, number[]> = {
    "Sol": [4],
    "Marte": [4],
    "Júpiter": [7],
    "Mercúrio": [7],
    "Saturno": [1],
    "Lua": [10],
    "Vênus": [10],
  };

  if (["Rahu", "Ketu", "Nodo Norte", "Nodo Sul", "Ascendente"].includes(planetName)) {
    return "—";
  }

  if (digBalaFull[planetName]?.includes(house)) return "Sim";
  if (digBalaWeak[planetName]?.includes(house)) return "Fraca";
  return "Neutro";
}

export type ChartMode = "tropical" | "sidereal";

export function formatNatalContext(
  profile: CompleteAstrologicalProfile,
  mode: ChartMode,
  userName?: string
): string {
  const lines: string[] = [];

  if (userName) {
    lines.push(`NOME DA CONSULENTE: ${userName}`);
    lines.push("");
  }

  if (mode === "tropical") {
    lines.push("=== MAPA TROPICAL NATAL ===");
    lines.push("");
    lines.push("-- PLANETAS NATAIS --");
    profile.tropical_natal.planets.forEach((p) => {
      const retro = p.isRetrograde ? " (R)" : "";
      lines.push(
        `- ${p.name}: ${p.sign} ${p.degree.toFixed(2)}°, Casa ${p.house}${retro}`
      );
    });

    lines.push("");
    lines.push("-- CASAS NATAIS --");
    profile.tropical_natal.houses
      .sort((a, b) => a.house - b.house)
      .forEach((h) => {
        lines.push(
          `- Casa ${h.house}: ${h.sign} ${h.cuspDegree.toFixed(2)}° (Regente: ${h.ruler})`
        );
      });

    if (profile.tropical_natal.aspects?.length) {
      lines.push("");
      lines.push("-- ASPECTOS RELEVANTES --");
      profile.tropical_natal.aspects.forEach((a) => {
        lines.push(`- ${a.planet1} ${a.type} ${a.planet2} (orbe ${a.orb.toFixed(2)}°)`);
      });
    }
  } else {
    lines.push("=== MAPA SIDERAL (VÉDICO) NATAL ===");
    lines.push("");

    if (profile.vedic_specifics) {
      const vs = profile.vedic_specifics;
      lines.push("-- PONTOS SIDERAIS PRINCIPAIS --");
      lines.push(`- Lagna (Ascendente): ${vs.lagna || "N/A"}`);
      lines.push(`- Nakshatra do Lagna: ${vs.lagnaNakshatra || "N/A"}`);
      lines.push(`- Lagnesha: ${vs.lagnesha || "N/A"}`);
      lines.push(`- Surya Lagna: ${vs.suryaLagna || "N/A"}`);
      lines.push(`- Chandra Lagna: ${vs.chandraLagna || "N/A"}`);
      lines.push(`- Janma Nakshatra (Lua): ${vs.janmaNakshatra || "N/A"}`);
      lines.push(`- Dharma Trikona: ${vs.dharmaTrikona || "N/A"}`);
      lines.push(`- Arudha Lagna: ${vs.arudhaLag_na || "N/A"}`);
      lines.push(`- Upapada Lagna: ${vs.upapadaLag_na || "N/A"}`);
      if (vs.karakas) {
        lines.push(
          `- Karakas: Atmakaraka ${vs.karakas.atmakaraka}, Amatyakaraka ${vs.karakas.amatyakaraka}, Darakaraka ${vs.karakas.darakaraka}`
        );
      }
      if (vs.dhanaYogas?.length) {
        lines.push(`- Dhana Yogas: ${vs.dhanaYogas.join(", ")}`);
      }
      if (vs.karmaYoga) {
        lines.push(`- Karma Yoga: ${vs.karmaYoga}`);
      }
      if (vs.dusthanas?.length) {
        lines.push(
          `- Dusthanas: ${vs.dusthanas
            .map((d) => `Casa ${d.house} (regente ${d.ruler}) - ${d.status}`)
            .join("; ")}`
        );
      }
      lines.push("");
    }

    lines.push("-- PLANETAS SIDERAIS --");
    profile.vedic_natal.planets.forEach((p) => {
      const retro = p.isRetrograde ? " (R)" : "";
      const combust = p.isCombust ? " (Combusto)" : "";
      const sign = translateSignName(p.sign);
      const digBala = getDigBalaStatus(p.name, p.house);
      lines.push(
        `- ${p.name}: ${sign} ${p.degree.toFixed(2)}°, Casa ${p.house}, Nakshatra ${p.nakshatra} (pada ${p.pada}), Dignidade ${p.dignity}, Dig Bala: ${digBala}${retro}${combust}`
      );
    });

    if (profile.vedic_natal.drishti?.length) {
      lines.push("");
      lines.push("-- DRISHTI (ASPECTOS VÉDICOS) --");
      profile.vedic_natal.drishti.forEach((d) => lines.push(`- ${d}`));
    }

    if (profile.vedic_vargas) {
      lines.push("");
      lines.push("-- VARGAS --");
      lines.push(`- Navamsa (D9): ${JSON.stringify(profile.vedic_vargas.d9Navamsa)}`);
      lines.push(`- Dasamsa (D10): ${JSON.stringify(profile.vedic_vargas.d10Dasamsa)}`);
    }

    if (profile.vedic_balas?.shadbala) {
      lines.push("");
      lines.push("-- BALAS (FORÇAS) --");
      Object.entries(profile.vedic_balas.shadbala).forEach(([planet, value]) => {
        lines.push(`- ${planet}: ${value}`);
      });
    }
  }

  return lines.join("\n");
}
