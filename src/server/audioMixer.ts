import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as string);
}
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

const isProduction = process.env.NODE_ENV === 'production';
const audioBaseDir = isProduction
  ? path.resolve(process.cwd(), 'dist')
  : path.resolve(process.cwd(), 'public');
const BACKGROUND_MUSIC_PATH = path.resolve(audioBaseDir, 'assets', 'audio', 'background-meditation.mp3');

function getAudioDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Mixa a narração (voz) com uma trilha instrumental de fundo.
 * A música é cortada/repetida para cobrir a duração da narração,
 * com volume reduzido e fade-in/fade-out nas bordas.
 *
 * Se o arquivo de música de fundo não existir, retorna a narração original sem mixagem.
 */
export async function mixWithBackgroundMusic(narrationBuffer: Buffer): Promise<Buffer> {
  if (!fs.existsSync(BACKGROUND_MUSIC_PATH)) {
    console.warn(`[AudioMixer] Música de fundo não encontrada em ${BACKGROUND_MUSIC_PATH}. Retornando narração sem mixagem.`);
    return narrationBuffer;
  }

  const tmpDir = os.tmpdir();
  const sessionId = crypto.randomBytes(8).toString('hex');
  const narrationPath = path.join(tmpDir, `narration-${sessionId}.mp3`);
  const outputPath = path.join(tmpDir, `mixed-${sessionId}.mp3`);

  fs.writeFileSync(narrationPath, narrationBuffer);

  try {
    const [narrationDuration, musicDuration] = await Promise.all([
      getAudioDurationSeconds(narrationPath),
      getAudioDurationSeconds(BACKGROUND_MUSIC_PATH),
    ]);

    // Se a narração for mais curta que a música, o áudio final usa a duração
    // completa da música (a narração termina antes, e a música segue tocando
    // sozinha até o fade-out final). Se a narração for mais longa, a música
    // é repetida em loop até cobrir toda a narração.
    const useFullMusicLength = musicDuration > narrationDuration;
    const totalDuration = useFullMusicLength ? musicDuration : narrationDuration;
    const fadeOutStart = Math.max(0, totalDuration - 4);

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg().input(narrationPath).input(BACKGROUND_MUSIC_PATH);

      if (!useFullMusicLength) {
        // Música mais curta que a narração: precisa repetir em loop
        command.inputOptions(['-stream_loop', '-1']);
      }

      command
        .complexFilter([
          // Volume da música de fundo elevado e fade in/out nas bordas reais
          `[1:a]volume=0.28,afade=t=in:st=0:d=3,afade=t=out:st=${fadeOutStart}:d=4[bg]`,
          // Mixa narração (mantém volume) com música de fundo
          `[0:a][bg]amix=inputs=2:duration=${useFullMusicLength ? 'longest' : 'first'}:dropout_transition=3[out]`,
        ])
        .outputOptions(['-map', '[out]', '-t', String(totalDuration)])
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('error', (err: Error) => reject(err))
        .on('end', () => resolve())
        .save(outputPath);
    });

    const mixedBuffer = fs.readFileSync(outputPath);
    return mixedBuffer;
  } finally {
    // Limpeza dos arquivos temporários
    [narrationPath, outputPath].forEach((p) => {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {
        // ignore
      }
    });
  }
}
