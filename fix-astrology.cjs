const fs = require('fs');
let code = fs.readFileSync('src/server/astrology.ts', 'utf8');

// I will just read the file, split by lines, and replace lines 664 to 720 (roughly) with the correct logic.
let lines = code.split('\n');

// Find the start: "  if (supabase && userId) {"
let startIdx = lines.findIndex(l => l.includes('if (supabase && userId) {'));
// Find the end: "  let rawPlanetPositionData ="
let endIdx = lines.findIndex(l => l.includes('let rawPlanetPositionData = rawVedicPlanetRes?.data?.planet_position || [];'));

console.log("Start idx:", startIdx, "End idx:", endIdx);

if (startIdx > -1 && endIdx > -1) {
  // Replace everything between the end of the first 'if (supabase...)' block and 'let rawPlanetPositionData'
  
  // Actually, let's find where 'if (supabase && userId) {' ends.
  let i = startIdx;
  let braceCount = 0;
  let foundFirst = false;
  while (i < lines.length) {
    if (lines[i].includes('{')) braceCount += (lines[i].match(/{/g) || []).length;
    if (lines[i].includes('}')) braceCount -= (lines[i].match(/}/g) || []).length;
    if (braceCount === 0 && lines[i].includes('}')) {
      break;
    }
    i++;
  }
  
  let endOfSupabaseIf = i; // Line 663 maybe
  console.log("End of supabase if:", endOfSupabaseIf);
  
  const correctLogic = `
  if (cachedPayload) {
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
    } catch (err: any) {
      console.warn("[AQUAR.IA Backend] Falha na API ProKerala, ativando gerador astrológico offline de contingência:", err?.message || err);
      dataSource = "MOTOR_FALLBACK";
      rawVedicPlanetRes = generateDeterministicAstrologicalData(birthData.birthDate, birthData.birthTime);
      console.log("[AQUAR.IA Backend] Pós-fallback, rawVedicPlanetRes:", JSON.stringify(rawVedicPlanetRes));
    }

    try {
      console.log(\`[AQUAR.IA Backend] Solicitando planet-position Tropical (Western)...\`);
      rawTropicalPlanetRes = await callProKeralaAPI("astrology/planet-position", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1,
        house_system: "placidus",
        system: "placidus"
      });
    } catch (err: any) {
      console.error("[AQUAR.IA Backend] Erro não fatal ao solicitar planet-position tropical:", err?.message || err);
    }

    try {
      console.log(\`[AQUAR.IA Backend] Solicitando dados do Kundli do ProKerala com ayanamsa=1...\`);
      rawKundliRes = await callProKeralaAPI("astrology/kundli", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1,
        house_system: "equal"
      });
      
      if (supabase && userId && dataSource !== "MOTOR_FALLBACK") {
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
    } catch (err: any) {
      console.warn("[AQUAR.IA Backend] Erro não fatal ao buscar dados adicionais do Kundli:", err?.message || err);
    }
  }
`;

  lines.splice(endOfSupabaseIf + 1, endIdx - (endOfSupabaseIf + 1), correctLogic);
  
  fs.writeFileSync('src/server/astrology.ts', lines.join('\n'));
  console.log("Fixed!");
} else {
  console.log("Could not find boundaries.");
}
