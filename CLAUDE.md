# Labo maths : consignes pour Claude

Site statique d'outils de maths interactifs (cours de secondaire, en français). Voir `README.md` pour la structure et le lancement.

## Conventions

- Tout le texte visible est en **français** ; le code, les noms et les commentaires sont en anglais, commentaires rares et courts.
- Pas de build ni de dépendance npm : modules ES, bibliothèques (math.js, KaTeX, Plotly) depuis un CDN.
- Couleurs et composants communs (`.ghost`, `.primary`, `.chips`…) viennent de `shared/theme.css` : utiliser ses variables (`--accent`, `--accent-soft`, `--bg`, `--panel`, `--border`, `--muted`…), jamais de couleur en dur. Vérifier les thèmes clair et sombre.
- Formules : `data-tex="…"` (+ `data-display`) dans le HTML, `renderTex` / `renderMixed` (`shared/tex.js`) en JS ; texte mêlé de maths avec `$…$`.
- Logique mathématique dans des modules sans DOM (`exercises.js`, `calc.js`, `model.js`…), testée dans `tests/`.
- Mise en page responsive : une colonne sous 900px ; respecter `prefers-reduced-motion` pour les animations.
- La rose en braille en commentaire au début de `index.html` est la signature de l'auteur : la conserver telle quelle.

## exp-log

- Un chapitre par « page » (`section.chapter`, affichée selon le hash de l'URL), barre de chapitres et liens précédent/suivant générés dans `app.js`.
- Méthodes : cartes `.method` dans une grille `.methods`, avec un `.method-actions` (« Voir un exemple » `data-example="<type>"`, « S'entraîner » `data-train="<choix>"`).
- Exemples résolus : générés par `TYPES[type].gen(seeded(11))` (même exemple à chaque fois), affichés dans un **panneau pleine largeur** sous la rangée de la carte (`initExamples` dans `lessons.js`), étapes en grille calcul à gauche / commentaire à droite. Préférer ce type de présentation aux menus `<details>` dans des colonnes étroites, jugés trop chargés.
- Nouveau type d'exercice : l'ajouter à `TYPES` dans `exercises.js` (énoncé, indices, étapes `{ tex, note }`, solutions, `residual`) ; les tests Node le vérifient automatiquement.

## Vérification

- `node --test` (Node ≥ 20) doit passer.
- Interface : `python3 -m http.server 8000` puis `http://localhost:8000/tests/exp-log.browser.html` ; mettre ce test à jour quand l'interface change.
- Sans réseau (Plotly en CDN indisponible), le test navigateur échoue en masse : ce n'est pas une régression.
