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
const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.SUPABASE_ANON_KEY) || cleanEnv(process.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseKey) {
  console.error("Credenciais do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: charts, error } = await supabase
  .from("user_chart")
  .select("*")
  .limit(10);

if (error) {
  console.error("Erro ao buscar user_chart:", error.message);
  process.exit(1);
}

if (!charts || charts.length === 0) {
  console.error("Nenhum registro encontrado em user_chart.");
  process.exit(1);
}

console.log(`Encontrados ${charts.length} registro(s):`);
for (const c of charts) {
  console.log(`- user_id: ${c.user_id}, birth_date: ${c.birth_date}, lat/lng: ${c.latitude}/${c.longitude}`);
}

const targetUserId = "82abfa16-b244-4281-8e7a-d80e3113ebcf";
const target = charts.find((c) => c.user_id === targetUserId) || charts[0];

// Try to find name/gender/timezone from a profiles-like table
let name = "Teste";
let gender = "feminino";
let timezone = "America/Sao_Paulo";

for (const tableName of ["profiles", "users", "user_profiles"]) {
  try {
    const { data: prof, error: profErr } = await supabase
      .from(tableName)
      .select("*")
      .eq(tableName === "users" ? "id" : "user_id", target.user_id)
      .single();
    if (!profErr && prof) {
      console.log(`\nEncontrado em '${tableName}':`, prof);
      name = prof.name || prof.full_name || name;
      gender = prof.gender || gender;
      timezone = prof.timezone || timezone;
      break;
    }
  } catch (e) {
    // ignore, table might not exist
  }
}

try {
  const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(target.user_id);
  if (!authErr && authData?.user) {
    console.log("\nauth.users metadata:", authData.user.user_metadata, "email:", authData.user.email);
    const meta = authData.user.user_metadata || {};
    name = meta.name || meta.full_name || name;
    gender = meta.gender || gender;
    timezone = meta.timezone || timezone;
  }
} catch (e) {
  console.log("Não foi possível consultar auth.admin:", e.message);
}

const bd = target.birth_data || {
  name,
  gender,
  birthDate: target.birth_date,
  birthTime: target.birth_time,
  birthPlace: {
    latitude: target.latitude,
    longitude: target.longitude,
    timezone,
  },
};

console.log(`\nRegenerando perfil para user_id: ${target.user_id} (${bd.name})...`);

const resp = await fetch("http://localhost:3000/api/generate-profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ...bd,
    userId: target.user_id,
  }),
});

const json = await resp.json();

if (!resp.ok) {
  console.error("Erro na regeneração:", json);
  process.exit(1);
}

console.log("\n=== STATUS GEMINI ===", json.geminiStatus, json.geminiErrorMessage || "");

try {
  const parsed = JSON.parse(json.analysis);
  for (const caminho of parsed.caminhos || []) {
    const chaves = caminho.chaves_coerencia || "";
    const match = chaves.match(/7\.\s*Código de Ancoragem:\s*\n?([^\n]+)/i);
    console.log(`\n=== ${caminho.nome_caminho} ===`);
    console.log("Código de Ancoragem:", match ? match[1].trim() : "(não encontrado)");
  }
} catch (e) {
  console.error("Erro ao parsear analysis:", e.message);
  console.log(json.analysis?.slice(0, 2000));
}
