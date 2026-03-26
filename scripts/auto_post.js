/**
 * Manga Auto Post Script
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

console.log('Creds presence:', {
      key: !!API_KEY,
      secret: !!API_SECRET,
      token: !!ACCESS_TOKEN,
      tokenSecret: !!ACCESS_SECRET
});

const GALLERY_URL = 'https://smpiiiiii.github.io/manga/gallery.html';

const EPISODES = [
  { ep: 1, title: 'Episode 1', images: ['yf1a.png', 'yf1b.png', 'yf1c.png', 'yf1d.png'], tags: ['episode1'] },
  { ep: 2, title: 'Episode 2', images: ['yf2a.png', 'yf2b.png', 'yf2c.png', 'yf2d.png'], tags: ['episode2'] },
  { ep: 3, title: 'Episode 3', images: ['yf3a.png', 'yf3b.png', 'yf3c.png', 'yf3d.png'], tags: ['episode3'] },
  { ep: 4, title: 'Episode 4', images: ['yf4a.png', 'yf4b.png', 'yf4c.png', 'yf4d.png'], tags: ['episode4'] },
  { ep: 5, title: 'Episode 5', images: ['yf5a.png', 'yf5b.png', 'yf5c.png', 'yf5d.png'], tags: ['episode5'] },
  { ep: 6, title: 'Episode 6', images: ['yf6a.png', 'yf6b.png', 'yf6c.png', 'yf6d.png'], tags: ['episode6'] },
  { ep: 7, title: 'Episode 7', images: ['yf7a.png', 'yf7b.png', 'yf7c.png', 'yf7d.png'], tags: ['episode7'] },
  { ep: 8, title: 'Episode 8', images: ['yf8a.png', 'yf8b.png', 'yf8c.png', 'yf8d.png'], tags: ['episode8'] },
  { ep: 9, title: 'Episode 9', images: ['yf9a.png', 'yf9b.png', 'yf9c.png', 'yf9d.png'], tags: ['episode9'] },
  { ep: 10, title: 'Episode 10', images: ['yf10a.png', 'yf10b.png', 'yf10c.png', 'yf10d.png'], tags: ['episode10'] },
  { ep: 11, title: 'Episode 11', images: ['yf11a.png', 'yf11b.png', 'yf11c.png', 'yf11d.png'], tags: ['episode11'] },
  { ep: 12, title: 'Episode 12', images: ['yf12a.png', 'yf12b.png', 'yf12c.png', 'yf12d.png'], tags: ['episode12'] },
  { ep: 13, title: 'Episode 13', images: ['yf13a.png', 'yf13b.png', 'yf13c.png', 'yf13d.png'], tags: ['episode13'] },
  { ep: 14, title: 'Episode 14', images: ['yf14a.png', 'yf14b.png', 'yf14c.png', 'yf14d.png'], tags: ['episode14'] },
  { ep: 15, title: 'Episode 15', images: ['yf15a.png', 'yf15b.png', 'yf15c.png', 'yf15d.png'], tags: ['episode15'] },
  { ep: 16, title: 'Episode 16', images: ['yf16a.png', 'yf16b.png', 'yf16c.png', 'yf16d.png'], tags: ['episode16'] }
  ];

function percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
    const paramString = Object.keys(params).sort().map(k => `${percentEncode(k)}=${percentEncode(params[k].toString())}`).join('&');
    const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
    return crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');
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
    const allParamsForSignature = { ...oauthParams, ...extraParams };
    oauthParams.oauth_signature = generateOAuthSignature(method, url, allParamsForSignature, API_SECRET, ACCESS_SECRET);
    const header = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ');
    return `OAuth ${header}`;
}

async function uploadImage(imagePath) {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const filePath = path.join(__dirname, '..', imagePath);
    if (!fs.existsSync(filePath)) throw new Error(`Image not found: ${filePath}`);
    const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
    const body = `media_data=${encodeURIComponent(base64)}`;
    const authHeader = generateOAuthHeader('POST', url, {});
    const options = {
          method: 'POST',
          headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': Buffer.byteLength(body)
          }
    };
    return new Promise((resolve, reject) => {
          const req = https.request(url, options, (res) => {
                  let data = '';
                  res.on('data', (chunk) => data += chunk);
                  res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data).media_id_string);
                            else reject(new Error(`Upload failed [${res.statusCode}]: ${data}`));
                  });
          });
          req.on('error', (e) => reject(e));
          req.write(body);
          req.end();
    });
}

async function postTweet(text, mediaIds) {
    const url = 'https://api.twitter.com/2/tweets';
    const body = JSON.stringify({ text, media: { media_ids: mediaIds } });
    const authHeader = generateOAuthHeader('POST', url, {});
    const options = {
          method: 'POST',
          headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json'
          }
    };
    return new Promise((resolve, reject) => {
          const req = https.request(url, options, (res) => {
                  let data = '';
                  res.on('data', (chunk) => data += chunk);
                  res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data).data);
                            else reject(new Error(`Post failed [${res.statusCode}]: ${data}`));
                  });
          });
          req.on('error', (e) => reject(e));
          req.write(body);
          req.end();
    });
}

const statusFilePath = path.join(__dirname, '..', 'post_status.json');

async function main() {
    let status = { lastEpisode: 0 };
    if (fs.existsSync(statusFilePath)) {
          status = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
    }
    const nextEpIndex = status.lastEpisode % EPISODES.length;
    const episode = EPISODES[nextEpIndex];
    console.log(`Next episode: ${episode.ep} - ${episode.title}`);
    try {
          const mediaIds = [];
          for (const img of episode.images) {
                  console.log(`Uploading: ${img}`);
                  const mediaId = await uploadImage(img);
                  mediaIds.push(mediaId);
          }
          const tags = episode.tags.map(t => `#${t}`).join(' ');
          const tweetText = `Manga Episode ${episode.ep}\n${episode.title}\n\nGallery: ${GALLERY_URL}\n\n${tags} #manga`;
          console.log('Posting...');
          const result = await postTweet(tweetText, mediaIds);
          console.log('Success!', result.id);
          status.lastEpisode = episode.ep;
          fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
    } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
    }
}

main();
