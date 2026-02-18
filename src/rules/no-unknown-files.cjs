const { createRuleContext, getCurrentFileAnalysis, isValidFileContext } = require("./_shared.cjs");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow files that do not match any configured boundaries element",
      recommended: false
    },
    schema: []
  },
  create(context) {
    const ruleContext = createRuleContext(context);

    return {
      Program(node) {
        if (!isValidFileContext(ruleContext.filename)) {
          return;
        }

        const result = getCurrentFileAnalysis(ruleContext);
        if (!result.known) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            message: `File \"${ruleContext.filename}\" does not match any configured boundaries element.`
          });
        }
      }
    };
  }
};
