import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import express from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const AUDIO_MIXER_SECRET = process.env.AUDIO_MIXER_SECRET;

// Tenta usar binários estáticos em dev (ffmpeg-static / ffprobe-static).
// Em produção (Docker), o ffmpeg do sistema está no PATH.
async function configureFfmpeg() {
  try {
    const ffmpegStatic = await import("ffmpeg-static");
    const ffmpegPath = ffmpegStatic.default || ffmpegStatic;
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(String(ffmpegPath));
    }
  } catch {
    // usa PATH do sistema
  }

  try {
    const ffprobeStatic = await import("ffprobe-static");
    const ffprobePath = ffprobeStatic.default?.path || ffprobeStatic;
    if (ffprobePath) {
      ffmpeg.setFfprobePath(String(ffprobePath));
    }
  } catch {
    // usa PATH do sistema
  }
}

interface MixRequest {
  narrationUrl: string;
  backgroundUrl: string;
  options?: {
    backgroundVolume?: number;
    fadeInSeconds?: number;
    fadeOutSeconds?: number;
  };
}

function unauthorized(res: express.Response) {
  res.status(401).json({ error: "Unauthorized" });
}

async function downloadFile(url: string, destination: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
}

function getAudioDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/mix", async (req, res) => {
  let narrationPath = "";
  let backgroundPath = "";
  let outputPath = "";

  try {
    if (AUDIO_MIXER_SECRET) {
      const provided = req.headers["x-mixer-secret"];
      if (provided !== AUDIO_MIXER_SECRET) {
        return unauthorized(res);
      }
    }

    const { narrationUrl, backgroundUrl, options } = req.body as MixRequest;

    if (!narrationUrl || !backgroundUrl) {
      return res.status(400).json({ error: "narrationUrl e backgroundUrl são obrigatórios." });
    }

    const backgroundVolume = options?.backgroundVolume ?? 0.28;
    const fadeInSeconds = options?.fadeInSeconds ?? 3;
    const fadeOutSeconds = options?.fadeOutSeconds ?? 4;

    const sessionId = crypto.randomBytes(8).toString("hex");
    const tmpDir = os.tmpdir();
    narrationPath = path.join(tmpDir, `narration-${sessionId}.mp3`);
    backgroundPath = path.join(tmpDir, `background-${sessionId}.mp3`);
    outputPath = path.join(tmpDir, `mixed-${sessionId}.mp3`);

    await Promise.all([
      downloadFile(narrationUrl, narrationPath),
      downloadFile(backgroundUrl, backgroundPath),
    ]);

    const [narrationDuration, musicDuration] = await Promise.all([
      getAudioDurationSeconds(narrationPath),
      getAudioDurationSeconds(backgroundPath),
    ]);

    const useFullMusicLength = musicDuration > narrationDuration;
    const totalDuration = useFullMusicLength ? musicDuration : narrationDuration;
    const fadeOutStart = Math.max(0, totalDuration - fadeOutSeconds);

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg().input(narrationPath).input(backgroundPath);

      if (!useFullMusicLength) {
        command.inputOptions(["-stream_loop", "-1"]);
      }

      command
        .complexFilter([
          `[1:a]volume=${backgroundVolume},afade=t=in:st=0:d=${fadeInSeconds},afade=t=out:st=${fadeOutStart}:d=${fadeOutSeconds}[bg]`,
          `[0:a][bg]amix=inputs=2:duration=${useFullMusicLength ? "longest" : "first"}:dropout_transition=3[out]`,
        ])
        .outputOptions(["-map", "[out]", "-t", String(totalDuration)])
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .on("error", (err) => reject(err))
        .on("end", () => resolve())
        .save(outputPath);
    });

    const mixedBuffer = await fs.readFile(outputPath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(mixedBuffer);
  } catch (err: any) {
    console.error("[AudioMixer] Erro ao mixar:", err);
    res.status(500).json({ error: "Erro ao mixar áudio.", details: err?.message || String(err) });
  } finally {
    for (const p of [narrationPath, backgroundPath, outputPath]) {
      if (p && existsSync(p)) {
        await fs.unlink(p).catch(() => {});
      }
    }
  }
});

configureFfmpeg().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Audio Mixer] online em http://0.0.0.0:${PORT}`);
  });
});
