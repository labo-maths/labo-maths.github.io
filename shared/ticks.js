// x-axis ticks at simple multiples of π (π/16 … π), labelled as fractions.

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** Label for (num/den)·π, e.g. "0", "π", "−π", "3π/4", "−π/2". */
export function piLabel(num, den) {
  if (num === 0) return "0";
  const g = gcd(num, den);
  const n = num / g, d = den / g;
  const sign = n < 0 ? "−" : "";
  const absN = Math.abs(n);
  const top = absN === 1 ? "π" : `${absN}π`;
  return d === 1 ? sign + top : `${sign}${top}/${d}`;
}

/** Ticks covering [min, max] with at most ~maxTicks entries. */
export function piTicks(min, max, maxTicks = 9) {
  const span = max - min;
  let den = 1;
  for (const d of [16, 8, 4, 2, 1]) {
    den = d;
    if (span / (Math.PI / d) <= maxTicks) break;
  }
  // Wider views: whole multiples of π, spaced 1, 2, 5, 10… π apart.
  let mult = 1;
  if (den === 1) {
    for (const m of [1, 2, 5, 10, 20, 50]) {
      mult = m;
      if (span / (m * Math.PI) <= maxTicks) break;
    }
  }
  const step = (mult * Math.PI) / den;
  const first = Math.ceil(min / step);
  const last = Math.floor(max / step);
  const values = [], labels = [];
  for (let k = first; k <= last; k++) {
    values.push(k * step);
    labels.push(piLabel(k * mult, den));
  }
  return { values, labels };
}
