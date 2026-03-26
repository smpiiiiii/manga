const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

const GALLERY_URL = 'https://smpiiiiii.github.io/manga/gallery.html';

const EPISODES = [
        { ep: 1, title: 'Episode 1', images: ['yf1a.png', 'yf1b.png', 'yf1c.png', 'yf1d.png'], tags: ['manga'] },
        { ep: 2, title: 'Episode 2', images: ['yf2a.png', 'yf2b.png', 'yf2c.png', 'yf2d.png'], tags: ['manga'] },
        { ep: 3, title: 'Episode 3', images: ['yf3a.png', 'yf3b.png', 'yf3c.png', 'yf3d.png'], tags: ['manga'] },
        { ep: 4, title: 'Episode 4', images: ['yf4a.png', 'yf4b.png', 'yf4c.png', 'yf4d.png'], tags: ['manga'] },
        { ep: 5, title: 'Episode 5', images: ['yf5a.png', 'yf5b.png', 'yf5c.png', 'yf5d.png'], tags: ['manga'] },
        { ep: 6, title: 'Episode 6', images: ['yf6a.png', 'yf6b.png', 'yf6c.png', 'yf6d.png'], tags: ['manga'] },
        { ep: 7, title: 'Episode 7', images: ['yf7a.png', 'yf7b.png', 'yf7c.png', 'yf7d.png'], tags: ['manga'] },
        { ep: 8, title: 'Episode 8', images: ['yf8a.png', 'yf8b.png', 'yf8c.png', 'yf8d.png'], tags: ['manga'] },
        { ep: 9, title: 'Episode 9', images: ['yf9a.png', 'yf9b.png', 'yf9c.png', 'yf9d.png'], tags: ['manga'] },
        { ep: 10, title: 'Episode 10', images: ['yf10a.png', 'yf10b.png', 'yf10c.png', 'yf10d.png'], tags: ['manga'] },
        { ep: 11, title: 'Episode 11', images: ['yf11a.png', 'yf11b.png', 'yf11c.png', 'yf11d.png'], tags: ['manga'] },
        { ep: 12, title: 'Episode 12', images: ['yf12a.png', 'yf12b.png', 'yf12c.png', 'yf12d.png'], tags: ['manga'] },
        { ep: 13, title: 'Episode 13', images: ['yf13a.png', 'yf13b.png', 'yf13c.png', 'yf13d.png'], tags: ['manga'] },
        { ep: 14, title: 'Episode 14', images: ['yf14a.png', 'yf14b.png', 'yf14c.png', 'yf14d.png'], tags: ['manga'] },
        { ep: 15, title: 'Episode 15', images: ['yf15a.png', 'yf15b.png', 'yf15c.png', 'yf15d.png'], tags: ['manga'] },
        { ep: 16, title: 'Episode 16', images: ['yf16a.png', 'yf16b.png', 'yf16c.png', 'yf16d.png'], tags: ['manga'] }
        ];

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

async function uploadImage(imagePath) {
          const url = 'https://upload.twitter.com/1.1/media/upload.json';
          const filePath = path.join(__dirname, '..', imagePath);
          if (!fs.existsSync(filePath)) throw new Error('Image not found: ' + imagePath);
          const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
          const body = 'media_data=' + encodeURIComponent(base64);
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
                                    res.on('data', d => data += d);
                                    res.on('end', () => res.statusCode < 300 ? resolve(JSON.parse(data).media_id_string) : reject(new Error(data)));
                      });
                      req.write(body);
                      req.end();
          });
}

async function postTweet(text, mediaIds) {
          const url = 'https://api.twitter.com/2/tweets';
          const postData = { text };
          if (mediaIds && mediaIds.length > 0) {
                      postData.media = { media_ids: mediaIds };
          }
          const body = JSON.stringify(postData);
          const authHeader = generateOAuthHeader('POST', url, {});
          const options = {
                      method: 'POST',
                      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
          };
          return new Promise((resolve, reject) => {
                      const req = https.request(url, options, (res) => {
                                    let data = '';
                                    res.on('data', d => data += d);
                                    res.on('end', () => res.statusCode < 300 ? resolve(JSON.parse(data).data) : reject(new Error(data)));
                      });
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
          console.log('Processing:', episode.ep, episode.title);

  let mediaIds = [];
          try {
                      for (const img of episode.images) {
                                    console.log('Uploading:', img);
                                    const mediaId = await uploadImage(img);
                                    mediaIds.push(mediaId);
                      }
          } catch (e) {
                      console.log('Media upload failed. Falling back to text-only.');
                      mediaIds = [];
          }

  try {
              const tweetText = 'Manga Ep ' + episode.ep + '\n' + episode.title + '\n\n' + GALLERY_URL;
              const result = await postTweet(tweetText, mediaIds);
              console.log('Success!', result.id);
              status.lastEpisode = episode.ep;
              fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
  } catch (e) {
              console.error('Final effort failed:', e.message);
              process.exit(1);
  }
}
main();
