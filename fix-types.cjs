const fs = require('fs');

// Fix supabaseClient.ts
let supabaseClientCode = fs.readFileSync('src/lib/supabaseClient.ts', 'utf8');
supabaseClientCode = supabaseClientCode.replace(
  "import.meta.env", "(import.meta as any).env"
).replace(
  "import.meta.env", "(import.meta as any).env"
);
fs.writeFileSync('src/lib/supabaseClient.ts', supabaseClientCode);

// Fix PlanetPosition
let astrologyCode = fs.readFileSync('src/server/astrology.ts', 'utf8');
astrologyCode = astrologyCode.replace(
  'isRetrograde: boolean;\n  ruler: string;\n}',
  'isRetrograde: boolean;\n  ruler: string;\n  longitude?: number;\n}'
);
fs.writeFileSync('src/server/astrology.ts', astrologyCode);
