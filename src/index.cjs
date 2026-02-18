const fs = require("node:fs");
const path = require("node:path");
const { rules } = require("./rules/index.cjs");
const recommended = require("./configs/recommended.cjs");
const strict = require("./configs/strict.cjs");

const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version
  },
  rules,
  configs: {
    recommended,
    strict
  }
};

module.exports = plugin;
