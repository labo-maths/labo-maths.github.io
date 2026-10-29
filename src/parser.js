// Turns user text like "3sin(2x - pi/4) + 1" into a function of x.
// math.js is passed in, so this module has no globals and can be tested in node.

const VARIABLES = new Set(["x", "pi", "e"]);
const FUNCTIONS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh",
  "sqrt", "cbrt", "abs", "exp", "log", "log10", "log2", "sign", "floor", "ceil", "round",
  "min", "max", "mod",
]);

/**
 * Returns { fn } on success or { error } with a message (in French) on failure.
 * `fn(x)` always returns a number, NaN where the expression is undefined.
 */
export function compileExpression(math, source) {
  const text = source
    .trim()
    .replace(/^y\s*=/i, "")
    .replace(/π/g, "pi")
    .replace(/[−–]/g, "-")
    .replace(/[·×]/g, "*");
  if (!text) return { error: "Expression vide" };

  let node;
  try {
    node = math.parse(text);
  } catch (e) {
    return { error: "Syntaxe invalide" };
  }

  let unknown = null;
  node.traverse((n, path, parent) => {
    if (unknown || !n.isSymbolNode) return;
    const isCall = parent?.isFunctionNode && path === "fn";
    if (isCall ? !FUNCTIONS.has(n.name) : !VARIABLES.has(n.name)) unknown = n.name;
  });
  if (unknown) return { error: `Inconnu : « ${unknown} » (variable autorisée : x)` };

  const code = node.compile();
  const fn = (x) => {
    try {
      const y = code.evaluate({ x });
      return typeof y === "number" ? y : NaN; // complex results, matrices…
    } catch {
      return NaN;
    }
  };
  return { fn };
}
