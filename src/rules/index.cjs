const { RULE_SHORT_NAMES_MAP } = require("../settings.cjs");
const entryPoint = require("./entry-point.cjs");
const elementTypes = require("./element-types.cjs");
const external = require("./external.cjs");
const noIgnored = require("./no-ignored.cjs");
const noPrivate = require("./no-private.cjs");
const noUnknown = require("./no-unknown.cjs");
const noUnknownFiles = require("./no-unknown-files.cjs");

const rules = {
  [RULE_SHORT_NAMES_MAP.ENTRY_POINT]: entryPoint,
  [RULE_SHORT_NAMES_MAP.ELEMENT_TYPES]: elementTypes,
  [RULE_SHORT_NAMES_MAP.EXTERNAL]: external,
  [RULE_SHORT_NAMES_MAP.NO_IGNORED]: noIgnored,
  [RULE_SHORT_NAMES_MAP.NO_PRIVATE]: noPrivate,
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN]: noUnknown,
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES]: noUnknownFiles
};

module.exports = {
  rules
};
