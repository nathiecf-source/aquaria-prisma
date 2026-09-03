import React from "react";
import { Lock } from "lucide-react";
import { PLANET_GLYPHS } from "../lib/planetGlyphs";

interface PlanetGlyphBarProps {
  profile: any;
  subscriptionTier: "FREE" | "PLUS";
  selectedPlanetId: string | null;
  onSelect: (planetId: string) => void;
  onLockedClick: () => void;
}

function resolvePosition(profile: any, config: typeof PLANET_GLYPHS[number]): { sign: string; degree: number } | null {
  if (!profile?.tropical_natal) return null;
  if (config.isAngle) {
    const houseNumber = config.id === "asc" ? 1 : 10;
    const house = profile.tropical_natal.houses?.find((h: any) => h.house === houseNumber);
    if (!house) return null;
    return { sign: house.sign, degree: house.cuspDegree ?? 0 };
  }
  const planet = profile.tropical_natal.planets?.find((p: any) => p.name === config.canonicalName);
  if (!planet) return null;
  return { sign: planet.sign, degree: planet.degree ?? 0 };
}

const SIGN_ABBREV: Record<string, string> = {
  "Áries": "Ári", "Touro": "Tou", "Gêmeos": "Gêm", "Câncer": "Cân",
  "Leão": "Leã", "Virgem": "Vir", "Libra": "Lib", "Escorpião": "Esc",
  "Sagitário": "Sag", "Capricórnio": "Cap", "Aquário": "Aqu", "Peixes": "Pei",
};

const PlanetGlyphBar: React.FC<PlanetGlyphBarProps> = ({
  profile,
  subscriptionTier,
  selectedPlanetId,
  onSelect,
  onLockedClick,
}) => {
  if (!profile?.tropical_natal) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-3">
      <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em] text-center mb-2">
        ✦ Engrenagens Celestes ✦
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 pb-2 px-1">
        {PLANET_GLYPHS.map((config) => {
          const position = resolvePosition(profile, config);
          const isLocked = !config.isFree && subscriptionTier === "FREE";
          const isActive = selectedPlanetId === config.id;

          return (
            <button
              key={config.id}
              onClick={() => (isLocked ? onLockedClick() : onSelect(config.id))}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-11 sm:w-12 md:w-[58px] py-2 px-1 rounded-lg border transition-all ${
                isActive
                  ? "border-[#8c6239] bg-[#8c6239]/10 shadow-[0_0_0_1px_rgba(140,98,57,0.3)]"
                  : "border-[#8c7f70]/15 bg-[#faf9f6] hover:border-[#8c7f70]/35 hover:bg-[#f4f1eb]"
              }`}
              title={`${config.label}${position ? ` em ${position.sign}` : ""}`}
            >
              {isLocked && (
                <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-[#8c7f70]/60" />
              )}
              <span className={`text-base leading-none ${isActive ? "text-[#8c6239]" : "text-[#5c544d]"}`}>
                {config.glyph}
              </span>
              <span className="font-mono text-[7px] text-[#8c7f70] uppercase tracking-wider leading-none whitespace-nowrap">
                {position ? `${SIGN_ABBREV[position.sign] || position.sign} ${Math.floor(position.degree)}°` : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlanetGlyphBar;
