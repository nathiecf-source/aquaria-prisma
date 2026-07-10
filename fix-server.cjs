const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const { name, gender, birthDate, birthTime, birthPlace, currentDate } = req.body;',
  'const { name, gender, birthDate, birthTime, birthPlace, currentDate, userId } = req.body;'
);

code = code.replace(
  'const astrologicalProfile = await fetchAstrologicalData(birthDataPayload, activeCurrentDate);',
  'const astrologicalProfile = await fetchAstrologicalData(birthDataPayload, activeCurrentDate, userId);'
);

fs.writeFileSync('server.ts', code);
