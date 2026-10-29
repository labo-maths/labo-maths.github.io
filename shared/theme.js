// Light/dark theme shared by every page. theme-boot.js, loaded in <head>,
// applies it before first paint; this module wires the button.

const media = matchMedia("(prefers-color-scheme: dark)");
const systemTheme = () => (media.matches ? "dark" : "light");

function savedTheme() {
  try { return localStorage.getItem("theme"); } catch { return null; }
}

export function currentTheme() {
  return document.documentElement.dataset.theme || systemTheme();
}

/**
 * Wires `button` to toggle the theme. `onChange` runs after every change
 * (button or system setting), e.g. to redraw a plot that reads CSS colours.
 */
export function initTheme(button, onChange = () => {}) {
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    button.textContent = theme === "dark" ? "☀ Mode clair" : "☾ Mode sombre";
  };
  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch {}
    apply(next);
    onChange();
  });
  // Follow the system setting until the user picks a theme.
  media.addEventListener("change", () => {
    if (savedTheme()) return;
    apply(systemTheme());
    onChange();
  });
  apply(currentTheme());
}
