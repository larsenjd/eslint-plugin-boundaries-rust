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
      description: "Prevent importing private elements of another element",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          allowUncles: {
            type: "boolean"
          },
          message: {
            type: "string"
          }
        },
        additionalProperties: false
      }
    ]
  },
  create(context) {
    const ruleContext = createRuleContext(context);

    if (!isValidFileContext(ruleContext.filename)) {
      return {};
    }

    const current = getCurrentFileAnalysis(ruleContext);
    if (!current.known || !current.matchedElementType || !current.scope) {
      return {};
    }

    const options = context.options[0] && typeof context.options[0] === "object" ? context.options[0] : {};

    function checkNode(node) {
      const source = getDependencySource(node);
      const dependency = analyzeDependency(ruleContext, source);

      if (!dependency.isLocal || !dependency.to || !dependency.scope || !dependency.to.matchedElementType) {
        return;
      }

      if (!dependency.to.known || !dependency.scope.base) {
        return;
      }

      if (current.matchedElementType === dependency.to.matchedElementType && current.scope.base === dependency.scope.base) {
        return;
      }

      if (dependency.scope.isEntryPoint) {
        return;
      }

      context.report({
        node,
        message:
          typeof options.message === "string"
            ? options.message
            : `Dependency is private of element type '${dependency.to.matchedElementType}'`
      });
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
