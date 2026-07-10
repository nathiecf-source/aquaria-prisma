const { Origin, Horoscope } = require('circular-natal-horoscope-js');

async function main() {
    const origin = new Origin({
        year: 2000,
        month: 0, // 0 = January
        date: 1,
        hour: 12,
        minute: 0,
        latitude: 19.07,
        longitude: 72.87,
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
    
    console.log("Houses:", horoscope.Houses);
}
main();
