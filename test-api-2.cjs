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
    const data = await response.json();
    console.log(`Status for ${endpoint}:`, response.status);
    console.log(`Response for ${endpoint}:`, JSON.stringify(data).substring(0, 500) + '...');
}

async function main() {
    try {
        const token = await fetchToken();
        await testEndpoint('astrology/natal-chart', token);
    } catch (e) {
        console.error(e);
    }
}
main();
