import React from "react";

interface DailySkyStoryCardProps {
  title: string;
  text: string;
  date: string;
}

export const DailySkyStoryCard = React.forwardRef<HTMLDivElement, DailySkyStoryCardProps>(({ title, text, date }, ref) => (
  <div ref={ref} className="relative mx-auto flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden bg-[#f4f1eb] p-[7%] text-[#3c352d]" style={{ containerType: "inline-size", backgroundImage: "radial-gradient(circle at 15% 10%, rgba(92,77,102,.14), transparent 38%), radial-gradient(circle at 85% 90%, rgba(212,175,55,.15), transparent 42%)" }}>
    <div className="flex items-center justify-between border-b border-[#8c7f70]/20 pb-[4%]">
      <div className="flex items-center gap-[2cqw]"><img src="/logo.png" alt="Aquar.IA" className="h-[9cqw] w-[9cqw] object-contain" /><span className="font-serif text-[3cqw] uppercase tracking-[.3em]">Aquar.IA</span></div>
      <span className="font-mono text-[2.6cqw] uppercase tracking-widest text-[#8c7f70]">{date.split("-").reverse().join(".")}</span>
    </div>
    <div className="flex flex-1 flex-col justify-center px-[3%]">
      <h2 className="mb-[8%] font-serif text-[7cqw] leading-tight text-[#3c352d]">{title}</h2>
      <p className="whitespace-pre-wrap font-sans text-[4.2cqw] leading-[1.6] text-[#5c544d]">{text}</p>
    </div>
    <div className="border-t border-[#8c7f70]/20 pt-[4%] text-center font-serif text-[3cqw] italic tracking-wide text-[#8c7f70]">Habitar a si mesma com reverência</div>
    <div className="absolute bottom-0 left-0 h-[1%] w-full bg-[#d4af37]" />
  </div>
));

DailySkyStoryCard.displayName = "DailySkyStoryCard";
