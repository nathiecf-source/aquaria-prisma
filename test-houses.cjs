const { Origin, Horoscope } = require('circular-natal-horoscope-js');

function calculatePlacidusHouses(dateStr, timeStr, lat, lng) {
    const [year, month, date] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    const origin = new Origin({
        year: parseInt(year),
        month: parseInt(month) - 1,
        date: parseInt(date),
        hour: parseInt(hour),
        minute: parseInt(minute),
        latitude: lat,
        longitude: lng,
    });
    
    const horoscope = new Horoscope({
        origin: origin,
        houseSystem: "placidus",
        zodiac: "tropical",
        aspectPoints: ['bodies', 'points', 'angles'],
        aspectWithPoints: ['bodies', 'points', 'angles'],
        aspectTypes: ["major", "minor"],
        customOrbs: {},
        language: 'en'
    });
    
    const signRulers = {
      "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
      "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Plutão",
      "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Urano", "Peixes": "Netuno"
    };

    const translateSignName = (signEn) => {
        const map = {
            "aries": "Áries", "taurus": "Touro", "gemini": "Gêmeos", "cancer": "Câncer",
            "leo": "Leão", "virgo": "Virgem", "libra": "Libra", "scorpio": "Escorpião",
            "sagittarius": "Sagitário", "capricorn": "Capricórnio", "aquarius": "Aquário", "pisces": "Peixes"
        };
        return map[signEn.toLowerCase()] || signEn;
    };

    return horoscope.Houses.map((h, i) => {
        const signBr = translateSignName(h.Sign.key);
        const cuspLong = h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
        const degreeInSign = cuspLong % 30;
        return {
            house: h.id,
            cuspDegree: Math.round(degreeInSign * 100) / 100,
            sign: signBr,
            ruler: signRulers[signBr] || "Sol",
            longitude: cuspLong
        };
    });
}
console.log(calculatePlacidusHouses("2000-01-01", "12:00", 19.07, 72.87));
