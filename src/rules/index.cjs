const { RULE_SHORT_NAMES_MAP } = require("../settings.cjs");
const { createStubRule } = require("./_stub-rule.cjs");
const noUnknownFiles = require("./no-unknown-files.cjs");

const rules = {
  [RULE_SHORT_NAMES_MAP.ENTRY_POINT]: createStubRule(RULE_SHORT_NAMES_MAP.ENTRY_POINT),
  [RULE_SHORT_NAMES_MAP.ELEMENT_TYPES]: createStubRule(RULE_SHORT_NAMES_MAP.ELEMENT_TYPES),
  [RULE_SHORT_NAMES_MAP.EXTERNAL]: createStubRule(RULE_SHORT_NAMES_MAP.EXTERNAL),
  [RULE_SHORT_NAMES_MAP.NO_IGNORED]: createStubRule(RULE_SHORT_NAMES_MAP.NO_IGNORED),
  [RULE_SHORT_NAMES_MAP.NO_PRIVATE]: createStubRule(RULE_SHORT_NAMES_MAP.NO_PRIVATE),
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN]: createStubRule(RULE_SHORT_NAMES_MAP.NO_UNKNOWN),
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES]: noUnknownFiles
};

module.exports = {
  rules
};
