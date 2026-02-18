const {
  analyzeDependency,
  createRuleContext,
  getCurrentFileAnalysis,
  getDependencySource,
  isValidFileContext
} = require("./_shared.cjs");
const { wildcardMatch } = require("./_policy.cjs");

function normalizeTargets(target) {
  if (!target) {
    return [];
  }

  if (typeof target === "string") {
    return [target];
  }

  if (Array.isArray(target)) {
    return target;
  }

  return [];
}

function normalizePathSelectors(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }

  return [];
}

function selectRule(fromType, toType, internalPath, options) {
  const rules = Array.isArray(options.rules) ? options.rules : [];

  for (const rule of rules) {
    const targets = normalizeTargets(rule.target);
    if (!targets.some((target) => wildcardMatch(target, toType))) {
      continue;
    }

    const allowedPaths = normalizePathSelectors(rule.allow);
    const blockedPaths = normalizePathSelectors(rule.disallow || rule.deny);

    if (blockedPaths.some((pattern) => wildcardMatch(pattern, internalPath))) {
      return {
        allowed: false,
        message: rule.message
      };
    }

    if (allowedPaths.length > 0) {
      return {
        allowed: allowedPaths.some((pattern) => wildcardMatch(pattern, internalPath)),
        message: rule.message
      };
    }
  }

  return {
    allowed: true,
    message: undefined
  };
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Check entry point used for each element type",
      recommended: true
    },
    schema: [
      {
        type: "object",
        additionalProperties: true
      }
    ]
  },
  create(context) {
    const ruleContext = createRuleContext(context);

    if (!isValidFileContext(ruleContext.filename)) {
      return {};
    }

    const current = getCurrentFileAnalysis(ruleContext);
    if (!current.known || !current.matchedElementType) {
      return {};
    }

    const fromType = current.matchedElementType;
    const options = context.options[0] && typeof context.options[0] === "object" ? context.options[0] : {};

    function checkNode(node) {
      const source = getDependencySource(node);
      const dependency = analyzeDependency(ruleContext, source);

      if (!dependency.isLocal || !dependency.to || !dependency.to.matchedElementType || !dependency.scope) {
        return;
      }

      const decision = selectRule(
        fromType,
        dependency.to.matchedElementType,
        dependency.scope.internalPath,
        options
      );

      if (!decision.allowed) {
        context.report({
          node,
          message:
            decision.message ||
            `The entry point '${dependency.scope.internalPath}' is not allowed in ${dependency.to.matchedElementType}`
        });
      }
    }

    return {
      ImportDeclaration: checkNode,
      ExportAllDeclaration: checkNode,
      ExportNamedDeclaration: checkNode,
      ImportExpression: checkNode,
      CallExpression: checkNode
    };
  }
};
