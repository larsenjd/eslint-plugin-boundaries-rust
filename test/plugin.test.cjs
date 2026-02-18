const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const plugin = require("../dist/index.cjs");
const { runLintWithPlugin } = require("./_lint-utils.cjs");

async function runLint(targetFile, settings, rules) {
  return runLintWithPlugin(targetFile, plugin, settings, rules);
}

test("no-unknown-files passes for matched element", async () => {
  const file = path.resolve(__dirname, "fixtures/known/src/file.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "known",
          mode: "file",
          pattern: "test/fixtures/known/src/*.ts"
        }
      ]
    },
    {
      "boundaries/no-unknown-files": "error"
    }
  );

  assert.equal(messages.length, 0);
});

test("no-unknown-files reports unmatched file", async () => {
  const file = path.resolve(__dirname, "fixtures/unknown/src/file.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "known",
          mode: "file",
          pattern: "test/fixtures/known/src/*.ts"
        }
      ]
    },
    {
      "boundaries/no-unknown-files": "error"
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/no-unknown-files");
});

test("no-unknown reports unresolved local import", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "shared",
          mode: "file",
          pattern: "test/fixtures/rules/src/shared/*.ts"
        },
        {
          type: "ignored",
          mode: "file",
          pattern: "test/fixtures/rules/src/ignored/*.ts"
        }
      ]
    },
    {
      "boundaries/no-unknown": "error"
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/no-unknown");
});

test("no-ignored reports ignored local import", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "shared",
          mode: "file",
          pattern: "test/fixtures/rules/src/shared/*.ts"
        }
      ],
      "boundaries/ignore": ["test/fixtures/rules/src/ignored/*.ts"]
    },
    {
      "boundaries/no-ignored": "error"
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/no-ignored");
});

test("element-types disallow rule reports invalid dependency", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "shared",
          mode: "file",
          pattern: "test/fixtures/rules/src/shared/*.ts"
        },
        {
          type: "ignored",
          mode: "file",
          pattern: "test/fixtures/rules/src/ignored/*.ts"
        }
      ]
    },
    {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "feature",
              disallow: ["shared"],
              message: "feature cannot import shared"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/element-types");
  assert.equal(messages[0].message, "feature cannot import shared");
});

test("external disallow rule reports invalid package usage", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/external-consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        }
      ]
    },
    {
      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "feature",
              disallow: ["lodash"],
              message: "feature cannot use lodash"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/external");
  assert.equal(messages[0].message, "feature cannot use lodash");
});

test("entry-point disallow rule reports private entry usage", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/entry-consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "component",
          mode: "file",
          pattern: "test/fixtures/rules/src/components/*/*.ts"
        }
      ]
    },
    {
      "boundaries/entry-point": [
        "error",
        {
          rules: [
            {
              target: "component",
              allow: ["*/index.ts"],
              message: "component private modules are not valid entry points"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/entry-point");
  assert.equal(messages[0].message, "component private modules are not valid entry points");
});

test("no-private ignores deep import into a different element type", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/entry-consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "component",
          mode: "file",
          pattern: "test/fixtures/rules/src/components/*/*.ts"
        }
      ]
    },
    {
      "boundaries/no-private": "error"
    }
  );

  assert.equal(messages.length, 0);
});

test("no-private allows importing declared entry point", async () => {
  const file = path.resolve(__dirname, "fixtures/rules/src/feature/public-entry-consumer.ts");
  const messages = await runLint(
    file,
    {
      "boundaries/elements": [
        {
          type: "feature",
          mode: "file",
          pattern: "test/fixtures/rules/src/feature/*.ts"
        },
        {
          type: "component",
          mode: "file",
          pattern: "test/fixtures/rules/src/components/*/*.ts"
        }
      ]
    },
    {
      "boundaries/no-private": "error"
    }
  );

  assert.equal(messages.length, 0);
});

test("monorepo ts-path alias element-types parity case", async () => {
  const file = path.resolve(__dirname, "fixtures/monorepo/packages/app/src/consumer.ts");
  const messages = await runLint(
    file,
    {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/tsconfig.base.json")
        }
      },
      "boundaries/elements": [
        {
          type: "app",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/app/src/*.ts"
        },
        {
          type: "lib-public",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/public.ts"
        },
        {
          type: "lib-private",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts"
        }
      ]
    },
    {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "app",
              disallow: ["lib-private"],
              message: "app cannot import lib-private over alias"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/element-types");
  assert.equal(messages[0].message, "app cannot import lib-private over alias");
});

test("monorepo workspace package-style alias element-types parity case", async () => {
  const file = path.resolve(__dirname, "fixtures/monorepo/packages/app/src/workspace-consumer.ts");
  const messages = await runLint(
    file,
    {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/tsconfig.base.json")
        }
      },
      "boundaries/elements": [
        {
          type: "app",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/app/src/*.ts"
        },
        {
          type: "lib-public",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/public.ts"
        },
        {
          type: "lib-private",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts"
        }
      ]
    },
    {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "app",
              disallow: ["lib-private"],
              message: "app cannot import workspace private internals"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/element-types");
  assert.equal(messages[0].message, "app cannot import workspace private internals");
});

test("monorepo project-references element-types parity case", async () => {
  const file = path.resolve(__dirname, "fixtures/monorepo/packages/app/src/reference-consumer.ts");
  const messages = await runLint(
    file,
    {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/packages/app/tsconfig.json")
        }
      },
      "boundaries/elements": [
        {
          type: "app",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/app/src/*.ts"
        },
        {
          type: "lib-public",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/public.ts"
        },
        {
          type: "lib-private",
          mode: "file",
          pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts"
        }
      ]
    },
    {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "app",
              disallow: ["lib-private"],
              message: "app cannot import referenced private internals"
            }
          ]
        }
      ]
    }
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "boundaries/element-types");
  assert.equal(messages[0].message, "app cannot import referenced private internals");
});
