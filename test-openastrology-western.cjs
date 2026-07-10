const { WesternAstrologyCalculator } = require('openastrology-library');
const calc = new WesternAstrologyCalculator();

async function main() {
    const result = await calc.calculateWesternAstrologyData(new Date('2000-01-01T12:00:00Z'), 19.07, 72.87, 'W', 'P'); // P for Placidus?
    console.log(JSON.stringify(result.houses).substring(0, 500));
}
main();
