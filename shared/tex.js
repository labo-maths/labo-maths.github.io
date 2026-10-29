// KaTeX helpers. KaTeX itself is loaded as a global by each page.

export function renderTex(el, source, display = false) {
  globalThis.katex.render(source, el, { throwOnError: false, displayMode: display });
}

/**
 * Renders text that mixes prose and math: "Pose $Y = a^x$." Inline math goes
 * between $…$, display math between $$…$$. Everything else is plain text, so
 * no HTML from the string is ever interpreted.
 */
export function renderMixed(el, text) {
  el.replaceChildren();
  for (const part of text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/)) {
    if (!part) continue;
    if (part.startsWith("$$")) {
      const span = document.createElement("span");
      renderTex(span, part.slice(2, -2), true);
      el.append(span);
    } else if (part.startsWith("$")) {
      const span = document.createElement("span");
      renderTex(span, part.slice(1, -1));
      el.append(span);
    } else {
      el.append(part);
    }
  }
}

/** Renders every element carrying data-tex (add data-display for display mode). */
export function renderStaticTex(root = document) {
  for (const el of root.querySelectorAll("[data-tex]")) {
    renderTex(el, el.dataset.tex, el.hasAttribute("data-display"));
  }
}

/** French number for TeX: 0.25 → "0{,}25" (no extra space after the comma). */
export function numTex(v, digits = 3) {
  const s = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits, useGrouping: false }).format(v);
  return s.replace(",", "{,}").replace("−", "-");
}
