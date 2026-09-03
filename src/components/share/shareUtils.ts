import { toPng } from "html-to-image";
import { PDFDocument, PageSizes } from "pdf-lib";

export const NAKSHATRA_PDF_KEY = String(
  import.meta.env.VITE_NAKSHATRA_PDF_KEY || "LUZDOSOL"
);

const UNLOCK_FLAG = "aquaria_nakshatra_unlocked";

export function isNakshatraUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_FLAG) === "true";
  } catch {
    return false;
  }
}

export function setNakshatraUnlocked(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(UNLOCK_FLAG, "true");
    } else {
      localStorage.removeItem(UNLOCK_FLAG);
    }
  } catch {
    // ignore
  }
}

export function validateNakshatraKey(input: string): boolean {
  return input.trim().toUpperCase() === NAKSHATRA_PDF_KEY.toUpperCase();
}

export async function generatePngFromElement(
  element: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<string> {
  return toPng(element, {
    pixelRatio: options?.pixelRatio ?? 2,
    backgroundColor: options?.backgroundColor,
    cacheBust: true,
  });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export async function shareImageFile(file: File, title?: string): Promise<void> {
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    throw new Error("Seu dispositivo não suporta compartilhamento direto de arquivos.");
  }
  await navigator.share({
    files: [file],
    title: title || "Aquar.IA Prisma",
  });
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generatePdfFromElement(
  element: HTMLElement,
  filename = "estrelas-guias-aquaria.pdf"
): Promise<string> {
  const dataUrl = await generatePngFromElement(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  const pngBytes = dataUrlToUint8Array(dataUrl);

  const pdfDoc = await PDFDocument.create();
  const [width, height] = PageSizes.A4;

  const embeddedImage = await pdfDoc.embedPng(pngBytes);
  const imgDims = embeddedImage.scale(1);
  // Escala para ocupar toda a largura da página A4, preservando a legibilidade
  const scale = width / imgDims.width;
  const imgWidth = imgDims.width * scale;
  const imgHeight = imgDims.height * scale;

  const pageCount = Math.max(1, Math.ceil(imgHeight / height));
  for (let i = 0; i < pageCount; i++) {
    const currentPage = pdfDoc.addPage(PageSizes.A4);
    const y = pageCount === 1 ? (height - imgHeight) / 2 : (i + 1) * height - imgHeight;
    currentPage.drawImage(embeddedImage, {
      x: (width - imgWidth) / 2,
      y,
      width: imgWidth,
      height: imgHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob(
    [pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer],
    { type: "application/pdf" }
  );
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return url;
}
