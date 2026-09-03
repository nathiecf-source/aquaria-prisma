import { toPng } from "html-to-image";
import { PDFDocument } from "pdf-lib";

const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export async function exportChatToPdf(element: HTMLElement, userName?: string) {
  if (!element) return;

  // Cria um wrapper no DOM para renderizar a conversa completa sem cortes
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.zIndex = "-1000";
  wrapper.style.width = `${A4_WIDTH_PX}px`;
  wrapper.style.maxWidth = `${A4_WIDTH_PX}px`;
  wrapper.style.height = "auto";
  wrapper.style.maxHeight = "none";
  wrapper.style.overflow = "visible";
  wrapper.style.backgroundColor = "#ffffff";
  wrapper.style.color = "#4a3f35";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "20px";
  wrapper.style.padding = "20px";
  wrapper.style.boxSizing = "border-box";

  // Cabeçalho do PDF
  const header = document.createElement("div");
  header.style.paddingBottom = "12px";
  header.style.borderBottom = "1px solid #d9d4c7";

  const title = document.createElement("div");
  title.style.cssText = "font-family: sans-serif; font-size: 18px; font-weight: 600; color: #4a3f35;";
  title.textContent = "Aquar.IA Chat";
  header.appendChild(title);

  const meta = document.createElement("div");
  meta.style.cssText = "font-family: sans-serif; font-size: 12px; color: #8c7f70; margin-top: 4px;";
  meta.textContent = `${userName || "Consulente"} · ${new Date().toLocaleDateString("pt-BR")}`;
  header.appendChild(meta);

  wrapper.appendChild(header);

  // Clona as mensagens sem as restrições de scroll/max-height
  const clone = element.cloneNode(true) as HTMLElement;
  clone.className = "";
  clone.style.position = "static";
  clone.style.width = "100%";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.backgroundColor = "transparent";
  clone.style.display = "flex";
  clone.style.flexDirection = "column";
  clone.style.gap = "20px";
  clone.style.padding = "0";
  clone.style.margin = "0";

  // Remove possíveis indicadores de loading do clone
  clone.querySelectorAll(".animate-pulse").forEach((el) => el.parentElement?.removeChild(el));

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const dataUrl = await toPng(wrapper, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const fullImage = new Image();
    fullImage.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      fullImage.onload = () => resolve();
      fullImage.onerror = reject;
    });

    const imgWidth = fullImage.naturalWidth;
    const imgHeight = fullImage.naturalHeight;

    const pagePixelWidth = A4_WIDTH_PX * 2;
    const pagePixelHeight = A4_HEIGHT_PX * 2;

    const scale = pagePixelWidth / imgWidth;
    const scaledTotalHeight = imgHeight * scale;

    const pagesNeeded = Math.max(1, Math.ceil(scaledTotalHeight / pagePixelHeight));

    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < pagesNeeded; i++) {
      const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

      const canvas = document.createElement("canvas");
      canvas.width = pagePixelWidth;
      canvas.height = pagePixelHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // Fundo branco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calcula a fatia da imagem correspondente a esta página
      const sourceY = (i * pagePixelHeight) / scale;
      const sourceHeight = Math.min(pagePixelHeight / scale, imgHeight - sourceY);
      const drawHeight = sourceHeight * scale;

      ctx.drawImage(
        fullImage,
        0,
        sourceY,
        imgWidth,
        sourceHeight,
        0,
        0,
        pagePixelWidth,
        drawHeight
      );

      const pageDataUrl = canvas.toDataURL("image/png");
      const pageImageBytes = await fetch(pageDataUrl).then((res) => res.arrayBuffer());
      const pageImage = await pdfDoc.embedPng(pageImageBytes);

      page.drawImage(pageImage, {
        x: 0,
        y: 0,
        width: A4_WIDTH_PT,
        height: A4_HEIGHT_PT,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `AquarIA_Chat_${userName || "usuario"}_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
}
