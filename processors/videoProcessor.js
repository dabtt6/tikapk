const { handleHtml, getDocument } = require("../services/htmlService");
const { getMediaInfoFromAPI } = require("../services/apiService");
const { downloadVideo } = require("../services/downloadService");
const { extractVideoDataFromJson } = require("../extractors/dataExtractor");

const fs = require("fs");
const path = require("path");

// Đường dẫn log lỗi
const LOG_ERROR_FILE = path.resolve(__dirname, "..", "log_error.txt");

/**
 * Ghi lỗi vào file log_error.txt
 * @param {string} url - URL TikTok gây lỗi
 * @param {string} message - Nội dung lỗi
 */
function logError(url, message) {
  const line = `[${new Date().toISOString()}] ${url} - ${message}\n`;
  try {
    fs.writeFileSync(LOG_ERROR_FILE, line, { flag: "a" });
    console.error("📄 Ghi log lỗi:", line.trim());
  } catch (err) {
    console.error("❌ Không thể ghi log lỗi:", err.message);
  }
}

/**
 * Xử lý một video TikTok từ URL
 * @param {string} url - Đường dẫn video TikTok
 */
const processVideoPost = async (url) => {
  try {
    console.log(`Processing video: ${url}`);

    // 1. Cố gắng trích xuất từ HTML
    const html = await handleHtml(url);
    const $ = getDocument(html);
    const jsonDataElement = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__");

    let videoData;
    let useDirectExtraction = false;

    if (jsonDataElement && jsonDataElement.length > 0) {
      const rawJSON = jsonDataElement[0]?.children?.[0]?.data;
      if (rawJSON) {
        videoData = extractVideoDataFromJson(rawJSON);
        if (videoData) {
          useDirectExtraction = true;
          console.log("METHOD: Direct extraction from HTML successful");
        }
      }
    }

    // 2. Nếu HTML fail, fallback sang API
    if (!useDirectExtraction) {
      console.log("HTML extraction failed. Using API as backup...");
      videoData = await getMediaInfoFromAPI(url);

      if (
        videoData.type !== "video" ||
        !videoData.video ||
        !videoData.video.playAddr
      ) {
        throw new Error("Invalid video data from API");
      }

      console.log("METHOD: Using backup API successful");

      videoData = {
        authorUniqueId: videoData.author.username,
        videoId: videoData.id,
        createTime: videoData.createTime,
        videoUrl: videoData.video.playAddr[0],
      };
    }

    // 3. Tải video
    await downloadVideo(videoData, url);

    console.log(
      `✅ Method used: ${
        useDirectExtraction ? "Direct HTML" : "Backup API"
      } for ${url}`
    );
  } catch (error) {
    console.error(`❌ Failed to process video from ${url}: ${error.message}`);
    logError(url, error.message); // 👉 Ghi lỗi vào log
    throw error; // 👉 QUAN TRỌNG: Ném lại lỗi để logSuccess không được gọi
  }
};

module.exports = {
  processVideoPost,
};
