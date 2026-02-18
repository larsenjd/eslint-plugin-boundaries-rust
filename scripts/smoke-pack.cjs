const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

const root = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "boundries-smoke-"));
const packDir = path.join(tempDir, "pack");
const appDir = path.join(tempDir, "app");
fs.mkdirSync(packDir, { recursive: true });
fs.mkdirSync(appDir, { recursive: true });

run(`pnpm pack --pack-destination "${packDir}"`, root);
const tarball = fs.readdirSync(packDir).find((name) => name.endsWith(".tgz"));
if (!tarball) {
  throw new Error("Failed to find packed tarball");
}

write(
  path.join(appDir, "package.json"),
  JSON.stringify(
    {
      name: "smoke-app",
      private: true,
      type: "commonjs"
    },
    null,
    2
  ) + "\n"
);

run("npm install eslint@^9", appDir);
run(`npm install "${path.join(packDir, tarball)}"`, appDir);

write(
  path.join(appDir, "eslint.config.cjs"),
  `const plugin = require("eslint-plugin-boundries-rust");\n\nmodule.exports = [\n  {\n    files: ["**/*.ts"],\n    plugins: { boundaries: plugin },\n    settings: {\n      "boundaries/elements": [{ type: "x", mode: "file", pattern: "src/*.ts" }]\n    },\n    rules: {\n      "boundaries/no-unknown-files": "error"\n    }\n  }\n];\n`
);

write(path.join(appDir, "src", "file.ts"), "export const ok = 1;\n");
run("npx eslint src/file.ts", appDir);

console.log("Smoke test passed");
