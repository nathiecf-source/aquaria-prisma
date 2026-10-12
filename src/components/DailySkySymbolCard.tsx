import React from "react";

interface Props { date: string; nakshatraName: string; symbolTitle: string; text: string; }

export const DailySkySymbolCard = React.forwardRef<HTMLDivElement, Props>(({ date, nakshatraName, symbolTitle, text }, ref) => (
  <div ref={ref} className="relative mx-auto flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden bg-[#f4f1eb] p-[7%] text-[#3c352d]" style={{ containerType: "inline-size", backgroundImage: "radial-gradient(circle at 80% 15%, rgba(92,77,102,.16), transparent 40%), radial-gradient(circle at 15% 85%, rgba(140,98,57,.14), transparent 42%)" }}>
    <div className="flex items-center justify-between border-b border-[#8c7f70]/20 pb-[4%]"><div className="flex items-center gap-[2cqw]"><img src="/logo.png" alt="Aquar.IA" className="h-[9cqw] w-[9cqw] object-contain" /><span className="font-serif text-[3cqw] uppercase tracking-[.3em]">Aquar.IA</span></div><span className="font-mono text-[2.6cqw] text-[#8c7f70]">{date.split("-").reverse().join(".")}</span></div>
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="mb-[5%] font-mono text-[2.8cqw] uppercase tracking-[.3em] text-[#8c6239]">Símbolo Sagrado</p>
      <h2 className="font-serif text-[9cqw] leading-tight text-[#5c4d66]">{nakshatraName}</h2>
      <p className="mt-[3%] font-serif text-[4.5cqw] italic text-[#8c6239]">{symbolTitle}</p>
      <div className="my-[8%] h-px w-[24%] bg-[#d4af37]" />
      <p className="max-w-[90%] whitespace-pre-wrap font-sans text-[3.7cqw] leading-[1.6] text-[#5c544d]">{text}</p>
    </div>
    <div className="text-center font-serif text-[3cqw] italic text-[#8c7f70]">A linguagem dos símbolos é a linguagem da alma</div><div className="absolute bottom-0 left-0 h-[1%] w-full bg-[#d4af37]" />
  </div>
));
DailySkySymbolCard.displayName = "DailySkySymbolCard";
