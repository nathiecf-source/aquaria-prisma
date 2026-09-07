import serverless from "serverless-http";

let handler: any;
let handlerError: any;

function elapsedMs(start: number): number {
  return Math.round((Date.now() - start) / 10) / 100;
}

async function buildHandler() {
  const buildStart = Date.now();
  console.log("[Vercel] Inicializando handler...", {
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    cwd: process.cwd(),
    keys: Object.keys(process.env).filter((k) =>
      ["SUPABASE", "GEMINI", "GOOGLE", "RESEND", "AUDIO_MIXER", "NODE_ENV", "VERCEL"].some((p) => k.includes(p) || k.startsWith(p))
    ),
  });

  try {
    const importStart = Date.now();
    const mod: any = await import("./server.mjs");
    console.log(`[Vercel] Bundle importado em ${elapsedMs(importStart)}s`);

    const createApp = mod.createApp || mod.default?.createApp;
    if (!createApp) {
      throw new Error("Bundle api/server.mjs nao exporta createApp.");
    }

    const appStart = Date.now();
    const app = await createApp();
    console.log(`[Vercel] Express app criado em ${elapsedMs(appStart)}s`);

    const handler = serverless(app);
    console.log(`[Vercel] Handler pronto em ${elapsedMs(buildStart)}s`);
    return handler;
  } catch (err: any) {
    console.error("[Vercel] Falha ao criar handler:", err);
    handlerError = err;
    return async (req: any, res: any) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "Falha ao iniciar a API.",
        details: err?.message || String(err),
        stack: err?.stack,
      }));
    };
  }
}

export default async (req: any, res: any) => {
  if (!handler) {
    handler = await buildHandler();
  }

  if (handlerError) {
    console.error("[Vercel] Handler em estado de erro:", handlerError);
  }

  return handler(req, res);
};
