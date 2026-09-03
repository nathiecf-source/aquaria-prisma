import { toPng } from "html-to-image";

export async function downloadStoryImage(node: HTMLElement, filename: string) {
  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 1,
      quality: 0.95,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("[Story] Erro ao gerar imagem:", err);
    throw err;
  }
}
