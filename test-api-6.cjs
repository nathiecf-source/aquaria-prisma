const https = require('https');
require('dotenv').config();

const clientId = process.env.PROKERALA_CLIENT_ID;
const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

async function fetchToken() {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.prokerala.com/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function testEndpoint(endpoint, token) {
    const url = `https://api.prokerala.com/v2/${endpoint}`;
    console.log(`Calling: ${url}`);
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const text = await response.text();
    console.log(`Status for ${endpoint}:`, response.status);
    console.log(`Response for ${endpoint}:`, text.substring(0, 1000));
}

async function main() {
    try {
        const token = await fetchToken();
        await testEndpoint('astrology/kundli?datetime=2000-01-01T12:00:00Z&coordinates=19.07,72.87&ayanamsa=1&house_system=placidus', token);
    } catch (e) {
        console.error(e);
    }
}
main();
