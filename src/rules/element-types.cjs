const {
  analyzeDependency,
  createRuleContext,
  getCurrentFileAnalysis,
  getDependencySource,
  isValidFileContext
} = require("./_shared.cjs");
const { evaluateRules } = require("./_policy.cjs");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Check allowed dependencies between element types",
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

      if (!dependency.isLocal || !dependency.to || !dependency.to.matchedElementType) {
        return;
      }

      const toType = dependency.to.matchedElementType;
      const decision = evaluateRules(fromType, toType, options, "type");
      if (!decision.allowed) {
        context.report({
          node,
          message: decision.message || `Importing ${toType} is not allowed in ${fromType}`
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
