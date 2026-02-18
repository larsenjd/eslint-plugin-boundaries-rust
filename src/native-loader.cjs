const fs = require("node:fs");
const path = require("node:path");

function findNativeBinary() {
  const candidates = [
    path.resolve(__dirname, ".."),
    path.resolve(__dirname, "..", "native"),
    path.resolve(__dirname, "..", "native", "target", "release")
  ];

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir);
    const match = files.find(
      (file) =>
        file.endsWith(".node") &&
        (file.includes("eslint_plugin_boundries_rust") || file === "index.node")
    );
    if (match) {
      return path.join(dir, match);
    }
  }

  return null;
}

let cached;

function loadNative() {
  if (cached) {
    return cached;
  }

  const binary = findNativeBinary();
  if (!binary) {
    throw new Error(
      "Native module not found. Run `pnpm run build:native` before using eslint-plugin-boundries-rust."
    );
  }

  cached = require(binary);
  return cached;
}

module.exports = {
  loadNative
};
