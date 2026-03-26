/**
 * Manga Auto Post DEBUG Script
 */
const crypto = require('crypto');
const https = require('https');

const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

function percentEncode(str) {
        return encodeURIComponent(str)
          .replace(/!/g, '%21')
          .replace(/'/g, '%27')
          .replace(/\(/g, '%28')
          .replace(/\)/g, '%29')
          .replace(/\*/g, '%2A');
}

function generateOAuthHeader(method, url, extraParams = {}) {
        const oauthParams = {
                  oauth_consumer_key: API_KEY,
                  oauth_nonce: crypto.randomBytes(16).toString('hex'),
                  oauth_signature_method: 'HMAC-SHA1',
                  oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
                  oauth_token: ACCESS_TOKEN,
                  oauth_version: '1.0'
        };
        const allParams = { ...oauthParams, ...extraParams };
        const paramString = Object.keys(allParams).sort().map(k => `${percentEncode(k)}=${percentEncode(allParams[k].toString())}`).join('&');
        const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
        const signingKey = `${percentEncode(API_SECRET)}&${percentEncode(ACCESS_SECRET)}`;
        const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');
        oauthParams.oauth_signature = signature;
        return 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ');
}

async function postTestTweet() {
        const url = 'https://api.twitter.com/2/tweets';
        const body = JSON.stringify({ text: 'Auth Test ' + new Date().toISOString() });
        const authHeader = generateOAuthHeader('POST', url, {});
        const options = {
                  method: 'POST',
                  headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        };
        return new Promise((resolve, reject) => {
                  const req = https.request(url, options, (res) => {
                              let data = '';
                              res.on('data', d => data += d);
                              res.on('end', () => res.statusCode < 300 ? resolve(data) : reject(new Error(data)));
                  });
                  req.write(body);
                  req.end();
        });
}

async function main() {
        console.log('Starting Auth Test...');
        try {
                  const res = await postTestTweet();
                  console.log('SUCCESS:', res);
        } catch (e) {
                  console.error('FAILED:', e.message);
        }
}
main();
