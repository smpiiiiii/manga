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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // カード幅500px + 余白。高さはカード全体が入るように大きめに
    await page.setViewport({ width: 520, height: 1200, deviceScaleFactor: 2 });

    // ローカルHTMLファイルを開く
    const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
    console.log(`🌐 URL: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });

    // 全画像の読み込みを待機
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      }));
    });

    // フォントの読み込みを待つ
    await page.evaluateHandle('document.fonts.ready');

    // 追加待機（レンダリング安定化）
    await new Promise(r => setTimeout(r, 3000));

    // カード要素のサイズを取得してログ出力
    const cardBox = await page.evaluate(() => {
      const card = document.querySelector('.card');
      if (!card) return null;
      const rect = card.getBoundingClientRect();
      return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
    });
    console.log(`📐 カードサイズ: ${JSON.stringify(cardBox)}`);

    if (!cardBox) {
      throw new Error('カード要素(.card)が見つかりません');
    }

    // パネル数を確認
    const cellCount = await page.evaluate(() => document.querySelectorAll('.cell').length);
    console.log(`🖼️ パネル数: ${cellCount}`);

    // カード要素のスクリーンショットを取得
    const cardElement = await page.$('.card');
    await cardElement.screenshot({
      path: outputFile,
      type: 'png',
    });

    // 出力ファイルサイズの確認
    const stat = fs.statSync(outputFile);
    console.log(`📸 レンダリング完了: ${htmlFile} → ${path.basename(outputFile)} (${Math.round(stat.size/1024)}KB)`);
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
