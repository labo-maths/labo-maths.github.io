// Calculator widget: input line, live preview, keypad and short history.
// The maths lives in calc.js; this file only builds and wires the DOM.

import { calculate } from "./calc.js";
import { renderTex } from "./tex.js";

// [label, text inserted, tooltip]. "|" marks where the caret lands.
const KEYS = [
  ["ln", "ln(|)", "Logarithme népérien (base e)"],
  ["log", "log(|)", "Logarithme décimal (base 10)"],
  ["logₐ", "log_|()", "Logarithme de base a : log_2(8) = 3"],
  ["eˣ", "e^(|)", "e puissance x"],
  ["10ˣ", "10^(|)", "10 puissance x"],
  ["x²", "²", "Au carré"],
  ["xʸ", "^", "Puissance : 2^5"],
  ["√", "√(|)", "Racine carrée"],
  ["∛", "∛(|)", "Racine cubique"],
  ["ⁿ√", "^(1/|)", "Racine n-ième : x^(1/n)"],
  ["7"], ["8"], ["9"], ["(", "(", "Parenthèse ouvrante"], [")", ")", "Parenthèse fermante"],
  ["4"], ["5"], ["6"], ["×", "×", "Multiplier"], ["÷", "÷", "Diviser"],
  ["1"], ["2"], ["3"], ["+", "+", "Additionner"], ["−", "-", "Soustraire"],
  ["0"], [",", ",", "Virgule décimale"], ["π", "π", "Pi"], ["e", "e", "Nombre e ≈ 2,718"], ["Rép", "Rép", "Résultat précédent"],
];

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

/**
 * Builds a calculator inside `root`. With `onUse(text)`, a button sends the
 * current result elsewhere (e.g. into an exercise's answer field).
 */
export function initCalculator(root, { onUse } = {}) {
  let ans; // last confirmed result, used by Rép
  let shown = null; // result on screen, what "Utiliser comme réponse" sends
  const history = [];

  const input = el("input", {
    type: "text",
    className: "calc-input",
    spellcheck: false,
    autocomplete: "off",
    placeholder: "ex. log_2(8)   ·   ln(5)/ln(2)",
    ariaLabel: "Calcul",
  });
  const preview = el("div", { className: "calc-preview", ariaHidden: "true" });
  const result = el("output", { className: "calc-result", ariaLive: "polite" });
  const use = el("button", { type: "button", className: "ghost calc-use", textContent: "→ Utiliser comme réponse", hidden: true });
  const keypad = el("div", { className: "calc-keys" });
  const historyList = el("ol", { className: "calc-history", ariaLabel: "Calculs précédents" });

  for (const [label, insert = label, title] of KEYS) {
    const key = el("button", { type: "button", textContent: label, title: title ?? "" });
    if (/^[\d,]$/.test(label)) key.className = "digit";
    key.dataset.insert = insert;
    keypad.append(key);
  }
  const clear = el("button", { type: "button", className: "action", textContent: "C", title: "Tout effacer (Échap)" });
  const back = el("button", { type: "button", className: "action", textContent: "⌫", title: "Effacer un caractère" });
  const equals = el("button", { type: "button", className: "primary equals", textContent: "=", title: "Calculer (Entrée)" });
  keypad.append(clear, back, equals);

  root.classList.add("calculator");
  root.append(
    el("div", { className: "calc-screen" }, input, preview, el("div", { className: "calc-result-row" }, result, use)),
    keypad,
    historyList,
  );

  /** Live view: TeX of what is typed and its value; errors only after "=". */
  function update(confirmed = false) {
    const text = input.value;
    use.hidden = true;
    shown = null;
    result.className = "calc-result";
    if (!text.trim()) {
      preview.replaceChildren();
      result.textContent = "";
      return null;
    }
    const r = calculate(text, ans);
    if (r.error) {
      result.textContent = confirmed ? r.error : "…";
      result.classList.add(confirmed ? "error" : "pending");
      if (confirmed) preview.replaceChildren();
      return null;
    }
    renderTex(preview, r.tex);
    renderTex(result, `${r.result.exact ? "=" : "\\approx"} ${r.result.tex}`);
    use.hidden = !onUse || r.result.scientific;
    shown = r.result.text;
    return r;
  }

  function confirm() {
    const r = update(true);
    if (!r) return;
    ans = r.value;
    if (history[0]?.text !== input.value) {
      history.unshift({ text: input.value, ...r });
      history.length = Math.min(history.length, 5);
      renderHistory();
    }
  }

  function renderHistory() {
    historyList.replaceChildren(...history.map((h) => {
      const item = el("button", { type: "button", title: "Reprendre ce calcul" });
      renderTex(item, `${h.tex} ${h.result.exact ? "=" : "\\approx"} ${h.result.tex}`);
      item.addEventListener("click", () => {
        input.value = h.text;
        update();
        input.focus();
      });
      return el("li", {}, item);
    }));
  }

  function insert(text) {
    const caret = text.indexOf("|");
    const clean = text.replace("|", "");
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.setRangeText(clean, start, end, "end");
    if (caret >= 0) input.setSelectionRange(start + caret, start + caret);
    update();
  }

  // Keep the caret in the input: keys must not take the focus.
  keypad.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
  keypad.addEventListener("click", (e) => {
    const key = e.target.closest("button");
    if (!key) return;
    if (key === equals) confirm();
    else if (key === clear) { input.value = ""; update(); }
    else if (key === back) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      if (start !== end) input.setRangeText("", start, end, "end");
      else if (start > 0) input.setRangeText("", start - 1, start, "end");
      update();
    } else insert(key.dataset.insert);
  });

  input.addEventListener("input", () => update());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirm(); }
    if (e.key === "Escape") { input.value = ""; update(); }
  });
  use.addEventListener("click", () => { if (shown) onUse(shown); });

  return { input };
}
