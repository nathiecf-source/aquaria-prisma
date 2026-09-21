import React from "react";

interface Props { date: string; title: string; pada: number; padaElement: string; activeUntil: string; next: string; text: string; }

export const DailySkyNakshatraCard = React.forwardRef<HTMLDivElement, Props>(({ date, title, pada, padaElement, activeUntil, next, text }, ref) => (
  <div ref={ref} className="relative mx-auto flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden bg-[#f4f1eb] p-[7%] text-[#3c352d]" style={{ containerType: "inline-size", backgroundImage: "radial-gradient(circle at 50% 20%, rgba(92,77,102,.18), transparent 42%), radial-gradient(circle at 80% 90%, rgba(212,175,55,.14), transparent 38%)" }}>
    <div className="flex items-center justify-between border-b border-[#8c7f70]/20 pb-[4%]"><div className="flex items-center gap-[2cqw]"><img src="/logo.png" alt="Aquar.IA" className="h-[9cqw] w-[9cqw] object-contain" /><span className="font-serif text-[3cqw] uppercase tracking-[.3em]">Aquar.IA</span></div><span className="font-mono text-[2.6cqw] text-[#8c7f70]">{date.split("-").reverse().join(".")}</span></div>
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="mb-[6%] font-mono text-[2.8cqw] uppercase tracking-[.3em] text-[#8c6239]">Nakshatra · Mansão Lunar</p>
      <h2 className="font-serif text-[10cqw] leading-tight text-[#5c4d66]">{title}</h2>
      <p className="mt-[4%] font-serif text-[5cqw]">Pada {pada} · {padaElement}</p>
      <div className="my-[9%] h-px w-[24%] bg-[#d4af37]" />
      <p className="mt-[6%] max-w-[90%] font-sans text-[3.7cqw] leading-[1.55] text-[#5c544d]">{text}</p>
      <p className="mt-[6%] max-w-[88%] font-sans text-[3.5cqw] leading-relaxed text-[#5c544d]">Ativa até <strong>{activeUntil}</strong>, quando começa <strong>{next}</strong>.</p>
    </div>
    <div className="text-center font-serif text-[3cqw] italic text-[#8c7f70]">O ritmo invisível que orienta o dia</div><div className="absolute bottom-0 left-0 h-[1%] w-full bg-[#d4af37]" />
  </div>
));
DailySkyNakshatraCard.displayName = "DailySkyNakshatraCard";
