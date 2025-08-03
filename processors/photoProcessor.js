const { getMediaInfoFromAPI } = require("../services/apiService");
const { downloadImages } = require("../services/downloadService");
const fs = require("fs");
const path = require("path");

const LOG_FILE_PATH = path.resolve(__dirname, "..", "log_error.txt");

function logError(url, message) {
  const logLine = `[${new Date().toISOString()}] ${url} - ${message}\n`;
  try {
    fs.writeFileSync(LOG_FILE_PATH, logLine, { flag: "a" });
    console.error("📄 Ghi log lỗi:", logLine.trim());
  } catch (err) {
    console.error("❌ Không thể ghi log lỗi:", err.message);
  }
}

const processPhotoPost = async (url) => {
  try {
    console.log(`Processing photo: ${url}`);
    const photoData = await getMediaInfoFromAPI(url);
    if (
      photoData.type !== "image" ||
      !photoData.images ||
      photoData.images.length === 0
    ) {
      throw new Error("Invalid or missing photo data");
    }

    await downloadImages(
      url,
      photoData.id,
      photoData.images,
      photoData.createTime,
      photoData.author.username
    );

    console.log(`All images successfully downloaded from ${url}`);
  } catch (error) {
    console.error(`❌ Failed to process photo from ${url}: ${error.message}`);
    logError(url, error.message);
    throw error; // 👈 THÊM DÒNG NÀY để báo lỗi cho bên ngoài
  }
};

module.exports = {
  processPhotoPost,
};

