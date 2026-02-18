const path = require("node:path");
const { SETTINGS } = require("../settings.cjs");
const { loadNative } = require("../native-loader.cjs");

function normalizeElements(elements) {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      type: typeof entry.type === "string" ? entry.type : "unknown",
      pattern: typeof entry.pattern === "string" ? entry.pattern : ""
    }))
    .filter((entry) => entry.pattern.length > 0);
}

function normalizeIgnore(ignore) {
  if (!Array.isArray(ignore)) {
    return [];
  }

  return ignore.filter((item) => typeof item === "string");
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow files that do not match any configured boundaries element",
      recommended: false
    },
    schema: []
  },
  create(context) {
    const native = loadNative();
    const settings = context.settings || {};
    const elements = normalizeElements(settings[SETTINGS.ELEMENTS]);
    const ignore = normalizeIgnore(settings[SETTINGS.IGNORE]);
    const cwd = context.cwd || process.cwd();

    return {
      Program(node) {
        const filename = context.filename;

        if (!filename || filename === "<input>" || filename.startsWith("<")) {
          return;
        }

        const payload = {
          filePath: path.resolve(filename),
          rootPath: path.resolve(cwd),
          elements,
          ignore
        };

        const result = native.analyzeFile(JSON.stringify(payload));

        if (!result.known) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            message: `File \"${filename}\" does not match any configured boundaries element.`
          });
        }
      }
    };
  }
};
