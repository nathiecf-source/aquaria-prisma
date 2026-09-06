import dotenv from "dotenv";
import path from "path";
import { pathToFileURL } from "url";

// Load environment variables immediately before any other imports
// .env.local overrides .env for local secrets
// Arquivos podem não existir no ambiente Vercel, então ignoramos erros de leitura.
try {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    override: true,
  });
} catch (err: any) {
  console.warn("[dotenv] .env não carregado:", err?.message || err);
}

try {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.local"),
    override: true,
  });
} catch (err: any) {
  console.warn("[dotenv] .env.local não carregado:", err?.message || err);
}

// Força NODE_ENV=production quando o bundle compilado for executado (npm run start / Vercel),
// evitando subir o Vite em produção. Em dev (tsx server.ts) o arquivo termina em .ts.
if (
  !process.env.NODE_ENV &&
  (
    typeof import.meta === "undefined" ||
    typeof import.meta.url !== "string" ||
    (process.argv[1] && process.argv[1].endsWith(".mjs"))
  )
) {
  process.env.NODE_ENV = "production";
}

import express from "express";
import { Resend } from "resend";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { fetchAstrologicalData, calculateHighlights, CompleteAstrologicalProfile, calculateVisualState } from "./src/server/astrology";
import { generateCaminhoReading, generateHouseReading, generateVetorReading, generateMoonReading, generateNakshatraGuideReading, generateDiretrizAmpla, generateGlossary, generateTransitCyclesReading, generateDashaReading, generateMeditationScript, generateHousePresenceQuestion, generateHouseMeditation, generateHouseMantra, generatePlanetReading, generatePlanetaryDynamicsReading, generateProfectionLordReading, generateRapidActivationsReading, HouseReadingSection } from "./src/server/geminiService";
import { calculateProfectionLord, calculateRapidActivations, calculateCurrentAge } from "./src/server/profectionEngine";
import { generateChatResponse } from "./src/server/chatService";
import { getGlossaryDefinition } from "./src/server/glossaryData";
import { getPlanetGlyphConfig, PLANET_GLYPHS } from "./src/lib/planetGlyphs";
import { synthesizeMeditation } from "./src/server/ttsService";
import { mixWithBackgroundMusic } from "./src/server/audioMixer";
import crypto from "crypto";
import { getTropicalTransitDegrees, getNatalDegrees, calculateAspects, getUpcomingCosmicEvents, getVedicTransitTerrain } from "./src/server/transitEngine";

const cleanEnvVar = (val: any): string | undefined => {
  if (!val) return undefined;
  const str = String(val).trim();
  if (str === "" || str === "null" || str === "undefined") return undefined;
  return str;
};

let supabaseAdmin: ReturnType<typeof createClient> | null | undefined;

function getSupabaseAdmin(): any {
  if (supabaseAdmin !== undefined) return supabaseAdmin;

  const urlSource = cleanEnvVar(process.env.SUPABASE_URL) ? "SUPABASE_URL" : cleanEnvVar(process.env.VITE_SUPABASE_URL) ? "VITE_SUPABASE_URL" : null;
  const keySource = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY) ? "SUPABASE_SERVICE_ROLE_KEY" : cleanEnvVar(process.env.SUPABASE_ANON_KEY) ? "SUPABASE_ANON_KEY" : cleanEnvVar(process.env.VITE_SUPABASE_ANON_KEY) ? "VITE_SUPABASE_ANON_KEY" : null;
  const supabaseUrl = urlSource ? cleanEnvVar(process.env[urlSource]) : undefined;
  const supabaseKey = keySource ? cleanEnvVar(process.env[keySource]) : undefined;

  console.info("[getSupabaseAdmin] Configuração:", {
    configured: !!(supabaseUrl && supabaseKey),
    urlSource,
    keySource,
    usesServiceRole: keySource === "SUPABASE_SERVICE_ROLE_KEY",
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error("[getSupabaseAdmin] Supabase não configurado.");
    supabaseAdmin = null;
    return supabaseAdmin;
  }

  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    return supabaseAdmin;
  } catch (error: any) {
    console.error("[getSupabaseAdmin] Falha ao criar cliente:", { message: error?.message });
    supabaseAdmin = null;
    return supabaseAdmin;
  }
}

async function getSystemSettings(supabase: any): Promise<{ chat_active: boolean; checkout_active: boolean; banner_active: boolean; banner_text: string; chamado_active: boolean; chamado_expires_at: string | null; chamado_features: string[]; chamado_banner_text: string }> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["chat_active", "checkout_active", "banner_active", "banner_text", "chamado_active", "chamado_expires_at", "chamado_features", "chamado_banner_text"]);

    if (error || !data) {
      console.warn("[SystemSettings] Erro ao carregar configurações:", error);
      return { chat_active: true, checkout_active: true, banner_active: false, banner_text: "", chamado_active: false, chamado_expires_at: null, chamado_features: [], chamado_banner_text: "" };
    }

    const map: Record<string, any> = {};
    for (const row of data) {
      map[row.key] = row.value;
    }

    const bannerText = map["banner_text"];
    const chamadoBannerText = map["chamado_banner_text"];
    const features = map["chamado_features"];
    const expiresAt = map["chamado_expires_at"];

    return {
      chat_active: map["chat_active"] !== false,
      checkout_active: map["checkout_active"] !== false,
      banner_active: map["banner_active"] === true,
      banner_text: typeof bannerText === "string" ? bannerText : "",
      chamado_active: map["chamado_active"] === true,
      chamado_expires_at: expiresAt && expiresAt !== "null" ? String(expiresAt) : null,
      chamado_features: Array.isArray(features) ? features.map(String) : [],
      chamado_banner_text: typeof chamadoBannerText === "string" ? chamadoBannerText : "",
    };
  } catch (err) {
    console.warn("[SystemSettings] Erro inesperado:", err);
    return { chat_active: true, checkout_active: true, banner_active: false, banner_text: "", chamado_active: false, chamado_expires_at: null, chamado_features: [], chamado_banner_text: "" };
  }
}

function hasActiveAccess(profile: any, chamado?: { active: boolean; expiresAt: string | null }): boolean {
  if (!profile) return false;

  const now = new Date();

  if (profile.has_access === true) {
    const expiresAt = profile.access_expires_at ? new Date(profile.access_expires_at) : null;
    if (!expiresAt || expiresAt > now) return true;
  }

  if (chamado?.active === true && chamado?.expiresAt) {
    const expiresAt = new Date(chamado.expiresAt);
    if (!isNaN(expiresAt.getTime()) && expiresAt > now) return true;
  }

  // Fallback legado enquanto a migração não estiver aplicada
  return profile.subscription_tier === "PLUS";
}

function isChamadoActive(settings: any): boolean {
  if (settings?.chamado_active !== true) return false;
  if (!settings?.chamado_expires_at) return false;
  const expiresAt = new Date(settings.chamado_expires_at);
  return !isNaN(expiresAt.getTime()) && expiresAt > new Date();
}

function hasChamadoFeature(settings: any, featureKey: string): boolean {
  if (!isChamadoActive(settings)) return false;
  return Array.isArray(settings?.chamado_features) && settings.chamado_features.includes(featureKey);
}

async function requireAuth(req: any, res: any, next: any): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[Auth] Supabase admin não disponível. Verifique as variáveis de ambiente no Vercel.");
    return res.status(500).json({ error: "Supabase não configurado." });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn("[Auth] Token inválido:", error?.message);
      return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    }

    req.user = data.user;
    req.userId = data.user.id;

    // Se o client enviou um userId, ele deve bater com o do token
    const bodyUserId = req.body?.userId || req.body?.user_id;
    if (bodyUserId && bodyUserId !== req.userId) {
      console.warn("[Auth] userId do body não pertence ao usuário autenticado:", { bodyUserId, tokenUserId: req.userId });
      return res.status(403).json({ error: "Acesso negado." });
    }

    const queryUserId = req.query?.userId || req.query?.user_id;
    if (queryUserId && queryUserId !== req.userId) {
      console.warn("[Auth] userId da query não pertence ao usuário autenticado:", { queryUserId, tokenUserId: req.userId });
      return res.status(403).json({ error: "Acesso negado." });
    }

    // Normaliza o userId no body/query para o restante do código
    if (!bodyUserId) {
      req.body = req.body || {};
      req.body.userId = req.userId;
    }

    if (!queryUserId) {
      req.query = req.query || {};
      req.query.userId = req.userId;
    }

    next();
  } catch (err: any) {
    console.error("[Auth] Erro ao validar token:", err);
    return res.status(500).json({ error: "Erro ao validar sessão." });
  }
}

async function requireFeatureAccess(req: any, res: any, featureKey: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.status(500).json({ error: "Supabase não configurado." });
    return false;
  }

  const userId = req.userId || req.body?.userId || req.body?.user_id;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "userId é obrigatório." });
    return false;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_access, access_expires_at, subscription_tier")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("[Access] Erro ao buscar perfil:", error);
  }

  if (hasActiveAccess(profile)) {
    return true;
  }

  const settings = await getSystemSettings(supabase);
  if (hasChamadoFeature(settings, featureKey)) {
    return true;
  }

  res.status(403).json({ error: "Recurso disponível apenas para assinantes PLUS ou durante um Chamado ativo." });
  return false;
}

// Cache genérico de leituras sob demanda (Caminhos, Casas por aba, Vetores, Lua, Dashas) — tabela "user_readings"
async function getCachedReading(userId: string | undefined | null, readingId: string): Promise<any | null> {
  if (!userId) {
    console.log(`[user_readings] CACHE MISS (sem userId) — ${readingId}`);
    return null;
  }
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn(`[user_readings] CACHE MISS (Supabase não configurado) — ${readingId}`);
      return null;
    }
    const { data } = await supabase
      .from("user_readings")
      .select("payload")
      .eq("user_id", userId)
      .eq("reading_id", readingId)
      .single();
    if (data?.payload) {
      const expiresAt = data.payload.expiresAt || data.payload.expires_at;
      if (expiresAt && new Date() >= new Date(expiresAt)) {
        console.log(`[user_readings] ⏰ CACHE EXPIRADO — ${readingId} (usuário ${userId})`);
        return null;
      }
      console.log(`[user_readings] ✅ CACHE HIT — ${readingId} (usuário ${userId}) — nenhuma chamada Gemini foi feita.`);
      return data.payload;
    }
    console.log(`[user_readings] ⏳ CACHE MISS — ${readingId} (usuário ${userId}) — vai gerar via Gemini agora.`);
    return null;
  } catch {
    console.log(`[user_readings] ⏳ CACHE MISS (linha não encontrada) — ${readingId} (usuário ${userId})`);
    return null;
  }
}

async function saveReading(
  userId: string | undefined | null,
  readingId: string,
  readingType: string,
  payload: any,
  expiresAt?: Date | string
): Promise<void> {
  if (!userId) return;
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    if (expiresAt) {
      payload.expiresAt = new Date(expiresAt).toISOString();
    }

    const record: any = {
      user_id: userId,
      reading_id: readingId,
      reading_type: readingType,
      payload,
      updated_at: new Date().toISOString(),
    };
    if (expiresAt) {
      record.expires_at = new Date(expiresAt).toISOString();
    }

    let { error } = await supabase
      .from("user_readings")
      .upsert(record, { onConflict: "user_id,reading_id" });

    // Fallback: se a coluna expires_at ainda não existir no banco, salva sem ela
    if (error && error.message && error.message.includes("expires_at")) {
      const { expires_at, ...recordWithoutExpiry } = record;
      const result = await supabase
        .from("user_readings")
        .upsert(recordWithoutExpiry, { onConflict: "user_id,reading_id" });
      error = result.error;
    }

    if (error) {
      console.error(`[user_readings] ❌ Erro ao salvar ${readingId}:`, error.message);
    } else {
      console.log(`[user_readings] 💾 Salvo com sucesso — ${readingId} (usuário ${userId}).`);
    }
  } catch (err: any) {
    console.error(`[user_readings] ❌ Erro inesperado ao salvar ${readingId}:`, err?.message || err);
  }
}

// ═══════════════════════════════════════════════════════════════
// Minha Evolução — mapeamento estático dos itens rastreáveis
// ═══════════════════════════════════════════════════════════════
const ELEMENT_ITEMS = [
  { id: "petal-fire", label: "Fogo" },
  { id: "petal-earth", label: "Terra" },
  { id: "petal-air", label: "Ar" },
  { id: "petal-water", label: "Água" },
];
const QUALITY_ITEMS = [
  { id: "petala-cardeal", label: "Cardeal" },
  { id: "petala-fixo", label: "Fixo" },
  { id: "petala-mutavel", label: "Mutável" },
];
const LUA_NATAL_ID = "lua-natal";
const CAMINHO_ITEMS = [
  { id: "eixo-asc", label: "Caminho da Presença" },
  { id: "eixo-ic", label: "Caminho de Consciência" },
  { id: "eixo-dsc", label: "Caminho da Reconexão" },
  { id: "eixo-mc", label: "Caminho da Realização" },
  { id: "caminho-assimilacao", label: "Caminho de Integração" },
  { id: "caminho-manifestacao", label: "Caminho da Manifestação" },
  { id: "caminho-transformacao", label: "Caminho da Transformação" },
];
const HOUSE_LABELS: Record<number, string> = {
  1: "Identidade e Presença",
  2: "Valor e Recursos",
  3: "Comunicação e Mente",
  4: "O Alicerce e a Memória",
  5: "Criatividade e Prazer",
  6: "Rotina e Corpo",
  7: "Relacionamentos e o Outro",
  8: "Transformação e Sombra",
  9: "Expansão e Crenças",
  10: "Missão e Realização",
  11: "Comunidade e Futuro",
  12: "Dissolução e Espírito",
};

const PLANET_PROGRESS_ITEMS = PLANET_GLYPHS.map(p => ({
  id: p.id,
  canonicalName: p.canonicalName,
  label: p.label,
  readingId: `planeta-${p.id}-tropical`,
}));

function getMappingLevel(percent: number): string {
  if (percent >= 76) return "Soberana da Própria Estrutura";
  if (percent >= 51) return "Navegante do Inconsciente";
  if (percent >= 26) return "Buscadora do Próprio Centro";
  return "Minha evolução geral";
}

async function createApp(): Promise<express.Application> {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware for parsing JSON
  app.use(express.json());
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();
    req.requestId = String(requestId);
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  // Auth middleware para endpoints /api/*. Exceções: saúde, settings, webhooks,
  // checkout (gerencia próprio token), analytics (gerencia próprio token) e cupons.
  const PUBLIC_API_PATHS = new Set([
    "/health",
    "/settings",
    "/webhooks/infinitepay",
    "/checkout/verify",
    "/checkout/infinitepay",
    "/coupons/validate",
    "/analytics/track",
    "/chat/upcoming-events",
  ]);

  app.use("/api", (req: any, res: any, next: any) => {
    const path = req.path || "";
    if (
      PUBLIC_API_PATHS.has(path) ||
      path.startsWith("/admin") ||
      path.startsWith("/checkout") ||
      path.startsWith("/webhooks")
    ) {
      return next();
    }
    requireAuth(req, res, next).catch(next);
  });

  // API Route: Load existing chart from Supabase
  app.post("/api/load-chart", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: "userId é obrigatório."
        });
      }

      // Como o middleware de auth já validou o token e userId,
      // usamos service role para conseguir ler o chart mesmo com RLS
      // limitando o acesso à linha do próprio usuário.
      const tempSupabase = getSupabaseAdmin();
      if (!tempSupabase) {
        return res.status(500).json({
          error: "Credenciais do Supabase não configuradas."
        });
      }

      const { data: chart, error } = await tempSupabase
        .from('user_chart')
        .select('birth_date, birth_time, latitude, longitude, birth_data, astrology_provider, astrology_cache_completeness')
        .eq('user_id', userId)
        .single();

      if (error || !chart) {
        console.log("[load-chart] Chart não encontrado para userId:", userId, error?.message || "");
        return res.json({ exists: false });
      }

      return res.json({
        exists: true,
        astrology_provider: chart.astrology_provider,
        astrology_cache_completeness: chart.astrology_cache_completeness,
        birth_date: chart.birth_date,
        birth_time: chart.birth_time,
        latitude: chart.latitude,
        longitude: chart.longitude,
        birth_data: chart.birth_data
      });

    } catch (err: any) {
      console.error("Erro ao carregar chart do Supabase:", err);
      return res.status(500).json({
        error: "Erro ao carregar chart do Supabase.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Minha Evolução — progresso agregado de leitura
  app.get("/api/user-progress", async (req, res) => {
    try {
      const userId = String(req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const [readingsRes, pathsRes, insightsRes, chartRes] = await Promise.all([
        supabase.from("user_readings").select("reading_id, reading_type, updated_at").eq("user_id", userId),
        supabase.from("user_paths").select("path_id, path_title, journal_text, updated_at").eq("user_id", userId),
        supabase.from("user_insights").select("id, insight_text, category, transit_key, created_at").eq("user_id", userId),
        supabase.from("user_chart").select("tropical_natal").eq("user_id", userId).single(),
      ]);

      const readingRows = readingsRes.data || [];
      const pathRows = pathsRes.data || [];
      const insightRows = insightsRes.data || [];
      const chartHouses = (chartRes.data?.tropical_natal as any)?.houses as Array<{ house: number; sign: string }> | undefined;

      const readingMap = new Map<string, string>(); // reading_id -> updated_at
      for (const row of readingRows as any[]) {
        readingMap.set(row.reading_id, row.updated_at);
      }
      const journalMap = new Map<string, { journal_text: string; updated_at: string }>();
      for (const row of pathRows as any[]) {
        journalMap.set(row.path_id, { journal_text: row.journal_text, updated_at: row.updated_at });
      }

      // ── O Alicerce ──
      const elementStatuses = ELEMENT_ITEMS.map(item => ({ ...item, read: readingMap.has(item.id) }));
      const qualityStatuses = QUALITY_ITEMS.map(item => ({ ...item, read: readingMap.has(item.id) }));
      const elementsReadCount = elementStatuses.filter(i => i.read).length;
      const qualitiesReadCount = qualityStatuses.filter(i => i.read).length;
      const luaRead = readingMap.has(LUA_NATAL_ID);

      const alicerceItems = [
        {
          id: "elementos",
          label: "Elementos: Fogo, Terra, Ar e Água",
          status: elementsReadCount === 4 ? "completed" : elementsReadCount > 0 ? "in_progress" : "pending",
          progress: `${elementsReadCount}/4`,
        },
        {
          id: "qualidades",
          label: "Qualidades: Cardeal, Fixo e Mutável",
          status: qualitiesReadCount === 3 ? "completed" : qualitiesReadCount > 0 ? "in_progress" : "pending",
          progress: `${qualitiesReadCount}/3`,
        },
        {
          id: LUA_NATAL_ID,
          label: "Lua Natal: Matriz emocional e apego",
          status: luaRead ? "completed" : "pending",
          progress: luaRead ? "1/1" : "0/1",
        },
      ];
      const alicerceCompletedGroups = alicerceItems.filter(i => i.status === "completed").length;

      // ── O Cenário da Vida (12 Casas) ──
      const houses = Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const sections: Array<"tropical" | "vedic" | "sintese"> = ["tropical", "vedic", "sintese"];
        const sectionsRead = sections.filter(s => readingMap.has(`casa-${num}-${s}`));
        const status = sectionsRead.length === 3 ? "completed" : sectionsRead.length > 0 ? "in_progress" : "pending";
        const houseData = chartHouses?.find((h: any) => h.house === num);
        return {
          id: num,
          label: `Casa ${num}`,
          theme: HOUSE_LABELS[num] || "",
          sign: (houseData?.sign as string) || "",
          sectionsRead: sectionsRead.length,
          missingSections: sections.filter(s => !readingMap.has(`casa-${num}-${s}`)),
          status,
        };
      });
      const housesCompletedCount = houses.filter(h => h.status === "completed").length;

      // ── Os Caminhos de Potência ──
      const caminhos = CAMINHO_ITEMS.map(item => {
        const hasReading = readingMap.has(item.id);
        const journal = journalMap.get(item.id);
        const hasJournal = !!journal?.journal_text && journal.journal_text.trim().length > 0;
        const status = hasReading && hasJournal ? "completed" : hasReading ? "in_progress" : "pending";
        return { ...item, status };
      });
      const caminhosCompletedCount = caminhos.filter(c => c.status === "completed").length;

      // ── O Cenário Planetário ──
      const planetas = PLANET_PROGRESS_ITEMS.map((item: typeof PLANET_PROGRESS_ITEMS[number]) => {
        const read = readingMap.has(item.readingId);
        return { id: item.id, label: item.label, status: read ? ("completed" as const) : ("pending" as const) };
      });
      const planetasCompletedCount = planetas.filter((p: typeof planetas[number]) => p.status === "completed").length;

      // ── Progresso geral (44 itens: 7 vetores + Lua + 12 Casas + 7 Caminhos + 17 Planetas) ──
      const totalItems = 8 + 12 + 7 + 17;
      const completedItems = elementsReadCount + qualitiesReadCount + (luaRead ? 1 : 0) + housesCompletedCount + caminhosCompletedCount + planetasCompletedCount;
      const percent = Math.round((completedItems / totalItems) * 100);
      const level = getMappingLevel(percent);

      // ── Badges ──
      const isRead = (readingId: string) => readingMap.has(readingId);
      const isHouseCompleted = (num: number) => houses.find(h => h.id === num)?.status === "completed";
      const isCaminhoCompleted = (id: string) => caminhos.find(c => c.id === id)?.status === "completed";
      const isPlanetRead = (id: string) => isRead(`planeta-${id}-tropical`);
      const isElementRead = (id: string) => readingMap.has(id);
      const isCasaDeSignoCompleted = (signo: string) => {
        const casa = houses.find((h: typeof houses[number]) => h.sign?.toLowerCase() === signo.toLowerCase());
        return casa ? casa.status === "completed" : false;
      };

      const badges = [
        {
          id: "pioneira-da-vontade",
          label: "Pioneira da Vontade",
          description: "Pétala Fogo, Pétala Cardeal e a leitura de Marte integrados.",
          unlocked: isElementRead("petal-fire") && isElementRead("petala-cardeal") && isPlanetRead("marte"),
        },
        {
          id: "estruturadora-da-rotina",
          label: "Estruturadora da Rotina",
          description: "Pétala Terra, Pétala Fixo, Casa 6 e a leitura de Saturno integrados.",
          unlocked: isElementRead("petal-earth") && isElementRead("petala-fixo") && isHouseCompleted(6) && isPlanetRead("saturno"),
        },
        {
          id: "mestra-da-percepcao",
          label: "Mestra da Percepção",
          description: "Pétala Ar, Casa 3, Casa 9, Mercúrio e o Caminho de Consciência integrados.",
          unlocked: isElementRead("petal-air") && isHouseCompleted(3) && isHouseCompleted(9) && isPlanetRead("mercurio") && isCaminhoCompleted("eixo-ic"),
        },
        {
          id: "navegante-dos-afetos",
          label: "Navegante dos Afetos",
          description: "Pétala Água, Pétala Mutável, Lua, Vênus, Casa 7 e o Caminho da Reconexão integrados.",
          unlocked: isElementRead("petal-water") && isElementRead("petala-mutavel") && isPlanetRead("lua") && isPlanetRead("venus") && isHouseCompleted(7) && isCaminhoCompleted("eixo-dsc"),
        },
        {
          id: "cartografa-da-existencia",
          label: "Cartógrafa da Existência",
          description: "Todas as 12 casas do mapa exploradas.",
          unlocked: housesCompletedCount === 12,
        },
        {
          id: "alquimista-do-destino",
          label: "Alquimista do Destino",
          description: "Os 7 Caminhos de Potência completados.",
          unlocked: caminhosCompletedCount === 7,
        },
        {
          id: "sacerdotisa-do-submundo",
          label: "Sacerdotisa do Submundo",
          description: "Casa 8, Plutão, Lua de Nascimento e o Caminho da Transformação integrados.",
          unlocked: isHouseCompleted(8) && isPlanetRead("plutao") && isRead(LUA_NATAL_ID) && isCaminhoCompleted("caminho-transformacao"),
        },
        {
          id: "buscadora-do-proposito",
          label: "Buscadora do Propósito",
          description: "Casa 10, Saturno, Nodo Norte e o Caminho da Realização integrados.",
          unlocked: isHouseCompleted(10) && isPlanetRead("saturno") && isPlanetRead("nodo-norte") && isCaminhoCompleted("eixo-mc"),
        },
        {
          id: "alquimista-do-inconsciente",
          label: "Alquimista do Inconsciente",
          description: "Casa 4, Casa 12, Nodo Sul, Lua, Quíron e o Caminho de Integração integrados.",
          unlocked: isHouseCompleted(4) && isHouseCompleted(12) && isPlanetRead("nodo-sul") && isPlanetRead("lua") && isPlanetRead("quiron") && isCaminhoCompleted("caminho-assimilacao"),
        },
        {
          id: "dona-de-si",
          label: "Dona de Si",
          description: "Sol, Marte, Casa 1 e o Caminho da Autenticidade integrados.",
          unlocked: isPlanetRead("sol") && isPlanetRead("marte") && isHouseCompleted(1) && isCaminhoCompleted("eixo-asc"),
        },
        {
          id: "criadora-abundante",
          label: "Criadora Abundante",
          description: "Casa 5, Casa 2, Vênus, Júpiter, Casa de Touro e o Caminho da Manifestação integrados.",
          unlocked: isHouseCompleted(5) && isHouseCompleted(2) && isPlanetRead("venus") && isPlanetRead("jupiter") && isCasaDeSignoCompleted("Touro") && isCaminhoCompleted("caminho-manifestacao"),
        },
        {
          id: "sonhadora-destemida",
          label: "Sonhadora Destemida",
          description: "Urano, Netuno, Casa 11, Lilith, Casa 9 e Júpiter integrados.",
          unlocked: isPlanetRead("urano") && isPlanetRead("netuno") && isHouseCompleted(11) && isPlanetRead("lilith") && isHouseCompleted(9) && isPlanetRead("jupiter"),
        },
      ];

      // ── Próxima Fronteira (determinístico) ──
      let nextFrontier: { title: string; description: string; targetId: string } | null = null;
      const firstMissingElement = elementStatuses.find(i => !i.read);
      const firstMissingQuality = qualityStatuses.find(i => !i.read);
      if (firstMissingElement) {
        nextFrontier = {
          title: "Explore os Elementos",
          description: `Você ainda não explorou o elemento ${firstMissingElement.label} do seu mapa. Que tal descobrir como ele molda sua energia vital?`,
          targetId: firstMissingElement.id,
        };
      } else if (firstMissingQuality) {
        nextFrontier = {
          title: "Explore as Qualidades",
          description: `A qualidade ${firstMissingQuality.label} ainda não foi mapeada. Descubra como ela define seu ritmo de ação.`,
          targetId: firstMissingQuality.id,
        };
      } else if (!luaRead) {
        nextFrontier = {
          title: "Sua Lua Natal",
          description: "Você ainda não explorou sua Lua Natal — a matriz da sua vida emocional e dos seus apegos mais profundos.",
          targetId: LUA_NATAL_ID,
        };
      } else {
        const nextHouse = houses.find(h => h.status !== "completed");
        if (nextHouse) {
          nextFrontier = {
            title: `Continue na Casa ${nextHouse.id}`,
            description: `Você já explorou parte da Casa ${nextHouse.id} (${nextHouse.theme}). Continue mapeando essa área da sua vida.`,
            targetId: `casa-${nextHouse.id}`,
          };
        } else {
          const nextCaminho = caminhos.find(c => c.status !== "completed");
          if (nextCaminho) {
            nextFrontier = {
              title: `Aprofunde-se no ${nextCaminho.label}`,
              description: nextCaminho.status === "in_progress"
                ? `Você já leu o ${nextCaminho.label}, mas ainda não registrou seu diário alquímico dessa jornada.`
                : `Você ainda não explorou o ${nextCaminho.label}, uma das 7 grandes leituras de integração e alquimia.`,
              targetId: nextCaminho.id,
            };
          } else {
            nextFrontier = {
              title: "Jornada Mapeada",
              description: "Você concluiu o mapeamento integral da sua psique e das suas estrelas-guia. Revisite qualquer ponto sempre que precisar.",
              targetId: "",
            };
          }
        }
      }

      // ── Linha do tempo ──
      type TimelineEntry = { label: string; timestamp: string };
      const timeline: TimelineEntry[] = [];

      const SECTION_LABELS: Record<string, string> = {
        tropical: "Dinâmica Psíquica",
        vedic: "Védico",
        sintese: "Síntese",
      };

      for (const [readingId, updatedAt] of readingMap.entries()) {
        // Ignora eventos auxiliares (pausa de presença, mantra) — não são "leituras" para a linha do tempo principal.
        if (readingId.includes("-pausa-pergunta") || readingId.endsWith("-mantra")) continue;

        let label: string | null = null;
        const houseMatch = readingId.match(/^casa-(\d+)-(tropical|vedic|sintese)$/);
        const caminhoItem = CAMINHO_ITEMS.find(c => c.id === readingId);
        const elementItem = ELEMENT_ITEMS.find(e => e.id === readingId);
        const qualityItem = QUALITY_ITEMS.find(q => q.id === readingId);
        if (houseMatch) {
          const num = houseMatch[1];
          const section = SECTION_LABELS[houseMatch[2]] || houseMatch[2];
          label = `Leitura concluída: Casa ${num} — ${section} (${HOUSE_LABELS[Number(num)] || ""})`;
        } else if (caminhoItem) {
          label = `Leitura ativada: ${caminhoItem.label}`;
        } else if (elementItem) {
          label = `Diagnóstico do elemento ${elementItem.label} ativado`;
        } else if (qualityItem) {
          label = `Diagnóstico da qualidade ${qualityItem.label} ativado`;
        } else if (readingId === LUA_NATAL_ID) {
          label = "Diagnóstico da Lua Natal ativado";
        } else {
          const planetItem = PLANET_PROGRESS_ITEMS.find((p: typeof PLANET_PROGRESS_ITEMS[number]) => p.readingId === readingId);
          if (planetItem) {
            label = `Leitura ativada: ${planetItem.label}`;
          }
        }
        if (label) timeline.push({ label, timestamp: updatedAt });
      }
      for (const [pathId, journal] of journalMap.entries()) {
        if (journal.journal_text && journal.journal_text.trim().length > 0) {
          const caminhoItem = CAMINHO_ITEMS.find(c => c.id === pathId);
          timeline.push({
            label: `Insight registrado no ${caminhoItem?.label || pathId}`,
            timestamp: journal.updated_at,
          });
        }
      }
      for (const row of insightRows as any[]) {
        timeline.push({ label: "Percepção registrada na Pausa de Presença", timestamp: row.created_at });
      }

      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return res.json({
        percent,
        level,
        alicerce: { items: alicerceItems, completed: alicerceCompletedGroups, total: 3 },
        cenario: { houses, completed: housesCompletedCount, total: 12 },
        caminhos: { items: caminhos, completed: caminhosCompletedCount, total: 7 },
        planetas: { items: planetas, completed: planetasCompletedCount, total: 17 },
        badges,
        nextFrontier,
        timeline: timeline.slice(0, 20),
      });
    } catch (err: any) {
      console.error("Erro ao calcular progresso do usuário:", err);
      return res.status(500).json({
        error: "Erro ao calcular progresso do usuário.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Próximos eventos cósmicos para o chat
  app.get("/api/chat/upcoming-events", async (req, res) => {
    try {
      const events = getUpcomingCosmicEvents(new Date(), 30);
      return res.json({ events });
    } catch (err: any) {
      console.error("Erro ao calcular eventos cósmicos:", err);
      return res.status(500).json({
        error: "Erro ao calcular eventos cósmicos.",
        details: err?.message || String(err),
      });
    }
  });

  // API Route: Chat Astrológico — Oráculo Pessoal
  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, message, mode, history, transitContext } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId é obrigatório." });
      }
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "message é obrigatória." });
      }

      const chartMode = mode === "sidereal" ? "sidereal" : "tropical";

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const settings = await getSystemSettings(supabase);
      if (!settings.chat_active) {
        return res.status(503).json({ error: "Oráculo/Chat em manutenção. Tente novamente mais tarde." });
      }

      // Verifica assinatura PLUS (compatível com has_access + access_expires_at)
      const { data: rawProfileRow, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier, full_name, has_access, access_expires_at")
        .eq("id", userId)
        .single();

      let profileRow = rawProfileRow;

      if (profileError || !profileRow) {
        console.warn("[/api/chat] Perfil ausente, tentando recriar a partir do auth.users:", { userId, profileError });

        const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);

        if (authUserError || !authUserData?.user) {
          console.error("[/api/chat] Usuário não existe em auth.users:", { userId, authUserError });
          return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
        }

        const authUser = authUserData.user;
        const meta = authUser.user_metadata || {};
        const fallbackProfile = {
          id: userId,
          full_name: meta.full_name || authUser.email || "Usuário Astrológico",
          whatsapp_number: meta.whatsapp_number || "+55 11 99999-9999",
          subscription_tier: meta.subscription_tier || "FREE",
          has_access: meta.has_access || false,
          access_expires_at: meta.access_expires_at || null,
        };

        const { error: upsertProfileError } = await supabase
          .from("profiles")
          .upsert(fallbackProfile, { onConflict: "id" });

        if (upsertProfileError) {
          console.error("[/api/chat] Erro ao criar perfil:", { userId, upsertProfileError });
          return res.status(500).json({ error: "Erro ao recuperar perfil. Tente novamente." });
        }

        profileRow = fallbackProfile as typeof rawProfileRow;
      }

      if (!profileRow) {
        return res.status(500).json({ error: "Erro ao recuperar perfil. Tente novamente." });
      }

      if (!(await requireFeatureAccess(req, res, "chat"))) {
        return;
      }

      // Controle de uso mensal
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageRow, error: usageError } = await supabase
        .from("chat_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .single();

      if (usageError && usageError.code !== "PGRST116") {
        console.error("[chat_usage] erro ao buscar uso:", usageError);
      }

      const currentCount = usageRow?.count || 0;
      if (currentCount >= 30) {
        return res.status(429).json({ error: "Limite de 30 perguntas mensais atingido." });
      }

      // Busca o mapa astral completo
      const { data: chartRow, error: chartError } = await supabase
        .from("user_chart")
        .select("tropical_natal, tropical_transits, vedic_natal, vedic_specifics, vedic_balas, vedic_timing, vedic_vargas, birth_data")
        .eq("user_id", userId)
        .single();

      if (chartError || !chartRow) {
        console.error("[chat] erro ao buscar mapa:", chartError);
        return res.status(404).json({ error: "Mapa astral não encontrado. Gere o mapa antes de usar o chat." });
      }

      const astrologicalProfile = chartRow as any as CompleteAstrologicalProfile;

      const response = await generateChatResponse(
        profileRow.full_name || "",
        astrologicalProfile,
        message.trim(),
        chartMode,
        Array.isArray(history) ? history : [],
        transitContext || undefined
      );

      // Incrementa o contador
      const newCount = currentCount + 1;
      const { error: upsertError } = await supabase
        .from("chat_usage")
        .upsert(
          {
            user_id: userId,
            month: currentMonth,
            count: newCount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,month" }
        );

      if (upsertError) {
        console.error("[chat_usage] erro ao atualizar uso:", upsertError);
      }

      return res.json({
        ...response,
        remaining: 30 - newCount,
      });
    } catch (err: any) {
      console.error("Erro em /api/chat:", err);
      return res.status(500).json({
        error: err?.message || "Erro ao processar a mensagem do chat.",
      });
    }
  });

  // API Route: Generate Profile
  app.post("/api/generate-profile", async (req, res) => {
    try {
      const { name, gender, gender_preference, birthDate, birthTime, birthPlace, currentDate, userId } = req.body;

      // 1. Validation
      if (!name || !gender || !birthDate || !birthTime || !birthPlace) {
        return res.status(400).json({
          error: "Campos obrigatórios ausentes. Certifique-se de enviar name, gender, birthDate, birthTime e birthPlace (com latitude, longitude e timezone)."
        });
      }

      if (gender !== "masculino" && gender !== "feminino") {
        return res.status(400).json({
          error: "O campo gender deve ser 'masculino' ou 'feminino'."
        });
      }

      if (gender_preference && !["feminino", "masculino", "neutro", "neutro_estrutural", "neutro_direto"].includes(gender_preference)) {
        return res.status(400).json({
          error: "O campo gender_preference, quando enviado, deve ser 'feminino', 'masculino' ou 'neutro'."
        });
      }

      if (
        typeof birthPlace.latitude !== "number" ||
        typeof birthPlace.longitude !== "number" ||
        !birthPlace.timezone
      ) {
        return res.status(400).json({
          error: "O campo birthPlace deve ser um objeto contendo latitude (number), longitude (number) e timezone (string)."
        });
      }

      const activeCurrentDate = currentDate || new Date().toISOString().split("T")[0];

      // 2. Compute full Tropical and Vedic data
      const birthDataPayload = {
        name,
        gender: gender as "masculino" | "feminino",
        gender_preference,
        birthDate,
        birthTime,
        birthPlace,
        currentDate: activeCurrentDate
      };

      // Extract token and resolve userId if missing
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      let activeUserId = userId;

      const cleanEnv = (val: any): string | undefined => {
        if (!val) return undefined;
        const str = String(val).trim();
        if (str === "" || str === "null" || str === "undefined") {
          return undefined;
        }
        return str;
      };

      if (!activeUserId && token) {
        const tempUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
        const tempKey = cleanEnv(process.env.SUPABASE_ANON_KEY) || cleanEnv(process.env.VITE_SUPABASE_ANON_KEY) || cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

        if (tempUrl && tempKey) {
          try {
            const tempSupabase = createClient(tempUrl, tempKey);
            const { data: { user } } = await tempSupabase.auth.getUser(token);
            if (user) {
              activeUserId = user.id;
              console.log(`[AQUAR.IA Backend] Usuário identificado a partir do token JWT: ${activeUserId}`);
            }
          } catch (jwtErr) {
            console.error("[AQUAR.IA Backend] Erro ao extrair userId do token JWT:", jwtErr);
          }
        }
      }

      const astrologicalProfile = await fetchAstrologicalData(birthDataPayload, activeCurrentDate, activeUserId, token);

      // 2.5. Verifica se já existe um chart salvo para este usuário (para decidir entre update/insert abaixo).
      let existingChart: { id?: any } | null = null;
      if (activeUserId) {
        try {
          const tempUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
          const tempKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.SUPABASE_ANON_KEY) || cleanEnv(process.env.VITE_SUPABASE_ANON_KEY);
          if (tempUrl && tempKey) {
            const tempSupabase = createClient(tempUrl, tempKey);
            const { data } = await tempSupabase
              .from('user_chart')
              .select('id, birth_date, birth_time, latitude, longitude')
              .eq('user_id', activeUserId)
              .single();
            if (data) {
              existingChart = data;
            }
          }
        } catch (cacheErr: any) {
          console.warn('[AQUAR.IA Backend] Falha ao verificar chart existente:', cacheErr?.message || cacheErr);
        }
      }

      // 3. Os 7 Caminhos deixaram de ser gerados aqui — agora são gerados sob demanda
      // (ver /api/generate-caminho-reading), evitando uma chamada Gemini pesada a cada login.
      const analysis = "";
      const hasGeminiError = false;
      const errorMessage = "";

      // 4. Calculate the 3 most heavily loaded vector elements mathematically
      const highlights = calculateHighlights(astrologicalProfile);

      // Calculate visual state for houses, elements, and qualities
      const visual_state = calculateVisualState(astrologicalProfile);

      // 5. Save to Supabase if userId is available
      let chartSaved = false;
      let chartSaveError: string | undefined = undefined;
      if (activeUserId) {
        try {
          const tempUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
          const tempKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.SUPABASE_ANON_KEY) || cleanEnv(process.env.VITE_SUPABASE_ANON_KEY);

          if (tempUrl && tempKey) {
            const tempSupabase = createClient(tempUrl, tempKey);

            const chartData = {
              user_id: activeUserId,
              birth_date: birthDate,
              birth_time: birthTime,
              latitude: birthPlace.latitude,
              longitude: birthPlace.longitude,
              birth_data: birthDataPayload,
              tropical_natal: astrologicalProfile.tropical_natal,
              tropical_transits: astrologicalProfile.tropical_transits,
              vedic_natal: astrologicalProfile.vedic_natal,
              vedic_specifics: astrologicalProfile.vedic_specifics,
              vedic_balas: astrologicalProfile.vedic_balas,
              vedic_timing: astrologicalProfile.vedic_timing,
              vedic_vargas: astrologicalProfile.vedic_vargas,
              visual_state: visual_state,
              highlights: highlights,
              analysis: analysis
            };

            if (existingChart) {
              // Update existing chart
              const { error: updateError } = await tempSupabase
                .from('user_chart')
                .update(chartData)
                .eq('user_id', activeUserId);
              if (updateError) throw updateError;
              chartSaved = true;
              console.log('[AQUAR.IA Backend] Chart atualizado no Supabase para usuário:', activeUserId);
            } else {
              // Insert new chart
              const { error: insertError } = await tempSupabase
                .from('user_chart')
                .insert(chartData);
              if (insertError) throw insertError;
              chartSaved = true;
              console.log('[AQUAR.IA Backend] Chart salvo no Supabase para usuário:', activeUserId);
            }
          } else {
            chartSaveError = 'Credenciais do Supabase não configuradas no servidor.';
            console.warn('[AQUAR.IA Backend] Chart não salvo:', chartSaveError);
          }
        } catch (dbErr: any) {
          chartSaveError = dbErr?.message || String(dbErr);
          console.error('[AQUAR.IA Backend] Erro ao salvar chart no Supabase:', dbErr);
        }
      } else {
        chartSaveError = 'userId não disponível para salvar o chart.';
        console.warn('[AQUAR.IA Backend] Chart não salvo:', chartSaveError);
      }

      // 5.5. Gerar Dinâmicas Planetárias em background (não bloqueia o onboard)
      if (activeUserId) {
        (async () => {
          const readingId = `dinamicas-planetarias-v2-${activeUserId}`;
          const cached = await getCachedReading(activeUserId, readingId);
          if (!cached) {
            try {
              console.log(`[AQUAR.IA Backend] Gerando Dinâmicas Planetárias em background para usuário: ${activeUserId}`);
              const readingText = await generatePlanetaryDynamicsReading(astrologicalProfile);
              await saveReading(activeUserId, readingId, "dinamicas-planetarias", { text: readingText });
              console.log(`[AQUAR.IA Backend] Dinâmicas Planetárias salvas em background para usuário: ${activeUserId}`);
            } catch (dynErr: any) {
              console.error(`[AQUAR.IA Backend] Falha ao gerar Dinâmicas Planetárias em background para usuário ${activeUserId}:`, dynErr?.message || String(dynErr));
            }
          }
        })();
      }

      // 6. Send complete response to client
      return res.json({
        profile: astrologicalProfile,
        analysis,
        highlights,
        visual_state,
        geminiStatus: hasGeminiError ? "error" : "success",
        geminiErrorMessage: hasGeminiError ? errorMessage : undefined,
        chartSaved,
        chartSaveError
      });

    } catch (err: any) {
      console.error("Erro crítico no processador:", err);
      return res.status(500).json({
        error: "Ocorreu um erro interno no servidor ao processar a matriz astrológica.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Caminho Reading (sob demanda, com cache em user_readings)
  app.post("/api/generate-caminho-reading", async (req, res) => {
    try {
      const { profile, caminhoId, userId } = req.body;
      if (!profile || !caminhoId) {
        return res.status(400).json({ error: "Perfil astrológico e caminhoId são obrigatórios." });
      }

      if (caminhoId !== "eixo-asc" && !(await requireFeatureAccess(req, res, String(caminhoId)))) {
        return;
      }

      const cached = await getCachedReading(userId, caminhoId);
      if (cached) {
        return res.json({ reading: cached, cached: true });
      }

      const readingText = await generateCaminhoReading(profile, caminhoId);
      const parsedReading = JSON.parse(readingText);
      await saveReading(userId, caminhoId, "caminho", parsedReading);
      return res.json({ reading: parsedReading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar leitura do caminho:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura do caminho.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Planetary Dynamics Reading (Yogas/Doshas, sob demanda, com cache em user_readings)
  app.post("/api/generate-planetary-dynamics", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }

      if (!(await requireFeatureAccess(req, res, "dinamicas-planetarias"))) {
        return;
      }

      const readingId = `dinamicas-planetarias-v2-${userId || "anon"}`;
      const cached = await getCachedReading(userId, readingId);
      if (cached) {
        return res.json({ reading: cached, cached: true });
      }

      const readingText = await generatePlanetaryDynamicsReading(profile);
      await saveReading(userId, readingId, "dinamicas-planetarias", { text: readingText });
      return res.json({ reading: { text: readingText }, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar Dinâmicas Planetárias:", err);
      return res.status(500).json({
        error: "Erro ao gerar Dinâmicas Planetárias.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate House Reading (por aba/seção, com cache em user_readings)
  app.post("/api/generate-house-reading", async (req, res) => {
    try {
      const { profile, houseId, userId } = req.body;
      const section: HouseReadingSection = (req.body.section === "vedic" || req.body.section === "sintese") ? req.body.section : "tropical";
      if (!profile || !houseId) {
        return res.status(400).json({ error: "Perfil astrológico e houseId são obrigatórios." });
      }

      const match = String(houseId).match(/(\d+)/);
      const houseNumber = match ? Number(match[1]) : null;
      const featureKey = houseNumber && houseNumber >= 1 && houseNumber <= 12 ? `casa_${houseNumber}` : null;
      const isAngularHouse = houseNumber ? [1, 4, 7, 10].includes(houseNumber) : false;

      if (featureKey && !isAngularHouse && !(await requireFeatureAccess(req, res, featureKey))) {
        return;
      }

      const readingId = `${houseId}-${section}`;
      const cached = await getCachedReading(userId, readingId);
      if (cached) {
        return res.json({ reading: cached, section, cached: true });
      }

      const readingText = await generateHouseReading(profile, houseId, section);
      const parsedReading = JSON.parse(readingText);
      await saveReading(userId, readingId, `casa-${section}`, parsedReading);
      return res.json({ reading: parsedReading, section, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da casa astrológica:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da casa astrológica.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Planet Reading (Régua de Glifos Astrológicos, com cache em user_readings)
  app.post("/api/generate-planet-reading", async (req, res) => {
    try {
      const { profile, planetId, userId, subscriptionTier } = req.body;
      if (!profile || !planetId) {
        return res.status(400).json({ error: "Perfil astrológico e planetId são obrigatórios." });
      }

      const config = getPlanetGlyphConfig(planetId);
      if (!config) {
        return res.status(400).json({ error: "Ponto astrológico desconhecido." });
      }
      if (!config.isFree && subscriptionTier === "FREE") {
        return res.status(403).json({ error: "Este ponto astrológico está bloqueado para o plano FREE." });
      }

      const readingId = `planeta-v3-${planetId}-tropical`;
      const cached = await getCachedReading(userId, readingId);
      if (cached) {
        return res.json({ reading: cached, cached: true });
      }

      const readingText = await generatePlanetReading(profile, planetId);
      let parsedReading: any;
      try {
        parsedReading = JSON.parse(readingText);
      } catch (parseErr) {
        console.error("[PLANET READING] Falha ao fazer parse do JSON:", parseErr, "\nTexto:", readingText.slice(0, 500));
        throw new Error("Resposta do Gemini não é um JSON válido.");
      }
      const vedicInfo = parsedReading?.vedicStrength ?? null;
      console.log("[PLANET READING] vedicStrength:", vedicInfo ? "presente" : "ausente", JSON.stringify(vedicInfo ?? null).slice(0, 200));
      await saveReading(userId, readingId, "planeta-tropical", parsedReading);
      return res.json({ reading: parsedReading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar leitura do ponto astrológico:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura do ponto astrológico.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Diretriz Reading (com cache em user_readings)
  app.post("/api/generate-vetor-reading", async (req, res) => {
    try {
      const { profile, vetorId, userId } = req.body;
      if (!profile || !vetorId) {
        return res.status(400).json({ error: "Perfil astrológico e vetorId são obrigatórios." });
      }

      const cached = await getCachedReading(userId, vetorId);
      if (cached) {
        return res.json({ reading: cached, cached: true });
      }

      const readingText = await generateVetorReading(profile, vetorId);
      const parsedReading = JSON.parse(readingText);
      await saveReading(userId, vetorId, "vetor", parsedReading);
      return res.json({ reading: parsedReading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da diretriz de força:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da diretriz de força.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Moon Reading (com cache em user_readings)
  app.post("/api/generate-moon-reading", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }

      const readingId = "lua-natal";
      const cached = await getCachedReading(userId, readingId);
      if (cached) {
        return res.json({ reading: cached, cached: true });
      }

      const readingText = await generateMoonReading(profile);
      const parsedReading = JSON.parse(readingText);
      await saveReading(userId, readingId, "lua", parsedReading);
      return res.json({ reading: parsedReading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da Lua:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da Lua.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Nakshatra Guide (PDF content)
  app.post("/api/generate-nakshatra-guide", async (req, res) => {
    try {
      const { profile } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }

      const readingText = await generateNakshatraGuideReading(profile);
      const parsedReading = JSON.parse(readingText);
      return res.json({ reading: parsedReading });
    } catch (err: any) {
      console.error("Erro ao gerar guia de Nakshatras:", err);
      return res.status(500).json({
        error: "Erro ao gerar guia de Nakshatras.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Diretriz Ampla
  app.post("/api/generate-diretriz-ampla", async (req, res) => {
    try {
      const { profile, userName, visualState } = req.body;
      if (!profile || !userName || !visualState) {
        return res.status(400).json({ error: "Perfil, nome do usuário e visualState são obrigatórios." });
      }

      const reading = await generateDiretrizAmpla(profile, userName, visualState);
      return res.json({ reading });
    } catch (err: any) {
      console.error("Erro ao gerar Diretriz Ampla:", err);
      return res.status(500).json({
        error: "Erro ao gerar Diretriz Ampla.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Transit Cycles (30 Days)
  app.post("/api/generate-transit-cycles", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      if (!(await requireFeatureAccess(req, res, "ciclos"))) {
        return;
      }

      // ── Motor de trânsitos interno (Etapa 4) ──
      let enrichedProfile = profile;
      try {
        const today = new Date();
        const transitDegrees = getTropicalTransitDegrees(today);
        const natalPlanets = getNatalDegrees(profile);
        const transitPayload = calculateAspects(transitDegrees, natalPlanets);

        console.log("[TRANSIT ENGINE] Payload final:", JSON.stringify(transitPayload, null, 2));

        // Converter para o formato TropicalTransit que o LLM já entende
        const allAspects = [
          ...transitPayload.transitos_estruturais,
          ...transitPayload.transitos_dinamicos
        ];

        const SIGNS_PT = ["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"];

        // Casa REAL por onde o planeta transita agora, calculada pelas longitudes absolutas das cúspides
        const natalHousesRaw: any[] = profile?.tropical_natal?.houses ?? [];
        // Prefere longitude absoluta; reconstrói a partir do signo+cuspDegree se ausente
        const SIGN_INDEX: Record<string, number> = {
          "Áries": 0, "Touro": 1, "Gêmeos": 2, "Câncer": 3, "Leão": 4, "Virgem": 5,
          "Libra": 6, "Escorpião": 7, "Sagitário": 8, "Capricórnio": 9, "Aquário": 10, "Peixes": 11,
        };
        const natalHousesLong: Array<{ house: number; longitude: number }> = natalHousesRaw
          .filter((h: any) => typeof h.house === "number")
          .map((h: any) => {
            const lon = typeof h.longitude === "number"
              ? h.longitude
              : ((SIGN_INDEX[h.sign] ?? 0) * 30 + (h.cuspDegree ?? 0));
            return { house: h.house, longitude: lon };
          });
        const houseOfDegree = (deg: number): number => {
          if (natalHousesLong.length !== 12) return 0;
          const sorted = [...natalHousesLong].sort((a, b) => a.house - b.house);
          for (let i = 0; i < 12; i++) {
            const cusp1 = sorted[i].longitude;
            const cusp2 = sorted[(i + 1) % 12].longitude;
            const relative = (deg - cusp1 + 360) % 360;
            const span    = (cusp2 - cusp1 + 360) % 360;
            if (relative < span) return sorted[i].house;
          }
          return 0;
        };

        const SIGN_RULERS_MAP: Record<string, string> = {
          "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
          "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Plutão",
          "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Urano", "Peixes": "Netuno",
        };
        const natalPlanetsMap: any[] = profile?.tropical_natal?.planets ?? [];
        const natalHousesMap: any[] = profile?.tropical_natal?.houses ?? [];

        const tropicalTransits = allAspects.map(t => {
          const transitSign = SIGNS_PT[Math.floor(t.grau_transito / 30)];
          const transitHouse = houseOfDegree(t.grau_transito) || (t.casa_natal ?? 1);

          // Co-casa: casa cuja cúspide abre no mesmo signo do trânsito (distinta da casa de posição)
          const coHouseObj = natalHousesMap.find((h: any) => h.sign === transitSign && h.house !== transitHouse);
          const transitCoHouse: number | undefined = coHouseObj?.house;

          const natalObj = natalPlanetsMap.find((p: any) => p.name === t.planeta_natal);
          const signoNatal: string = natalObj?.sign || "";
          const regenteSignoNatal: string = SIGN_RULERS_MAP[signoNatal] || "";
          const regenteObj = regenteSignoNatal ? natalPlanetsMap.find((p: any) => p.name === regenteSignoNatal) : undefined;
          const casaDoRegenteNatal: number | undefined = regenteObj?.house;
          const casaRegidaPeloTransitante: number | undefined = natalHousesMap.find((h: any) => h.ruler === t.planeta_transito)?.house;

          // Camada sideral/védica para o bloco "Geografia do Trânsito"
          const vedicTerrain = getVedicTransitTerrain(profile, t.planeta_transito, t.grau_transito, transitHouse);

          return {
            planet: t.planeta_transito,
            transitSign,
            transitDegree: t.grau_transito % 30,
            transitHouse,
            transitCoHouse,
            casaNatal: t.casa_natal ?? 1,
            planetaNatal: t.planeta_natal,
            aspectToNatal: `${t.aspecto} com ${t.planeta_natal} Natal`,
            ritmo_tempo: t.ritmo_tempo,
            casaDoRegenteNatal,
            casaRegidaPeloTransitante,
            vedic_structural_terrain: vedicTerrain,
          };
        });

        console.log("[TRANSIT HOUSE DEBUG]", tropicalTransits.map(t => `${t.planet} sign=${t.transitSign} → Casa ${t.transitHouse}${t.transitCoHouse ? ` + co-Casa ${t.transitCoHouse}` : ""}`));
        enrichedProfile = { ...profile, tropical_transits: tropicalTransits };
      } catch (engineErr: any) {
        console.warn("[TRANSIT ENGINE] Falha no motor interno, usando dados do profile:", engineErr?.message);
      }

      const readingText = await generateTransitCyclesReading(enrichedProfile);
      return res.json({ reading: readingText });
    } catch (err: any) {
      console.error("Erro ao gerar Leitura de Trânsitos e Ciclos:", err);
      return res.status(500).json({
        error: "Erro ao gerar Leitura de Trânsitos e Ciclos.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Senhor do Ano (Annual Profection + Solar Return)
  app.post("/api/cycles/profection", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile || !profile.birthData) {
        return res.status(400).json({ error: "Perfil astrológico completo é obrigatório." });
      }

      if (!(await requireFeatureAccess(req, res, "ciclos"))) {
        return;
      }

      const referenceDate = new Date();
      const age = calculateCurrentAge(profile.birthData.birthDate, referenceDate);
      const readingId = `senhor-do-ano-idade-${age}`;

      const cached = await getCachedReading(userId, readingId);
      if (cached && cached.profection) {
        console.log(`[PROFECTION] Cache hit para ${readingId}`);
        return res.json({
          profection: cached.profection,
          reading: cached.reading,
          cached: true
        });
      }

      const profectionData = await calculateProfectionLord(profile, referenceDate, { allowSolarReturnFetch: true });
      const reading = await generateProfectionLordReading(profile, profectionData);

      await saveReading(userId, readingId, "profection", {
        profection: profectionData,
        reading,
        generatedAt: referenceDate.toISOString()
      });

      return res.json({ profection: profectionData, reading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar Senhor do Ano:", err);
      return res.status(500).json({
        error: "Erro ao gerar Senhor do Ano.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Ativações Rápidas (fast transits + profection)
  app.post("/api/cycles/rapid-activations", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile || !profile.birthData) {
        return res.status(400).json({ error: "Perfil astrológico completo é obrigatório." });
      }

      if (!(await requireFeatureAccess(req, res, "ciclos"))) {
        return;
      }

      const referenceDate = new Date();
      const dateKey = referenceDate.toISOString().split("T")[0];
      const readingId = `ativacoes-rapidas-${dateKey}`;

      const cached = await getCachedReading(userId, readingId);
      if (cached && cached.activations) {
        console.log(`[RAPID ACTIVATIONS] Cache hit para ${readingId}`);
        return res.json({
          profection: cached.profection,
          activations: cached.activations,
          reading: cached.reading,
          cached: true
        });
      }

      const profectionData = await calculateProfectionLord(profile, referenceDate, { allowSolarReturnFetch: true });
      const activations = calculateRapidActivations(profile, profectionData, referenceDate);

      let reading = "";
      if (activations.length > 0) {
        reading = await generateRapidActivationsReading(profile, profectionData, activations);
      }

      await saveReading(userId, readingId, "rapid-activations", {
        profection: profectionData,
        activations,
        reading,
        generatedAt: referenceDate.toISOString()
      });

      return res.json({ profection: profectionData, activations, reading, cached: false });
    } catch (err: any) {
      console.error("Erro ao gerar Ativações Rápidas:", err);
      return res.status(500).json({
        error: "Erro ao gerar Ativações Rápidas.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Dashas (Tríade do Tempo Cósmico)
  app.post("/api/cycles/dashas", async (req, res) => {
    try {
      const { profile, userId } = req.body;
      if (!profile || !profile.birthData) {
        return res.status(400).json({ error: "Perfil astrológico completo é obrigatório." });
      }

      if (!(await requireFeatureAccess(req, res, "ciclos"))) {
        return;
      }

      const normalizeKey = (name: string) =>
        name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "-");

      const referenceDate = new Date();
      const vedicTiming = profile.vedic_timing || {};
      const maha = normalizeKey(vedicTiming.mahadasha || "desconhecido");
      const antar = normalizeKey(vedicTiming.antardasha || "desconhecido");
      const pratyan = normalizeKey(vedicTiming.pratyantardasha || "desconhecido");
      const readingId = `dasha-v2-${userId}-${maha}-${antar}-${pratyan}`;

      const pratyantardashaEnd = vedicTiming.pratyantardashaEnd;
      const parsedDashaEnd = pratyantardashaEnd
        ? new Date(String(pratyantardashaEnd).trim().replace(" ", "T") + (/Z$|[+-]\d{2}:?\d{2}$/.test(String(pratyantardashaEnd)) ? "" : "Z"))
        : null;
      const expiresAt = parsedDashaEnd && Number.isFinite(parsedDashaEnd.getTime())
        ? parsedDashaEnd
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const cached = await getCachedReading(userId, readingId);
      if (cached && cached.reading) {
        console.log(`[DASHAS] Cache hit para ${readingId}`);
        return res.json({
          reading: cached.reading,
          triad: { maha: vedicTiming.mahadasha, antar: vedicTiming.antardasha, pratyan: vedicTiming.pratyantardasha },
          expiresAt: cached.expiresAt || expiresAt.toISOString(),
          cached: true
        });
      }

      const reading = await generateDashaReading(profile);

      await saveReading(userId, readingId, "dasha", {
        reading,
        triad: { maha: vedicTiming.mahadasha, antar: vedicTiming.antardasha, pratyan: vedicTiming.pratyantardasha },
        generatedAt: referenceDate.toISOString()
      }, expiresAt);

      return res.json({
        reading,
        triad: { maha: vedicTiming.mahadasha, antar: vedicTiming.antardasha, pratyan: vedicTiming.pratyantardasha },
        expiresAt: expiresAt.toISOString(),
        cached: false
      });
    } catch (err: any) {
      console.error("Erro ao gerar Dashas:", err);
      return res.status(500).json({
        error: "Erro ao gerar Dashas.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Glossary
  app.post("/api/generate-glossary", async (req, res) => {
    try {
      const { term } = req.body;
      if (!term) {
        return res.status(400).json({ error: "Termo é obrigatório." });
      }

      const fixedDefinition = getGlossaryDefinition(term);
      if (fixedDefinition) {
        return res.json({ definition: fixedDefinition });
      }

      const definition = await generateGlossary(term);
      return res.json({ definition });
    } catch (err: any) {
      console.error("Erro ao gerar Glossário:", err);
      return res.status(500).json({
        error: "Erro ao gerar Glossário.",
        details: err?.message || String(err)
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // MEDITAÇÃO ALQUÍMICA — Endpoints
  // ═══════════════════════════════════════════════════════════════

  // POST /api/meditation — gera ou recupera áudio de meditação
  app.post("/api/meditation", async (req, res) => {
    try {
      const { userId, pathId, sourceText, pathTitle, gender, gender_preference } = req.body;

      if (!userId || !pathId || !sourceText || !pathTitle) {
        return res.status(400).json({ error: "userId, pathId, sourceText e pathTitle são obrigatórios." });
      }

      const sourceHash = crypto.createHash("sha256").update(sourceText).digest("hex");
      const mixedHash = crypto.createHash("sha256").update(`${sourceHash}|mixed-v1`).digest("hex");
      const narrationHash = crypto.createHash("sha256").update(`${sourceHash}|narration-v1`).digest("hex");
      const mixerConfigured = !!process.env.AUDIO_MIXER_URL?.trim();
      const expectedHash = mixerConfigured ? mixedHash : narrationHash;

      // Conectar ao Supabase com service_role
      const cleanEnv = (val: any): string | undefined => {
        if (!val) return undefined;
        const str = String(val).trim();
        if (str === "" || str === "null" || str === "undefined") return undefined;
        return str;
      };
      const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
      const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Credenciais do Supabase não configuradas." });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Verificar cache: se já existe áudio para este caminho/usuário com mesmo hash
      const { data: existing } = await supabase
        .from("user_paths")
        .select("meditation_audio_url, source_text_hash, journal_text, meditation_script")
        .eq("user_id", userId)
        .eq("path_id", pathId)
        .single();

      if (existing?.meditation_audio_url && existing.source_text_hash === expectedHash) {
        return res.json({
          audioUrl: existing.meditation_audio_url,
          journalText: existing.journal_text || "",
          cached: true,
        });
      }

      let ssml = existing?.meditation_script || "";
      let narrationBuffer: Buffer | null = null;
      if (mixerConfigured && existing?.meditation_audio_url && existing.source_text_hash === narrationHash) {
        const existingNarration = await fetch(existing.meditation_audio_url);
        if (existingNarration.ok) {
          narrationBuffer = Buffer.from(await existingNarration.arrayBuffer());
          console.log("[MEDITATION] Reutilizando narração de contingência para tentar a mixagem.");
        }
      }

      if (!narrationBuffer) {
        console.log(`[MEDITATION] Gerando roteiro para ${pathId} (user: ${userId})...`);
        ssml = await generateMeditationScript(sourceText, pathTitle, gender || "feminino", gender_preference, pathId);
        console.log(`[MEDITATION] Sintetizando áudio TTS...`);
        narrationBuffer = await synthesizeMeditation(ssml);
      }

      console.log(`[MEDITATION] Mixando com música de fundo...`);
      const mixResult = await mixWithBackgroundMusic(narrationBuffer, supabase);
      const finalHash = mixResult.mixed ? mixedHash : narrationHash;
      console.log(`[MEDITATION] Resultado da mixagem: ${mixResult.mixed ? "mixed" : `narration (${mixResult.reason})`}`);

      // Upload para Supabase Storage
      const filePath = `${userId}/${pathId}/${finalHash}.mp3`;
      const { error: uploadError } = await supabase
        .storage
        .from("meditations")
        .upload(filePath, mixResult.buffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("[MEDITATION] Erro no upload:", uploadError);
        return res.status(500).json({ error: "Erro ao salvar áudio no storage.", details: uploadError.message });
      }

      // Obter URL pública
      const { data: urlData } = supabase
        .storage
        .from("meditations")
        .getPublicUrl(filePath);

      const audioUrl = urlData.publicUrl;

      // Upsert em user_paths
      const { error: dbError } = await supabase
        .from("user_paths")
        .upsert({
          user_id: userId,
          path_id: pathId,
          path_title: pathTitle,
          source_text: sourceText,
          source_text_hash: finalHash,
          meditation_script: ssml,
          meditation_audio_url: audioUrl,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,path_id" });

      if (dbError) {
        console.error("[MEDITATION] Erro ao salvar no banco:", dbError);
      }

      console.log(`[MEDITATION] Áudio gerado com sucesso: ${audioUrl}`);
      return res.json({ audioUrl, cached: false });
    } catch (err: any) {
      console.error("[MEDITATION] Erro geral:", err);
      return res.status(500).json({
        error: "Erro ao gerar meditação.",
        details: err?.message || String(err),
      });
    }
  });

  // POST /api/meditation/journal — salva diário
  app.post("/api/meditation/journal", async (req, res) => {
    try {
      const { userId, pathId, journalText } = req.body;

      if (!userId || !pathId) {
        return res.status(400).json({ error: "userId e pathId são obrigatórios." });
      }

      const cleanEnv = (val: any): string | undefined => {
        if (!val) return undefined;
        const str = String(val).trim();
        if (str === "" || str === "null" || str === "undefined") return undefined;
        return str;
      };
      const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
      const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Credenciais do Supabase não configuradas." });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Preserva dados já existentes (path_title, source_text, meditation_script, etc.)
      // em vez de sobrescrevê-los com valores fixos ou vazios.
      const { data: existingRow } = await supabase
        .from("user_paths")
        .select("path_title, source_text, source_text_hash")
        .eq("user_id", userId)
        .eq("path_id", pathId)
        .single();

      const { error } = await supabase
        .from("user_paths")
        .upsert({
          user_id: userId,
          path_id: pathId,
          path_title: existingRow?.path_title || "",
          source_text: existingRow?.source_text || "",
          source_text_hash: existingRow?.source_text_hash || "",
          journal_text: journalText || "",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,path_id" });

      if (error) {
        return res.status(500).json({ error: "Erro ao salvar diário.", details: error.message });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[MEDITATION JOURNAL] Erro:", err);
      return res.status(500).json({ error: "Erro ao salvar diário.", details: err?.message || String(err) });
    }
  });

  // GET /api/meditation/journal/list — retorna todas as entradas de diário de um usuário
  app.get("/api/meditation/journal/list", async (req, res) => {
    try {
      const userId = String(req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const { data } = await supabase
        .from("user_paths")
        .select("path_id, path_title, journal_text, updated_at")
        .eq("user_id", userId)
        .not("journal_text", "is", null)
        .neq("journal_text", "");

      return res.json({ entries: data || [] });
    } catch (err: any) {
      console.error("[MEDITATION JOURNAL LIST] Erro:", err);
      return res.status(500).json({ error: "Erro ao buscar diário.", details: err?.message || String(err) });
    }
  });

  // GET /api/meditation/journal — retorna diário
  app.get("/api/meditation/journal", async (req, res) => {
    try {
      const { userId, pathId } = req.query;

      if (!userId || !pathId) {
        return res.status(400).json({ error: "userId e pathId são obrigatórios." });
      }

      const cleanEnv = (val: any): string | undefined => {
        if (!val) return undefined;
        const str = String(val).trim();
        if (str === "" || str === "null" || str === "undefined") return undefined;
        return str;
      };
      const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
      const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Credenciais do Supabase não configuradas." });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data } = await supabase
        .from("user_paths")
        .select("journal_text, meditation_audio_url, source_text")
        .eq("user_id", userId)
        .eq("path_id", pathId)
        .single();

      return res.json({
        journalText: data?.journal_text || "",
        audioUrl: data?.meditation_audio_url || null,
        sourceText: data?.source_text || "",
      });
    } catch (err: any) {
      console.error("[MEDITATION JOURNAL GET] Erro:", err);
      return res.status(500).json({ error: "Erro ao buscar diário.", details: err?.message || String(err) });
    }
  });

  // GET /api/meditation/download — faz download do áudio gerado
  app.get("/api/meditation/download", async (req, res) => {
    try {
      const { userId, pathId } = req.query;

      if (!userId || !pathId) {
        return res.status(400).json({ error: "userId e pathId são obrigatórios." });
      }

      const cleanEnv = (val: any): string | undefined => {
        if (!val) return undefined;
        const str = String(val).trim();
        if (str === "" || str === "null" || str === "undefined") return undefined;
        return str;
      };
      const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
      const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Credenciais do Supabase não configuradas." });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data } = await supabase
        .from("user_paths")
        .select("meditation_audio_url, path_title")
        .eq("user_id", userId)
        .eq("path_id", pathId)
        .single();

      if (!data?.meditation_audio_url) {
        return res.status(404).json({ error: "Áudio de meditação não encontrado." });
      }

      const audioRes = await fetch(data.meditation_audio_url);
      if (!audioRes.ok) {
        throw new Error(`Erro ao buscar áudio do storage: ${audioRes.status}`);
      }

      const arrayBuffer = await audioRes.arrayBuffer();
      const contentType = audioRes.headers.get("content-type") || "audio/mpeg";

      const safeTitle = (data.path_title || String(pathId))
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase()
        .replace(/^-+|-+$/g, "");
      const date = new Date().toISOString().slice(0, 10);
      const filename = `meditacao-${safeTitle || "alquimica"}-${date}.mp3`;

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", arrayBuffer.byteLength);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("[MEDITATION DOWNLOAD] Erro:", err);
      return res.status(500).json({ error: "Erro ao baixar meditação.", details: err?.message || String(err) });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // CARD DE PAUSA DE PRESENÇA — Endpoints das Casas
  // ═══════════════════════════════════════════════════════════════

  // POST /api/house-presence-question — gera ou recupera a pergunta de presença e meditação de uma Casa
  app.post("/api/house-presence-question", async (req, res) => {
    try {
      const { userId, houseId, synthesisContext, houseNumber, houseSign, housePlanets } = req.body;

      if (!houseId || !synthesisContext || typeof synthesisContext !== "object") {
        return res.status(400).json({ error: "houseId e synthesisContext são obrigatórios." });
      }

      const questionCacheId = `${houseId}-pausa-pergunta-v4`;
      const meditationCacheId = `${houseId}-pausa-meditacao-v1`;

      let question: string | null = null;
      let meditation: string | null = null;
      let questionFromCache = false;
      let meditationFromCache = false;

      // Tenta cache em user_readings
      if (userId) {
        const cachedQuestion = await getCachedReading(userId, questionCacheId);
        const cachedMeditation = await getCachedReading(userId, meditationCacheId);
        if (cachedQuestion && typeof cachedQuestion === "string") {
          question = cachedQuestion;
          questionFromCache = true;
        }
        if (cachedMeditation && typeof cachedMeditation === "string") {
          meditation = cachedMeditation;
          meditationFromCache = true;
        }
      }

      if (!question) {
        question = await generateHousePresenceQuestion(synthesisContext);
      }

      if (!meditation) {
        const number = typeof houseNumber === "number" ? houseNumber : (parseInt(String(houseId).replace(/\D/g, ""), 10) || 1);
        meditation = await generateHouseMeditation(synthesisContext, number, houseSign, housePlanets);
      }

      if (userId) {
        await saveReading(userId, questionCacheId, "casa-pausa-pergunta", question);
        await saveReading(userId, meditationCacheId, "casa-pausa-meditacao", meditation);
      }

      return res.json({ question, meditation, cached: questionFromCache && meditationFromCache });
    } catch (err: any) {
      console.error("[HOUSE PRESENCE QUESTION] Erro:", err);
      return res.status(500).json({ error: "Erro ao gerar pergunta de presença.", details: err?.message || String(err) });
    }
  });

  // POST /api/house-mantra — gera ou recupera o mantra do Dom Manifestado de uma Casa
  app.post("/api/house-mantra", async (req, res) => {
    try {
      const { userId, houseId, domText } = req.body;

      if (!houseId || !domText || typeof domText !== "string") {
        return res.status(400).json({ error: "houseId e domText são obrigatórios." });
      }

      const cacheId = `${houseId}-mantra`;

      // Tenta cache em user_readings
      if (userId) {
        const cached = await getCachedReading(userId, cacheId);
        if (cached && typeof cached === "string") {
          return res.json({ mantra: cached, cached: true });
        }
      }

      const mantra = await generateHouseMantra(domText);

      if (userId) {
        await saveReading(userId, cacheId, "casa-mantra", mantra);
      }

      return res.json({ mantra, cached: false });
    } catch (err: any) {
      console.error("[HOUSE MANTRA] Erro:", err);
      return res.status(500).json({ error: "Erro ao gerar mantra.", details: err?.message || String(err) });
    }
  });

  // POST /api/house-insight — salva percepção da Pausa de Presença na aba Insights
  app.post("/api/house-insight", async (req, res) => {
    try {
      const { userId, houseId, insightText } = req.body;

      if (!userId || !houseId) {
        return res.status(400).json({ error: "userId e houseId são obrigatórios." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado no servidor." });
      }

      const category = `${houseId}-pausa`;
      const { data, error } = await supabase
        .from("user_insights")
        .insert({
          user_id: userId,
          insight_text: insightText || "",
          category,
          transit_key: null,
        })
        .select("id, insight_text, category, created_at")
        .single();

      if (error) {
        console.error("[HOUSE INSIGHT] Erro ao salvar:", error);
        return res.status(500).json({ error: "Erro ao salvar percepção.", details: error.message });
      }

      return res.json({ success: true, insight: data });
    } catch (err: any) {
      console.error("[HOUSE INSIGHT] Erro:", err);
      return res.status(500).json({ error: "Erro ao salvar percepção.", details: err?.message || String(err) });
    }
  });

  // GET /api/house-insight — retorna a última percepção salva de uma Casa
  app.get("/api/house-insight", async (req, res) => {
    try {
      const { userId, houseId } = req.query;

      if (!userId || !houseId) {
        return res.status(400).json({ error: "userId e houseId são obrigatórios." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado no servidor." });
      }

      const category = `${houseId}-pausa`;
      const { data, error } = await supabase
        .from("user_insights")
        .select("id, insight_text, category, created_at")
        .eq("user_id", userId)
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[HOUSE INSIGHT GET] Erro:", error);
        return res.status(500).json({ error: "Erro ao buscar percepção.", details: error.message });
      }

      return res.json({ insight: data || null });
    } catch (err: any) {
      console.error("[HOUSE INSIGHT GET] Erro:", err);
      return res.status(500).json({ error: "Erro ao buscar percepção.", details: err?.message || String(err) });
    }
  });

  // ============================================================
  // InfinitePay Checkout
  // ============================================================

  const PLANS: Record<string, { price: number; description: string }> = {
    "annual-launch": { price: 21600, description: "Plano Anual — Lançamento" },
    "semester": { price: 16000, description: "Passe Semestral" },
    "annual-official": { price: 24000, description: "Plano Anual Oficial" },
    "monthly": { price: 1290, description: "Continuar com os Ciclos Ativos" },
  };

  function getAppUrl(): string {
    const url = process.env.APP_URL || process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`;
    return url.replace(/\/$/, "");
  }

  async function verifyPaymentWithInfinitePay(
    orderNsu: string,
    transactionNsu: string,
    slug: string
  ): Promise<{ paid: boolean; payload: any }> {
    const handle = process.env.INFINITEPAY_HANDLE;
    if (!handle || !transactionNsu || !slug) {
      console.warn("[InfinitePay] Impossível verificar: handle, transaction_nsu ou slug ausente.");
      return { paid: false, payload: {} };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const checkRes = await fetch("https://api.checkout.infinitepay.io/payment_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: transactionNsu, slug }),
      });

      if (!checkRes.ok) {
        console.warn("[InfinitePay] payment_check retornou status:", checkRes.status);
        return { paid: false, payload: {} };
      }

      const checkData = await checkRes.json().catch(() => ({} as any));
      return { paid: checkData.paid === true, payload: checkData };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("[InfinitePay] payment_check excedeu 15s.");
      } else {
        console.error("[InfinitePay] payment_check erro:", err?.message || err);
      }
      return { paid: false, payload: {} };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function findUserByEmail(supabase: any, email: string): Promise<string | null> {
    const pageSize = 1000;
    let page = 1;
    const normalizedEmail = email.toLowerCase().trim();

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });
      if (error || !data) {
        console.warn("[findUserByEmail] Erro ao listar usuários:", error);
        return null;
      }

      const users = data.users || [];
      const found = users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      if (found) return found.id;

      if (users.length < pageSize) break;
      page++;
    }

    return null;
  }

  function appendWebhookToken(url: string): string {
    const secret = process.env.INFINITE_WEBHOOK_SECRET;
    if (!secret) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(secret)}`;
  }

  async function isAdmin(supabase: any, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.warn("[Admin] Erro ao verificar admin:", error);
        return false;
      }

      return data.is_admin === true;
    } catch (err) {
      console.error("[Admin] Erro:", err);
      return false;
    }
  }

  async function requireAdmin(req: any, res: any): Promise<{ supabase: any; user: any } | null> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

      if (!token) {
        res.status(401).json({ error: "Sessão inválida." });
        return null;
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(500).json({ error: "Supabase não configurado." });
        return null;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        res.status(401).json({ error: "Sessão inválida." });
        return null;
      }

      if (!(await isAdmin(supabase, user.id))) {
        res.status(403).json({ error: "Acesso restrito a administradores." });
        return null;
      }

      return { supabase, user };
    } catch (err: any) {
      console.error("[Admin] Erro na autorização:", err);
      res.status(500).json({ error: "Erro ao verificar permissões." });
      return null;
    }
  }

  function endOfDay(dateInput: string | Date): string {
    const d = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput.getTime());
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  function computeAccessExpiration(currentExpiresAt: string | null | undefined, planId: string): Date {
    const now = new Date();
    const current = currentExpiresAt ? new Date(currentExpiresAt) : null;
    const base = current && current > now ? current : now;
    if (planId === "semester") {
      base.setMonth(base.getMonth() + 6);
    } else if (planId === "monthly") {
      base.setMonth(base.getMonth() + 1);
    } else {
      base.setFullYear(base.getFullYear() + 1);
    }
    return base;
  }

  async function validateCoupon(supabase: any, code: string, planId?: string) {
    const normalizedCode = code.toUpperCase().trim();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .single();

    if (error || !data) {
      return { valid: false, error: "Cupom não encontrado." };
    }

    if (!data.is_active) {
      return { valid: false, error: "Cupom inativo." };
    }

    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      return { valid: false, error: "Cupom expirado." };
    }

    if (data.max_uses !== null && data.max_uses !== undefined && data.current_uses >= data.max_uses) {
      return { valid: false, error: "Limite de usos do cupom atingido." };
    }

    if (data.plan_id && data.plan_id !== planId) {
      return { valid: false, error: "Cupom não é válido para este plano." };
    }

    return {
      valid: true,
      code: normalizedCode,
      planId: data.plan_id || null,
      discountType: data.discount_type,
      discountValue: Number(data.discount_value),
    };
  }

  function applyDiscount(originalCents: number, coupon: { discountType: string; discountValue: number }): number {
    let discounted = originalCents;
    if (coupon.discountType === "percentage") {
      discounted = Math.round(originalCents * (1 - coupon.discountValue / 100));
    } else if (coupon.discountType === "fixed") {
      const fixedCents = Math.round(coupon.discountValue * 100);
      discounted = Math.max(0, originalCents - fixedCents);
    }
    return Math.max(0, discounted);
  }

  async function incrementCouponUses(supabase: any, code?: string | null) {
    if (!code) return;
    const { error } = await supabase.rpc("increment_coupon_uses", { p_code: code });
    if (error) {
      console.error("[Coupons] Erro ao incrementar uso:", error);
    }
  }

  async function grantAccess(supabase: any, userId: string, planId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_expires_at")
      .eq("id", userId)
      .single();

    const newExpiration = computeAccessExpiration(profile?.access_expires_at, planId);

    const { error } = await supabase
      .from("profiles")
      .update({
        has_access: true,
        subscription_tier: "PLUS",
        current_plan_id: planId,
        access_expires_at: newExpiration.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[InfinitePay] Erro ao conceder acesso:", error);
      throw new Error("Erro ao atualizar perfil de acesso.");
    }
  }

  // POST /api/coupons/validate - valida um cupom
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, plan_id } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ valid: false, error: "Código do cupom é obrigatório." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ valid: false, error: "Supabase não configurado." });
      }

      const result = await validateCoupon(supabase, code, plan_id);
      return res.json(result);
    } catch (err: any) {
      console.error("[Coupons] Erro ao validar:", err);
      return res.status(500).json({ valid: false, error: "Erro ao validar cupom." });
    }
  });

  // POST /api/checkout/infinitepay - gera link de pagamento
  app.post("/api/checkout/infinitepay", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      const { planId, coupon_code } = req.body;

      if (!token) {
        return res.status(401).json({ error: "Sessão inválida." });
      }
      if (!planId || !PLANS[planId]) {
        return res.status(400).json({ error: "Plano inválido." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const settings = await getSystemSettings(supabase);
      if (!settings.checkout_active) {
        return res.status(503).json({ error: "Checkout em manutenção. Tente novamente mais tarde." });
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const handle = process.env.INFINITEPAY_HANDLE;
      if (!handle) {
        return res.status(500).json({ error: "INFINITEPAY_HANDLE não configurado." });
      }

      const plan = PLANS[planId];
      let finalPrice = plan.price;
      let couponData: { code: string; discountType: string; discountValue: number } | null = null;

      if (coupon_code) {
        const coupon = await validateCoupon(supabase, coupon_code, planId);
        if (!coupon.valid) {
          return res.status(400).json({ error: coupon.error });
        }
        couponData = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        };
        finalPrice = applyDiscount(plan.price, couponData);
      }

      const orderNsu = crypto.randomUUID();
      const appUrl = getAppUrl();

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        plan_id: planId,
        order_nsu: orderNsu,
        amount: finalPrice,
        original_amount: plan.price,
        coupon_code: couponData?.code || null,
        status: "pending",
        provider: "infinitepay",
      });

      if (txError) {
        console.error("[InfinitePay Checkout] Erro ao criar transação:", txError);
        return res.status(500).json({ error: "Erro ao criar pedido." });
      }

      const itemDescription = couponData
        ? `${plan.description} (Cupom ${couponData.code})`
        : plan.description;

      const payload: any = {
        handle,
        order_nsu: orderNsu,
        redirect_url: `${appUrl}/sucesso`,
        items: [{ quantity: 1, price: finalPrice, description: itemDescription }],
      };

      if (user.email) {
        payload.customer = { email: user.email };
      }

      const webhookUrl = process.env.INFINITE_WEBHOOK_URL;
      if (webhookUrl) {
        payload.webhook_url = appendWebhookToken(webhookUrl);
      } else if (!appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
        payload.webhook_url = appendWebhookToken(`${appUrl}/api/webhooks/infinitepay`);
      }

      const controller = new AbortController();
      const linksTimeout = setTimeout(() => controller.abort(), 15000);

      let ipRes;
      try {
        ipRes = await fetch("https://api.checkout.infinitepay.io/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        clearTimeout(linksTimeout);
        console.error("[InfinitePay Checkout] Erro na chamada à API:", err);
        return res.status(502).json({ error: "Erro ao gerar link de pagamento." });
      } finally {
        clearTimeout(linksTimeout);
      }

      const ipData = await ipRes.json().catch(() => ({} as any));
      if (!ipRes.ok || !ipData.url) {
        console.error("[InfinitePay Checkout] Erro na API:", ipData);
        return res.status(502).json({ error: "Erro ao gerar link de pagamento.", details: ipData });
      }

      await supabase
        .from("transactions")
        .update({
          checkout_url: ipData.url,
          payload: ipData,
          updated_at: new Date().toISOString(),
        })
        .eq("order_nsu", orderNsu);

      return res.json({ url: ipData.url, order_nsu: orderNsu });
    } catch (err: any) {
      console.error("[InfinitePay Checkout] Erro:", err);
      return res.status(500).json({ error: "Erro interno no checkout.", details: err?.message || String(err) });
    }
  });

  // POST /api/checkout/verify - validação ativa via redirect (fallback localhost)
  app.post("/api/checkout/verify", async (req, res) => {
    try {
      const { order_nsu, transaction_nsu, slug } = req.body;

      if (!order_nsu || !transaction_nsu || !slug) {
        return res.status(400).json({ error: "Dados incompletos para verificação." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const { data: tx, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("order_nsu", order_nsu)
        .single();

      if (txError || !tx) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      if (tx.status === "paid") {
        return res.json({ success: true, already_paid: true });
      }

      const handle = process.env.INFINITEPAY_HANDLE;
      if (!handle) {
        return res.status(500).json({ error: "INFINITEPAY_HANDLE não configurado." });
      }

      const { paid, payload: checkPayload } = await verifyPaymentWithInfinitePay(order_nsu, transaction_nsu, slug);

      if (!paid) {
        console.warn("[InfinitePay Verify] Pagamento não confirmado:", { order_nsu, transaction_nsu });
        return res.json({ success: false, message: "Pagamento ainda não confirmado." });
      }

      await supabase
        .from("transactions")
        .update({
          status: "paid",
          transaction_nsu,
          slug,
          payload: checkPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("order_nsu", order_nsu);

      await grantAccess(supabase, tx.user_id, tx.plan_id);
      await incrementCouponUses(supabase, tx.coupon_code);

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[InfinitePay Verify] Erro:", err);
      return res.status(500).json({ error: "Erro ao verificar pagamento.", details: err?.message || String(err) });
    }
  });

  // POST /api/webhooks/infinitepay - webhook de produção
  app.post("/api/webhooks/infinitepay", async (req, res) => {
    try {
      const body = req.body || {};
      const webhookSecret = process.env.INFINITE_WEBHOOK_SECRET;
      const providedToken = (req.query?.token as string) || body?.token;

      if (webhookSecret) {
        if (!providedToken || providedToken !== webhookSecret) {
          console.warn("[InfinitePay Webhook] Token inválido ou ausente.");
          return res.status(401).send("Unauthorized");
        }
      } else {
        console.warn(
          "[InfinitePay Webhook] INFINITE_WEBHOOK_SECRET não configurado. Considere defini-lo para proteger o webhook."
        );
      }
      const orderNsu = body.order_nsu || body.orderNsu || body.reference?.orderNsu || body.reference?.order_nsu;
      const transactionNsu = body.transaction_nsu || body.transactionNsu || body.reference?.transactionNsu || body.reference?.transaction_nsu;
      const slug = body.invoice_slug || body.slug || body.reference?.slug;
      const amount = typeof body.amount === "number" ? body.amount : body.paid_amount || body.charge?.amount;
      const customerEmail = body.customer?.email || body.customer_email || body.buyer?.email || body.email;
      const isPaid = body.paid === true || body.status === "paid";

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(400).send("Bad Request");
      }

      // Caso 1: checkout conhecido (annual / semester / one-time)
      if (orderNsu) {
        const { data: tx } = await supabase
          .from("transactions")
          .select("*")
          .eq("order_nsu", orderNsu)
          .single();

        if (tx && tx.status === "paid") {
          return res.status(200).send("OK");
        }

        if (tx) {
          if (!transactionNsu || !slug) {
            console.warn("[InfinitePay Webhook] transaction_nsu ou slug ausentes:", { orderNsu, body });
            return res.status(400).send("Bad Request");
          }

          const { paid } = await verifyPaymentWithInfinitePay(orderNsu, transactionNsu, slug);

          if (!paid) {
            console.warn("[InfinitePay Webhook] Pagamento não confirmado pela InfinitePay:", { orderNsu, transactionNsu });
            return res.status(400).send("Bad Request");
          }

          await supabase
            .from("transactions")
            .update({
              status: "paid",
              transaction_nsu: transactionNsu || tx.transaction_nsu,
              slug: slug || tx.slug,
              payload: body,
              updated_at: new Date().toISOString(),
            })
            .eq("order_nsu", orderNsu);

          await grantAccess(supabase, tx.user_id, tx.plan_id);
          await incrementCouponUses(supabase, tx.coupon_code);
          return res.status(200).send("OK");
        }

        // Checkout conhecido não encontrado — pode ser um pedido antigo ou outro ambiente
        console.warn("[InfinitePay Webhook] Pedido desconhecido:", { orderNsu, body });
        return res.status(200).send("OK");
      }

      // Caso 2: assinatura mensal via Planos e Recorrências
      const monthlyAmount = Number(process.env.INFINITE_PAY_MONTHLY_AMOUNT) || 1290;
      if (isPaid && amount === monthlyAmount && customerEmail) {
        let verified = false;

        if (orderNsu && transactionNsu && slug) {
          const { paid } = await verifyPaymentWithInfinitePay(orderNsu, transactionNsu, slug);
          verified = paid;
        } else if (webhookSecret && providedToken === webhookSecret) {
          verified = true;
        } else {
          console.warn(
            "[InfinitePay Webhook] Assinatura mensal sem detalhes para verificação e sem INFINITE_WEBHOOK_SECRET."
          );
          return res.status(400).send("Bad Request");
        }

        if (!verified) {
          console.warn("[InfinitePay Webhook] Assinatura mensal não verificada:", { customerEmail, body });
          return res.status(400).send("Bad Request");
        }

        const userId = await findUserByEmail(supabase, customerEmail);
        if (!userId) {
          console.warn("[InfinitePay Webhook] E-mail não encontrado:", customerEmail);
          return res.status(200).send("OK");
        }

        const subscriptionNsu = orderNsu || transactionNsu || crypto.randomUUID();

        // Evita duplicatas
        const { data: existing } = await supabase
          .from("transactions")
          .select("id, status")
          .eq("order_nsu", subscriptionNsu)
          .single();

        if (existing && existing.status === "paid") {
          return res.status(200).send("OK");
        }

        if (!existing) {
          await supabase.from("transactions").insert({
            user_id: userId,
            plan_id: "monthly",
            order_nsu: subscriptionNsu,
            transaction_nsu: transactionNsu || subscriptionNsu,
            slug: slug || null,
            amount,
            status: "paid",
            provider: "infinitepay-subscription",
            payload: body,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        await grantAccess(supabase, userId, "monthly");
        console.log("[InfinitePay Webhook] Acesso mensal concedido:", userId, customerEmail);
        return res.status(200).send("OK");
      }

      console.warn("[InfinitePay Webhook] Payload não reconhecido:", body);
      return res.status(200).send("OK");
    } catch (err: any) {
      console.error("[InfinitePay Webhook] Erro:", err);
      return res.status(400).send("Bad Request");
    }
  });

  // ============================================================
  // Admin Panel API
  // ============================================================

  // GET /api/health - diagnóstico mascarado de configuração e conexão básica
  app.get("/api/health", async (req: any, res) => {
    const required = {
      SUPABASE_URL: !!cleanEnvVar(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: !!cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY),
      VITE_SUPABASE_URL: !!cleanEnvVar(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: !!cleanEnvVar(process.env.VITE_SUPABASE_ANON_KEY),
    };
    const optional = {
      JHORA_API_URL: { configured: !!cleanEnvVar(process.env.JHORA_API_URL), using_default: !cleanEnvVar(process.env.JHORA_API_URL) },
      ASTROLOGY_API_KEY: !!cleanEnvVar(process.env.ASTROLOGY_API_KEY),
      GEMINI_API_KEY: !!cleanEnvVar(process.env.GEMINI_API_KEY),
      GOOGLE_TTS_CREDENTIALS_JSON: !!cleanEnvVar(process.env.GOOGLE_TTS_CREDENTIALS_JSON),
      RESEND_API_KEY: !!cleanEnvVar(process.env.RESEND_API_KEY),
      AUDIO_MIXER_URL: !!cleanEnvVar(process.env.AUDIO_MIXER_URL),
      AUDIO_MIXER_SECRET: !!cleanEnvVar(process.env.AUDIO_MIXER_SECRET),
      BACKGROUND_MUSIC_URL: !!cleanEnvVar(process.env.BACKGROUND_MUSIC_URL),
    };
    const supabase = getSupabaseAdmin();
    let database = { ok: false, error: supabase ? "probe_failed" : "not_configured" };
    if (supabase) {
      try {
        const probe = supabase.from("system_settings").select("key").limit(1);
        const result: any = await Promise.race([
          probe,
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
        ]);
        database = { ok: !result.error, error: result.error ? "query_failed" : "" };
      } catch (error: any) {
        database = { ok: false, error: error?.message === "timeout" ? "timeout" : "query_failed" };
      }
    }
    const missingRequired = Object.entries(required).filter(([, present]) => !present).map(([name]) => name);
    return res.status(missingRequired.length === 0 && database.ok ? 200 : 503).json({
      ok: missingRequired.length === 0 && database.ok,
      request_id: req.requestId,
      runtime: { node_env: process.env.NODE_ENV || null, vercel: process.env.VERCEL === "1" },
      required,
      optional,
      database,
      missing_required: missingRequired,
    });
  });

  // GET /api/settings - configurações globais públicas (read-only)
  app.get("/api/settings", async (req, res) => {
    try {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const settings = await getSystemSettings(supabase);
      return res.json(settings);
    } catch (err: any) {
      console.error("[Admin] Erro ao carregar settings:", err);
      return res.status(500).json({ error: "Erro ao carregar configurações." });
    }
  });

  // POST /api/admin/settings - atualiza uma chave de sistema
  app.post("/api/admin/settings", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Chave e valor são obrigatórios." });
      }

      const { error } = await admin.supabase
        .from("system_settings")
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) {
        console.error("[Admin] Erro ao atualizar setting:", error);
        return res.status(500).json({ error: "Erro ao atualizar configuração." });
      }

      return res.json({ success: true, key, value });
    } catch (err: any) {
      console.error("[Admin] Erro em settings:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // GET /api/admin/metrics - métricas rápidas
  app.get("/api/admin/metrics", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { count: totalUsers, error: totalError } = await admin.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activePlusUsers, error: activeError } = await admin.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("has_access", true)
        .gt("access_expires_at", new Date().toISOString());

      if (totalError || activeError) {
        console.error("[Admin] Erro nas métricas:", { totalError, activeError });
        return res.status(500).json({ error: "Erro ao carregar métricas." });
      }

      return res.json({
        totalUsers: totalUsers || 0,
        activePlusUsers: activePlusUsers || 0,
      });
    } catch (err: any) {
      console.error("[Admin] Erro em métricas:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/users/search - busca por e-mail
  app.post("/api/admin/users/search", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "E-mail é obrigatório." });
      }

      const searchTerm = email.toLowerCase().trim();

      // Lista usuários do auth (com service role) e filtra por e-mail
      let allUsers: any[] = [];
      let page = 1;
      const perPage = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await admin.supabase.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          console.error("[Admin] Erro ao listar usuários:", error);
          return res.status(500).json({ error: "Erro ao buscar usuários." });
        }

        allUsers = allUsers.concat(data.users || []);
        hasMore = (data.users || []).length === perPage;
        page++;
      }

      const matchedUsers = allUsers.filter(
        (u) => u.email && u.email.toLowerCase().includes(searchTerm)
      );

      if (matchedUsers.length === 0) {
        return res.json({ users: [] });
      }

      const userIds = matchedUsers.map((u) => u.id);
      const { data: profiles, error: profileError } = await admin.supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profileError) {
        console.error("[Admin] Erro ao buscar perfis:", profileError);
        return res.status(500).json({ error: "Erro ao buscar perfis." });
      }

      const profileMap: Record<string, any> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = p;
      }

      const users = matchedUsers.map((u) => ({
        id: u.id,
        email: u.email,
        profile: profileMap[u.id] || null,
      }));

      return res.json({ users });
    } catch (err: any) {
      console.error("[Admin] Erro na busca:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/users/grace - +7 dias de cortesia
  app.post("/api/admin/users/grace", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      const { data: profile } = await admin.supabase
        .from("profiles")
        .select("access_expires_at")
        .eq("id", userId)
        .single();

      const now = new Date();
      const current = profile?.access_expires_at ? new Date(profile.access_expires_at) : null;
      const base = current && current > now ? current : now;
      base.setDate(base.getDate() + 7);

      const { error } = await admin.supabase
        .from("profiles")
        .update({
          has_access: true,
          subscription_tier: "PLUS",
          current_plan_id: "grace",
          access_expires_at: base.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("[Admin] Erro na cortesia:", error);
        return res.status(500).json({ error: "Erro ao adicionar dias de cortesia." });
      }

      return res.json({ success: true, access_expires_at: base.toISOString() });
    } catch (err: any) {
      console.error("[Admin] Erro em grace:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/users/grant - liberar PLUS com plano e data manual
  app.post("/api/admin/users/grant", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { userId, planId, expiresAt } = req.body;
      if (!userId || !planId || !PLANS[planId] || !expiresAt) {
        return res.status(400).json({ error: "Dados incompletos para liberar acesso." });
      }

      const expiration = endOfDay(expiresAt);

      const { error } = await admin.supabase
        .from("profiles")
        .update({
          has_access: true,
          subscription_tier: "PLUS",
          current_plan_id: planId,
          access_expires_at: expiration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("[Admin] Erro ao conceder PLUS:", error);
        return res.status(500).json({ error: "Erro ao conceder acesso PLUS." });
      }

      return res.json({ success: true, access_expires_at: expiration });
    } catch (err: any) {
      console.error("[Admin] Erro em grant:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/users/reset-chart - deleta dados de nascimento
  app.post("/api/admin/users/reset-chart", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      const { error } = await admin.supabase
        .from("user_chart")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("[Admin] Erro ao resetar mapa:", error);
        return res.status(500).json({ error: "Erro ao resetar mapa." });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Admin] Erro em reset-chart:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // ============================================================
  // Admin: Analytics
  // ============================================================

  // POST /api/analytics/track - registra um evento
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { event_name } = req.body;
      if (!event_name || typeof event_name !== "string") {
        return res.status(400).json({ error: "event_name é obrigatório." });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      if (!token) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase não configurado." });
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const { error } = await supabase.from("analytics_events").insert({
        event_name,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[Analytics] Erro ao inserir evento:", error);
        return res.status(500).json({ error: "Erro ao registrar evento." });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Analytics] Erro:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // GET /api/admin/funnel - métricas do funil de vendas
  app.get("/api/admin/funnel", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { count: viewPaywall, error: err1 } = await admin.supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "view_paywall");

      const { count: viewPlans, error: err2 } = await admin.supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "view_plans");

      const { count: checkoutInitiated, error: err3 } = await admin.supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "checkout_initiated");

      const { count: checkoutCompleted, error: err4 } = await admin.supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid");

      if (err1 || err2 || err3 || err4) {
        console.error("[Admin] Erro no funil:", { err1, err2, err3, err4 });
        return res.status(500).json({ error: "Erro ao carregar funil." });
      }

      return res.json({
        viewPaywall: viewPaywall || 0,
        viewPlans: viewPlans || 0,
        checkoutInitiated: checkoutInitiated || 0,
        checkoutCompleted: checkoutCompleted || 0,
      });
    } catch (err: any) {
      console.error("[Admin] Erro no funil:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // ============================================================
  // Admin: Coupons
  // ============================================================

  // GET /api/admin/coupons - lista todos os cupons
  app.get("/api/admin/coupons", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { data, error } = await admin.supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin] Erro ao listar cupons:", error);
        return res.status(500).json({ error: "Erro ao listar cupons." });
      }

      return res.json({ coupons: data || [] });
    } catch (err: any) {
      console.error("[Admin] Erro em coupons:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/coupons - cria um novo cupom
  app.post("/api/admin/coupons", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { code, discount_type, discount_value, max_uses, expires_at } = req.body;

      if (!code || !discount_type || discount_value === undefined || discount_value === null) {
        return res.status(400).json({ error: "Código, tipo e valor de desconto são obrigatórios." });
      }

      if (!["percentage", "fixed"].includes(discount_type)) {
        return res.status(400).json({ error: "Tipo de desconto inválido." });
      }

      const normalizedCode = code.toUpperCase().trim();
      const numericValue = Number(discount_value);
      if (isNaN(numericValue) || numericValue <= 0) {
        return res.status(400).json({ error: "Valor de desconto inválido." });
      }

      const payload: any = {
        code: normalizedCode,
        discount_type,
        discount_value: numericValue,
        is_active: true,
        current_uses: 0,
      };

      if (max_uses !== undefined && max_uses !== null && max_uses !== "") {
        const max = Number(max_uses);
        if (!isNaN(max) && max > 0) {
          payload.max_uses = max;
        }
      }

      if (expires_at) {
        payload.expires_at = endOfDay(expires_at);
      }

      const { data, error } = await admin.supabase.from("coupons").insert(payload).select().single();

      if (error) {
        console.error("[Admin] Erro ao criar cupom:", error);
        if (error.code === "23505") {
          return res.status(400).json({ error: "Já existe um cupom com esse código." });
        }
        return res.status(500).json({ error: "Erro ao criar cupom." });
      }

      return res.json({ success: true, coupon: data });
    } catch (err: any) {
      console.error("[Admin] Erro em create coupon:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // DELETE /api/admin/coupons - remove um cupom
  app.delete("/api/admin/coupons", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "id é obrigatório." });
      }

      const { error } = await admin.supabase.from("coupons").delete().eq("id", id);

      if (error) {
        console.error("[Admin] Erro ao deletar cupom:", error);
        return res.status(500).json({ error: "Erro ao deletar cupom." });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Admin] Erro em delete coupon:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // GET /api/admin/feedbacks - lista depoimentos
  app.get("/api/admin/feedbacks", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { data, error } = await admin.supabase
        .from("user_feedbacks")
        .select("id, content, rating, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin] Erro ao listar feedbacks:", error);
        return res.status(500).json({ error: "Erro ao listar feedbacks." });
      }

      return res.json({ feedbacks: data || [] });
    } catch (err: any) {
      console.error("[Admin] Erro em feedbacks:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // GET /api/admin/user-events - histórico de eventos de uma usuária
  app.get("/api/admin/user-events", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const userId = req.query.userId as string;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId é obrigatório." });
      }

      const { data, error } = await admin.supabase
        .from("analytics_events")
        .select("id, event_name, user_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin] Erro ao listar eventos:", error);
        return res.status(500).json({ error: "Erro ao listar eventos." });
      }

      return res.json({ events: data || [] });
    } catch (err: any) {
      console.error("[Admin] Erro em user-events:", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/admin/send-email - dispara e-mail transacional manual
  app.post("/api/admin/send-email", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const { template_id, user_email } = req.body;
      if (!template_id || !user_email || typeof template_id !== "string" || typeof user_email !== "string") {
        return res.status(400).json({ error: "template_id e user_email são obrigatórios." });
      }

      const TEMPLATES: Record<string, { subject: string; body: string }> = {
        "lembrete-vencimento": {
          subject: "Seu ciclo na Aquar.IA está se encerrando",
          body: `Olá!\n\nSeu acesso PLUS na Aquar.IA está próximo do vencimento.\nPara não perder a continuidade das suas leituras, trânsitos e meditações, renove sua assinatura mensal.\n\nAcesse: ${process.env.INFINITE_PAY_MONTHLY_URL || process.env.VITE_INFINITE_PAY_MONTHLY_URL || ""}\n\nCom carinho,\nEquipe Aquar.IA`,
        },
        "boas-vindas-manual": {
          subject: "Seu acesso completo foi liberado!",
          body: `Olá!\n\nSeu acesso PLUS na Aquar.IA foi liberado. Agora você pode explorar todas as casas, caminhos, trânsitos, meditações e o chat astrológico.\n\nAproveite o seu mapa com profundidade.\n\nBem-vinda,\nEquipe Aquar.IA`,
        },
        "aviso-suporte": {
          subject: "Atualizamos o seu mapa astral",
          body: `Olá!\n\nSeu mapa astral na Aquar.IA foi atualizado com ajustes técnicos. Recomendamos que acesse novamente para conferir as leituras sincronizadas.\n\nSe precisar de ajuda, estamos por aqui.\n\nAtenciosamente,\nEquipe Aquar.IA`,
        },
      };

      const template = TEMPLATES[template_id];
      if (!template) {
        return res.status(400).json({ error: "Template inválido." });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.VITE_MAIL_FROM || "onboarding@resend.dev";

      if (!resendApiKey) {
        console.log(`[Admin] RESEND_API_KEY ausente. Simulando e-mail:`);
        console.log(`  Para: ${user_email}`);
        console.log(`  Assunto: ${template.subject}`);
        console.log(`  Corpo: ${template.body}`);
        return res.json({ success: true, simulated: true, to: user_email, subject: template.subject });
      }

      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: user_email,
        subject: template.subject,
        text: template.body,
      });

      if (error) {
        console.error("[Admin] Erro ao enviar e-mail via Resend:", error);
        return res.status(500).json({ error: "Erro ao enviar e-mail.", details: error });
      }

      console.log(`[Admin] E-mail enviado via Resend:`, data?.id);
      return res.json({ success: true, simulated: false, to: user_email, subject: template.subject, messageId: data?.id });
    } catch (err: any) {
      console.error("[Admin] Erro em send-email:", err);
      return res.status(500).json({ error: "Erro interno.", details: err?.message || String(err) });
    }
  });

  // Serve static background audio usado pelo Presence Pause e Meditação
  app.use("/assets/audio", express.static(path.join(process.cwd(), "public", "assets", "audio")));

  // Vite integration as middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando Vite em modo desenvolvimento...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    console.log("Iniciando servidor em modo produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Middleware global de erro — captura exceções não tratadas e loga stack
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Express Error]", {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      message: err?.message,
      stack: err?.stack,
    });
    if (res.headersSent) return next(err);
    res.status(500).json({
      error: "Erro interno no servidor.",
      request_id: req.requestId,
      ...(process.env.NODE_ENV !== "production" ? { details: err?.message || String(err) } : {}),
    });
  });

  return app;
}

export { createApp };
export default createApp;

// Detecta se este módulo é o entrypoint real (npm start / npm run dev).
// Em Vercel, o entrypoint é api/index.ts, então process.argv[1] aponta para
// o launcher da Vercel e não para o bundle do server.ts. Isso evita que
// o servidor tente chamar app.listen() dentro do container serverless.
function isMainModule(): boolean {
  if (typeof process === "undefined" || !process.argv?.[1]) return false;
  if (typeof import.meta === "undefined" || !import.meta.url) return false;
  try {
    const mainUrl = pathToFileURL(process.argv[1]).href;
    return import.meta.url === mainUrl;
  } catch {
    return false;
  }
}

if (process.env.VERCEL !== "1" && process.env.SERVERLESS !== "1" && isMainModule()) {
  createApp().then((app) => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[AQUAR.IA Server] Cérebro online em http://localhost:${PORT}`);
    });
  }).catch((err: any) => {
    console.error("[AQUAR.IA Server] Falha ao iniciar servidor local:", err);
    process.exit(1);
  });
}
