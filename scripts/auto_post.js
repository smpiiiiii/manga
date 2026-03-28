/**
 * ゆるふわ女医みなみ 自動投稿スクリプト
 * GitHub Actionsから毎日21時に実行される
 * 次に投稿すべきエピソードを自動判定し、X（Twitter）に投稿する
 */

const fs = require('fs');
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');

// X API設定（GitHub Secretsから取得）
const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

// ギャラリーURL
const GALLERY_URL = 'https://smpiiiiii.github.io/manga/gallery.html';

// 投稿対象のエピソード一覧（順番に投稿される）
const EPISODES = [
  { ep: 1, title: '距離感バグってる外来', images: ['yf1a.png','yf1b.png','yf1c.png','yf1d.png'], tags: ['外来回'] },
  { ep: 2, title: '当直中のカップ麺の背徳感', images: ['yf2a.png','yf2b.png','yf2c.png','yf2d.png'], tags: ['当直回'] },
  { ep: 3, title: '健康診断でまさかの…💦', images: ['yf3a.png','yf3b.png','yf3c.png','yf3d.png'], tags: ['健診回'] },
  { ep: 4, title: '夜勤明けのシャワー事件💦', images: ['yf4a.png','yf4b.png','yf4c.png','yf4d.png'], tags: ['当直回'] },
  { ep: 5, title: '病院忘年会のドレス事件👗', images: ['yf5a.png','yf5b.png','yf5c.png','yf5d.png'], tags: ['忘年会回'] },
  { ep: 6, title: '朝のコーヒー大惨事☕💦', images: ['yf6a.png','yf6b.png','yf6c.png','yf6d.png'], tags: ['日常回'] },
  { ep: 7, title: '患者さんに告白された!?💌', images: ['yf7a.png','yf7b.png','yf7c.png','yf7d.png'], tags: ['外来回'] },
  { ep: 8, title: '雨の日のスケスケ白衣事件☔💦', images: ['yf8a.png','yf8b.png','yf8c.png','yf8d.png'], tags: ['日常回'] },
  { ep: 9, title: '当直室の置き手紙💌', images: ['yf9a.png','yf9b.png','yf9c.png','yf9d.png'], tags: ['当直回'] },
  { ep: 10, title: '当直コール地獄📱💀', images: ['yf10a.png','yf10b.png','yf10c.png','yf10d.png'], tags: ['当直回'] },
  { ep: 11, title: '指導医のヤバい距離感💍', images: ['yf11a.png','yf11b.png','yf11c.png','yf11d.png'], tags: ['日常回'] },
  { ep: 12, title: 'スマホの通知📱💔', images: ['yf12a.png','yf12b.png','yf12c.png','yf12d.png'], tags: ['日常回'] },
  { ep: 13, title: '合コンの問診タイム🍷💊', images: ['yf13a.png','yf13b.png','yf13c.png','yf13d.png'], tags: ['合コン回'] },
  { ep: 14, title: '初めてのお泊り🏠💕', images: ['yf14a.png','yf14b.png','yf14c.png','yf14d.png'], tags: ['恋愛回'] },
  { ep: 15, title: 'お泊まり翌日の首元の秘密🤫', images: ['yf15a.png','yf15b.png','yf15c.png','yf15d.png'], tags: ['恋愛回'] },
  { ep: 16, title: '白衣のポケットの秘密🍫', images: ['yf16a.png','yf16b.png','yf16c.png','yf16d.png'], tags: ['ドジっ子回'] },
];

// 投稿状態ファイルパス
const STATUS_FILE = path.join(__dirname, '..', 'post_status.json');

// ===== X APIクライアント（twitter-api-v2ライブラリ使用） =====
const client = new TwitterApi({
  appKey: API_KEY,
  appSecret: API_SECRET,
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_SECRET,
});

// ===== 投稿状態管理 =====
function loadStatus() {
  try { return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8')); }
  catch { return { lastEpisode: 0 }; }
}

function saveStatus(status) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
}

// ===== 投稿テキスト生成 =====
function generateText(episode) {
  const hashtags = [
    '#4コマ漫画',
    '#ゆるふわ女医みなみ',
    '#マンガ',
    '#漫画',
    '#医療マンガ',
    ...episode.tags.map(t => `#${t}`),
  ].join(' ');

  return [
    `🩺 ゆるふわ女医みなみ 第${episode.ep}話`,
    `「${episode.title}」`,
    ``,
    hashtags,
    ``,
    `▼ 全エピソードはこちら`,
    GALLERY_URL,
  ].join('\n');
}

// ===== メイン処理 =====
async function main() {
  // API設定チェック
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
    console.error('❌ X API認証情報が設定されていません');
    console.error('GitHub Secretsに以下を設定してください:');
    console.error('  X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET');
    process.exit(1);
  }

  console.log('🔑 API認証情報: OK');

  // APIキーの先頭5文字を表示（デバッグ用）
  console.log(`🔑 API_KEY: ${API_KEY.substring(0, 5)}...`);
  console.log(`🔑 ACCESS_TOKEN: ${ACCESS_TOKEN.substring(0, 10)}...`);

  // API接続テスト
  try {
    const me = await client.v2.me();
    console.log(`✅ API接続成功! ユーザー: @${me.data.username}`);
  } catch (err) {
    console.error(`❌ API接続失敗: ${err.message}`);
    process.exit(1);
  }

  const mangaDir = path.resolve(__dirname, '..');
  const status = loadStatus();
  const nextIdx = status.lastEpisode % EPISODES.length;
  const episode = EPISODES[nextIdx];

  console.log(`📖 次の投稿: 第${episode.ep}話「${episode.title}」`);

  // 画像の存在確認
  const existingImages = episode.images
    .map(img => path.join(mangaDir, img))
    .filter(p => fs.existsSync(p));

  console.log(`🖼️ 画像${existingImages.length}/${episode.images.length}枚を検出`);

  // 画像アップロード（最大4枚）- 失敗してもテキスト投稿にフォールバック
  let mediaIds = [];
  if (existingImages.length > 0) {
    for (const imgPath of existingImages.slice(0, 4)) {
      console.log(`⬆️ アップロード中: ${path.basename(imgPath)}`);
      try {
        const mediaId = await client.v1.uploadMedia(imgPath);
        mediaIds.push(mediaId);
        console.log(`✅ アップロード完了: ${mediaId}`);
      } catch (err) {
        console.error(`⚠️ アップロードエラー: ${err.message}`);
        // 画像アップロード失敗時はテキストのみ投稿にフォールバック
        mediaIds = [];
        console.log('📝 テキストのみ投稿にフォールバック');
        break;
      }
    }
  } else {
    console.log('📝 画像なし - テキストのみ投稿');
  }

  // 投稿テキスト生成
  const text = generateText(episode);
  console.log(`\n📝 投稿テキスト:\n${text}\n`);

  // 投稿
  try {
    const tweetData = { text };
    if (mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds };
    }
    const result = await client.v2.tweet(tweetData);
    console.log(`🎉 投稿成功！ Tweet ID: ${result.data.id}`);

    // 状態更新
    status.lastEpisode = episode.ep;
    saveStatus(status);
    console.log(`📋 状態更新完了 (次回: 第${(episode.ep % EPISODES.length) + 1}話)`);
  } catch (err) {
    console.error(`❌ 投稿エラー: ${err.message}`);
    if (err.data) {
      console.error(`📋 詳細: ${JSON.stringify(err.data)}`);
    }
    process.exit(1);
  }
}

main();
