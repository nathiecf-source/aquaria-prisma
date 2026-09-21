import React from "react";
import { Download, Loader2, X } from "lucide-react";
import Markdown from "react-markdown";
import { downloadSolarReturnDocument } from "../lib/docxExport";

export interface SolarReturnReadingData {
  opening: string;
  ascendant: { title: string; introduction: string; atmosphere: string; rhythmAdjustment: string; activation: string; compass: string };
  stellium: { title: string; introduction: string; mirror: string; bucketHandle: string };
  lunarPhase: { title: string; introduction: string; instinctiveClimate: string; emotionalAlchemy: string };
  midheaven: { title: string; introduction: string; delivery: string };
  majorCycles: { introduction: string; items: Array<{ title: string; text: string }> };
  synthesisRows: Array<{ point: string; placement: string; compass: string }>;
  closing: string;
}

export interface SolarReturnResult {
  reading: SolarReturnReadingData;
  analysis: { location: { name: string }; exactReturnInstant: string };
  solarReturnYear: number;
  validFrom: string;
  validUntil: string;
  cached: boolean;
}

interface SolarReturnModalProps {
  result: SolarReturnResult;
  userName: string;
  onClose: () => void;
}

const Text: React.FC<{ children?: string }> = ({ children }) => children ? (
  <div className="font-sans text-[14px] text-[#4a423a] leading-relaxed prose prose-sm max-w-none prose-strong:text-[#3c352d]">
    <Markdown>{children}</Markdown>
  </div>
) : null;

const Bullet: React.FC<{ label: string; text?: string }> = ({ label, text }) => text ? (
  <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
    <span className="text-[#8c6239] mt-1">•</span>
    <div><strong className="font-serif text-[#3c352d]">{label}:</strong> <span className="font-sans text-[14px] leading-relaxed text-[#4a423a]">{text}</span></div>
  </div>
) : null;

export default function SolarReturnModal({ result, userName, onClose }: SolarReturnModalProps) {
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const reading = result.reading;

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadSolarReturnDocument(result, userName);
    } catch (err: any) {
      setError(err?.message || "Não foi possível gerar o documento.");
    } finally {
      setDownloading(false);
    }
  };

  const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-[120] bg-[#1f1b18]/70 backdrop-blur-sm p-2 sm:p-6 flex items-center justify-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Leitura da Revolução Solar" className="w-full max-w-5xl max-h-[96vh] bg-[#f7f4ee] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-[#8c7f70]/15 px-5 sm:px-8 py-4 bg-[#ede9de]/60">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8c6239]">Portal do Ano</p>
            <h2 className="font-serif text-xl sm:text-2xl text-[#3c352d]">Revolução Solar {result.solarReturnYear}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg border border-[#8c6239]/30 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#8c6239] hover:bg-[#8c6239]/10 disabled:opacity-50">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} DOCX
            </button>
            <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-full text-[#8c7f70] hover:bg-[#8c7f70]/10"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-7 sm:px-10 sm:py-10 space-y-9">
          <div className="text-center space-y-2 border-b border-[#8c7f70]/15 pb-6">
            <img src="/logo.png" alt="Aquar.IA" className="w-16 h-16 object-contain mx-auto" />
            <p className="font-serif text-[#3c352d]">{result.analysis.location.name}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#8c7f70]">{dateFormat.format(new Date(result.validFrom))} — {dateFormat.format(new Date(result.validUntil))}</p>
          </div>

          <Text>{reading.opening}</Text>

          <section className="space-y-4">
            <h3 className="font-serif text-lg text-[#3c352d]">1. {reading.ascendant.title}</h3>
            <Text>{reading.ascendant.introduction}</Text>
            <div className="space-y-3 pl-1"><Bullet label="A Atmosfera do Ciclo" text={reading.ascendant.atmosphere} /><Bullet label="Ajuste de Ritmo" text={reading.ascendant.rhythmAdjustment} /><Bullet label="A Ativação" text={reading.ascendant.activation} /><Bullet label="A Bússola do Ano" text={reading.ascendant.compass} /></div>
          </section>

          {reading.stellium?.title && (
            <section className="space-y-4">
              <h3 className="font-serif text-lg text-[#3c352d]">2. {reading.stellium.title}</h3>
              <Text>{reading.stellium.introduction}</Text>
              <div className="space-y-3 pl-1"><Bullet label="O Espelho Alquímico" text={reading.stellium.mirror} /><Bullet label="A Válvula de Escape" text={reading.stellium.bucketHandle} /></div>
            </section>
          )}

          <section className="space-y-4">
            <h3 className="font-serif text-lg text-[#3c352d]">3. {reading.lunarPhase.title}</h3>
            <Text>{reading.lunarPhase.introduction}</Text>
            <div className="space-y-3 pl-1"><Bullet label="O Clima Instintivo" text={reading.lunarPhase.instinctiveClimate} /><Bullet label="Alquimia Emocional" text={reading.lunarPhase.emotionalAlchemy} /></div>
          </section>

          <section className="space-y-4">
            <h3 className="font-serif text-lg text-[#3c352d]">4. {reading.midheaven.title}</h3>
            <Text>{reading.midheaven.introduction}</Text>
            <div className="pl-1"><Bullet label="A Entrega" text={reading.midheaven.delivery} /></div>
          </section>

          {reading.majorCycles?.items?.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-serif text-lg text-[#3c352d]">5. Marcas do Tempo: Os Ciclos Maiores Ativos</h3>
              <Text>{reading.majorCycles.introduction}</Text>
              <div className="space-y-3 pl-1">{reading.majorCycles.items.map((item, index) => <Bullet key={index} label={item.title} text={item.text} />)}</div>
            </section>
          )}

          <section className="space-y-4">
            <h3 className="font-serif text-xl text-[#3c352d]">A Síntese do Ciclo</h3>
            <div className="overflow-x-auto rounded-xl border border-[#8c7f70]/20">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-[#ede9de]"><tr>{["Ponto de Ativação", "Posicionamento", "Bússola do Ano"].map(title => <th key={title} className="px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-[#5c4d66]">{title}</th>)}</tr></thead>
                <tbody>{reading.synthesisRows.map((row, index) => <tr key={index} className="border-t border-[#8c7f70]/15"><td className="px-4 py-3 font-serif text-sm text-[#3c352d]">{row.point}</td><td className="px-4 py-3 text-sm text-[#4a423a]">{row.placement}</td><td className="px-4 py-3 text-sm text-[#4a423a] leading-relaxed">{row.compass}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <blockquote className="border-l-2 border-[#8c6239] pl-5 py-2 font-serif italic text-[#5c4d66] text-base leading-relaxed">{reading.closing}</blockquote>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
