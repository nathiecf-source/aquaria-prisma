const https = require('https');

async function main() {
    const response = await fetch('https://api.github.com/repos/prokerala/astrology-api-client-php/git/trees/master?recursive=1');
    const data = await response.json();
    for (const file of data.tree) {
        if (file.path.includes('Result') && file.path.includes('.php')) {
            console.log(file.path);
        }
    }
}
main();
