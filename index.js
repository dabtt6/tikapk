const fs = require("fs");
const path = require("path");
const { validateURL } = require("./utils/urlUtils");
const { processVideoPost } = require("./processors/videoProcessor");
const { processPhotoPost } = require("./processors/photoProcessor");

const LINKS_FILE = "links.txt";
const LOG_SUCCESS_FILE = "log_success.txt"; // Thêm dòng này

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
 * Đọc danh sách link đã xử lý thành công
 * @returns {Set<string>}
 */
function readSuccessLinks() {
  try {
    const data = fs.readFileSync(LOG_SUCCESS_FILE, "utf8");
    return new Set(
      data
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
    );
  } catch {
    return new Set(); // Nếu file chưa tồn tại
  }
}

/**
 * Ghi log thành công
 * @param {string} url
 */
function logSuccess(url) {
  fs.appendFileSync(LOG_SUCCESS_FILE, `${url}\n`);
}

/**
 * Xử lý từng URL TikTok
 * @param {string[]} urls - Danh sách URL
 */
const processUrls = async (urls) => {
  const successLinks = readSuccessLinks(); // Đọc log
  const filteredUrls = urls.filter((url) => !successLinks.has(url)); // Lọc link đã tải

  console.log(`🚀 Bắt đầu xử lý ${filteredUrls.length}/${urls.length} TikTok URL...`);
  for (let i = 0; i < filteredUrls.length; i++) {
    const url = filteredUrls[i];
    if (!validateURL(url)) {
      console.error(`⚠️  Link không hợp lệ: ${url}`);
      continue;
    }
    try {
      if (i > 0) await new Promise((r) => setTimeout(r, 2000));
      if (url.includes("/photo/")) {
        await processPhotoPost(url);
      } else {
        await processVideoPost(url);
      }
      logSuccess(url); // Ghi vào log nếu thành công
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
