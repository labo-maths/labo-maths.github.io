# sinusoidal-web

Outil pédagogique pour explorer les fonctions sinusoïdales `y = A·sin(ωx − φ) + D`.
Version web de [sinusoidalFunctions](../sinusoidalFunctions) (Python/tkinter).

- **Curseurs** : faire varier A, ω, φ et D et voir la courbe, la ligne médiane, les bornes `D ± A`, un pic `x_p` et la période `T`.
- **Saisie libre** : taper n'importe quelle fonction de `x` (`2 sin(3x - pi/4) + 1`, `sin(x) + cos(x)`…). L'appli ajuste la sinusoïde la plus proche (moindres carrés) et indique si la courbe n'en est pas une (R²).
- Formule affichée sous les formes sinus **et** cosinus, axe des x en unités ou en multiples de π, thème clair/sombre.

## Lancer

Aucune installation : ce sont des fichiers statiques (math.js, KaTeX et Plotly viennent d'un CDN).
Les modules ES exigent un serveur local, pas `file://` :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Déploiement : GitHub Pages sur la branche `main`, dossier racine.

## Tests

La partie mathématique (`src/model.js`, `src/ticks.js`) n'a aucune dépendance et se teste avec Node ≥ 20 :

```sh
node --test
```

## Structure

| Fichier | Rôle |
|---|---|
| `src/model.js` | Évaluation, ajustement (balayage de ω + section dorée, puis moindres carrés pour A, φ, D), période et pic |
| `src/ticks.js` | Graduations en multiples de π |
| `src/parser.js` | Saisie utilisateur → fonction, via math.js avec liste blanche (pas d'`eval`) |
| `src/app.js` | Interface : contrôles, graphique Plotly, formules KaTeX |
| `src/style.css` | Mise en page et thèmes (variables CSS) |
