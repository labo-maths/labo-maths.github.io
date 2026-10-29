// Exercise generator for exponential and logarithmic equations. Pure: no DOM.
//
// Every exercise is
//   { type, prompt, statement, hints[], steps[{ tex, note }], solutions[], approx, residual }
// where `statement` and `steps[].tex` are TeX, `hints` and `notes` are text with
// $…$ math (see shared/tex.js), `solutions` are numbers (empty = no solution),
// and `residual(x)` returns [lhs, rhs] so tests can check every solution.

import { fr, mul, pow, value, fracTex } from "../shared/fraction.js";
import { numTex } from "../shared/tex.js";

// ---------- small helpers ----------

const int = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/** "x", "2x", "-x", "3x - 2", "x + 1". */
export function linTex(p, q = 0, v = "x") {
  const head = p === 0 ? "" : p === 1 ? v : p === -1 ? `-${v}` : `${p}${v}`;
  if (q === 0) return head || "0";
  if (!head) return `${q}`;
  return `${head} ${q > 0 ? "+" : "-"} ${Math.abs(q)}`;
}

/** Signed term for sums: (" + ", 3, "2^x") → " + 3 \cdot 2^x"; coefficient 1 is dropped. */
function termTex(coef, factor, first = false) {
  const sign = coef < 0 ? (first ? "-" : " - ") : first ? "" : " + ";
  const c = Math.abs(coef);
  return sign + (factor ? (c === 1 ? factor : `${c} \\cdot ${factor}`) : `${c}`);
}

/** a^{e}, with the exponent left out when it is 1. */
const powTex = (a, e) => (e === "1" ? `${a}` : `${a}^{${e}}`);

/** 1/1000 → "0{,}001" for base 10, otherwise a fraction. */
function valueTex(v, base) {
  if (base === 10 && v.d !== 1 && v.n === 1) return numTex(value(v), 10);
  return fracTex(v);
}

const setTex = (items) => (items.length ? `S = \\{${items.join(" \\, ; \\, ")}\\}` : "S = \\emptyset");
const step = (tex, note = "") => ({ tex, note });

/** "2 \times 2 \times 2" for small positive powers, to show where 8 comes from. */
const productTex = (a, k) => Array(k).fill(a).join(" \\times ");

const SAME_BASE = "Deux puissances de même base sont égales si et seulement si leurs exposants sont égaux : $a^x = a^y \\Leftrightarrow x = y$.";

/** Why rhs = a^k, as a step note. */
function powerReason(a, k, rhsTex) {
  if (k === 0) return `car $a^0 = 1$ pour toute base $a$.`;
  if (k === 1) return `car $a^1 = a$.`;
  if (k > 1 && k <= 5) return `car $${productTex(a, k)} = ${rhsTex}$.`;
  if (k > 1) return `car $${a}^{${k}} = ${rhsTex}$.`;
  return `car $${rhsTex} = \\frac{1}{${powTex(a, String(-k))}} = ${a}^{${k}}$ (rappel : $a^{-n} = \\frac{1}{a^n}$).`;
}

// ---------- même base ----------

function genDirect(rng) {
  const a = pick(rng, [2, 3, 5, 10]);
  const [lo, hi] = { 2: [-4, 6], 3: [-3, 4], 5: [-2, 3], 10: [-5, 5] }[a];
  const k = int(rng, lo, hi);
  const rhs = pow(fr(a), k);
  const rhsTex = valueTex(rhs, a);
  const nudge =
    k < 0 ? "Un nombre entre 0 et 1 s'écrit avec un exposant négatif : $a^{-n} = \\frac{1}{a^n}$."
    : k === 0 ? "Que vaut n'importe quel nombre non nul élevé à la puissance 0 ?"
    : `Multiplie $${a}$ par lui-même jusqu'à obtenir $${rhsTex}$ : combien de facteurs faut-il ?`;
  return {
    type: "direct",
    statement: `${a}^x = ${rhsTex}`,
    hints: [`Essaie d'écrire $${rhsTex}$ comme une puissance de $${a}$.`, nudge, SAME_BASE],
    steps: [
      step(`${a}^x = ${rhsTex}`, "On cherche à écrire les deux membres comme des puissances de même base."),
      step(`${a}^x = ${a}^{${k}}`, powerReason(a, k, rhsTex)),
      step(`x = ${k}`, SAME_BASE),
      step(setTex([k])),
    ],
    solutions: [k],
    residual: (x) => [a ** x, value(rhs)],
  };
}

function genRoot(rng) {
  const a = pick(rng, [2, 3, 5]);
  const q = pick(rng, [2, 3, 4]);
  const m = int(rng, 1, a === 5 ? 2 : 3);
  if (m % q === 0) return genRoot(rng);
  const inside = a ** m;
  const root = q === 2 ? `\\sqrt{${inside}}` : `\\sqrt[${q}]{${inside}}`;
  const x = fr(m, q);
  const steps = [step(`${a}^x = ${root}`, "Une racine est une puissance à exposant fractionnaire.")];
  if (m > 1) {
    steps.push(step(`${a}^x = ${q === 2 ? `\\sqrt{${a}^{${m}}}` : `\\sqrt[${q}]{${a}^{${m}}}`}`, powerReason(a, m, `${inside}`)));
  }
  steps.push(
    step(`${a}^x = ${m > 1 ? `(${a}^{${m}})` : a}^{\\frac{1}{${q}}}`, `car $\\sqrt[n]{b} = b^{1/n}$${q === 2 ? " (et $\\sqrt{b} = b^{1/2}$)" : ""}.`),
    step(`${a}^x = ${a}^{${fracTex(x)}}`, m > 1 ? "car $(a^n)^p = a^{n \\times p}$." : ""),
    step(`x = ${fracTex(x)}`, SAME_BASE),
    step(setTex([fracTex(x)])),
  );
  return {
    type: "root",
    statement: `${a}^x = ${root}`,
    hints: [
      "Une racine peut s'écrire comme une puissance : $\\sqrt[n]{b} = b^{1/n}$.",
      m > 1 ? `Écris d'abord $${inside}$ comme une puissance de $${a}$.` : `Le nombre sous la racine est déjà $${a}$ lui-même.`,
      "Puis utilise $(a^n)^p = a^{n \\times p}$ et égale les exposants.",
    ],
    steps,
    solutions: [value(x)],
    residual: (v) => [a ** v, inside ** (1 / q)],
  };
}

function genAffine(rng) {
  const a = pick(rng, [2, 3, 5]);
  const p = int(rng, 1, 3);
  const q = int(rng, -3, 3);
  if (p === 1 && q === 0) return genAffine(rng);
  const [lo, hi] = { 2: [-3, 6], 3: [-2, 4], 5: [-1, 3] }[a];
  const k = int(rng, lo, hi);
  const rhs = pow(fr(a), k);
  const rhsTex = fracTex(rhs);
  const lin = linTex(p, q);
  const x = fr(k - q, p);
  const steps = [
    step(`${a}^{${lin}} = ${rhsTex}`, "Le membre de droite est une puissance de la même base."),
    step(`${a}^{${lin}} = ${a}^{${k}}`, powerReason(a, k, rhsTex)),
    step(`${lin} = ${k}`, SAME_BASE),
  ];
  if (q !== 0) steps.push(step(`${linTex(p)} = ${k - q}`, `On isole $x$ : ${q > 0 ? "on soustrait" : "on ajoute"} $${Math.abs(q)}$ des deux côtés.`));
  if (p !== 1) steps.push(step(`x = ${fracTex(x)}`, `On divise par $${p}$.`));
  steps.push(step(setTex([fracTex(x)])));
  return {
    type: "affine",
    statement: `${a}^{${lin}} = ${rhsTex}`,
    hints: [
      `Écris $${rhsTex}$ comme une puissance de $${a}$.`,
      "Égale les exposants : il reste une équation du premier degré.",
      "Isole $x$ comme dans n'importe quelle équation du premier degré.",
    ],
    steps,
    solutions: [value(x)],
    residual: (v) => [a ** (p * v + q), value(rhs)],
  };
}

// ---------- changer de base ----------

const POWER_BASES = { 2: [2, 3, 4], 3: [2, 3], 5: [2, 3] };

function genTransform(rng) {
  const c = pick(rng, [2, 3, 5]);
  const i = pick(rng, POWER_BASES[c]);
  const b = c ** i;
  const k = pick(rng, [1, 1, 2]);
  const [lo, hi] = { 2: [-3, 6], 3: [-2, 4], 5: [-2, 3] }[c];
  const j = int(rng, lo, hi);
  if (j === 0) return genTransform(rng);
  const rhs = pow(fr(c), j);
  const rhsTex = fracTex(rhs);
  const kx = linTex(k);
  const x = fr(j, i * k);
  return {
    type: "transform",
    statement: `${b}^{${kx}} = ${rhsTex}`,
    hints: [
      `$${b}$ et $${rhsTex}$ sont-ils des puissances d'un même nombre ?`,
      `Essaie la base $${c}$ : $${b} = ${c}^{${i}}$.`,
      "Utilise $(a^n)^p = a^{n \\times p}$, puis égale les exposants.",
    ],
    steps: [
      step(`${b}^{${kx}} = ${rhsTex}`, `Les bases sont différentes, mais toutes deux sont des puissances de $${c}$.`),
      step(`(${c}^{${i}})^{${kx}} = ${c}^{${j}}`, `car $${b} = ${c}^{${i}}$ et $${rhsTex} = ${c}^{${j}}$.`),
      step(`${c}^{${linTex(i * k)}} = ${c}^{${j}}`, "car $(a^n)^p = a^{n \\times p}$."),
      step(`${linTex(i * k)} = ${j}`, SAME_BASE),
      step(`x = ${fracTex(x)}`, `On divise par $${i * k}$.`),
      step(setTex([fracTex(x)])),
    ],
    solutions: [value(x)],
    residual: (v) => [b ** (k * v), value(rhs)],
  };
}

function genTwoBases(rng) {
  const c = pick(rng, [2, 3]);
  const [i, j] = pick(rng, c === 2 ? [[1, 2], [1, 3], [2, 3], [3, 2], [2, 1]] : [[1, 2], [2, 1], [1, 3]]);
  const p1 = int(rng, 1, 2), q1 = int(rng, -3, 3);
  const p2 = int(rng, 1, 2), q2 = int(rng, -3, 3);
  const coef = i * p1 - j * p2;
  if (coef === 0) return genTwoBases(rng);
  const x = fr(j * q2 - i * q1, coef);
  const b1 = c ** i, b2 = c ** j;
  const lin1 = linTex(p1, q1), lin2 = linTex(p2, q2);
  const wrap = (e, lin) => (e === 1 ? `${c}^{${lin}}` : `(${c}^{${e}})^{${lin}}`);
  return {
    type: "twoBases",
    statement: `${b1}^{${lin1}} = ${b2}^{${lin2}}`,
    hints: [
      `Écris $${b1}$ et $${b2}$ comme des puissances d'un même nombre.`,
      `Les deux sont des puissances de $${c}$.`,
      "Distribue l'exposant ($(a^n)^p = a^{np}$), égale les exposants et résous l'équation du premier degré.",
    ],
    steps: [
      step(`${b1}^{${lin1}} = ${b2}^{${lin2}}`, `Les deux bases sont des puissances de $${c}$.`),
      step(`${wrap(i, lin1)} = ${wrap(j, lin2)}`, `car ${[[b1, i], [b2, j]].filter(([, e]) => e > 1).map(([b, e]) => `$${b} = ${c}^{${e}}$`).join(" et ")}.`),
      step(`${c}^{${linTex(i * p1, i * q1)}} = ${c}^{${linTex(j * p2, j * q2)}}`, "car $(a^n)^p = a^{n \\times p}$ : on distribue l'exposant."),
      step(`${linTex(i * p1, i * q1)} = ${linTex(j * p2, j * q2)}`, SAME_BASE),
      step(`${linTex(coef)} = ${j * q2 - i * q1}`, "On regroupe les termes en $x$ d'un côté, les nombres de l'autre."),
      step(`x = ${fracTex(x)}`, coef === 1 ? "" : `On divise par $${coef}$.`),
      step(setTex([fracTex(x)])),
    ],
    solutions: [value(x)],
    residual: (v) => [b1 ** (p1 * v + q1), b2 ** (p2 * v + q2)],
  };
}

function genFractionBase(rng) {
  const [p, q] = pick(rng, [[2, 3], [3, 2], [1, 2], [2, 5], [3, 4], [4, 3], [1, 3], [5, 2]]);
  const k = pick(rng, [-3, -2, -1, 2, 3]);
  const base = fr(p, q);
  const baseTex = `\\left(\\frac{${p}}{${q}}\\right)`;
  const rhs = pow(base, k);
  const rhsTex = fracTex(rhs);
  const reason = k < 0
    ? `car $${rhsTex} = \\left(\\frac{${q}}{${p}}\\right)^{${-k}}$ et $\\left(\\frac{a}{b}\\right)^{-n} = \\left(\\frac{b}{a}\\right)^{n}$.`
    : `car $\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}$ : $\\frac{${p}^{${k}}}{${q}^{${k}}} = ${rhsTex}$.`;
  return {
    type: "fractionBase",
    statement: `${baseTex}^x = ${rhsTex}`,
    hints: [
      `Compare $${rhsTex}$ à la base $\\frac{${p}}{${q}}$ : est-ce une puissance de $\\frac{${p}}{${q}}$, ou de son inverse $\\frac{${q}}{${p}}$ ?`,
      "Rappel : $\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}$ et $\\left(\\frac{a}{b}\\right)^{-1} = \\frac{b}{a}$.",
      SAME_BASE,
    ],
    steps: [
      step(`${baseTex}^x = ${rhsTex}`, "On cherche à écrire le membre de droite avec la même base."),
      step(`${baseTex}^x = ${baseTex}^{${k}}`, reason),
      step(`x = ${k}`, SAME_BASE),
      step(setTex([k])),
    ],
    solutions: [k],
    residual: (v) => [value(base) ** v, value(rhs)],
  };
}

function genFactor(rng) {
  const a = pick(rng, [2, 3]);
  let u = int(rng, 0, 3), v = int(rng, 0, 3);
  if (u === v) return genFactor(rng);
  const minus = rng() < 0.35;
  if (minus && u < v) [u, v] = [v, u]; // a^(x+u) − a^(x+v) with u > v keeps the factor positive
  const C = minus ? a ** u - a ** v : a ** u + a ** v;
  const x0 = int(rng, -2, 2);
  const ax0 = pow(fr(a), x0);
  const R = mul(ax0, C);
  const moved = !minus && rng() < 0.4; // PDF style: a^(x+u) = R − a^(x+v)
  const e = (s) => (s === 0 ? "x" : `x + ${s}`);
  const t1 = `${a}^{${e(u)}}`, t2 = `${a}^{${e(v)}}`;
  const op = minus ? "-" : "+";
  const lhs = `${t1} ${op} ${t2}`;
  const statement = moved ? `${t1} = ${fracTex(R)} - ${t2}` : `${lhs} = ${fracTex(R)}`;
  const split = (s) => (s === 0 ? `${a}^x` : `${a}^x \\cdot ${a}^{${s}}`);
  const pw = (s) => (s === 0 ? "1" : `${a}^{${s}}`);
  const steps = [step(statement, "Tous les termes contiennent la même exponentielle $a^x$.")];
  if (moved) steps.push(step(`${lhs} = ${fracTex(R)}`, "On regroupe les termes en $x$ dans le membre de gauche."));
  steps.push(
    step(`${split(u)} ${op} ${split(v)} = ${fracTex(R)}`, "car $a^{x+n} = a^x \\cdot a^n$."),
    step(`${a}^x\\,(${pw(u)} ${op} ${pw(v)}) = ${fracTex(R)}`, `On met $${a}^x$ en évidence.`),
    step(`${a}^x \\cdot ${C} = ${fracTex(R)}`, `car $${pw(u)} ${op} ${pw(v)} = ${C}$.`),
    step(`${a}^x = ${fracTex(ax0)}`, `On divise les deux membres par $${C}$.`),
    step(`${a}^x = ${a}^{${x0}}`, powerReason(a, x0, fracTex(ax0))),
    step(`x = ${x0}`, SAME_BASE),
    step(setTex([x0])),
  );
  return {
    type: "factor",
    statement,
    hints: [
      `Utilise $a^{x+n} = a^x \\cdot a^n$ pour faire apparaître $${a}^x$ dans chaque terme.`,
      `Mets $${a}^x$ en évidence.`,
      "Il reste une équation du type $a^x = \\text{nombre}$.",
    ],
    steps,
    solutions: [x0],
    residual: (x) => [a ** (x + u) + (minus ? -1 : 1) * a ** (x + v), value(R)],
  };
}

// ---------- second degré (Y = a^x) ----------

function genQuadratic(rng) {
  const a = pick(rng, [2, 3, 5]);
  const powers = { 2: [0, 1, 2, 3, 4], 3: [0, 1, 2, 3], 5: [0, 1, 2] }[a];
  const r = rng();
  let k1 = pick(rng, powers), k2 = null, Y2;
  if (r < 0.1) Y2 = a ** k1; // double root
  else if (r < 0.4) Y2 = -pick(rng, [1, 2, 3, 4, 6]); // one root gives no solution
  else {
    k2 = pick(rng, powers);
    if (k2 === k1) return genQuadratic(rng);
    Y2 = a ** k2;
  }
  if (r < 0.1) k2 = k1;
  const Y1 = a ** k1;
  const B = -(Y1 + Y2), Cst = Y1 * Y2;
  const D = B * B - 4 * Cst;
  const asSquare = rng() < 0.5; // 4^x instead of 2^{2x}
  const sq = asSquare ? `${a * a}^x` : `${a}^{2x}`;
  const moveConst = rng() < 0.35;
  const left = sq + (B ? termTex(B, `${a}^x`) : "");
  const statement = moveConst ? `${left} = ${-Cst}` : `${left}${termTex(Cst, "")} = 0`;
  const zeroForm = `${left}${termTex(Cst, "")} = 0`;

  const steps = [step(statement, "Les exposants sont $2x$ et $x$ : l'équation cache une équation du second degré.")];
  if (moveConst) steps.push(step(zeroForm, "On ramène tout dans le membre de gauche."));
  steps.push(
    step(`(${a}^x)^2${B ? termTex(B, `${a}^x`) : ""}${termTex(Cst, "")} = 0`,
      asSquare ? `car $${a * a}^x = (${a}^2)^x = (${a}^x)^2$.` : `car $${a}^{2x} = (${a}^x)^2$.`),
    step(`Y^2${B ? termTex(B, "Y") : ""}${termTex(Cst, "")} = 0`, `On pose $Y = ${a}^x$ (avec $Y > 0$, car une exponentielle est toujours positive).`),
    step(`\\Delta = (${B})^2 - 4 \\cdot 1 \\cdot (${Cst}) = ${D}`, "On calcule le discriminant."),
  );
  const roots = D === 0 ? [Y1] : [Y1, Y2].sort((p, q) => q - p);
  steps.push(D === 0
    ? step(`Y = \\frac{${-B}}{2} = ${Y1}`, "$\\Delta = 0$ : une seule racine.")
    : step(`Y = \\frac{${-B} \\pm ${Math.sqrt(D)}}{2} \\;\\Rightarrow\\; Y_1 = ${roots[0]}, \\; Y_2 = ${roots[1]}`, "$\\Delta > 0$ : deux racines."));

  const solutions = [];
  for (const Y of roots) {
    if (Y < 0) {
      steps.push(step(`${a}^x = ${Y}`, "Impossible : une exponentielle est toujours strictement positive. Pas de solution ici."));
    } else {
      const k = Math.round(Math.log(Y) / Math.log(a));
      steps.push(step(`${a}^x = ${Y} = ${a}^{${k}} \\;\\Rightarrow\\; x = ${k}`, `On revient à $Y = ${a}^x$ : $${Y} = ${a}^{${k}}$.`));
      solutions.push(k);
    }
  }
  solutions.sort((p, q) => p - q);
  steps.push(step(setTex(solutions)));
  return {
    type: "quadratic",
    statement,
    hints: [
      `Remarque que ${asSquare ? `$${a * a}^x = (${a}^x)^2$` : `$${a}^{2x} = (${a}^x)^2$`} : c'est une équation du second degré déguisée.`,
      `Pose $Y = ${a}^x$ et résous l'équation en $Y$ avec $\\Delta$.`,
      "Attention : $a^x > 0$, donc une valeur négative de $Y$ ne donne aucune solution.",
    ],
    steps,
    solutions,
    residual: (x) => [a ** (2 * x) + B * a ** x + Cst, 0],
  };
}

// ---------- logarithmes ----------

const logTex = (a) => (a === 10 ? "\\log" : a === "e" ? "\\ln" : `\\log_{${a}}`);
/** log² x is written \log^2 x (base 10) or \log_2^2 x. */
const logPowTex = (a, n) => (n === 1 ? logTex(a) : a === 10 ? `\\log^{${n}}` : `\\log_{${a}}^{${n}}`);

/** x^2 + Bx + C, terms with a zero coefficient left out. */
const quadTex = (B, C, v = "x") => `${v}^2${B ? termTex(B, v) : ""}${C ? termTex(C, "") : ""}`;

/** Δ and the two roots of v² + Bv + C = 0, for integer roots r1 > r2. */
function deltaSteps(B, C, r1, r2, v = "x") {
  const D = B * B - 4 * C;
  return [
    step(`\\Delta = (${B})^2 - 4 \\cdot 1 \\cdot (${C}) = ${D}`, "On calcule le discriminant."),
    step(`${v} = \\frac{${-B} \\pm ${Math.sqrt(D)}}{2} \\;\\Rightarrow\\; ${v}_1 = ${r1}, \\; ${v}_2 = ${r2}`, "$\\Delta > 0$ : deux racines."),
  ];
}

const CE_NOTE = "Un logarithme n'existe que pour un nombre strictement positif : on commence toujours par les conditions d'existence (C.E.).";

function genLogEval(rng) {
  const a = pick(rng, [2, 3, 5, 10]);
  const [lo, hi] = { 2: [-3, 6], 3: [-2, 4], 5: [-2, 3], 10: [-3, 4] }[a];
  const k = int(rng, lo, hi);
  const N = pow(fr(a), k);
  const NTex = valueTex(N, a);
  const arg = NTex.includes("frac") ? `\\left(${NTex}\\right)` : NTex;
  return {
    type: "logEval",
    prompt: "Calcule",
    statement: `${logTex(a)} ${arg}`,
    hints: [
      `Par définition, $${logTex(a)} N$ est l'exposant qu'il faut donner à $${a}$ pour obtenir $N$.`,
      `Cherche $y$ tel que $${a}^y = ${NTex}$.`,
      k < 0 ? "Un nombre entre 0 et 1 correspond à un exposant négatif." : `Écris $${NTex}$ comme une puissance de $${a}$.`,
    ],
    steps: [
      step(`${logTex(a)} ${arg} = y \\;\\Leftrightarrow\\; ${a}^y = ${NTex}`, `Définition : $\\log_a N = y \\Leftrightarrow a^y = N$${a === 10 ? " (et $\\log$ sans indice signifie $\\log_{10}$)" : ""}.`),
      step(`${a}^y = ${a}^{${k}}`, powerReason(a, k, NTex)),
      step(`y = ${k}`, SAME_BASE),
      step(`${logTex(a)} ${arg} = ${k}`),
    ],
    solutions: [k],
    residual: (y) => [a ** y, value(N)],
  };
}

function genLogSolve(rng) {
  const a = pick(rng, [2, 3, 5]);
  const c = int(rng, 2, 40);
  // A power of a would be a "même base" exercise, not a logarithm one.
  for (let p = a; p <= c; p *= a) if (p === c) return genLogSolve(rng);
  const sol = Math.log(c) / Math.log(a);
  return {
    type: "logSolve",
    statement: `${a}^x = ${c}`,
    hints: [
      `$${c}$ n'est pas une puissance entière de $${a}$ : la méthode « même base » ne suffit plus.`,
      "Applique le logarithme ($\\ln$ ou $\\log$) aux deux membres.",
      "Rappel : $\\ln(a^x) = x \\ln a$. Donne la réponse arrondie au centième.",
    ],
    steps: [
      step(`${a}^x = ${c}`, `$${c}$ n'est pas une puissance de $${a}$ : on utilise le logarithme.`),
      step(`\\ln(${a}^x) = \\ln ${c}`, "On applique $\\ln$ aux deux membres (ils sont strictement positifs)."),
      step(`x \\ln ${a} = \\ln ${c}`, "car $\\ln(a^x) = x \\ln a$."),
      step(`x = \\frac{\\ln ${c}}{\\ln ${a}}`, `On divise par $\\ln ${a}$ (non nul car $${a} \\neq 1$).`),
      step(`x \\approx ${numTex(sol, 2)}`, "À la calculatrice."),
      step(`S = \\left\\{\\frac{\\ln ${c}}{\\ln ${a}}\\right\\}`),
    ],
    solutions: [sol],
    approx: true,
    residual: (x) => [a ** x, c],
  };
}

function genLogEq(rng) {
  const a = pick(rng, [2, 3, 10]);
  const k = int(rng, 0, a === 10 ? 2 : 3);
  const p = int(rng, 1, 3);
  const q = int(rng, -5, 5);
  const lin = linTex(p, q);
  const ak = a ** k;
  const x = fr(ak - q, p);
  const bound = fr(-q, p);
  const steps = [
    step(`${logTex(a)}(${lin}) = ${k}`, "Un logarithme n'existe que pour un nombre strictement positif."),
    step(`\\text{C.E. : } ${lin} > 0 \\;\\Leftrightarrow\\; x > ${fracTex(bound)}`, "Condition d'existence."),
    step(`${lin} = ${a}^{${k}} = ${ak}`, `Définition : $\\log_a A = k \\Leftrightarrow A = a^k$.`),
  ];
  if (q !== 0) steps.push(step(`${linTex(p)} = ${ak - q}`, `On ${q > 0 ? "soustrait" : "ajoute"} $${Math.abs(q)}$ des deux côtés.`));
  if (p !== 1) steps.push(step(`x = ${fracTex(x)}`, `On divise par $${p}$.`));
  steps.push(
    step(`${fracTex(x)} > ${fracTex(bound)} \\;\\checkmark`, "La solution respecte la condition d'existence."),
    step(setTex([fracTex(x)])),
  );
  return {
    type: "logEq",
    statement: `${logTex(a)}(${lin}) = ${k}`,
    hints: [
      `Commence par la condition d'existence : $${lin} > 0$.`,
      `Par définition, $\\log_a A = k \\Leftrightarrow A = a^k$ : ici $${lin} = ${a}^{${k}}$.`,
      "Résous l'équation du premier degré, puis vérifie la condition d'existence.",
    ],
    steps,
    solutions: [value(x)],
    residual: (v) => [Math.log(p * v + q) / Math.log(a), k],
  };
}

/** C.E., then the rules of logarithms, then a second-degree equation with one root outside the domain. */
function genLogEqRules(rng) {
  return rng() < 0.5 ? logSumEq(rng) : logDoubleEq(rng);
}

// log_a(x + p) + log_a(x + q) = k. Built from a^k = u·v (u < v) and the solution x0;
// the other root x1 = -(p + q) - x0 gives x1 + p = -v < 0, so the C.E. always rejects it.
function logSumEq(rng) {
  const a = pick(rng, [2, 3, 10]);
  const k = int(rng, ...{ 2: [3, 5], 3: [2, 3], 10: [1, 2] }[a]);
  const N = a ** k;
  const pairs = [];
  for (let u = 1; u * u < N; u++) if (N % u === 0) pairs.push([u, N / u]);
  const [u, v] = pick(rng, pairs);
  const x0 = int(rng, -3, 5);
  const p = u - x0, q = v - x0;
  const x1 = -(p + q) - x0;
  const L = logTex(a);
  const A = linTex(1, p), B = linTex(1, q);
  const statement = `${L}(${A}) + ${L}(${B}) = ${k}`;
  const C0 = p * q;
  const steps = [
    step(statement, CE_NOTE),
    step(`\\text{C.E. : } ${A} > 0 \\text{ et } ${B} > 0 \\;\\Leftrightarrow\\; x > ${-p}`,
      `Les deux arguments doivent être positifs : on garde la condition la plus forte. Domaine : $]${-p} \\,;\\, +\\infty[$.`),
    step(`${L}\\big[(${A})(${B})\\big] = ${k}`, "car $\\log_a x + \\log_a y = \\log_a (x \\cdot y)$."),
    step(`${L}\\big[(${A})(${B})\\big] = ${L} ${a}^{${k}}`, `On écrit le nombre comme un logarithme de même base : $${k} = ${L} ${a}^{${k}}$.`),
    step(`(${A})(${B}) = ${N}`, "$\\log_a A = \\log_a B \\Leftrightarrow A = B$ : on enlève les logarithmes."),
    step(`${quadTex(p + q, C0)} = ${N}`, "On développe."),
    step(`${quadTex(p + q, C0 - N)} = 0`, "On ramène tout dans le membre de gauche."),
    ...deltaSteps(p + q, C0 - N, x0, x1),
    step(`x_1 = ${x0} > ${-p} \\;\\checkmark \\qquad x_2 = ${x1} \\leq ${-p} \\;\\text{: rejetée}`,
      `On vérifie les C.E. : avec $x = ${x1}$, $${A}$ vaudrait $${x1 + p}$, et le logarithme d'un nombre négatif n'existe pas.`),
    step(setTex([x0])),
  ];
  return {
    type: "logEqRules",
    statement,
    hints: [
      `Commence par les conditions d'existence : $${A} > 0$ et $${B} > 0$.`,
      `Regroupe les deux logarithmes avec $\\log_a x + \\log_a y = \\log_a (x \\cdot y)$, puis écris $${k} = ${L} ${a}^{${k}}$.`,
      "Développe, résous l'équation du second degré, puis rejette la solution qui ne respecte pas les C.E.",
    ],
    steps,
    solutions: [x0],
    residual: (x) => [(Math.log(x + p) + Math.log(x + q)) / Math.log(a), k],
  };
}

// 2 log x = log(bx + c): x² = bx + c with roots x0 > 0 and x1 < 0; x1 breaks the C.E. x > 0.
function logDoubleEq(rng) {
  const a = pick(rng, [2, 3, 10, "e"]);
  const x0 = int(rng, 1, 6), x1 = -int(rng, 1, 5);
  const b = x0 + x1, c = -x0 * x1;
  if (b === 0) return logDoubleEq(rng);
  const L = logTex(a);
  const lin = linTex(b, c);
  const statement = `2 ${L} x = ${L}(${lin})`;
  const ce = b > 0
    ? step(`\\text{C.E. : } x > 0 \\text{ et } ${lin} > 0 \\;\\Leftrightarrow\\; x > 0`,
      `$${lin} > 0 \\Leftrightarrow x > ${fracTex(fr(-c, b))}$ : la condition $x > 0$ est la plus forte.`)
    : step(`\\text{C.E. : } x > 0 \\text{ et } ${lin} > 0 \\;\\Leftrightarrow\\; 0 < x < ${fracTex(fr(c, -b))}`,
      `$${lin} > 0 \\Leftrightarrow x < ${fracTex(fr(c, -b))}$ : les deux conditions ensemble.`);
  const steps = [
    step(statement, CE_NOTE),
    ce,
    step(`${L}(x^2) = ${L}(${lin})`, "car $r \\log_a x = \\log_a x^r$."),
    step(`x^2 = ${lin}`, "$\\log_a A = \\log_a B \\Leftrightarrow A = B$ : on enlève les logarithmes."),
    step(`${quadTex(-b, -c)} = 0`, "On ramène tout dans le membre de gauche."),
    ...deltaSteps(-b, -c, x0, x1),
    step(`x_1 = ${x0} \\;\\checkmark \\qquad x_2 = ${x1} \\;\\text{: rejetée}`,
      `On vérifie les C.E. : $${x1} < 0$ et $${L} x$ n'existe pas pour $x \\leq 0$.`),
    step(setTex([x0])),
  ];
  return {
    type: "logEqRules",
    statement,
    hints: [
      `Commence par les conditions d'existence : $x > 0$ et $${lin} > 0$.`,
      `Utilise $r \\log_a x = \\log_a x^r$ pour écrire $2 ${L} x = ${L}(x^2)$.`,
      "Deux logarithmes de même base sont égaux si leurs arguments le sont. Résous, puis rejette la solution hors des C.E.",
    ],
    steps,
    solutions: [x0],
    residual: (x) => [2 * Math.log(x), Math.log(b * x + c)],
  };
}

/** log² x + B log x + C = 0 (Y = log x), or log⁴ x + B log² x + C = 0 (Y = log² x). */
function genLogQuadratic(rng) {
  const a = pick(rng, [2, 3, 10]);
  const square = rng() < 0.3;
  let Y1, Y2;
  if (square) {
    [Y1, Y2] = [pick(rng, [1, 4, 9]), pick(rng, [1, 4, 9])];
  } else {
    const [lo, hi] = { 2: [-3, 4], 3: [-2, 3], 10: [-2, 3] }[a];
    [Y1, Y2] = [int(rng, lo, hi), int(rng, lo, hi)];
  }
  if (Y1 === Y2) return genLogQuadratic(rng);
  if (Y1 < Y2) [Y1, Y2] = [Y2, Y1];
  const B = -(Y1 + Y2), C = Y1 * Y2;
  const [hi, lo] = square ? [4, 2] : [2, 1];
  const statement = `${logPowTex(a, hi)} x${B ? termTex(B, `${logPowTex(a, lo)} x`).replace(" \\cdot", "") : ""}${C ? termTex(C, "") : ""} = 0`;
  const Lx = `${logTex(a)} x`;
  const Ytex = `${logPowTex(a, lo)} x`;
  const xTex = (k) => valueTex(pow(fr(a), k), a);
  const steps = [
    step(statement, `${CE_NOTE} Notation : $${logPowTex(a, 2)} x = (${Lx})^2$, à ne pas confondre avec $${logTex(a)} x^2$.`),
    step(`\\text{C.E. : } x > 0`, "Domaine : $]0 \\,;\\, +\\infty[$."),
    step(`${quadTex(B, C, "Y")} = 0`, `On pose $Y = ${Ytex}$ : l'équation devient du second degré.`),
    ...deltaSteps(B, C, Y1, Y2, "Y"),
  ];
  const ks = [];
  for (const Y of [Y1, Y2]) {
    if (square) {
      const m = Math.sqrt(Y);
      steps.push(step(`${Ytex} = ${Y} \\;\\Leftrightarrow\\; ${Lx} = ${m} \\text{ ou } ${Lx} = -${m} \\;\\Leftrightarrow\\; x = ${xTex(m)} \\text{ ou } x = ${xTex(-m)}`,
        `On revient à $Y = ${Ytex}$, puis $${logTex(a)} x = y \\Leftrightarrow x = ${a}^y$.`));
      ks.push(m, -m);
    } else {
      steps.push(step(`${Lx} = ${Y} \\;\\Leftrightarrow\\; x = ${a}^{${Y}} = ${xTex(Y)}`,
        `On revient à $Y = ${Lx}$ : $\\log_a x = y \\Leftrightarrow x = a^y$.`));
      ks.push(Y);
    }
  }
  ks.sort((p, q) => p - q);
  steps.push(
    step(`x > 0 \\;\\checkmark`, "Une puissance de la base est toujours strictement positive : toutes les solutions respectent les C.E."),
    step(setTex(ks.map(xTex))),
  );
  return {
    type: "logQuadratic",
    statement,
    hints: [
      `Condition d'existence : $x > 0$. Puis remarque que $${logPowTex(a, hi)} x = (${Ytex})^2$.`,
      `Pose $Y = ${Ytex}$ et résous l'équation en $Y$ avec $\\Delta$.`,
      `Reviens à $x$ : $${Lx} = y \\Leftrightarrow x = ${a}^y$.${square ? " Attention, $Y$ est un carré : deux valeurs de $\\log x$ pour chaque $Y$." : ""}`,
    ],
    steps,
    solutions: ks.map((k) => value(pow(fr(a), k))),
    residual: (x) => {
      const l = Math.log(x) / Math.log(a);
      return [l ** hi + B * l ** lo + C, 0];
    },
  };
}

// ---------- catalogue ----------

export const TYPES = {
  direct: { label: "Même base", level: 1, gen: genDirect },
  root: { label: "Racines", level: 1, gen: genRoot },
  affine: { label: "Exposant ax + b", level: 1, gen: genAffine },
  transform: { label: "Changer de base", level: 2, gen: genTransform },
  fractionBase: { label: "Base fractionnaire", level: 2, gen: genFractionBase },
  twoBases: { label: "Deux bases", level: 2, gen: genTwoBases },
  factor: { label: "Mise en évidence", level: 2, gen: genFactor },
  quadratic: { label: "Second degré (Y = aˣ)", level: 3, gen: genQuadratic },
  logEval: { label: "Calculer un logarithme", level: 4, gen: genLogEval },
  logSolve: { label: "aˣ = c avec ln", level: 4, gen: genLogSolve },
  logEq: { label: "Équation logarithmique", level: 4, gen: genLogEq },
  logEqRules: { label: "Équation log : C.E. et règles", level: 4, gen: genLogEqRules },
  logQuadratic: { label: "Équation log : Y = log x", level: 4, gen: genLogQuadratic },
};

export const LEVELS = [
  { id: 1, label: "Facile" },
  { id: 2, label: "Moyen" },
  { id: 3, label: "Difficile" },
  { id: 4, label: "Logarithmes" },
];

/** `choice` is a type id, "level:<n>" or "all". */
export function generate(choice = "all", rng = Math.random) {
  let ids = Object.keys(TYPES);
  if (choice.startsWith("level:")) ids = ids.filter((id) => TYPES[id].level === Number(choice.slice(6)));
  else if (choice !== "all") ids = [choice];
  const type = pick(rng, ids);
  return { prompt: "Résous l'équation", approx: false, ...TYPES[type].gen(rng) };
}

// ---------- answers ----------

const EMPTY = /^(∅|aucune?|impossible|pasdesolution|vide|s=∅|s=\{\})$/;

/** "x = 3/2", "1 ; 3", "{-1 ; 2}", "1,5", "∅" → numbers, or null when unreadable. */
export function parseAnswer(text) {
  const t = text.toLowerCase().replace(/\s+/g, "").replace(/[−–]/g, "-");
  if (!t) return null;
  if (EMPTY.test(t)) return [];
  const body = t.replace(/^s=/, "").replace(/^[{(\[]|[})\]]$/g, "");
  const parts = body.split(/;|ou|et/).map((p) => p.replace(/^[a-z]=/, "")).filter(Boolean);
  if (!parts.length) return null;
  const out = [];
  for (const p of parts) {
    const m = p.replace(",", ".").match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?$/);
    if (!m) return null;
    const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
    if (!Number.isFinite(v)) return null;
    out.push(v);
  }
  return out;
}

/** { ok, values } — values null when the input could not be read. */
export function checkAnswer(exercise, text) {
  const values = parseAnswer(text);
  if (!values) return { ok: false, values: null };
  const tol = exercise.approx ? 0.006 : 1e-6; // approx answers are expected to 2 decimals
  const want = [...new Set(exercise.solutions)];
  const got = [...new Set(values.map((v) => Math.round(v * 1e9) / 1e9))];
  const ok = got.length === want.length && want.every((w) => got.some((g) => Math.abs(g - w) <= tol));
  return { ok, values };
}

/** Seeded generator (mulberry32), so a given exercise can be reproduced in tests. */
export function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
