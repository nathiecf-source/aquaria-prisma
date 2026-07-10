const fs = require('fs');
let code = fs.readFileSync('src/server/astrology.ts', 'utf8');

// 1. In tropicalPlanets mapping, add longitude property so we can re-assign houses later
code = code.replace(
  'const { sign, degree } = getSignAndDegree(tropicalLong);\n      const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;\n\n      return {\n        name,\n        sign,\n        degree,\n        house,\n        isRetrograde,\n        ruler: signRulers[sign] || "Sol"\n      };',
  'const { sign, degree } = getSignAndDegree(tropicalLong);\n      const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;\n\n      return {\n        name,\n        sign,\n        degree,\n        house,\n        isRetrograde,\n        ruler: signRulers[sign] || "Sol",\n        longitude: tropicalLong\n      };'
);

code = code.replace(
  'const { sign, degree } = getSignAndDegree(tropicalLong);\n    const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;\n\n    tropicalPlanets.push({\n      name: def.name,\n      sign,\n      degree,\n      house,\n      isRetrograde: (birthYear + def.sideralBase) % 5 === 0,\n      ruler: signRulers[sign] || "Sol"\n    });',
  'const { sign, degree } = getSignAndDegree(tropicalLong);\n    const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;\n\n    tropicalPlanets.push({\n      name: def.name,\n      sign,\n      degree,\n      house,\n      isRetrograde: (birthYear + def.sideralBase) % 5 === 0,\n      ruler: signRulers[sign] || "Sol",\n      longitude: tropicalLong\n    });'
);

// 2. Add longitude to tropicalHouses (Placidus block)
code = code.replace(
  'cuspDegree: Math.round(degreeInSign * 100) / 100,\n            sign: signBr,\n            ruler: signRulers[signBr] || "Sol"\n        };',
  'cuspDegree: Math.round(degreeInSign * 100) / 100,\n            sign: signBr,\n            ruler: signRulers[signBr] || "Sol",\n            longitude: cuspLong\n        };'
);

// 3. Add longitude to tropicalHouses (Fallback block)
code = code.replace(
  'cuspDegree: degree,\n        sign,\n        ruler: signRulers[sign] || "Sol"\n      };',
  'cuspDegree: degree,\n        sign,\n        ruler: signRulers[sign] || "Sol",\n        longitude: houseLong\n      };'
);

// 4. After tropicalHouses fallback block, add code to reassign planet houses
const reassignLogic = `
  // Re-assign correct houses to tropical planets based on true house cusps
  tropicalPlanets.forEach(p => {
    const planetLong = p.longitude;
    let assignedHouse = 1;
    for (let i = 0; i < 12; i++) {
      const cusp1 = tropicalHouses[i].longitude;
      const cusp2 = tropicalHouses[(i + 1) % 12].longitude;
      const relativePlanet = (planetLong - cusp1 + 360) % 360;
      const relativeCusp2 = (cusp2 - cusp1 + 360) % 360;
      if (relativePlanet < relativeCusp2) {
        assignedHouse = tropicalHouses[i].house;
        break;
      }
    }
    p.house = assignedHouse;
  });
`;

code = code.replace(
  '  // 4. Aspectos Astrológicos calculados',
  reassignLogic + '\n  // 4. Aspectos Astrológicos calculados'
);

fs.writeFileSync('src/server/astrology.ts', code);
console.log("Updated src/server/astrology.ts");
