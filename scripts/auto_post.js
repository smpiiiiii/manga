/**
 * 研修医ユウトの女遊び日記 自動投稿スクリプト
 * GitHub Actionsから毎日21時に実行される
 * HTMLカードをPuppeteerでレンダリングし、セリフ入り画像をXに投稿する
 */

const fs = require('fs');
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');
const { renderCard } = require('./render_card');

// X API設定（GitHub Secretsから取得）
const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.X_ACCESS_SECRET;

// 過去作ギャラリーURL
const GALLERY_URL = 'https://smpiiiiii.github.io/manga/yuuto_gallery.html';

// 投稿対象のエピソード一覧（順番に投稿される）
const EPISODES = [
  { ep: 1, title: '夜勤明けのナースと🌙', htmlFile: 'yuuto_ep1.html', tags: ['大人'] },
  { ep: 2, title: '薬剤師との知的な夜💊', htmlFile: 'yuuto_ep2.html', tags: ['大人'] },
  { ep: 3, title: '事務の子との週末☕', htmlFile: 'yuuto_ep3.html', tags: ['大人'] },
  { ep: 4, title: '同期との当直明け🌅', htmlFile: 'yuuto_ep4.html', tags: ['大人'] },
  { ep: 5, title: '指導医との大人の夜🥂', htmlFile: 'yuuto_ep5.html', tags: ['大人'] },
  { ep: 6, title: '人妻ナースの秘密💍', htmlFile: 'yuuto_ep6.html', tags: ['禁断'] },
  { ep: 7, title: '患者の娘さん🏥', htmlFile: 'yuuto_ep7.html', tags: ['禁断'] },
  { ep: 8, title: '同窓会で無双🥂', htmlFile: 'yuuto_ep8.html', tags: ['大人'] },
];

// 投稿状態ファイルパス
const STATUS_FILE = path.join(__dirname, '..', 'post_status.json');
// ギャラリーHTMLファイルパス
const GALLERY_FILE = path.join(__dirname, '..', 'yuuto_gallery.html');

// ===== X APIクライアント =====
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
    const tagClass = episode.tags.includes('禁断') ? 'red' : 'purple';
    const tagLabel = episode.tags[0];
    const newCard = `    <a class="card" href="${episode.htmlFile}">
        <div class="title-bar"><span class="ep-badge">第${episode.ep}話</span><span class="ep-title">${episode.title}</span></div>
        <div class="info"><p><span class="tag ${tagClass}">${tagLabel}</span><span class="tag red">NEW</span></p></div>
    </a>`;
    // 既存のNEWタグを削除
    html = html.replace(/<span class="tag red">NEW<\/span>/g, '');
    // カードを追加
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
    process.exit(1);
  }

  console.log('🔑 API認証情報: OK');
  console.log(`🔑 API_KEY: ${API_KEY.substring(0, 5)}...`);

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

  // 全話投稿済みなら新作待ちでスキップ
  if (status.lastEpisode >= EPISODES.length) {
    console.log(`📭 全${EPISODES.length}話投稿済み。新作が追加されるまでスキップします`);
    process.exit(0);
  }

  const nextIdx = status.lastEpisode;
  const episode = EPISODES[nextIdx];

  console.log(`📖 次の投稿: 第${episode.ep}話「${episode.title}」`);

  // HTMLカードをレンダリングして画像化
  const renderedImage = path.join(mangaDir, `rendered_ep${episode.ep}.png`);
  try {
    console.log(`🎨 HTMLカードをレンダリング中: ${episode.htmlFile}`);
    await renderCard(episode.htmlFile, renderedImage);
    console.log(`✅ レンダリング完了: ${path.basename(renderedImage)}`);
  } catch (err) {
    console.error(`❌ レンダリングエラー: ${err.message}`);
    process.exit(1);
  }

  // レンダリング画像をアップロード
  let mediaIds = [];
  try {
    console.log(`⬆️ アップロード中: ${path.basename(renderedImage)}`);
    const mediaId = await client.v1.uploadMedia(renderedImage);
    mediaIds.push(mediaId);
    console.log(`✅ アップロード完了: ${mediaId}`);
  } catch (err) {
    console.error(`⚠️ アップロードエラー: ${err.message}`);
    console.log('📝 テキストのみ投稿にフォールバック');
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

    // ギャラリー更新
    updateGallery(episode);

    // 状態更新
    status.lastEpisode = episode.ep;
    saveStatus(status);
    console.log(`📋 状態更新完了 (次回: 第${(episode.ep % EPISODES.length) + 1}話)`);

    // レンダリング画像のクリーンアップ
    try { fs.unlinkSync(renderedImage); } catch {}
  } catch (err) {
    console.error(`❌ 投稿エラー: ${err.message}`);
    if (err.data) console.error(`📋 詳細: ${JSON.stringify(err.data)}`);
    process.exit(1);
  }
}

main();
