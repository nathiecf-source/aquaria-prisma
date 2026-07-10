const fs = require('fs');
let code = fs.readFileSync('src/server/astrology.ts', 'utf8');

const oldBlock = `  try {
    if (cachedPayload) {
      rawVedicPlanetRes = cachedPayload.vedicPlanetRes;
      rawTropicalPlanetRes = cachedPayload.tropicalPlanetRes;
      rawKundliRes = cachedPayload.kundliRes;
    } else {
      if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
        throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env).");
      }

    console.log(\`[AQUAR.IA Backend] Solicitando planet-position Védico (Sideral)...\`);
    rawVedicPlanetRes = await callProKeralaAPI("astrology/planet-position", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1, // Lahiri
      house_system: "equal"
    });
  } catch (err: any) {`;

const newBlock = `  if (cachedPayload) {
    rawVedicPlanetRes = cachedPayload.vedicPlanetRes;
    rawTropicalPlanetRes = cachedPayload.tropicalPlanetRes;
    rawKundliRes = cachedPayload.kundliRes;
  } else {
    try {
      if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
        throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env).");
      }

      console.log(\`[AQUAR.IA Backend] Solicitando planet-position Védico (Sideral)...\`);
      rawVedicPlanetRes = await callProKeralaAPI("astrology/planet-position", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1, // Lahiri
        house_system: "equal"
      });
    } catch (err: any) {`;

code = code.replace(oldBlock, newBlock);

const oldSaveCache = `  try {
    console.log(\`[AQUAR.IA Backend] Solicitando dados do Kundli do ProKerala com ayanamsa=1...\`);
    rawKundliRes = await callProKeralaAPI("astrology/kundli", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1,
      house_system: "equal"
    });
  } catch (err: any) {
    console.warn("[AQUAR.IA Backend] Erro não fatal ao buscar dados adicionais do Kundli:", err?.message || err);
  }`;

const newSaveCache = `  try {
    if (!cachedPayload) {
      console.log(\`[AQUAR.IA Backend] Solicitando dados do Kundli do ProKerala com ayanamsa=1...\`);
      rawKundliRes = await callProKeralaAPI("astrology/kundli", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1,
        house_system: "equal"
      });
      
      // Save to Supabase Cache if we fetched from API
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
  } catch (err: any) {
    console.warn("[AQUAR.IA Backend] Erro não fatal ao buscar dados adicionais do Kundli:", err?.message || err);
  }`;

code = code.replace(oldSaveCache, newSaveCache);

// And we need to fix the second try-catch for tropical to only fetch if !cachedPayload
const oldTropical = `  try {
    console.log(\`[AQUAR.IA Backend] Solicitando planet-position Tropical (Western)...\`);
    rawTropicalPlanetRes = await callProKeralaAPI("astrology/planet-position", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1, // Fix: Ayanamsa is mandatory for this API even if we use it for western
      house_system: "placidus",
      system: "placidus"
    });
  } catch (err: any) {`;

const newTropical = `  try {
    if (!cachedPayload) {
      console.log(\`[AQUAR.IA Backend] Solicitando planet-position Tropical (Western)...\`);
      rawTropicalPlanetRes = await callProKeralaAPI("astrology/planet-position", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1, // Fix: Ayanamsa is mandatory for this API even if we use it for western
        house_system: "placidus",
        system: "placidus"
      });
    }
  } catch (err: any) {`;

code = code.replace(oldTropical, newTropical);

fs.writeFileSync('src/server/astrology.ts', code);
console.log("Fixed try-catch");
