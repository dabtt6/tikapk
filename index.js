const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');
const readline = require('readline');

const links = fs.readFileSync('links.txt', 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
const logSuccess = 'log_success.txt';
const logError = 'log_error.txt';
const downloadedLinks = fs.existsSync(logSuccess) ? fs.readFileSync(logSuccess, 'utf-8').split('\n') : [];

let downloadedCount = 0;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadFile(url, index) {
  return new Promise((resolve) => {
    const fileName = path.basename(new URL(url).pathname.split('?')[0]);
    const filePath = path.join(__dirname, 'downloads', fileName);

    if (downloadedLinks.includes(url) || fs.existsSync(filePath)) {
      console.log(`[${index + 1}/${links.length}] ✅ Bỏ qua: ${fileName}`);
      downloadedCount++;
      return resolve();
    }

    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.log(`[${index + 1}/${links.length}] ❌ HTTP ${response.statusCode}: ${fileName}`);
        fs.appendFileSync(logError, `${url}${os.EOL}`);
        file.close();
        fs.unlinkSync(filePath);
        return resolve();
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.appendFileSync(logSuccess, `${url}${os.EOL}`);
        downloadedCount++;
        console.log(`[${index + 1}/${links.length}] ✅ Tải xong: ${fileName}`);
        resolve();
      });
    }).on('error', (err) => {
      console.log(`[${index + 1}/${links.length}] ❌ Lỗi kết nối: ${fileName}`);
      fs.appendFileSync(logError, `${url}${os.EOL}`);
      resolve();
    });
  });
}

async function askConcurrency() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((res) => rl.question(q, res));

  let input = await question("👉 Bạn muốn tải bao nhiêu file cùng lúc? (mặc định 10): ");
  rl.close();

  let num = parseInt(input);
  return isNaN(num) || num < 1 ? 10 : num;
}

async function downloadAll() {
  ensureDir('downloads');

  const CONCURRENT_DOWNLOADS = await askConcurrency();

  console.log(`\n🚀 Bắt đầu tải ${links.length} link (song song ${CONCURRENT_DOWNLOADS} mỗi lượt)...\n`);

  let index = 0;

  async function nextBatch() {
    const batch = [];

    for (let i = 0; i < CONCURRENT_DOWNLOADS && index < links.length; i++) {
      batch.push(downloadFile(links[index], index));
      index++;
    }

    await Promise.allSettled(batch);

    if (index < links.length) {
      await nextBatch();
    }
  }

  await nextBatch();

  console.log(`\n✅ Đã tải thành công ${downloadedCount}/${links.length} link.`);
}

downloadAll();
