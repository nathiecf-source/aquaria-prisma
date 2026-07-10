const https = require('https');

async function main() {
    const response = await fetch('https://api.github.com/repos/prokerala/astrology-api-client-php/git/trees/master?recursive=1', {
        headers: { 'User-Agent': 'node.js' }
    });
    const data = await response.json();
    for (const file of data.tree) {
        if (file.path.includes('Result')) {
            console.log(file.path);
        }
    }
}
main();
