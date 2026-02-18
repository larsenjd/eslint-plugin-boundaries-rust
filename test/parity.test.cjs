const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const rustPlugin = require("../dist/index.cjs");
const { normalizeMessages, runLintWithPlugin } = require("./_lint-utils.cjs");

const upstreamModule = require("eslint-plugin-boundaries");
const upstreamPlugin = upstreamModule.default || upstreamModule;
const strictParity = process.env.STRICT_PARITY === "1";

function withFileMode(settings) {
  const elements = settings["boundaries/elements"];
  if (!Array.isArray(elements)) {
    return settings;
  }

  return {
    ...settings,
    "boundaries/elements": elements.map((element) => ({
      ...element,
      mode: "file"
    }))
  };
}

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
  },
  {
    name: "monorepo-ts-alias-element-types",
    file: "fixtures/monorepo/packages/app/src/consumer.ts",
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/tsconfig.base.json")
        }
      },
      "boundaries/elements": [
        { type: "app", pattern: "test/fixtures/monorepo/packages/app/src/*.ts" },
        { type: "lib-public", pattern: "test/fixtures/monorepo/packages/lib/src/public.ts" },
        { type: "lib-private", pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts" }
      ]
    },
    rules: {
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
  },
  {
    name: "monorepo-workspace-alias-element-types",
    file: "fixtures/monorepo/packages/app/src/workspace-consumer.ts",
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/tsconfig.base.json")
        }
      },
      "boundaries/elements": [
        { type: "app", pattern: "test/fixtures/monorepo/packages/app/src/*.ts" },
        { type: "lib-public", pattern: "test/fixtures/monorepo/packages/lib/src/public.ts" },
        { type: "lib-private", pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts" }
      ]
    },
    rules: {
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
  },
  {
    name: "monorepo-project-references-element-types",
    file: "fixtures/monorepo/packages/app/src/reference-consumer.ts",
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve(__dirname, "fixtures/monorepo/packages/app/tsconfig.json")
        }
      },
      "boundaries/elements": [
        { type: "app", pattern: "test/fixtures/monorepo/packages/app/src/*.ts" },
        { type: "lib-public", pattern: "test/fixtures/monorepo/packages/lib/src/public.ts" },
        { type: "lib-private", pattern: "test/fixtures/monorepo/packages/lib/src/private/*.ts" }
      ]
    },
    rules: {
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
  }
];

for (const scenario of scenarios) {
  test(`parity:${scenario.name}`, async () => {
    const file = path.resolve(__dirname, scenario.file);
    const settings = withFileMode(scenario.settings);
    const rustMessages = await runLintWithPlugin(file, rustPlugin, settings, scenario.rules);
    const upstreamMessages = await runLintWithPlugin(file, upstreamPlugin, settings, scenario.rules);

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
