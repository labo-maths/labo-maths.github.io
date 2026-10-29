// Loaded as a blocking script in every page's <head>, so the theme is set
// before first paint (no flash): the saved choice, else the system setting.
// theme.js then keeps it up to date.
{
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch {}
  document.documentElement.dataset.theme =
    saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
