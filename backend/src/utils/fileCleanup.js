const fs = require("fs");
const path = require("path");

function isSafePath(baseDirectory, targetPath) {
  const relativePath = path.relative(baseDirectory, targetPath);
  return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function cleanupFiles(baseDirectory, fileNames) {
  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    return;
  }

  const uniqueNames = [...new Set(fileNames)];

  uniqueNames.forEach((fileName) => {
    if (!fileName) {
      return;
    }

    const normalizedName = path.basename(String(fileName));
    const absolutePath = path.resolve(baseDirectory, normalizedName);

    if (!isSafePath(baseDirectory, absolutePath)) {
      return;
    }

    fs.unlink(absolutePath, () => {
      // Best effort cleanup.
    });
  });
}

module.exports = {
  cleanupFiles,
  isSafePath
};
