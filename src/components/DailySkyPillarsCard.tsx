import React from "react";

interface Props { date: string; vedic: any; guidance: { vara: string; tithi: string; yoga: string; karana: string }; }

function tithiPakshaLabel(paksha: string): string {
  if (paksha === "Amavasya" || paksha?.toLowerCase().includes("krishna")) return "MINGUANTE";
  if (paksha?.toLowerCase().includes("shukla")) return "CRESCENTE";
  return "RECOLHIMENTO";
}

export const DailySkyPillarsCard = React.forwardRef<HTMLDivElement, Props>(({ date, vedic, guidance }, ref) => {
  const rows = [
    ["Vāra · Regente do dia", `${vedic.vara.weekday.toUpperCase()} · ${vedic.vara.ruler.toUpperCase()}`, guidance.vara],
    ["Tithi · Dia lunar", `${vedic.tithi.name.split(" ")[0].toUpperCase()} · ${vedic.tithi.number}º DIA LUNAR (${tithiPakshaLabel(vedic.tithi.paksha)})`, guidance.tithi],
    ["Yoga · Atmosfera", `${vedic.yoga.name.toUpperCase()} · ${vedic.yoga.purpose.toUpperCase()}`, guidance.yoga],
    ["Karana · Ação prática", `${vedic.karana.name.toUpperCase()} · ${vedic.karana.focus.toUpperCase()}`, guidance.karana],
  ];
  return <div ref={ref} className="relative mx-auto flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden bg-[#2b3c5c] p-[7%] text-[#fbf9f5]" style={{ containerType: "inline-size", backgroundImage: "radial-gradient(circle at 15% 10%, rgba(212,175,55,.2), transparent 35%), radial-gradient(circle at 90% 90%, rgba(92,77,102,.5), transparent 42%)" }}>
    <div className="flex items-center justify-between"><div className="flex items-center gap-[2cqw]"><img src="/logo.png" alt="Aquar.IA" className="h-[9cqw] w-[9cqw] object-contain brightness-0 invert" /><span className="font-serif text-[3cqw] uppercase tracking-[.3em]">Aquar.IA</span></div><span className="font-mono text-[2.6cqw] text-[#e6dfcf]">{date.split("-").reverse().join(".")}</span></div>
    <h2 className="mb-[7%] mt-[10%] text-center font-serif text-[8cqw]">Pilares do Dia</h2>
    <div className="flex flex-1 flex-col justify-center gap-[4%]">{rows.map(([label, value, purpose]) => <div key={label} className="border-l-2 border-[#d4af37]/70 pl-[5%]"><p className="font-mono text-[2.7cqw] uppercase tracking-[.25em] text-[#d4af37]">{label}</p><p className="mt-[1%] font-serif text-[4.5cqw]">{value}</p><p className="mt-[1%] font-sans text-[3.2cqw] leading-relaxed text-[#e6dfcf]">{purpose}</p></div>)}</div>
    <div className="text-center font-serif text-[3cqw] italic text-[#e6dfcf]">Presença para atravessar o ritmo do agora</div><div className="absolute bottom-0 left-0 h-[1%] w-full bg-[#d4af37]" />
  </div>;
});
DailySkyPillarsCard.displayName = "DailySkyPillarsCard";
