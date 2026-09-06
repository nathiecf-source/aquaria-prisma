import assert from "node:assert/strict";
import test from "node:test";
import { mixWithBackgroundMusic } from "./audioMixer";

const narration = Buffer.from("narration");

function supabaseMock(uploadError: unknown = null) {
  return {
    storage: {
      from: () => ({
        upload: async () => ({ error: uploadError }),
        getPublicUrl: () => ({ data: { publicUrl: "https://storage.test/narration.mp3" } }),
        remove: async () => ({ error: null }),
      }),
    },
  };
}

test("returns a marked narration fallback when mixer is not configured", { concurrency: false }, async () => {
  const previous = process.env.AUDIO_MIXER_URL;
  delete process.env.AUDIO_MIXER_URL;
  try {
    const result = await mixWithBackgroundMusic(narration, supabaseMock());
    assert.equal(result.mixed, false);
    assert.equal(result.reason, "not_configured");
    assert.deepEqual(result.buffer, narration);
  } finally {
    if (previous === undefined) delete process.env.AUDIO_MIXER_URL;
    else process.env.AUDIO_MIXER_URL = previous;
  }
});

test("marks a successful remote mix", { concurrency: false }, async () => {
  const previousUrl = process.env.AUDIO_MIXER_URL;
  const previousSecret = process.env.AUDIO_MIXER_SECRET;
  const previousBackground = process.env.BACKGROUND_MUSIC_URL;
  const previousFetch = globalThis.fetch;
  process.env.AUDIO_MIXER_URL = "https://mixer.test";
  process.env.AUDIO_MIXER_SECRET = "test-secret";
  process.env.BACKGROUND_MUSIC_URL = "https://storage.test/background.mp3";
  globalThis.fetch = async (_input, init) => {
    assert.equal((init?.headers as Record<string, string>)["x-mixer-secret"], "test-secret");
    return new Response(Buffer.from("mixed"), { status: 200, headers: { "content-type": "audio/mpeg" } });
  };
  try {
    const result = await mixWithBackgroundMusic(narration, supabaseMock());
    assert.equal(result.mixed, true);
    assert.deepEqual(result.buffer, Buffer.from("mixed"));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.AUDIO_MIXER_URL; else process.env.AUDIO_MIXER_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.AUDIO_MIXER_SECRET; else process.env.AUDIO_MIXER_SECRET = previousSecret;
    if (previousBackground === undefined) delete process.env.BACKGROUND_MUSIC_URL; else process.env.BACKGROUND_MUSIC_URL = previousBackground;
  }
});
