const { ESLint } = require("eslint");

async function runLintWithPlugin(targetFile, plugin, settings, rules) {
  const mergedSettings = {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".json"]
      }
    },
    ...settings
  };

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts"],
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module"
        },
        plugins: {
          boundaries: plugin
        },
        settings: mergedSettings,
        rules
      }
    ]
  });

  const [result] = await eslint.lintFiles([targetFile]);
  return result.messages;
}

function normalizeMessages(messages) {
  return messages
    .map((message) => ({
      ruleId: message.ruleId,
      line: message.line,
      column: message.column
    }))
    .sort((a, b) => {
      if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;
      if (a.line !== b.line) return a.line - b.line;
      if (a.column !== b.column) return a.column - b.column;
      return 0;
    });
}

module.exports = {
  runLintWithPlugin,
  normalizeMessages
};
