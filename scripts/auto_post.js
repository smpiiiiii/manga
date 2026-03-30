/**
 * 研修医ユウトの女遊び日記 自動投稿スクリプト
 * GitHub Actionsから毎日21時に実行される
 * 次に投稿すべきエピソードを自動判定し、X（Twitter）に投稿する
 * 投稿後、yuuto_gallery.htmlに自動でエピソードを追加する
 */

const fs = require('fs');
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');

// X API設定（GitHub Secretsから取得）
const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

// 過去作ギャラリーURL
const GALLERY_URL = 'https://smpiiiiii.github.io/manga/yuuto_gallery.html';

// 投稿対象のエピソード一覧（順番に投稿される）
const EPISODES = [
  { ep: 1, title: '夜勤明けのナースと🌙', images: ['yuuto1a.png','yuuto1b.png','yuuto1c.png','yuuto1d.png'], tags: ['大人'], htmlFile: 'yuuto_ep1.html' },
  { ep: 2, title: '薬剤師との知的な夜💊', images: ['yuuto2a.png','yuuto2b.png','yuuto2c.png','yuuto2d.png'], tags: ['大人'], htmlFile: 'yuuto_ep2.html' },
  { ep: 3, title: '事務の子との週末☕', images: ['yuuto3a.png','yuuto3b.png','yuuto3c.png','yuuto3d.png'], tags: ['大人'], htmlFile: 'yuuto_ep3.html' },
  { ep: 4, title: '同期との当直明け🌅', images: ['yuuto4a.png','yuuto4b.png','yuuto4c.png','yuuto4d.png'], tags: ['大人'], htmlFile: 'yuuto_ep4.html' },
  { ep: 5, title: '指導医との大人の夜🥂', images: ['yuuto5a.png','yuuto5b.png','yuuto5c.png','yuuto5d.png'], tags: ['大人'], htmlFile: 'yuuto_ep5.html' },
  { ep: 6, title: '人妻ナースの秘密💍', images: ['yuuto6a.png','yuuto6b.png','yuuto6c.png','yuuto6d.png'], tags: ['禁断'], htmlFile: 'yuuto_ep6.html' },
  { ep: 7, title: '患者の娘さん🏥', images: ['yuuto7a.png','yuuto7b.png','yuuto7c.png','yuuto7d.png'], tags: ['禁断'], htmlFile: 'yuuto_ep7.html' },
  { ep: 8, title: '同窓会で無双🥂', images: ['yuuto8a.png','yuuto8b.png','yuuto8c.png','yuuto8d.png'], tags: ['大人'], htmlFile: 'yuuto_ep8.html' },
];

// 投稿状態ファイルパス
const STATUS_FILE = path.join(__dirname, '..', 'post_status.json');
// ギャラリーHTMLファイルパス
const GALLERY_FILE = path.join(__dirname, '..', 'yuuto_gallery.html');

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

// ===== ギャラリー更新 =====
function updateGallery(episode) {
  try {
    let html = fs.readFileSync(GALLERY_FILE, 'utf-8');

    // タグのCSSクラスを決定
    const tagClass = episode.tags.includes('禁断') ? 'red' : 'purple';
    const tagLabel = episode.tags[0];

    // 新しいカードHTML（NEWタグ付き）
    const newCard = `    <a class="card" href="${episode.htmlFile}">
        <div class="title-bar"><span class="ep-badge">第${episode.ep}話</span><span class="ep-title">${episode.title}</span></div>
        <div class="info"><p><span class="tag ${tagClass}">${tagLabel}</span><span class="tag red">NEW</span></p></div>
    </a>`;

    // 既存のNEWタグを削除
    html = html.replace(/<span class="tag red">NEW<\/span>/g, '');

    // GALLERY_STARTとGALLERY_ENDの間の</div>の直前にカードを追加
    const marker = '<!-- GALLERY_END -->';
    const gridEnd = '</div>\n' + marker;
    html = html.replace(gridEnd, newCard + '\n</div>\n' + marker);

    fs.writeFileSync(GALLERY_FILE, html, 'utf-8');
    console.log(`📋 ギャラリー更新: 第${episode.ep}話を追加`);
  } catch (err) {
    console.error(`⚠️ ギャラリー更新エラー: ${err.message}`);
  }
}

// ===== 投稿テキスト生成 =====
function generateText(episode) {
  const hashtags = [
    '#4コマ漫画',
    '#研修医ユウトの女遊び日記',
    '#マンガ',
    '#漫画',
    '#医療マンガ',
    '#病院恋愛',
    ...episode.tags.map(t => `#${t}`),
  ].join(' ');

  return [
    `🖤 研修医ユウトの女遊び日記 第${episode.ep}話`,
    `「${episode.title}」`,
    ``,
    hashtags,
    ``,
    `▼ 過去作はこちら`,
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

    // ギャラリー更新（投稿成功後）
    updateGallery(episode);

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
