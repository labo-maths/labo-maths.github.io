// Entry point: static formulas, chapters, trainer, theme and chapter navigation.
/* global Plotly */

import { renderStaticTex } from "../shared/tex.js";
import { initTheme } from "../shared/theme.js";
import { initLessons } from "./lessons.js";
import { initTrainer } from "./trainer.js";

renderStaticTex();
const lessons = initLessons();
const trainer = initTrainer();
initTheme(document.getElementById("theme-toggle"), lessons.renderPlots);

// One chapter per "page": the URL hash names the chapter shown, so links,
// reloads and the browser's back/forward buttons all work.
const chapters = [...document.querySelectorAll(".chapter")];
const links = new Map([...document.querySelectorAll(".chapters a")].map((a) => [a.hash.slice(1), a]));

for (const [i, section] of chapters.entries()) {
  const pager = document.createElement("nav");
  pager.className = "pager";
  pager.setAttribute("aria-label", "Chapitre précédent ou suivant");
  for (const [target, cls, arrow] of [[chapters[i - 1], "prev", "←"], [chapters[i + 1], "next", "→"]]) {
    if (!target) { pager.append(document.createElement("span")); continue; }
    const a = document.createElement("a");
    a.className = "pager-link " + cls;
    a.href = "#" + target.id;
    a.innerHTML = `<small>${cls === "prev" ? "Précédent" : "Suivant"}</small><span></span>`;
    const title = links.get(target.id).title; // full chapter name; the bar shows a short one
    a.querySelector("span").textContent = cls === "prev" ? `${arrow} ${title}` : `${title} ${arrow}`;
    pager.append(a);
  }
  section.append(pager);
}

function showChapter(id) {
  const current = chapters.find((c) => c.id === id) ?? chapters[0];
  for (const c of chapters) c.hidden = c !== current;
  for (const [key, a] of links) {
    if (key === current.id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  links.get(current.id).scrollIntoView({ block: "nearest", inline: "nearest" });
  // Plots drawn while their chapter was hidden have the wrong width.
  for (const plot of current.querySelectorAll(".js-plotly-plot")) Plotly.Plots.resize(plot);
  window.scrollTo(0, 0);
}

addEventListener("hashchange", () => showChapter(location.hash.slice(1)));
showChapter(location.hash.slice(1));
// The browser jumps to the #anchor once the page has loaded, past the header: undo that.
addEventListener("load", () => window.scrollTo(0, 0), { once: true });

for (const btn of document.querySelectorAll("[data-train]")) {
  btn.addEventListener("click", () => {
    location.hash = "#exercices"; // fires hashchange → showChapter, but synchronously show it now so focus works
    showChapter("exercices");
    trainer.train(btn.dataset.train);
  });
}
