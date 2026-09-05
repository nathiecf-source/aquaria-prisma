import crypto from "crypto";

const MIXER_URL = process.env.AUDIO_MIXER_URL;
const MIXER_SECRET = process.env.AUDIO_MIXER_SECRET;

function getBackgroundMusicUrl(): string {
  if (process.env.BACKGROUND_MUSIC_URL) {
    return process.env.BACKGROUND_MUSIC_URL;
  }

  const baseUrl =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!baseUrl) {
    throw new Error("[AudioMixer] Nenhuma URL base configurada para a trilha sonora.");
  }

  return `${baseUrl.replace(/\/$/, "")}/assets/audio/background-meditation.mp3`;
}

/**
 * Mixa a narração (voz) com a trilha instrumental de fundo.
 * O processamento é delegado a um serviço externo (Cloud Run) para
 * evitar carregar o binário do ffmpeg no bundle Vercel.
 *
 * Recebe o buffer da narração e o cliente Supabase (service role) para
 * fazer upload temporário da narração e gerar uma URL acessível pelo mixer.
 */
export async function mixWithBackgroundMusic(
  narrationBuffer: Buffer,
  supabase: any
): Promise<Buffer> {
  if (!MIXER_URL) {
    console.warn("[AudioMixer] AUDIO_MIXER_URL não configurado. Retornando narração sem trilha.");
    return narrationBuffer;
  }

  const sessionId = crypto.randomUUID();
  const tempPath = `temp/${sessionId}.mp3`;

  try {
    const { error: tempUploadError } = await supabase
      .storage
      .from("meditations")
      .upload(tempPath, narrationBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (tempUploadError) {
      console.warn("[AudioMixer] Falha no upload temporário:", tempUploadError);
      return narrationBuffer;
    }

    const { data: urlData } = supabase.storage.from("meditations").getPublicUrl(tempPath);
    const narrationUrl = urlData.publicUrl;
    const backgroundUrl = getBackgroundMusicUrl();

    const response = await fetch(`${MIXER_URL.replace(/\/$/, "")}/mix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MIXER_SECRET ? { "x-mixer-secret": MIXER_SECRET } : {}),
      },
      body: JSON.stringify({
        narrationUrl,
        backgroundUrl,
        options: {
          backgroundVolume: 0.28,
          fadeInSeconds: 3,
          fadeOutSeconds: 4,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mixer respondeu ${response.status}: ${text}`);
    }

    const mixedArray = await response.arrayBuffer();
    return Buffer.from(mixedArray);
  } catch (err: any) {
    console.error("[AudioMixer] Erro ao mixar externamente:", err);
    return narrationBuffer;
  } finally {
    await supabase.storage.from("meditations").remove([tempPath]).catch(() => {});
  }
}
