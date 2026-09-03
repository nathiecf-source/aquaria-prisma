import { TextToSpeechClient } from '@google-cloud/text-to-speech';

let ttsClient: TextToSpeechClient | null = null;

function getTTSClient(): TextToSpeechClient {
  if (ttsClient) return ttsClient;

  const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_JSON;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;

  if (!credentialsJson) {
    throw new Error("[TTS] GOOGLE_TTS_CREDENTIALS_JSON não configurado.");
  }

  const credentials = JSON.parse(credentialsJson);

  ttsClient = new TextToSpeechClient({
    projectId: projectId || credentials.project_id,
    credentials,
  });

  return ttsClient!;
}

// Voz e velocidade padrão usadas na geração da meditação.
export const DEFAULT_MEDITATION_VOICE = 'pt-BR-Chirp3-HD-Aoede';
export const DEFAULT_SPEAKING_RATE = 0.74;

export async function synthesizeMeditation(
  ssml: string,
  voiceName: string = DEFAULT_MEDITATION_VOICE,
  speakingRate: number = DEFAULT_SPEAKING_RATE
): Promise<Buffer> {
  const client = getTTSClient();

  // Fallback chain: voz escolhida -> Neural2 -> Wavenet
  const fallbackVoices = [voiceName, 'pt-BR-Neural2-C', 'pt-BR-Wavenet-C'];
  let lastError: any = null;

  for (const name of fallbackVoices) {
    try {
      const isChirp3 = name.startsWith('pt-BR-Chirp3');

      const [response] = await client.synthesizeSpeech({
        input: { ssml },
        voice: {
          languageCode: 'pt-BR',
          name,
          ssmlGender: 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          // Chirp3 HD não aceita ajuste de pitch customizado
          ...(isChirp3 ? {} : { pitch: -1.0 }),
          volumeGainDb: 0,
        },
      });

      if (!response.audioContent) {
        throw new Error("[TTS] Resposta sem audioContent.");
      }

      // audioContent pode ser Uint8Array ou string base64
      if (typeof response.audioContent === 'string') {
        return Buffer.from(response.audioContent, 'base64');
      }
      return Buffer.from(response.audioContent);
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      // Se for erro de voz não disponível, tentar próxima
      if (msg.includes('not found') || msg.includes('not available') || msg.includes('INVALID_ARGUMENT')) {
        console.warn(`[TTS] Voz ${name} indisponível, tentando fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("[TTS] Todas as vozes falharam.");
}
