const { WesternAstrologyCalculator } = require('openastrology-library');
const calc = new WesternAstrologyCalculator();

async function main() {
    // try to guess the parameters for calculateChart
    try {
        const result = await calc.calculateChart({
            date: new Date('2000-01-01T12:00:00Z'),
            latitude: 19.07,
            longitude: 72.87,
            houseSystem: 'P' // P for Placidus
        });
        console.log("Houses:", result.houses.map(h => h.degree));
    } catch(e) {
        console.error(e);
    }
}
main();
