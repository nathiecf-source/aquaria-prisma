import React from "react";
import { Wand2, Download, Image as ImageIcon, Moon, Sun, RefreshCw, AlertCircle } from "lucide-react";
import { generatePngFromElement, downloadImage } from "../share/shareUtils";
import { CarouselCardTemplate, CarouselCardData } from "./CarouselCardTemplate";

interface CarouselGeneratorPanelProps {
  getToken: () => Promise<string | null>;
}

interface CarouselCard {
  ordem: number;
  titulo: string;
  texto: string;
}

const MAX_TEXT_LENGTH = 15000;
const MAX_BODY_CHARS = 200;
const MAX_TITLE_WORDS = 3;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isTitleValid(value: string): boolean {
  return value.trim().length > 0 && wordCount(value) <= MAX_TITLE_WORDS;
}

function isBodyValid(value: string): boolean {
  return value.trim().length > 0 && value.length <= MAX_BODY_CHARS;
}

export const CarouselGeneratorPanel: React.FC<CarouselGeneratorPanelProps> = ({ getToken }) => {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cards, setCards] = React.useState<CarouselCard[]>([]);
  const [caption, setCaption] = React.useState("");
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [format, setFormat] = React.useState<"feed" | "stories">("feed");
  const [backgroundUrl, setBackgroundUrl] = React.useState("");
  const [generatingIndex, setGeneratingIndex] = React.useState<number | null>(null);
  const [fontsReady, setFontsReady] = React.useState(false);
  const cardRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  React.useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Tenor+Sans&display=swap";
    document.head.appendChild(link);

    document.fonts.ready.then(() => setFontsReady(true)).catch(() => setFontsReady(true));
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Cole um texto para gerar o carrossel.");
      return;
    }
    setLoading(true);
    setError(null);
    setCards([]);
    setCaption("");

    try {
      const token = await getToken();
      const res = await fetch("/api/admin/carousel/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.details || `Erro ${res.status}`);
      }
      if (!Array.isArray(data.carrossel)) {
        throw new Error("Resposta inesperada do servidor.");
      }
      setCards(data.carrossel);
      setCaption(typeof data.legenda === "string" ? data.legenda : "");
    } catch (err: any) {
      setError(err?.message || "Erro ao gerar carrossel.");
      console.error("[CarouselGenerator] erro:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateCard(index: number, patch: Partial<CarouselCard>) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  async function downloadSingle(index: number) {
    const card = cards[index];
    const el = cardRefs.current[card.ordem];
    if (!el) return;
    setGeneratingIndex(index);
    try {
      await document.fonts.ready;
      const dataUrl = await generatePngFromElement(el, { pixelRatio: 1 });
      const label = card.titulo.replace(/\s+/g, "_").toLowerCase().slice(0, 30) || `card_${index + 1}`;
      downloadImage(dataUrl, `aquaria-card-${index + 1}-${label}-${format}.png`);
    } catch (err) {
      console.error("[CarouselGenerator] erro ao gerar PNG:", err);
      setError("Erro ao gerar imagem. Tente sem imagem de fundo externa (CORS).");
    } finally {
      setGeneratingIndex(null);
    }
  }

  async function downloadAll() {
    setGeneratingIndex(-1);
    try {
      for (let i = 0; i < cards.length; i++) {
        await downloadSingle(i);
      }
    } finally {
      setGeneratingIndex(null);
    }
  }

  const allValid = cards.every((c) => isTitleValid(c.titulo) && isBodyValid(c.texto));

  return (
    <section className="bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-[#6e6356]">Gerador de Carrossel</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6e2d8] text-[#6e6356] text-xs hover:border-[#8c6239] transition-colors"
          >
            {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            {theme === "dark" ? "Escuro" : "Claro"}
          </button>
          <div className="flex rounded-lg border border-[#e6e2d8] overflow-hidden">
            <button
              onClick={() => setFormat("feed")}
              className={`px-3 py-1.5 text-xs ${format === "feed" ? "bg-[#3c352d] text-[#fbf9f5]" : "text-[#6e6356]"}`}
            >
              4:5 Feed
            </button>
            <button
              onClick={() => setFormat("stories")}
              className={`px-3 py-1.5 text-xs ${format === "stories" ? "bg-[#3c352d] text-[#fbf9f5]" : "text-[#6e6356]"}`}
            >
              9:16 Stories
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-[#3c352d]">Texto original</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
          placeholder="Cole aqui o texto longo (aula, reflexão ou artigo)..."
          className="w-full h-40 p-3 rounded-xl border border-[#e6e2d8] bg-white text-sm text-[#3c352d] focus:outline-none focus:ring-2 focus:ring-[#8c6239]/30 resize-none"
        />
        <div className="flex items-center justify-between text-[10px] text-[#8c7f70]">
          <span>{text.length} / {MAX_TEXT_LENGTH}</span>
          <span>{fontsReady ? "Fontes carregadas" : "Carregando fontes..."}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-[#3c352d]">Imagem de fundo (opcional)</label>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#8c7f70]" />
          <input
            type="text"
            value={backgroundUrl}
            onChange={(e) => setBackgroundUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-... (deve permitir CORS)"
            className="flex-1 p-2.5 rounded-lg border border-[#e6e2d8] bg-white text-sm text-[#3c352d] focus:outline-none focus:ring-2 focus:ring-[#8c6239]/30"
          />
          {backgroundUrl && (
            <button
              onClick={() => setBackgroundUrl("")}
              className="text-[10px] text-[#8c7f70] hover:text-[#3c352d] underline"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-[10px] text-[#8c7f70]">
          Deixe vazio para usar o gradiente padrão da marca. URLs sem permissão CORS podem falhar e usar o fallback.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3c352d] text-[#fbf9f5] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#2a251f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? "Gerando..." : "Gerar cards"}
        </button>

        {cards.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={generatingIndex !== null || !allValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#3c352d] text-[#3c352d] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#3c352d] hover:text-[#fbf9f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar todos
          </button>
        )}
      </div>

      {caption && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#3c352d]">Legenda</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full h-32 p-3 rounded-xl border border-[#e6e2d8] bg-white text-sm text-[#3c352d] focus:outline-none focus:ring-2 focus:ring-[#8c6239]/30 resize-none"
          />
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-[#6e6356]">Cards gerados</h3>
            {!allValid && (
              <span className="text-[10px] text-red-700">Ajuste os campos inválidos antes de baixar.</span>
            )}
          </div>

          <div className="grid gap-4">
            {cards.map((card, index) => (
              <div key={card.ordem} className="rounded-xl border border-[#e6e2d8] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8c7f70]">
                    Card {card.ordem}
                  </span>
                  <button
                    onClick={() => downloadSingle(index)}
                    disabled={generatingIndex !== null || !isTitleValid(card.titulo) || !isBodyValid(card.texto)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#8c6239] hover:text-[#3c352d] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3 h-3" />
                    PNG
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <input
                      value={card.titulo}
                      onChange={(e) => updateCard(index, { titulo: e.target.value })}
                      className={`w-full p-2 rounded-lg border text-sm font-medium uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[#8c6239]/30 ${
                        isTitleValid(card.titulo) ? "border-[#e6e2d8] text-[#3c352d]" : "border-red-300 text-red-800"
                      }`}
                    />
                    <p className="text-[10px] text-[#8c7f70] mt-1">
                      {wordCount(card.titulo)} / {MAX_TITLE_WORDS} palavras
                    </p>
                  </div>
                  <div>
                    <textarea
                      value={card.texto}
                      onChange={(e) => updateCard(index, { texto: e.target.value })}
                      className={`w-full h-20 p-2 rounded-lg border text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#8c6239]/30 ${
                        isBodyValid(card.texto) ? "border-[#e6e2d8] text-[#3c352d]" : "border-red-300 text-red-800"
                      }`}
                    />
                    <p className={`text-[10px] mt-1 ${card.texto.length > MAX_BODY_CHARS ? "text-red-700" : "text-[#8c7f70]"}`}>
                      {card.texto.length} / {MAX_BODY_CHARS} caracteres
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden rendering templates for PNG export */}
      {cards.map((card) => {
        const data: CarouselCardData = {
          ordem: card.ordem,
          titulo: card.titulo,
          texto: card.texto,
        };
        return (
          <div
            key={`render-${card.ordem}`}
            style={{ position: "fixed", left: -9999, top: 0, zIndex: -1 }}
          >
            <CarouselCardTemplate
              ref={(el) => { cardRefs.current[card.ordem] = el; }}
              data={data}
              theme={theme}
              format={format}
              backgroundUrl={backgroundUrl}
            />
          </div>
        );
      })}
    </section>
  );
};
