import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, LEVELS, generate, parseAnswer, checkAnswer, seeded, linTex } from "../exp-log/exercises.js";
import { fr, add, mul, div, pow, fracTex, fracText } from "../shared/fraction.js";

const RUNS = 300;

/** Every TeX string must have balanced braces; every hint/note an even number of $. */
function assertWellFormed(ex, label) {
  const tex = [ex.statement, ...ex.steps.map((s) => s.tex)];
  for (const t of tex) {
    let depth = 0;
    for (const ch of t.replace(/\\[{}]/g, "")) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      assert.ok(depth >= 0, `${label}: unbalanced "}" in ${t}`);
    }
    assert.equal(depth, 0, `${label}: unbalanced "{" in ${t}`);
    assert.ok(!/undefined|NaN|null/.test(t), `${label}: ${t}`);
  }
  for (const t of [...ex.hints, ...ex.steps.map((s) => s.note)]) {
    assert.equal((t.match(/\$/g) ?? []).length % 2, 0, `${label}: unpaired $ in ${t}`);
    assert.ok(!/undefined|NaN/.test(t), `${label}: ${t}`);
  }
}

for (const [id, { gen }] of Object.entries(TYPES)) {
  test(`${id}: ${RUNS} generated exercises are correct and well formed`, () => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const ex = { prompt: "", approx: false, ...gen(seeded(seed)) };
      const label = `${id} #${seed} (${ex.statement})`;
      assert.equal(ex.type, id);
      assert.ok(ex.hints.length >= 2, `${label}: hints`);
      assert.ok(ex.steps.length >= 3, `${label}: steps`);
      assertWellFormed(ex, label);
      for (const x of ex.solutions) {
        const [lhs, rhs] = ex.residual(x);
        const scale = Math.max(1, Math.abs(lhs), Math.abs(rhs));
        assert.ok(Math.abs(lhs - rhs) <= 1e-9 * scale, `${label}: x = ${x} gives ${lhs} ≠ ${rhs}`);
      }
      if (id !== "quadratic") assert.equal(ex.solutions.length, 1, label);
      assert.ok(checkAnswer(ex, ex.solutions.join(" ; ")).ok, `${label}: own answer rejected`);
    }
  });
}

test("quadratic exercises cover two, one and 'negative root' solution sets", () => {
  const sizes = new Set();
  let impossible = 0;
  for (let seed = 1; seed <= RUNS; seed++) {
    const ex = TYPES.quadratic.gen(seeded(seed));
    sizes.add(ex.solutions.length);
    if (ex.steps.some((s) => s.note.startsWith("Impossible"))) impossible++;
    assert.ok(ex.solutions.length >= 1, ex.statement);
  }
  assert.deepEqual([...sizes].sort(), [1, 2]);
  assert.ok(impossible > 0);
});

test("generate filters by type and by level", () => {
  const rng = seeded(42);
  for (let i = 0; i < 50; i++) assert.equal(generate("factor", rng).type, "factor");
  for (const { id } of LEVELS) {
    for (let i = 0; i < 30; i++) assert.equal(TYPES[generate(`level:${id}`, rng).type].level, id);
  }
  assert.equal(generate("logEval", rng).prompt, "Calcule");
  assert.equal(generate("direct", rng).prompt, "Résous l'équation");
});

test("parseAnswer reads the usual ways of writing a solution", () => {
  assert.deepEqual(parseAnswer("3"), [3]);
  assert.deepEqual(parseAnswer("x = -2"), [-2]);
  assert.deepEqual(parseAnswer("3/2"), [1.5]);
  assert.deepEqual(parseAnswer("−1/4"), [-0.25]);
  assert.deepEqual(parseAnswer("1,5"), [1.5]);
  assert.deepEqual(parseAnswer("1 ; 3"), [1, 3]);
  assert.deepEqual(parseAnswer("x = 1 ou x = 3"), [1, 3]);
  assert.deepEqual(parseAnswer("S = {1 ; 3}"), [1, 3]);
  assert.deepEqual(parseAnswer("∅"), []);
  assert.deepEqual(parseAnswer("aucune"), []);
  assert.equal(parseAnswer(""), null);
  assert.equal(parseAnswer("deux"), null);
  assert.equal(parseAnswer("1/0"), null);
});

test("checkAnswer compares solution sets, in any order", () => {
  const ex = { solutions: [1, 3], approx: false };
  assert.ok(checkAnswer(ex, "3 ; 1").ok);
  assert.ok(!checkAnswer(ex, "1").ok);
  assert.ok(!checkAnswer(ex, "1 ; 3 ; 5").ok);
  assert.equal(checkAnswer(ex, "???").values, null);
  assert.ok(checkAnswer({ solutions: [0.5], approx: false }, "1/2").ok);
  const approx = { solutions: [Math.log(5) / Math.log(2)], approx: true }; // 2.3219…
  assert.ok(checkAnswer(approx, "2,32").ok);
  assert.ok(!checkAnswer(approx, "2,3").ok);
  assert.ok(checkAnswer({ solutions: [], approx: false }, "impossible").ok);
});

test("fractions stay reduced with a positive denominator", () => {
  assert.deepEqual({ ...fr(6, -8) }, { n: -3, d: 4 });
  assert.deepEqual({ ...fr(0, -5) }, { n: 0, d: 1 });
  assert.deepEqual({ ...add(fr(1, 2), fr(1, 3)) }, { n: 5, d: 6 });
  assert.deepEqual({ ...mul(fr(2, 3), 3) }, { n: 2, d: 1 });
  assert.deepEqual({ ...div(1, fr(1, 4)) }, { n: 4, d: 1 });
  assert.deepEqual({ ...pow(fr(2, 3), -2) }, { n: 9, d: 4 });
  assert.deepEqual({ ...pow(2, -3) }, { n: 1, d: 8 });
  assert.equal(fracTex(fr(-1, 8)), "-\\frac{1}{8}");
  assert.equal(fracText(fr(3, 2)), "3/2");
  assert.throws(() => fr(1, 0));
});

test("linTex writes linear expressions the way a teacher would", () => {
  assert.equal(linTex(1), "x");
  assert.equal(linTex(-1), "-x");
  assert.equal(linTex(2, -3), "2x - 3");
  assert.equal(linTex(1, 1), "x + 1");
  assert.equal(linTex(0, 4), "4");
});
