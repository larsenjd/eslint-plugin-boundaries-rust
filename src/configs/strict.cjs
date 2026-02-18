const recommended = require("./recommended.cjs");
const { SETTINGS } = require("../settings.cjs");

module.exports = {
  ...recommended,
  rules: {
    ...recommended.rules,
    [SETTINGS.RULE_NO_IGNORED]: 2,
    [SETTINGS.RULE_NO_UNKNOWN_FILES]: 2,
    [SETTINGS.RULE_NO_UNKNOWN]: 2
  }
};
