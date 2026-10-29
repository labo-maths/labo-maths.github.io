// UI: reads controls, computes the curve, renders the plot and the formula.
// math.js, KaTeX and Plotly are loaded as globals by index.html.
/* global math, katex, Plotly */

import { linspace, evaluateSinusoid, fitSinusoid, cosPhase, derived } from "./model.js";
import { piTicks, piLabel } from "./ticks.js";
import { compileExpression } from "./parser.js";

const X_RANGE = [-10, 10];
const Y_RANGE_SLIDERS = [-10.5, 10.5]; // fixed so changing A or D visibly moves the curve
const GOOD_FIT = 0.99;
const xs = linspace(...X_RANGE, 1200);

const $ = (id) => document.getElementById(id);
const SLIDERS = ["A", "omega", "phi", "D"];
const DEFAULTS = { A: 1, omega: 1, phi: 0, D: 0 };

const state = {
  mode: "sliders",
  view: [...X_RANGE], // current x range, kept in sync with zoom/pan
  expr: { fn: null, error: null },
};

// ---------- formatting ----------

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const fmt = (v) => nf.format(Math.abs(v) < 0.005 ? 0 : v);
const tex = (v) => fmt(v).replace(",", "{,}"); // no extra space after the decimal comma in KaTeX

/** "π/4" when φ is close to a multiple of π/12, otherwise "". */
function piApprox(v) {
  const k = Math.round((v / Math.PI) * 12);
  return k !== 0 && Math.abs(v - (k * Math.PI) / 12) < 0.006 ? piLabel(k, 12) : "";
}

/** TeX for A·f(ωx − φ) + D, dropping 1s, zeros and doubled signs. */
function formulaTex(fn, { A, omega, phi, D }, rel = "=") {
  const amp = Math.abs(A - 1) < 0.005 ? "" : tex(A);
  const w = Math.abs(omega - 1) < 0.005 ? "" : tex(omega);
  const ph = Math.abs(phi) < 0.005 ? "" : `${phi > 0 ? " - " : " + "}${tex(Math.abs(phi))}`;
  const d = Math.abs(D) < 0.005 ? "" : `${D > 0 ? " + " : " - "}${tex(Math.abs(D))}`;
  return `y ${rel} ${amp}\\${fn}(${w}x${ph})${d}`;
}

function renderTex(el, source, display = false) {
  katex.render(source, el, { throwOnError: false, displayMode: display });
}

// ---------- computation ----------

function sliderParams() {
  return Object.fromEntries(SLIDERS.map((k) => [k, Number($(k).value)]));
}

/** { ys, params, fit } — params null when nothing sinusoidal can be shown. */
function compute() {
  if (state.mode === "sliders") {
    const params = sliderParams();
    return { ys: evaluateSinusoid(params, xs), params, fit: null };
  }
  if (!state.expr.fn) return { ys: [], params: null, fit: null };
  const ys = xs.map(state.expr.fn);
  const fit = fitSinusoid(xs, ys);
  return { ys, params: fit, fit };
}

// ---------- plot ----------

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderPlot({ ys, params, fit }) {
  const c = {
    fg: cssVar("--fg"), muted: cssVar("--muted"), grid: cssVar("--plot-grid"),
    curve: cssVar("--curve"), fitC: cssVar("--fit"), mid: cssVar("--midline"),
    bounds: cssVar("--bounds"), period: cssVar("--period"),
  };
  const traces = [{
    x: xs, y: ys.map((y) => (Number.isFinite(y) ? y : null)),
    mode: "lines", line: { color: c.curve, width: 2.5 }, name: "f(x)", hoverinfo: "x+y",
  }];
  const shapes = [], annotations = [];

  // Only draw the guides when the curve really is (close to) a sinusoid.
  const trusted = params && (!fit || fit.r2 >= GOOD_FIT);
  if (fit && fit.r2 >= 0.5) {
    traces.push({
      x: xs, y: evaluateSinusoid(fit, xs), mode: "lines", name: "ajustement",
      line: { color: c.fitC, width: 1.5, dash: "dot" }, hoverinfo: "skip",
    });
  }
  if (trusted) {
    const { A, D } = params;
    const hline = (y, color, dash) => ({
      type: "line", xref: "paper", x0: 0, x1: 1, y0: y, y1: y, line: { color, width: 1.5, dash },
    });
    if ($("show-midline").checked) shapes.push(hline(D, c.mid, "dash"));
    if ($("show-bounds").checked) shapes.push(hline(D + A, c.bounds, "dot"), hline(D - A, c.bounds, "dot"));
    if ($("show-period").checked) {
      const { T, xPeak } = derived(params);
      const top = D + A;
      const vline = (x) => ({ type: "line", x0: x, x1: x, y0: D, y1: top, line: { color: c.period, width: 1, dash: "dot" } });
      shapes.push(vline(xPeak), vline(xPeak + T));
      annotations.push({
        x: xPeak, y: top, ax: xPeak + T, ay: top, axref: "x", ayref: "y",
        showarrow: true, arrowside: "end+start", arrowhead: 2, arrowcolor: c.period, text: "",
      }, {
        x: xPeak + T / 2, y: top, yshift: 12, showarrow: false,
        text: `T = ${fmt(T)}`, font: { color: c.period },
      });
      traces.push({
        x: [xPeak], y: [top], mode: "markers+text", text: ["x<sub>p</sub>"], textposition: "top left",
        marker: { color: c.period, size: 8 }, textfont: { color: c.period }, hoverinfo: "x+y", name: "pic",
      });
    }
  }

  const xaxis = {
    range: X_RANGE, zeroline: true, zerolinecolor: c.muted, gridcolor: c.grid, color: c.fg,
    title: { text: $("axis").value === "radians" ? "x (rad)" : "x" },
  };
  if ($("axis").value === "radians") {
    const { values, labels } = piTicks(...state.view);
    Object.assign(xaxis, { tickmode: "array", tickvals: values, ticktext: labels });
  }
  const yaxis = {
    zeroline: true, zerolinecolor: c.muted, gridcolor: c.grid, color: c.fg, title: { text: "y" },
    ...(state.mode === "sliders" ? { range: Y_RANGE_SLIDERS } : { autorange: true }),
  };

  Plotly.react("plot", traces, {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: c.fg },
    margin: { l: 50, r: 16, t: 16, b: 44 }, showlegend: false,
    xaxis, yaxis, shapes, annotations,
    uirevision: state.mode, // keep the user's zoom across updates, reset it when switching mode
  }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["select2d", "lasso2d"] });
}

// ---------- formula & values ----------

function renderResults({ params, fit }) {
  const note = $("fit-note");
  note.className = "note";
  note.textContent = "";
  $("formula-cos").textContent = "";
  $("values").replaceChildren();

  if (!params) {
    $("results-title").textContent = "Formule";
    $("formula").textContent = state.mode === "free" && state.expr.fn
      ? "Impossible d'ajuster une sinusoïde (fonction constante ou non définie sur l'intervalle)."
      : "—";
    return;
  }

  const rel = fit ? "\\approx" : "=";
  $("results-title").textContent = fit ? "Sinusoïde ajustée" : "Formule";
  renderTex($("formula"), formulaTex("sin", params, rel));
  renderTex($("formula-cos"), formulaTex("cos", { ...params, phi: cosPhase(params.phi) }, rel));

  const { T, xPeak } = derived(params);
  const phiPi = piApprox(params.phi);
  const rows = [
    ["A", fmt(params.A)],
    ["\\omega", fmt(params.omega)],
    ["T = 2\\pi/\\omega", fmt(T)],
    ["\\varphi", fmt(params.phi) + (phiPi ? ` ≈ ${phiPi}` : "")],
    ["D", fmt(params.D)],
    ["x_p", fmt(xPeak)],
  ];
  if (fit) rows.push(["R^2", nf.format(Math.round(fit.r2 * 1000) / 1000)]);
  for (const [label, value] of rows) {
    const div = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    renderTex(dt, label);
    dd.textContent = value;
    div.append(dt, dd);
    $("values").append(div);
  }

  if (fit && fit.r2 < GOOD_FIT) {
    note.className = "note warn";
    note.textContent = "Ajustement approximatif : cette courbe n'est probablement pas une sinusoïde pure. " +
      "La courbe pointillée montre la sinusoïde la plus proche.";
  } else if (fit) {
    note.textContent = "Paramètres retrouvés par ajustement (moindres carrés) sur l'intervalle affiché.";
  }
}

// ---------- update loop ----------

function update() {
  for (const k of SLIDERS) {
    const v = Number($(k).value);
    const p = k === "phi" ? piApprox(v) : "";
    $(`${k}-out`).textContent = fmt(v) + (p ? ` ≈ ${p}` : "");
  }
  const result = compute();
  renderPlot(result);
  renderResults(result);
}

let frame = 0;
const scheduleUpdate = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(update);
};

function setExpression(text) {
  const r = compileExpression(math, text);
  state.expr = r.fn ? { fn: r.fn, error: null } : { fn: null, error: r.error };
  $("expr-error").textContent = text.trim() ? state.expr.error ?? "" : "";
  $("expr").setAttribute("aria-invalid", String(Boolean(state.expr.error && text.trim())));
}

function setMode(mode) {
  state.mode = mode;
  state.view = [...X_RANGE];
  for (const btn of document.querySelectorAll(".tabs button")) {
    btn.setAttribute("aria-selected", String(btn.dataset.mode === mode));
  }
  $("mode-sliders").hidden = mode !== "sliders";
  $("mode-free").hidden = mode !== "free";
  if (mode === "free") {
    // Start from the slider curve so the two modes connect.
    if (!$("expr").value.trim()) {
      const p = sliderParams();
      const a = p.A === 1 ? "" : `${p.A} `;
      const w = p.omega === 1 ? "" : p.omega;
      const phi = p.phi === 0 ? "" : p.phi > 0 ? ` - ${p.phi}` : ` + ${-p.phi}`;
      const d = p.D === 0 ? "" : p.D > 0 ? ` + ${p.D}` : ` - ${-p.D}`;
      $("expr").value = `${a}sin(${w}x${phi})${d}`;
    }
    setExpression($("expr").value);
    $("expr").focus();
  }
  update();
}

// ---------- theme ----------

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
  updateThemeButton();
  update();
}

function updateThemeButton() {
  $("theme-toggle").textContent = currentTheme() === "dark" ? "☀ Mode clair" : "☾ Mode sombre";
}

// ---------- wiring ----------

for (const k of SLIDERS) $(k).addEventListener("input", scheduleUpdate);
$("reset").addEventListener("click", () => {
  for (const k of SLIDERS) $(k).value = DEFAULTS[k];
  update();
});
for (const btn of document.querySelectorAll(".tabs button")) {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
}

let typing = 0;
$("expr").addEventListener("input", () => {
  clearTimeout(typing);
  typing = setTimeout(() => { setExpression($("expr").value); update(); }, 150);
});
for (const chip of document.querySelectorAll("[data-expr]")) {
  chip.addEventListener("click", () => {
    $("expr").value = chip.dataset.expr;
    setExpression(chip.dataset.expr);
    update();
  });
}

for (const id of ["axis", "show-midline", "show-bounds", "show-period"]) {
  $(id).addEventListener("change", update);
}
$("theme-toggle").addEventListener("click", toggleTheme);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  updateThemeButton();
  update();
});

for (const el of document.querySelectorAll("[data-tex]")) {
  renderTex(el, el.dataset.tex, el.hasAttribute("data-display"));
}

updateThemeButton();
update();

// Re-label π ticks when the user zooms or pans.
$("plot").on("plotly_relayout", (e) => {
  if (e["xaxis.autorange"]) state.view = [...X_RANGE];
  else if ("xaxis.range[0]" in e) state.view = [e["xaxis.range[0]"], e["xaxis.range[1]"]];
  else if (Array.isArray(e["xaxis.range"])) state.view = [...e["xaxis.range"]];
  else return;
  if ($("axis").value === "radians") scheduleUpdate();
});
