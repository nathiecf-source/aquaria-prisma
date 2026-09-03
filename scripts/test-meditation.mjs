import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const cleanEnv = (val) => {
  if (!val) return undefined;
  const str = String(val).trim();
  if (str === "" || str === "null" || str === "undefined") return undefined;
  return str;
};
const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Regenerate profile and get the analysis JSON
const targetUserId = "82abfa16-b244-4281-8e7a-d80e3113ebcf";

// Fetch birth data from the already-saved chart via load-chart
const loadResp = await fetch("http://localhost:3000/api/load-chart", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: targetUserId }),
});
const loadData = await loadResp.json();
console.log("Birth time from saved chart:", loadData.birth_time);

const savedBirthData = loadData.birth_data || {};
const genResp2 = await fetch("http://localhost:3000/api/generate-profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Nathie Ferreira",
    gender: savedBirthData.gender || "feminino",
    gender_preference: process.argv[3] || savedBirthData.gender_preference,
    birthDate: loadData.birth_date,
    birthTime: loadData.birth_time,
    birthPlace: { latitude: loadData.latitude, longitude: loadData.longitude, timezone: savedBirthData.birthPlace?.timezone || "America/Sao_Paulo" },
    userId: targetUserId,
  }),
});
const genData = await genResp2.json();
const parsed = JSON.parse(genData.analysis);

// Escolhe o caminho a testar via argumento de linha de comando (padrão: autenticidade)
const searchTerm = process.argv[2] || "autenticidade";
const caminho = parsed.caminhos.find((c) => (c.nome_caminho || "").toLowerCase().includes(searchTerm.toLowerCase()));

if (!caminho) {
  console.error(`Caminho contendo "${searchTerm}" não encontrado. Caminhos disponíveis:`, parsed.caminhos.map(c => c.nome_caminho));
  process.exit(1);
}

console.log(`\n=== CAMINHO SELECIONADO: ${caminho.nome_caminho} ===`);
console.log("\n=== CHAVES DE COERÊNCIA ===\n", caminho.chaves_coerencia);
console.log("\n=== FRASE DIDATICA ===\n", caminho.frase_didatica);
console.log("\n=== TENSAO EVOLUCIONARIA (Movimento 1) ===\n", caminho.tensao_evolucionaria);
console.log("\n=== INTEGRACAO (Movimento 2) ===\n", caminho.integracao);
console.log("\n=== DOM (Movimento 3) ===\n", caminho.dom);

// 2. Build sourceText exactly like the client does
const sourceText = [
  caminho.chaves_coerencia,
  caminho.frase_didatica,
  caminho.tensao_evolucionaria,
  caminho.integracao,
  caminho.dom,
].filter(Boolean).join("\n\n");

// 3. Call /api/meditation
console.log("\n\nGerando meditação...");
const testPathId = "test-" + Date.now(); // avoid cache hit
const medResp = await fetch("http://localhost:3000/api/meditation", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: targetUserId,
    pathId: testPathId,
    sourceText,
    pathTitle: caminho.nome_caminho,
    gender: savedBirthData.gender || "feminino",
    gender_preference: process.argv[3] || savedBirthData.gender_preference,
  }),
});
const medData = await medResp.json();

if (medData.error) {
  console.error("Erro na meditação:", medData);
  process.exit(1);
}

console.log("\n=== AUDIO URL ===\n", medData.audioUrl);

// 4. Fetch the generated SSML script from Supabase for inspection
const { data: pathRow, error: pathErr } = await supabase
  .from("user_paths")
  .select("meditation_script")
  .eq("user_id", targetUserId)
  .eq("path_id", testPathId)
  .single();

if (pathErr) {
  console.error("Erro ao buscar script SSML:", pathErr.message);
} else {
  console.log("\n=== ROTEIRO SSML GERADO ===\n");
  console.log(pathRow.meditation_script);
}
