function createStubRule(name) {
  return {
    meta: {
      type: "problem",
      docs: {
        description: `Rust-backed implementation placeholder for boundaries/${name}`,
        recommended: true
      },
      schema: []
    },
    create() {
      return {};
    }
  };
}

module.exports = {
  createStubRule
};
