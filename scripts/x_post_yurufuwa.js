/**
 * ゆるふわ女医みなみ X投稿スクリプト
 * 各エピソードを画像付きでXに投稿する
 * 使い方: node x_post_yurufuwa.js [エピソード番号]
 * 例: node x_post_yurufuwa.js 1 → 第1話を投稿
 */

const fs = require('fs');
const path = require('path');

// X API設定（環境変数から取得）
const API_KEY = process.env.X_API_KEY || '';
const API_SECRET = process.env.X_API_SECRET || '';
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || '';
const ACCESS_SECRET = process.env.X_ACCESS_SECRET || '';

// まとめページURL
const SERIES_URL = 'https://smpiiiiii.github.io/manga/yurufuwa_series.html';

// エピソード情報
const episodes = [
  { ep: 1, title: '距離感バグってる外来', tag: '外来回' },
  { ep: 2, title: '当直中のカップ麺の背徳感', tag: '当直回' },
  { ep: 3, title: '健康診断でまさかの…💦', tag: '健診回' },
  { ep: 4, title: '夜勤明けのシャワー事件💦', tag: '当直回' },
  { ep: 5, title: '病院忘年会のドレス事件👗', tag: '忘年会回' },
  { ep: 6, title: '朝のコーヒー大惨事☕💦', tag: '日常回' },
  { ep: 7, title: '患者さんに告白された!?💌', tag: '外来回' },
  { ep: 8, title: '雨の日のスケスケ白衣事件☔💦', tag: '日常回' },
  { ep: 9, title: '当直室の置き手紙💌', tag: '当直回' },
  { ep: 10, title: '当直コール地獄📱💀', tag: '当直回' },
  { ep: 11, title: '指導医のヤバい距離感💍', tag: '日常回' },
  { ep: 12, title: 'スマホの通知📱💔', tag: '日常回' },
  { ep: 13, title: '合コンの問診タイム🍷💊', tag: '合コン回' },
  { ep: 14, title: '初めてのお泊り🏠💕', tag: '恋愛回' },
  { ep: 'happen', title: '番外ハプニング編', tag: '番外編' },
];

/**
 * 投稿テキストを生成
 */
function generateTweetText(episode) {
  const epLabel = episode.ep === 'happen' ? '番外編' : `第${episode.ep}話`;
  const lines = [
    `🩺 ゆるふわ女医みなみ ${epLabel}`,
    `「${episode.title}」`,
    ``,
    `#4コマ漫画 #AI漫画 #ゆるふわ女医みなみ`,
    ``,
    `📖 過去エピソードはこちら`,
    SERIES_URL,
  ];
  return lines.join('\n');
}

/**
 * 画像パスを取得
 */
function getImagePath(episode) {
  const mangaDir = path.resolve(__dirname, '..');
  const epStr = episode.ep === 'happen' ? 'happen' : `ep${episode.ep}`;
  
  // final版があればそちらを使用
  const files = fs.readdirSync(mangaDir).filter(f => f.includes(`yurufuwa_${epStr}_card`));
  const finalFile = files.find(f => f.includes('final'));
  return path.join(mangaDir, finalFile || files[files.length - 1] || `yurufuwa_${epStr}_card.png`);
}

// メイン処理
const epArg = process.argv[2];
if (!epArg) {
  console.log('使い方: node x_post_yurufuwa.js [エピソード番号|all|preview]');
  console.log('  node x_post_yurufuwa.js 1       → 第1話を投稿');
  console.log('  node x_post_yurufuwa.js happen   → 番外編を投稿');
  console.log('  node x_post_yurufuwa.js preview  → 全エピソードの投稿文をプレビュー');
  process.exit(0);
}

if (epArg === 'preview') {
  // 全エピソードの投稿文をプレビュー
  episodes.forEach(ep => {
    const text = generateTweetText(ep);
    const imgPath = getImagePath(ep);
    const imgExists = fs.existsSync(imgPath);
    console.log('─'.repeat(40));
    console.log(text);
    console.log(`📸 画像: ${imgExists ? '✅' : '❌'} ${path.basename(imgPath)}`);
    console.log('');
  });
  process.exit(0);
}

// 特定のエピソードを投稿
const targetEp = episodes.find(e => String(e.ep) === epArg);
if (!targetEp) {
  console.error(`エピソード "${epArg}" が見つかりません`);
  process.exit(1);
}

const tweetText = generateTweetText(targetEp);
const imagePath = getImagePath(targetEp);

console.log('投稿内容:');
console.log(tweetText);
console.log(`\n画像: ${imagePath}`);
console.log(`画像存在: ${fs.existsSync(imagePath) ? '✅' : '❌'}`);
console.log('\n※ X API連携は別途設定が必要です。');
console.log('手動で投稿する場合は、上記テキストと画像を使ってください。');
