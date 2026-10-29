# Labo maths

Outils interactifs pour comprendre les mathématiques en les manipulant.
Site : https://labo-maths.github.io

| Outil | Dossier |
|---|---|
| Fonctions sinusoïdales : `y = A·sin(ωx − φ) + D`, curseurs, saisie libre, ajustement automatique | [`sinusoides/`](sinusoides/) |

## Lancer en local

Fichiers statiques, sans installation (math.js, KaTeX et Plotly viennent d'un CDN).
Les modules ES exigent un serveur local, pas `file://` :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Chaque `git push` sur `main` met le site à jour (GitHub Pages, racine du dépôt).

## Tests

La partie mathématique n'a aucune dépendance et se teste avec Node ≥ 20 :

```sh
node --test
```

## Structure

```
index.html          page d'accueil : la liste des outils
shared/
  theme.css         couleurs (variables CSS), thèmes clair/sombre, composants communs
  theme.js          bouton de thème
  ticks.js          graduations en multiples de π
  parser.js         saisie utilisateur → fonction de x (math.js, liste blanche, pas d'eval)
sinusoides/
  index.html, style.css, app.js
  model.js          évaluation et ajustement d'une sinusoïde
tests/
```

## Ajouter un outil

1. Créer un dossier `<outil>/` avec son `index.html`, en reprenant l'en-tête de `sinusoides/index.html`
   (lien « Labo maths », bouton de thème, script anti-flash dans `<head>`).
2. Importer ce qui sert depuis `../shared/` ; mettre dans `shared/` tout ce qu'un deuxième outil réutiliserait.
3. Ajouter une carte dans `index.html` et une ligne dans le tableau ci-dessus.
4. Mettre la logique mathématique dans un module sans DOM et la tester dans `tests/`.
