const RULE_SHORT_NAMES_MAP = {
  ENTRY_POINT: "entry-point",
  ELEMENT_TYPES: "element-types",
  EXTERNAL: "external",
  NO_IGNORED: "no-ignored",
  NO_PRIVATE: "no-private",
  NO_UNKNOWN: "no-unknown",
  NO_UNKNOWN_FILES: "no-unknown-files"
};

const SETTINGS = {
  ELEMENTS: "boundaries/elements",
  IGNORE: "boundaries/ignore",
  RULE_ENTRY_POINT: `boundaries/${RULE_SHORT_NAMES_MAP.ENTRY_POINT}`,
  RULE_ELEMENT_TYPES: `boundaries/${RULE_SHORT_NAMES_MAP.ELEMENT_TYPES}`,
  RULE_EXTERNAL: `boundaries/${RULE_SHORT_NAMES_MAP.EXTERNAL}`,
  RULE_NO_IGNORED: `boundaries/${RULE_SHORT_NAMES_MAP.NO_IGNORED}`,
  RULE_NO_PRIVATE: `boundaries/${RULE_SHORT_NAMES_MAP.NO_PRIVATE}`,
  RULE_NO_UNKNOWN: `boundaries/${RULE_SHORT_NAMES_MAP.NO_UNKNOWN}`,
  RULE_NO_UNKNOWN_FILES: `boundaries/${RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES}`
};

module.exports = {
  RULE_SHORT_NAMES_MAP,
  SETTINGS
};
