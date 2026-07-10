const { Origin, Horoscope } = require('circular-natal-horoscope-js');

async function main() {
    const origin = new Origin({
        year: 2000,
        month: 0,
        date: 1,
        hour: 12,
        minute: 0,
        latitude: 19.07,
        longitude: 72.87,
    });
    console.log(origin);
}
main();
