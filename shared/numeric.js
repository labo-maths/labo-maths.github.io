// Small numeric helpers shared by the tools.

/** n evenly spaced numbers from a to b, both included. */
export function linspace(a, b, n) {
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}
