const fs = require('fs');
let code = fs.readFileSync('src/server/astrology.ts', 'utf8');

// 1. Add createClient at the top
code = code.replace(
  "import circularHoroscope from 'circular-natal-horoscope-js';",
  "import circularHoroscope from 'circular-natal-horoscope-js';\nimport { createClient } from '@supabase/supabase-js';"
);

// 2. Add userId parameter
code = code.replace(
  'export async function fetchAstrologicalData(\n  birthData: BirthData,\n  currentDateStr: string\n): Promise<CompleteAstrologicalProfile> {',
  'export async function fetchAstrologicalData(\n  birthData: BirthData,\n  currentDateStr: string,\n  userId?: string\n): Promise<CompleteAstrologicalProfile> {'
);

// 3. Add Cache Check & Fallback
const cacheCheckLogic = `
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Using anon key or service role if available
  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  let rawVedicPlanetRes: any = null;
  let rawTropicalPlanetRes: any = null;
  let rawKundliRes: any = null;
  let dataSource: "API_PROKERALA" | "MOTOR_FALLBACK" | "SUPABASE_CACHE" = "API_PROKERALA";
  let cachedPayload: any = null;

  if (supabase && userId) {
    try {
      const { data: chartData, error } = await supabase
        .from('user_charts')
        .select('prokerala_raw_data')
        .eq('user_id', userId)
        // Optionally match date/time/lat/lng to ensure we are caching the right chart if user can have multiple
        .eq('birth_date', birthData.birthDate)
        .eq('birth_time', birthData.birthTime)
        .eq('latitude', birthData.birthPlace.latitude)
        .eq('longitude', birthData.birthPlace.longitude)
        .single();
      
      if (!error && chartData && chartData.prokerala_raw_data) {
        cachedPayload = chartData.prokerala_raw_data;
        dataSource = "SUPABASE_CACHE";
        console.log(\`[AQUAR.IA Backend] Cache encontrado no Supabase para o usuário \${userId}.\`);
      }
    } catch (err) {
      console.warn("[AQUAR.IA Backend] Erro ao consultar cache no Supabase:", err);
    }
  }

  try {
    if (cachedPayload) {
      rawVedicPlanetRes = cachedPayload.vedicPlanetRes;
      rawTropicalPlanetRes = cachedPayload.tropicalPlanetRes;
      rawKundliRes = cachedPayload.kundliRes;
    } else {
      if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
        throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env).");
      }
`;

code = code.replace(
  `  let rawVedicPlanetRes: any = null;
  let rawTropicalPlanetRes: any = null;
  let rawKundliRes: any = null;
  let dataSource: "API_PROKERALA" | "MOTOR_FALLBACK" = "API_PROKERALA";

  try {
    if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
      throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env).");
    }`,
  cacheCheckLogic
);

// 4. Save cache logic
const saveCacheLogic = `
      rawKundliRes = await callProKeralaAPI("/v2/astrology/kundli", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1 // Lahiri
      });

      // Save to Supabase Cache
      if (supabase && userId) {
        try {
          const payloadToCache = {
            vedicPlanetRes: rawVedicPlanetRes,
            tropicalPlanetRes: rawTropicalPlanetRes,
            kundliRes: rawKundliRes
          };
          const { error } = await supabase.from('user_charts').upsert({
            user_id: userId,
            birth_date: birthData.birthDate,
            birth_time: birthData.birthTime,
            latitude: birthData.birthPlace.latitude,
            longitude: birthData.birthPlace.longitude,
            prokerala_raw_data: payloadToCache,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,birth_date,birth_time,latitude,longitude' });
          
          if (error) {
            console.error("[AQUAR.IA Backend] Erro ao salvar cache no Supabase:", error);
          } else {
            console.log(\`[AQUAR.IA Backend] Mapa salvo no Supabase para o usuário \${userId}.\`);
          }
        } catch (err) {
          console.warn("[AQUAR.IA Backend] Falha na operação de cache no Supabase:", err);
        }
      }
    }
  } catch (apiError: any) {`;

code = code.replace(
  `      rawKundliRes = await callProKeralaAPI("/v2/astrology/kundli", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1 // Lahiri
      });
    }
  } catch (apiError: any) {`,
  saveCacheLogic
);

code = code.replace(
  `dataSource
  };`,
  `dataSource: dataSource as string
  };`
);

fs.writeFileSync('src/server/astrology.ts', code);
console.log("Updated src/server/astrology.ts");
