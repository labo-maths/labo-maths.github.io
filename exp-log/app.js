// Entry point: static formulas, chapters, trainer, theme and chapter navigation.

import { renderStaticTex } from "../shared/tex.js";
import { initTheme } from "../shared/theme.js";
import { initLessons } from "./lessons.js";
import { initTrainer } from "./trainer.js";

renderStaticTex();
const lessons = initLessons();
const trainer = initTrainer();
initTheme(document.getElementById("theme-toggle"), lessons.renderPlots);

for (const btn of document.querySelectorAll("[data-train]")) {
  btn.addEventListener("click", () => trainer.train(btn.dataset.train));
}

// Highlight the chapter currently on screen in the side navigation.
const links = new Map([...document.querySelectorAll(".chapters a")].map((a) => [a.hash.slice(1), a]));
const observer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    for (const a of links.values()) a.removeAttribute("aria-current");
    links.get(e.target.id)?.setAttribute("aria-current", "true");
  }
}, { rootMargin: "-30% 0px -60% 0px" });
for (const id of links.keys()) observer.observe(document.getElementById(id));
