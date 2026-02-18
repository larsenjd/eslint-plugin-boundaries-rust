const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const rustPlugin = require("../dist/index.cjs");
const { normalizeMessages, runLintWithPlugin } = require("./_lint-utils.cjs");

const upstreamModule = require("eslint-plugin-boundaries");
const upstreamPlugin = upstreamModule.default || upstreamModule;
const strictParity = process.env.STRICT_PARITY === "1";

const scenarios = [
  {
    name: "no-unknown-files",
    file: "fixtures/unknown/src/file.ts",
    settings: {
      "boundaries/elements": [{ type: "known", pattern: "test/fixtures/known/src/*.ts" }]
    },
    rules: {
      "boundaries/no-unknown-files": "error"
    }
  },
  {
    name: "no-unknown",
    file: "fixtures/rules/src/feature/consumer.ts",
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" },
        { type: "shared", pattern: "test/fixtures/rules/src/shared/*.ts" },
        { type: "ignored", pattern: "test/fixtures/rules/src/ignored/*.ts" }
      ]
    },
    rules: {
      "boundaries/no-unknown": "error"
    }
  },
  {
    name: "no-ignored",
    file: "fixtures/rules/src/feature/consumer.ts",
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" },
        { type: "shared", pattern: "test/fixtures/rules/src/shared/*.ts" }
      ],
      "boundaries/ignore": ["test/fixtures/rules/src/ignored/*.ts"]
    },
    rules: {
      "boundaries/no-ignored": "error"
    }
  },
  {
    name: "element-types",
    file: "fixtures/rules/src/feature/consumer.ts",
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" },
        { type: "shared", pattern: "test/fixtures/rules/src/shared/*.ts" },
        { type: "ignored", pattern: "test/fixtures/rules/src/ignored/*.ts" }
      ]
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [{ from: "feature", disallow: ["shared"], message: "feature cannot import shared" }]
        }
      ]
    }
  },
  {
    name: "external",
    file: "fixtures/rules/src/feature/external-consumer.ts",
    settings: {
      "boundaries/elements": [{ type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" }]
    },
    rules: {
      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [{ from: "feature", disallow: ["lodash"], message: "feature cannot use lodash" }]
        }
      ]
    }
  },
  {
    name: "entry-point",
    file: "fixtures/rules/src/feature/entry-consumer.ts",
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" },
        { type: "component", pattern: "test/fixtures/rules/src/components/*/*.ts" }
      ]
    },
    rules: {
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
  },
  {
    name: "no-private",
    file: "fixtures/rules/src/feature/entry-consumer.ts",
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "test/fixtures/rules/src/feature/*.ts" },
        { type: "component", pattern: "test/fixtures/rules/src/components/*/*.ts" }
      ]
    },
    rules: {
      "boundaries/no-private": "error"
    }
  }
];

for (const scenario of scenarios) {
  test(`parity:${scenario.name}`, async () => {
    const file = path.resolve(__dirname, scenario.file);
    const rustMessages = await runLintWithPlugin(file, rustPlugin, scenario.settings, scenario.rules);
    const upstreamMessages = await runLintWithPlugin(file, upstreamPlugin, scenario.settings, scenario.rules);

    const rustNormalized = normalizeMessages(rustMessages);
    const upstreamNormalized = normalizeMessages(upstreamMessages);

    if (!strictParity) {
      if (JSON.stringify(rustNormalized) !== JSON.stringify(upstreamNormalized)) {
        console.error(`PARITY DRIFT: ${scenario.name}`);
        console.error(`  rust: ${JSON.stringify(rustNormalized)}`);
        console.error(`  upstream: ${JSON.stringify(upstreamNormalized)}`);
      }
      return;
    }

    assert.deepEqual(rustNormalized, upstreamNormalized, `Parity mismatch for ${scenario.name}`);
  });
}
