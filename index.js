const fs = require("fs");
const path = require("path");

const { validateURL } = require("./utils/urlUtils");
const { processVideoPost } = require("./processors/videoProcessor");
const { processPhotoPost } = require("./processors/photoProcessor");

const LINKS_FILE = "links.txt";

/**
 * Đọc danh sách URL từ file txt
 * @param {string} filePath - Đường dẫn đến file chứa link
 * @returns {string[]} - Mảng các URL
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
 * Xử lý từng URL TikTok
 * @param {string[]} urls - Danh sách URL
 */
const processUrls = async (urls) => {
  console.log(`🚀 Bắt đầu xử lý ${urls.length} TikTok URL...`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    if (!validateURL(url)) {
      console.error(`⚠️  Link không hợp lệ: ${url}`);
      continue;
    }

    try {
      // Tránh bị rate-limit
      if (i > 0) await new Promise((r) => setTimeout(r, 2000));

      if (url.includes("/photo/")) {
        await processPhotoPost(url);
      } else {
        await processVideoPost(url);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi xử lý ${url}: ${err.message}`);
    }
  }

  console.log("✅ Hoàn tất xử lý tất cả link.");
};

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
    await processUrls(urls);
  } catch (err) {
    console.error(`🔥 Lỗi nghiêm trọng: ${err.message}`);
    process.exit(1);
  }
})();
