const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { validateURL } = require("./utils/urlUtils");
const { processVideoPost } = require("./processors/videoProcessor");
const { processPhotoPost } = require("./processors/photoProcessor");

const LINKS_FILE = "links.txt";
const LOG_OK = "log_success.txt";
const LOG_ERR = "log_error.txt";

let successCount = 0;
let errorCount = 0;

/**
 * Ghi log ra file
 */
function appendLog(file, line) {
  fs.appendFileSync(file, line + "\n");
}

/**
 * Hiển thị tiến trình dạng 1 dòng duy nhất
 */
function printProgress(total) {
  const done = successCount + errorCount;
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`▶️ Tiến trình: ${done}/${total} (✅ ${successCount} | ❌ ${errorCount})`);
}

/**
 * Đọc danh sách URL từ file txt
 */
function readLinks(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch (err) {
    console.error("❌ Không đọc được file links.txt:", err.message);
    return [];
  }
}

/**
 * Hỏi người dùng muốn tải đồng thời bao nhiêu link
 */
async function askConcurrency() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((res) => rl.question(q, res));
  const input = await question("👉 Bạn muốn xử lý bao nhiêu link cùng lúc? (mặc định 5): ");
  rl.close();

  const num = parseInt(input);
  return isNaN(num) || num < 1 ? 5 : num;
}

/**
 * Xử lý một URL TikTok
 */
async function handleUrl(url, total) {
  if (!validateURL(url)) {
    appendLog(LOG_ERR, url);
    errorCount++;
    printProgress(total);
    return;
  }

  try {
    if (url.includes("/photo/")) {
      await processPhotoPost(url);
    } else {
      await processVideoPost(url);
    }

    successCount++;
    appendLog(LOG_OK, url);
  } catch (err) {
    errorCount++;
    appendLog(LOG_ERR, url);
  }

  printProgress(total);
}

/**
 * Xử lý đồng thời theo batch giới hạn
 */
async function processUrlsParallel(urls, concurrency) {
  console.log(`\n🚀 Bắt đầu xử lý ${urls.length} TikTok URL (song song ${concurrency})...\n`);

  let index = 0;

  async function nextBatch() {
    const batch = [];

    for (let i = 0; i < concurrency && index < urls.length; i++, index++) {
      const url = urls[index];
      batch.push(handleUrl(url, urls.length));
    }

    await Promise.allSettled(batch);

    if (index < urls.length) {
      await nextBatch();
    }
  }

  await nextBatch();

  console.log(`\n✅ Hoàn tất: Thành công ${successCount}, lỗi ${errorCount}, tổng ${urls.length}`);
}

/**
 * Điểm khởi chạy ứng dụng
 */
(async () => {
  const urls = readLinks(LINKS_FILE);

  if (urls.length === 0) {
    console.log("⚠️ Không có link nào trong links.txt");
    process.exit(0);
  }

  try {
    const concurrency = await askConcurrency();
    await processUrlsParallel(urls, concurrency);
  } catch (err) {
    console.error(`🔥 Lỗi nghiêm trọng: ${err.message}`);
    process.exit(1);
  }
})();
