import dotenv from "dotenv";
// Load environment variables immediately before any other imports
dotenv.config({ override: true });

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { fetchAstrologicalData, calculateHighlights, CompleteAstrologicalProfile, calculateVisualState } from "./src/server/astrology";
import { generateAstrologicalSynthesis, generateHouseReading, generateVetorReading, generateMoonReading, generateDiretrizAmpla, generateGlossary, generateTransitCyclesReading } from "./src/server/geminiService";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API Route: Generate Profile
  app.post("/api/generate-profile", async (req, res) => {
    try {
      const { name, gender, birthDate, birthTime, birthPlace, currentDate, userId } = req.body;

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
        birthDate,
        birthTime,
        birthPlace,
        currentDate: activeCurrentDate
      };

      // Extract token and resolve userId if missing
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      let activeUserId = userId;

      if (!activeUserId && token) {
        const cleanEnv = (val: any): string | undefined => {
          if (!val) return undefined;
          const str = String(val).trim();
          if (str === "" || str === "null" || str === "undefined") {
            return undefined;
          }
          return str;
        };

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

      // 3. Process the Synthesis via Gemini API
      let analysis = "";
      let hasGeminiError = false;
      let errorMessage = "";

      try {
        analysis = await generateAstrologicalSynthesis(astrologicalProfile);
      } catch (geminiErr: any) {
        hasGeminiError = true;
        errorMessage = geminiErr?.message || String(geminiErr);
        console.error("Erro na síntese com Gemini API:", errorMessage);
        
        // Generate a high-quality fallback explanation of the chart if the Gemini key is not configured or fails,
        // so the user experience doesn't break.
        analysis = `### ⚠️ Síntese Astrológica Temporariamente Indisponível\n\nNão foi possível realizar o processamento com Inteligência Artificial no momento.\n\n**Motivo:** ${errorMessage}\n\n*Por favor, verifique se a chave de API **GEMINI_API_KEY** está configurada corretamente nas Configurações da plataforma (Settings > Secrets).* \n\nNo entanto, a sua **Matriz de Dados Oculta** foi calculada com sucesso abaixo:\n\n- **Ascendente (Lagna):** ${astrologicalProfile.vedic_specifics.lagna}\n- **Regente do Ascendente (Lagnesha):** ${astrologicalProfile.vedic_specifics.lagnesha}\n- **Janma Nakshatra:** ${astrologicalProfile.vedic_specifics.janmaNakshatra}\n- **Atmakaraka (Indicador de Alma):** ${astrologicalProfile.vedic_specifics.karakas.atmakaraka}\n- **Dasha Atual:** ${astrologicalProfile.vedic_timing.mahadasha} (${astrologicalProfile.vedic_timing.antardasha})`;
      }

      // 4. Calculate the 3 most heavily loaded vector elements mathematically
      const highlights = calculateHighlights(astrologicalProfile);

      // Calculate visual state for houses, elements, and qualities
      const visual_state = calculateVisualState(astrologicalProfile);

      // 5. Send complete response to client
      return res.json({
        profile: astrologicalProfile,
        analysis,
        highlights,
        visual_state,
        geminiStatus: hasGeminiError ? "error" : "success",
        geminiErrorMessage: hasGeminiError ? errorMessage : undefined
      });

    } catch (err: any) {
      console.error("Erro crítico no processador:", err);
      return res.status(500).json({
        error: "Ocorreu um erro interno no servidor ao processar a matriz astrológica.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate House Reading
  app.post("/api/generate-house-reading", async (req, res) => {
    try {
      const { profile, houseId } = req.body;
      if (!profile || !houseId) {
        return res.status(400).json({ error: "Perfil astrológico e houseId são obrigatórios." });
      }

      const readingText = await generateHouseReading(profile, houseId);
      const parsedReading = JSON.parse(readingText);
      return res.json({ reading: parsedReading });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da casa astrológica:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da casa astrológica.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Diretriz Reading
  app.post("/api/generate-vetor-reading", async (req, res) => {
    try {
      const { profile, vetorId } = req.body;
      if (!profile || !vetorId) {
        return res.status(400).json({ error: "Perfil astrológico e vetorId são obrigatórios." });
      }

      const readingText = await generateVetorReading(profile, vetorId);
      const parsedReading = JSON.parse(readingText);
      return res.json({ reading: parsedReading });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da diretriz de força:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da diretriz de força.",
        details: err?.message || String(err)
      });
    }
  });

  // API Route: Generate Moon Reading
  app.post("/api/generate-moon-reading", async (req, res) => {
    try {
      const { profile } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }

      const readingText = await generateMoonReading(profile);
      const parsedReading = JSON.parse(readingText);
      return res.json({ reading: parsedReading });
    } catch (err: any) {
      console.error("Erro ao gerar leitura da Lua:", err);
      return res.status(500).json({
        error: "Erro ao gerar leitura da Lua.",
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

      const readingText = await generateDiretrizAmpla(profile, userName, visualState);
      return res.json({ reading: readingText });
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
      const { profile } = req.body;
      if (!profile) {
        return res.status(400).json({ error: "Perfil astrológico é obrigatório." });
      }

      const readingText = await generateTransitCyclesReading(profile);
      return res.json({ reading: readingText });
    } catch (err: any) {
      console.error("Erro ao gerar Leitura de Trânsitos e Ciclos:", err);
      return res.status(500).json({
        error: "Erro ao gerar Leitura de Trânsitos e Ciclos.",
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite integration as middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando Vite em modo desenvolvimento...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor em modo produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AQUAR.IA Server] Cérebro online em http://localhost:${PORT}`);
  });
}

startServer();
