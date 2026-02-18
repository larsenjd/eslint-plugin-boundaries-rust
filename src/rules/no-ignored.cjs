const {
  analyzeDependency,
  createRuleContext,
  getCurrentFileAnalysis,
  getDependencyReportNode,
  getDependencySource,
  isValidFileContext
} = require("./_shared.cjs");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent importing ignored files from recognized elements",
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

      if (!dependency.isLocal || !dependency.to) {
        return;
      }

      if (dependency.to.known && !dependency.to.matchedElementType) {
        context.report({
          node: getDependencyReportNode(node),
          message: "Importing ignored files is not allowed"
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
