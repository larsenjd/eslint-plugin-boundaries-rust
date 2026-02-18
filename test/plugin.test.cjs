const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { ESLint } = require("eslint");
const plugin = require("../dist/index.cjs");

async function runLint(targetFile, settings) {
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
        settings,
        rules: {
          "boundaries/no-unknown-files": "error"
        }
      }
    ]
  });

  const [result] = await eslint.lintFiles([targetFile]);
  return result.messages;
}

test("no-unknown-files passes for matched element", async () => {
  const file = path.resolve(__dirname, "fixtures/known/src/file.ts");
  const messages = await runLint(file, {
    "boundaries/elements": [
      {
        type: "known",
        pattern: "test/fixtures/known/src/*.ts"
      }
    ]
  });

  assert.equal(messages.length, 0);
});

test("no-unknown-files reports unmatched file", async () => {
  const file = path.resolve(__dirname, "fixtures/unknown/src/file.ts");
  const messages = await runLint(file, {
    "boundaries/elements": [
      {
        type: "known",
        pattern: "test/fixtures/known/src/*.ts"
      }
    ]
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/no-unknown-files");
});
