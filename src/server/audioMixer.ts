import crypto from "crypto";

export interface AudioMixResult {
  buffer: Buffer;
  mixed: boolean;
  reason?: "not_configured" | "temp_upload_failed" | "mixer_failed";
}

export function isAudioMixerConfigured(): boolean {
  return !!process.env.AUDIO_MIXER_URL?.trim();
}

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
): Promise<AudioMixResult> {
  const mixerUrl = process.env.AUDIO_MIXER_URL?.trim();
  const mixerSecret = process.env.AUDIO_MIXER_SECRET?.trim();
  if (!mixerUrl) {
    console.warn("[AudioMixer] AUDIO_MIXER_URL não configurado. Retornando narração sem trilha.");
    return { buffer: narrationBuffer, mixed: false, reason: "not_configured" };
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
      return { buffer: narrationBuffer, mixed: false, reason: "temp_upload_failed" };
    }

    const { data: urlData } = supabase.storage.from("meditations").getPublicUrl(tempPath);
    const narrationUrl = urlData.publicUrl;
    const backgroundUrl = getBackgroundMusicUrl();

    const response = await fetch(`${mixerUrl.replace(/\/$/, "")}/mix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(mixerSecret ? { "x-mixer-secret": mixerSecret } : {}),
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
      signal: AbortSignal.timeout(280000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mixer respondeu ${response.status}: ${text}`);
    }

    const mixedArray = await response.arrayBuffer();
    return { buffer: Buffer.from(mixedArray), mixed: true };
  } catch (err: any) {
    console.error("[AudioMixer] Erro ao mixar externamente:", { message: err?.message });
    return { buffer: narrationBuffer, mixed: false, reason: "mixer_failed" };
  } finally {
    await supabase.storage.from("meditations").remove([tempPath]).catch(() => {});
  }
}
