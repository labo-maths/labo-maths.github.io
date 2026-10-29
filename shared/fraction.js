// Exact rational arithmetic on small integers: { n, d } with d > 0 and gcd(n, d) = 1.
// Plain integers are accepted wherever a fraction is expected.

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function fr(n, d = 1) {
  if (d === 0) throw new RangeError("dénominateur nul");
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return Object.freeze({ n: (s * n) / g + 0, d: (s * d) / g }); // + 0 turns −0 into 0
}

const F = (x) => (typeof x === "number" ? fr(x) : x);

export const add = (a, b) => (a = F(a), b = F(b), fr(a.n * b.d + b.n * a.d, a.d * b.d));
export const sub = (a, b) => (a = F(a), b = F(b), fr(a.n * b.d - b.n * a.d, a.d * b.d));
export const mul = (a, b) => (a = F(a), b = F(b), fr(a.n * b.n, a.d * b.d));
export const div = (a, b) => (a = F(a), b = F(b), fr(a.n * b.d, a.d * b.n));

/** a^k for an integer k (negative k inverts). */
export function pow(a, k) {
  a = F(a);
  return k >= 0 ? fr(a.n ** k, a.d ** k) : fr(a.d ** -k, a.n ** -k);
}

export const value = (a) => (a = F(a), a.n / a.d);
export const isInt = (a) => F(a).d === 1;

/** TeX: "3", "-\frac{1}{8}". */
export function fracTex(a) {
  a = F(a);
  if (a.d === 1) return `${a.n}`;
  return `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`;
}

/** Plain text: "3", "-1/8". */
export function fracText(a) {
  a = F(a);
  return a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`;
}
