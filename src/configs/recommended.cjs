const { SETTINGS } = require("../settings.cjs");

module.exports = {
  rules: {
    [SETTINGS.RULE_ELEMENT_TYPES]: [2],
    [SETTINGS.RULE_ENTRY_POINT]: [2],
    [SETTINGS.RULE_EXTERNAL]: [2],
    [SETTINGS.RULE_NO_IGNORED]: 0,
    [SETTINGS.RULE_NO_PRIVATE]: [
      2,
      {
        allowUncles: true
      }
    ],
    [SETTINGS.RULE_NO_UNKNOWN_FILES]: 0,
    [SETTINGS.RULE_NO_UNKNOWN]: 0
  },
  settings: {
    [SETTINGS.ELEMENTS]: []
  }
};
