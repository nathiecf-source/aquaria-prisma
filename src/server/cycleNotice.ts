import crypto from "crypto";
import type { TransitAspect } from "./transitEngine";
import type { RestructuringCycle } from "./restructuringCyclesEngine";

export type CycleNoticeTab = "dashas" | "portal" | "transits";

export interface CycleSignature {
  signature: string;
  identities: string[];
}

function normalizePart(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
}

export function createCycleSignature(identities: string[]): CycleSignature {
  const canonical = Array.from(new Set(identities.map(normalizePart).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return {
    signature: crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex"),
    identities: canonical,
  };
}

export function createDashaSignature(timing: any): CycleSignature {
  return createCycleSignature([
    `maha|${normalizePart(timing?.mahadasha)}`,
    `antar|${normalizePart(timing?.antardasha)}`,
    `pratyan|${normalizePart(timing?.pratyantardasha)}`,
  ]);
}

export function createPortalSignature(profection: any, solarReturnYear: number): CycleSignature {
  const lordIdentities = (profection?.lords || []).map((lord: any) =>
    `lord|${normalizePart(lord?.name)}|${normalizePart(lord?.source)}|${normalizePart(lord?.sign)}|${normalizePart(lord?.house)}`
  );
  return createCycleSignature([
    `age|${normalizePart(profection?.age)}`,
    `house|${normalizePart(profection?.profectedHouse)}`,
    `sign|${normalizePart(profection?.sign)}`,
    `primary|${normalizePart(profection?.primaryLord)}`,
    `source|${normalizePart(profection?.source)}`,
    `solar-year|${normalizePart(solarReturnYear)}`,
    ...lordIdentities,
  ]);
}

export function createTransitSignature(aspects: TransitAspect[], cycles: RestructuringCycle[] = []): CycleSignature {
  const transitIdentities = aspects.map((aspect) =>
    `transit|${normalizePart(aspect.planeta_transito)}|${normalizePart(aspect.aspecto)}|${normalizePart(aspect.planeta_natal)}|house-${normalizePart(aspect.casa_natal)}`
  );
  const cycleIdentities = cycles
    .filter((cycle) => cycle.isActive || cycle.type === "proximo")
    .map((cycle) =>
      `cycle|${normalizePart(cycle.tradition)}|${normalizePart(cycle.planet)}|${normalizePart(cycle.cycleName)}|${normalizePart(cycle.type)}|house-${normalizePart(cycle.affectedHouse)}`
    );
  return createCycleSignature([...transitIdentities, ...cycleIdentities]);
}
