const fs = require("node:fs");
const path = require("node:path");
const resolveImport = require("eslint-module-utils/resolve").default;
const { SETTINGS } = require("../settings.cjs");
const { loadNative } = require("../native-loader.cjs");

const RESOLUTION_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json"
];

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

function getRootPath(context, settings) {
  const configuredRoot = settings[SETTINGS.ROOT_PATH];
  const cwd = context.cwd || process.cwd();
  if (!configuredRoot) {
    return path.resolve(cwd);
  }
  if (path.isAbsolute(configuredRoot)) {
    return configuredRoot;
  }
  return path.resolve(cwd, configuredRoot);
}

function normalizePathForMatch(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

function getPatternBase(pattern) {
  const normalized = normalizePathForMatch(pattern);
  const wildcardIndex = normalized.search(/[*?[]/);
  if (wildcardIndex === -1) {
    return normalized;
  }
  const prefix = normalized.slice(0, wildcardIndex);
  const slash = prefix.lastIndexOf("/");
  return slash === -1 ? "" : prefix.slice(0, slash + 1);
}

function getElementScopeFromAnalysis(analysis) {
  if (!analysis || !analysis.matchedPattern || !analysis.relativePath) {
    return null;
  }

  const base = getPatternBase(analysis.matchedPattern);
  const relative = normalizePathForMatch(analysis.relativePath);

  if (!base || !relative.startsWith(base)) {
    return null;
  }

  const internalPath = relative.slice(base.length) || path.basename(relative);
  return {
    base,
    internalPath,
    isEntryPoint: /(^|\/)index\.[A-Za-z0-9]+$/.test(internalPath)
  };
}

function analyzeFile(native, filePath, rootPath, elements, ignore) {
  return native.analyzeFile(
    JSON.stringify({
      filePath: path.resolve(filePath),
      rootPath,
      elements,
      ignore
    })
  );
}

function toLocalDependencyPath(source, filename) {
  if (typeof source !== "string") {
    return null;
  }

  if (source.startsWith(".")) {
    return path.resolve(path.dirname(filename), source);
  }

  if (source.startsWith("/")) {
    return source;
  }

  return null;
}

function resolveLocalDependency(source, filename) {
  const rawBase = toLocalDependencyPath(source, filename);
  if (!rawBase) {
    return null;
  }

  if (fs.existsSync(rawBase) && fs.statSync(rawBase).isFile()) {
    return rawBase;
  }

  for (const extension of RESOLUTION_EXTENSIONS) {
    const withExtension = `${rawBase}${extension}`;
    if (fs.existsSync(withExtension) && fs.statSync(withExtension).isFile()) {
      return withExtension;
    }
  }

  if (fs.existsSync(rawBase) && fs.statSync(rawBase).isDirectory()) {
    for (const extension of RESOLUTION_EXTENSIONS) {
      const indexFile = path.join(rawBase, `index${extension}`);
      if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
        return indexFile;
      }
    }
  }

  return null;
}

function getDependencySource(node) {
  if (!node) {
    return null;
  }

  if (node.type === "ImportDeclaration") {
    return node.source && node.source.value;
  }

  if (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
    return node.source && node.source.value;
  }

  if (node.type === "ImportExpression") {
    const sourceNode = node.source;
    return sourceNode && sourceNode.type === "Literal" ? sourceNode.value : null;
  }

  if (
    node.type === "CallExpression" &&
    node.callee &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require"
  ) {
    const [arg] = node.arguments || [];
    return arg && arg.type === "Literal" ? arg.value : null;
  }

  return null;
}

function getDependencyReportNode(node) {
  if (!node) {
    return node;
  }

  if (node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
    return node.source || node;
  }

  if (node.type === "ImportExpression") {
    return node.source || node;
  }

  if (
    node.type === "CallExpression" &&
    node.callee &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require"
  ) {
    const [arg] = node.arguments || [];
    return arg || node;
  }

  return node;
}

function createRuleContext(context) {
  const native = loadNative();
  const settings = context.settings || {};
  const elements = normalizeElements(settings[SETTINGS.ELEMENTS]);
  const ignore = normalizeIgnore(settings[SETTINGS.IGNORE]);
  const rootPath = getRootPath(context, settings);
  const filename = context.filename;

  return {
    context,
    native,
    settings,
    elements,
    ignore,
    rootPath,
    filename
  };
}

function parseExternalModuleName(source) {
  if (typeof source !== "string") {
    return null;
  }

  if (source.startsWith(".") || source.startsWith("/")) {
    return null;
  }

  if (source.startsWith("@")) {
    const [scope, name] = source.split("/");
    return name ? `${scope}/${name}` : source;
  }

  return source.split("/")[0];
}

function resolveDependencyPath(source, context, filename) {
  try {
    return resolveImport(source, context) || resolveLocalDependency(source, filename);
  } catch (error) {
    if (
      error &&
      typeof error.message === "string" &&
      error.message.includes('unable to load resolver "node"')
    ) {
      return resolveLocalDependency(source, filename);
    }
    throw error;
  }
}

function analyzeDependency(ruleContext, source) {
  if (typeof source !== "string" || source.length === 0) {
    return {
      isLocal: false,
      isExternal: false,
      source,
      externalModule: null,
      resolvedPath: null,
      to: null,
      scope: null
    };
  }

  const { native, context, filename, rootPath, elements, ignore } = ruleContext;
  const resolved = resolveDependencyPath(source, context, filename);
  const externalModule = parseExternalModuleName(source);

  if (!resolved) {
    return {
      isLocal: false,
      isExternal: Boolean(externalModule),
      source,
      externalModule,
      resolvedPath: null,
      to: null,
      scope: null
    };
  }

  const analysis = analyzeFile(native, resolved, rootPath, elements, ignore);

  return {
    isLocal: true,
    isExternal: false,
    source,
    externalModule: null,
    resolvedPath: resolved,
    to: analysis,
    scope: getElementScopeFromAnalysis(analysis)
  };
}

function getCurrentFileAnalysis(ruleContext) {
  const { native, filename, rootPath, elements, ignore } = ruleContext;
  const analysis = analyzeFile(native, filename, rootPath, elements, ignore);
  return {
    ...analysis,
    scope: getElementScopeFromAnalysis(analysis)
  };
}

function isValidFileContext(filename) {
  return Boolean(filename && filename !== "<input>" && !filename.startsWith("<"));
}

module.exports = {
  createRuleContext,
  analyzeDependency,
  getCurrentFileAnalysis,
  getDependencySource,
  getDependencyReportNode,
  isValidFileContext,
  normalizeElements,
  normalizeIgnore,
  analyzeFile,
  getPatternBase,
  getElementScopeFromAnalysis
};
