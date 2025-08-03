const fs = require('fs');
const https = require('https');
const path = require('path');

const links = fs.readFileSync('links.txt', 'utf-8').split('\n').filter(Boolean);
const logSuccess = 'log_success.txt';
const logError = 'log_error.txt';
const downloadedLinks = fs.existsSync(logSuccess) ? fs.readFileSync(logSuccess, 'utf-8').split('\n') : [];

let downloadedCount = 0;

function downloadFile(url, index) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(new URL(url).pathname.split('?')[0]);
    const filePath = path.join(__dirname, 'downloads', fileName);

    if (downloadedLinks.includes(url) || fs.existsSync(filePath)) {
      console.log(`[${index + 1}/${links.length}] ✅ Bỏ qua (đã tải): ${fileName}`);
      downloadedCount++;
      return resolve();
    }

    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.log(`[${index + 1}/${links.length}] ❌ Lỗi tải: ${fileName}`);
        fs.appendFileSync(logError, `${url}\n`);
        return reject();
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.appendFileSync(logSuccess, `${url}\n`);
        downloadedCount++;
        console.log(`[${index + 1}/${links.length}] ✅ Tải xong: ${fileName}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.appendFileSync(logError, `${url}\n`);
      console.log(`[${index + 1}/${links.length}] ❌ Lỗi kết nối: ${fileName}`);
      reject(err);
    });
  });
}

async function downloadAll() {
  if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
  }

  for (let i = 0; i < links.length; i++) {
    try {
      await downloadFile(links[i], i);
    } catch {}
  }

  console.log(`\n➡️ Đã tải: ${downloadedCount}/${links.length} link thành công.`);
}

downloadAll();
