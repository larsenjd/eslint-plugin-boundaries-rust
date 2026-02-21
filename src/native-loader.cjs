const fs = require("node:fs");
const path = require("node:path");

function isMusl() {
  if (process.platform !== "linux") {
    return false;
  }

  const report = process.report && process.report.getReport ? process.report.getReport() : null;
  if (report && report.header && report.header.glibcVersionRuntime) {
    return false;
  }

  return true;
}

function platformTriples() {
  if (process.platform === "win32") {
    return ["win32-x64-msvc", "win32-arm64-msvc"];
  }

  if (process.platform === "darwin") {
    return ["darwin-arm64", "darwin-x64"];
  }

  if (process.platform === "linux") {
    if (process.arch === "arm64") {
      return isMusl() ? ["linux-arm64-musl", "linux-arm64-gnu"] : ["linux-arm64-gnu", "linux-arm64-musl"];
    }
    return isMusl() ? ["linux-x64-musl", "linux-x64-gnu"] : ["linux-x64-gnu", "linux-x64-musl"];
  }

  return [];
}

function optionalPackageCandidates() {
  return platformTriples().map((triple) => `eslint-plugin-boundaries-rust-${triple}`);
}

function candidateBinaryNames() {
  return [
    "index.node",
    "eslint_plugin_boundaries_rust.node",
    ...platformTriples().map((triple) => `eslint_plugin_boundaries_rust.${triple}.node`)
  ];
}

function findNativeBinary() {
  const candidates = [
    path.resolve(__dirname, ".."),
    path.resolve(__dirname, "..", "native"),
    path.resolve(__dirname, "..", "native", "target", "release")
  ];

  const names = candidateBinaryNames();

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir);

    for (const name of names) {
      if (files.includes(name)) {
        return path.join(dir, name);
      }
    }

    const fallback = files.find(
      (file) =>
        file.endsWith(".node") &&
        (file.includes("eslint_plugin_boundaries_rust") || file === "index.node")
    );

    if (fallback) {
      return path.join(dir, fallback);
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
  if (binary) {
    cached = require(binary);
    return cached;
  }

  for (const packageName of optionalPackageCandidates()) {
    try {
      const packageRoot = path.dirname(require.resolve(`${packageName}/package.json`));
      for (const name of candidateBinaryNames()) {
        const candidate = path.join(packageRoot, name);
        if (fs.existsSync(candidate)) {
          cached = require(candidate);
          return cached;
        }
      }
    } catch {
      // Try next package candidate.
    }
  }

  throw new Error(
    "Native module not found. Run `pnpm run build:native` or install a package with prebuilt binaries."
  );
}

module.exports = {
  loadNative
};
