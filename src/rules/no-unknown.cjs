const {
  analyzeDependency,
  createRuleContext,
  getCurrentFileAnalysis,
  getDependencySource,
  isValidFileContext
} = require("./_shared.cjs");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent importing unknown local elements from known elements",
      recommended: false
    },
    schema: []
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

    function checkNode(node) {
      const source = getDependencySource(node);
      const dependency = analyzeDependency(ruleContext, source);

      if (dependency.isLocal && dependency.to && !dependency.to.known) {
        context.report({
          node,
          message: "Importing unknown elements is not allowed"
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
