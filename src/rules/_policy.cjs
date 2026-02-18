function wildcardMatch(pattern, target) {
  if (pattern === "*") {
    return true;
  }

  if (!pattern.includes("*")) {
    return pattern === target;
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`).test(target);
}

function selectorMatchesValue(selector, targetValue, key = "type") {
  if (!selector) {
    return false;
  }

  if (typeof selector === "string") {
    return wildcardMatch(selector, targetValue);
  }

  if (Array.isArray(selector)) {
    return selector.some((entry) => selectorMatchesValue(entry, targetValue, key));
  }

  if (typeof selector === "object" && selector !== null) {
    if (typeof selector[key] === "string") {
      return wildcardMatch(selector[key], targetValue);
    }
  }

  return false;
}

function evaluateRules(fromValue, toValue, options, selectorKey = "type") {
  const defaultPolicy = options.default === "allow";
  const rules = Array.isArray(options.rules) ? options.rules : [];
  let matched = false;
  let allowed = defaultPolicy;
  let message;

  for (const rule of rules) {
    const fromSelector = rule && rule.from;
    if (fromSelector && !selectorMatchesValue(fromSelector, fromValue, selectorKey)) {
      continue;
    }

    const allowSelector = rule && rule.allow;
    const disallowSelector = rule && (rule.disallow || rule.deny);

    if (disallowSelector && selectorMatchesValue(disallowSelector, toValue, selectorKey)) {
      matched = true;
      allowed = false;
      message = typeof rule.message === "string" ? rule.message : undefined;
      continue;
    }

    if (allowSelector && selectorMatchesValue(allowSelector, toValue, selectorKey)) {
      matched = true;
      allowed = true;
      message = typeof rule.message === "string" ? rule.message : undefined;
    }
  }

  return {
    allowed: matched ? allowed : defaultPolicy,
    message
  };
}

module.exports = {
  wildcardMatch,
  selectorMatchesValue,
  evaluateRules
};
