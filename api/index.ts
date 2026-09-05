import { createApp } from "../server";

let handler: any;
let handlerError: any;

async function buildHandler() {
  console.log("[Vercel] Inicializando handler...", {
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    cwd: process.cwd(),
    keys: Object.keys(process.env).filter((k) =>
      ["SUPABASE", "GEMINI", "GOOGLE", "RESEND", "AUDIO_MIXER", "NODE_ENV", "VERCEL"].some((p) => k.includes(p) || k.startsWith(p))
    ),
  });

  try {
    const { default: serverless } = await import("serverless-http");
    const app = await createApp();
    console.log("[Vercel] Express app criado com sucesso.");
    return serverless(app);
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
