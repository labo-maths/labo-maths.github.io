// Light/dark theme shared by every page. Each page also has a tiny inline
// script in <head> that applies the saved theme before first paint.

const media = matchMedia("(prefers-color-scheme: dark)");

export function currentTheme() {
  return document.documentElement.dataset.theme || (media.matches ? "dark" : "light");
}

/**
 * Wires `button` to toggle the theme. `onChange` runs after every change
 * (button or system setting), e.g. to redraw a plot that reads CSS colours.
 */
export function initTheme(button, onChange = () => {}) {
  const label = () => {
    button.textContent = currentTheme() === "dark" ? "☀ Mode clair" : "☾ Mode sombre";
  };
  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    label();
    onChange();
  });
  media.addEventListener("change", () => { label(); onChange(); });
  label();
}
