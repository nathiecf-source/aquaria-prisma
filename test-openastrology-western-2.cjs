const { WesternAstrologyCalculator } = require('openastrology-library');
const calc = new WesternAstrologyCalculator();
console.log(Object.keys(calc));
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(calc)));
