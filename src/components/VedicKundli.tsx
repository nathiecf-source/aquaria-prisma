import React from "react";

/**
 * Kundli em grade sul-indiana (4×4) com glifos tropicais dos signos.
 * Signos em posições fixas no sentido anti-horário; planetas distribuídos
 * pelo signo sideral (Rasi/D-1). A casa do Lagna é marcada.
 */

const SIGN_GLYPHS: Record<string, string> = {
  "Áries": "♈", "Touro": "♉", "Gêmeos": "♊", "Câncer": "♋",
  "Leão": "♌", "Virgem": "♍", "Libra": "♎", "Escorpião": "♏",
  "Sagitário": "♐", "Capricórnio": "♑", "Aquário": "♒", "Peixes": "♓",
};

const PLANET_GLYPHS: Record<string, string> = {
  "Sol": "☉", "Lua": "☽", "Marte": "♂", "Mercúrio": "☿",
  "Júpiter": "♃", "Vênus": "♀", "Saturno": "♄",
  "Nodo Norte": "☊", "Nodo Sul": "☋", "Rahu": "☊", "Ketu": "☋",
};

const PLANET_ABBR: Record<string, string> = {
  "Sol": "Sol", "Lua": "Lua", "Marte": "Mar", "Mercúrio": "Mer",
  "Júpiter": "Jup", "Vênus": "Ven", "Saturno": "Sat",
  "Nodo Norte": "Rahu", "Nodo Sul": "Ketu", "Rahu": "Rahu", "Ketu": "Ketu",
};

// Posição fixa de cada signo na grade sul-indiana: [linha, coluna] 0-indexed.
const SOUTH_INDIAN_CELLS: { sign: string; row: number; col: number }[] = [
  { sign: "Peixes", row: 0, col: 0 },
  { sign: "Áries", row: 0, col: 1 },
  { sign: "Touro", row: 0, col: 2 },
  { sign: "Gêmeos", row: 0, col: 3 },
  { sign: "Aquário", row: 1, col: 0 },
  { sign: "Câncer", row: 1, col: 3 },
  { sign: "Capricórnio", row: 2, col: 0 },
  { sign: "Leão", row: 2, col: 3 },
  { sign: "Sagitário", row: 3, col: 0 },
  { sign: "Escorpião", row: 3, col: 1 },
  { sign: "Libra", row: 3, col: 2 },
  { sign: "Virgem", row: 3, col: 3 },
];

export interface KundliPlanet {
  name: string;
  sign: string;
  degree?: number;
  isRetrograde?: boolean;
}

interface VedicKundliProps {
  planets: KundliPlanet[];
  lagna?: string;
  title?: string;
}

export const VedicKundli: React.FC<VedicKundliProps> = ({ planets, lagna, title }) => {
  const bySign = new Map<string, KundliPlanet[]>();
  for (const p of planets) {
    const list = bySign.get(p.sign) || [];
    list.push(p);
    bySign.set(p.sign, list);
  }

  const grid: (typeof SOUTH_INDIAN_CELLS[number] | "center" | null)[][] =
    Array.from({ length: 4 }, () => Array(4).fill(null));
  for (const cell of SOUTH_INDIAN_CELLS) grid[cell.row][cell.col] = cell;
  grid[1][1] = "center"; grid[1][2] = "center";
  grid[2][1] = "center"; grid[2][2] = "center";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="grid aspect-square grid-cols-4 overflow-hidden rounded-xl border border-[#8c7f70]/30 bg-[#fbf9f5]">
        {grid.flatMap((rowArr, r) =>
          rowArr.map((cell, c) => {
            if (cell === "center") {
              return r === 1 && c === 1 ? (
                <div
                  key="center"
                  className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-1 border-[#8c7f70]/20 bg-[#f4f1eb]/60 p-2 text-center"
                  style={{ gridColumn: "2 / span 2", gridRow: "2 / span 2" }}
                >
                  <span className="font-serif text-sm uppercase tracking-widest text-[#3c352d]">
                    {title || "Rasi · D-1"}
                  </span>
                  {lagna && (
                    <span className="text-[10px] uppercase tracking-wider text-[#8c7f70]">
                      Lagna {SIGN_GLYPHS[lagna] || ""} {lagna}
                    </span>
                  )}
                </div>
              ) : null;
            }
            if (!cell) return null;
            const signPlanets = bySign.get(cell.sign) || [];
            const isLagna = lagna === cell.sign;
            return (
              <div
                key={cell.sign}
                className={`relative flex flex-col border border-[#8c7f70]/20 p-1.5 ${
                  isLagna ? "bg-[#8c6239]/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base leading-none text-[#8c6239]" title={cell.sign}>
                    {SIGN_GLYPHS[cell.sign] || cell.sign}
                  </span>
                  {isLagna && (
                    <span className="rounded bg-[#8c6239] px-1 text-[8px] font-bold uppercase text-white">
                      Asc
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-1 flex-wrap content-start gap-x-1.5 gap-y-0.5">
                  {signPlanets.map((p) => (
                    <span
                      key={p.name}
                      className="inline-flex items-baseline gap-0.5 text-[10px] font-medium text-[#3c352d]"
                      title={`${PLANET_ABBR[p.name] || p.name} ${typeof p.degree === "number" ? p.degree.toFixed(1) : ""}°${p.isRetrograde ? " ℞" : ""}`}
                    >
                      <span className="text-[11px]">{PLANET_GLYPHS[p.name] || ""}</span>
                      {PLANET_ABBR[p.name] || p.name}
                      {p.isRetrograde && <span className="text-[8px]">℞</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VedicKundli;
