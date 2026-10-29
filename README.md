# Labo maths

Outils interactifs pour comprendre les mathématiques en les manipulant.
Site : https://labo-maths.github.io

| Outil | Dossier |
|---|---|
| Fonctions sinusoïdales : `y = A·sin(ωx − φ) + D`, curseurs, saisie libre, ajustement automatique | [`sinusoides/`](sinusoides/) |
| Exponentielles et logarithmes : fonctions réciproques, `aˣ`, logarithmes, équations exponentielles et logarithmiques, pense-bête imprimable, générateur d'exercices avec indices, résolution pas à pas et calculatrice | [`exp-log/`](exp-log/) |

## Services

| Service | Rôle |
|---|---|
| [GitHub](https://github.com/labo-maths/labo-maths.github.io) | Dépôt du code et hébergement (GitHub Pages, mise à jour à chaque push sur `main`) |
| [cdnjs](https://cdnjs.com) (Cloudflare) | KaTeX (formules) et math.js (calcul) |
| [jsDelivr](https://www.jsdelivr.com) | Plotly (graphiques) |
| [GoatCounter](https://www.goatcounter.com) | Statistiques de visites, privées et sans cookie (compte partagé avec le portfolio) |

Visites comptées avec GoatCounter (sans cookie, donc sans bannière de consentement) : script dans le `<head>` de chaque page,
chemins préfixés par le domaine (`labo-maths.github.io/…`) pour les distinguer du portfolio sur https://exokayn.goatcounter.com (rien n'est affiché sur le site).

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

L'interface de `exp-log/` se vérifie dans le navigateur : avec le serveur local lancé,
ouvrir http://localhost:8000/tests/exp-log.browser.html (toutes les lignes doivent être vertes).

## Structure

```
index.html          page d'accueil : la liste des outils
shared/
  theme.css         couleurs (variables CSS), thèmes clair/sombre, composants communs (boutons, champs, curseurs)
  theme-boot.js     thème appliqué avant le premier affichage (script bloquant dans <head>)
  theme.js          bouton de thème, suit le réglage du système tant qu'aucun choix n'est enregistré
  ticks.js          graduations en multiples de π
  parser.js         saisie utilisateur → fonction de x (math.js, liste blanche, pas d'eval)
  numeric.js        linspace
  fraction.js       fractions exactes (calcul et affichage TeX)
  tex.js            rendu KaTeX (formules statiques, texte mêlé de $…$)
  plot.js           couleurs du thème et mise en page Plotly communes
  calc.js           calculatrice : saisie → arbre → valeur, TeX et erreurs en français (sans DOM, pas d'eval)
  calculator.js/.css  widget calculatrice (écran de taille fixe, aperçu TeX, clavier, historique, Rép)
sinusoides/
  index.html, style.css, app.js
  model.js          évaluation et ajustement d'une sinusoïde
exp-log/
  index.html, style.css, app.js
  lessons.js        laboratoires interactifs du cours (réciproques, échiquier, aˣ, logarithmes) et exemples résolus
                    (panneau pleine largeur sous la rangée de la méthode, un seul ouvert à la fois)
  exercises.js      générateur d'exercices (sans DOM) : énoncé, indices, étapes, solutions
  trainer.js        carte d'exercice : indices, « Étape suivante », vérification de la réponse
tests/
  *.test.js         tests Node
  exp-log.browser.html  vérification de l'interface dans le navigateur
```

## Ajouter un outil

1. Créer un dossier `<outil>/` avec son `index.html`, en reprenant l'en-tête de `sinusoides/index.html`
   (lien « Labo maths », bouton de thème, `shared/theme-boot.js` dans `<head>`).
2. Importer ce qui sert depuis `../shared/` ; mettre dans `shared/` tout ce qu'un deuxième outil réutiliserait.
3. Ajouter une carte dans `index.html` et une ligne dans le tableau ci-dessus.
4. Mettre la logique mathématique dans un module sans DOM et la tester dans `tests/`.
