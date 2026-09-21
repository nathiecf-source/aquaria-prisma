import React from "react";

interface DailySkySummaryCardProps {
  theme: string;
  summary: string;
  date: string;
}

export const DailySkySummaryCard = React.forwardRef<HTMLDivElement, DailySkySummaryCardProps>(({ theme, summary, date }, ref) => (
  <div ref={ref} className="relative mx-auto flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden bg-[#2b3c5c] p-[7%] text-[#fbf9f5]" style={{ containerType: "inline-size", backgroundImage: "radial-gradient(circle at 50% 15%, rgba(212,175,55,.22), transparent 35%), radial-gradient(circle at 20% 85%, rgba(92,77,102,.45), transparent 45%)" }}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[2cqw]"><img src="/logo.png" alt="Aquar.IA" className="h-[11cqw] w-[11cqw] object-contain brightness-0 invert" /><span className="font-serif text-[3cqw] uppercase tracking-[.3em]">Aquar.IA</span></div>
      <span className="font-mono text-[2.7cqw] tracking-widest text-[#e6dfcf]">{date.split("-").reverse().join(".")}</span>
    </div>
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="mb-[6%] font-mono text-[2.8cqw] uppercase tracking-[.35em] text-[#d4af37]">Céu do Dia</span>
      <h2 className="mb-[10%] max-w-[94%] font-serif text-[7.5cqw] leading-[1.22]">{theme}</h2>
      <div className="mb-[10%] h-px w-[20%] bg-[#d4af37]/60" />
      <p className="max-w-[88%] whitespace-pre-wrap font-sans text-[4cqw] leading-[1.65] text-[#f4f1eb]">{summary}</p>
    </div>
    <div className="text-center font-serif text-[3.2cqw] italic text-[#e6dfcf]">Portal 36_ · Presença e ritmo</div>
    <div className="absolute bottom-0 left-0 h-[1%] w-full bg-[#d4af37]" />
  </div>
));

DailySkySummaryCard.displayName = "DailySkySummaryCard";
