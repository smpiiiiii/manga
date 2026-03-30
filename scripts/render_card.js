/**
 * HTMLカードをスクリーンショットとしてレンダリングするスクリプト
 * Puppeteerを使用してエピソードHTMLを画像化する
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 指定したHTMLファイルのカード部分をスクリーンショットとして保存
 * @param {string} htmlFile - HTMLファイル名（例: yuuto_ep1.html）
 * @param {string} outputFile - 出力画像ファイルパス
 * @returns {string} 出力画像ファイルパス
 */
async function renderCard(htmlFile, outputFile) {
  const mangaDir = path.resolve(__dirname, '..');
  const htmlPath = path.join(mangaDir, htmlFile);

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTMLファイルが見つかりません: ${htmlPath}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // カードの幅500pxに合わせたビューポート
    await page.setViewport({ width: 520, height: 800, deviceScaleFactor: 2 });

    // ローカルHTMLファイルを開く
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

    // フォントの読み込みを待つ
    await page.evaluateHandle('document.fonts.ready');
    
    // 少し待機（画像の読み込み）
    await new Promise(r => setTimeout(r, 2000));

    // カード要素のスクリーンショットを取得
    const cardElement = await page.$('.card');
    if (!cardElement) {
      throw new Error('カード要素(.card)が見つかりません');
    }

    await cardElement.screenshot({
      path: outputFile,
      type: 'png',
    });

    console.log(`📸 レンダリング完了: ${htmlFile} → ${path.basename(outputFile)}`);
    return outputFile;
  } finally {
    await browser.close();
  }
}

module.exports = { renderCard };

// 直接実行時のテスト用
if (require.main === module) {
  const htmlFile = process.argv[2] || 'yuuto_ep1.html';
  const outputFile = process.argv[3] || path.join(__dirname, '..', 'rendered_card.png');
  renderCard(htmlFile, outputFile)
    .then(() => console.log('✅ 完了'))
    .catch(err => { console.error('❌ エラー:', err.message); process.exit(1); });
}
