const { WesternAstrologyCalculator } = require('openastrology-library');
const calc = new WesternAstrologyCalculator();

async function main() {
    try {
        const result = await calc.calculateChart({
            name: "Test",
            dateOfBirth: "2000-01-01",
            timeOfBirth: "12:00:00",
            latitude: 19.07,
            longitude: 72.87,
            timezone: "Asia/Kolkata"
        });
        console.log("Houses:", result.houses.map(h => h.degree));
    } catch(e) {
        console.error(e);
    }
}
main();
