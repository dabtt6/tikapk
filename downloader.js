const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function sanitizeFilename(url) {
  const name = url.split("/").slice(-2).join("_").split("?")[0];
  return name.replace(/[^a-z0-9_\-\.]/gi, "_");
}

function download(url) {
  return new Promise((resolve, reject) => {
    const filename = sanitizeFilename(url) + ".mp4";
    const output = path.join(__dirname, "downloads", filename);

    if (!fs.existsSync("downloads")) {
      fs.mkdirSync("downloads");
    }

    const cmd = `yt-dlp -o "${output}" "${url}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || stdout || err.message));
      } else {
        resolve();
      }
    });
  });
}

module.exports = { download };
