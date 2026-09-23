# Mes calories — compteur de calories simple

Appli web **locale**, zéro dépendance, zéro installation : un seul dossier, des fichiers
HTML/CSS/JS purs. Aucun compte, aucun serveur, aucune donnée envoyée — tout vit dans le
navigateur (`localStorage`).

## Lancer l'appli

- **Le plus simple** : double-clic sur `lancer.command` (ouvre un petit serveur local et
  le navigateur sur `http://127.0.0.1:8791`).
- **Sans serveur** : double-clic sur `app/index.html` (fonctionne aussi, mais certains
  navigateurs limitent le stockage des pages ouvertes en `file://`).

## Ce qu'elle fait

- Objectif calorique personnalisé (formule de Mifflin-St Jeor : sexe, âge, taille, poids,
  activité, but perdre/maintenir/prendre) — ou objectif manuel.
- Journal par repas (petit-déj, déjeuner, collation, dîner), navigation jour par jour.
- Base locale d'environ 85 aliments (kcal / 100 g + portion type), avec une trentaine de
  plats d'Afrique de l'Ouest (riz gras, attiéké, foutou, sauce arachide, poisson braisé…).
- Saisie libre pour les aliments absents, avec mémorisation dans « Mes aliments ».
- Anneau de progression, reste à consommer, dépassement signalé en rouge.
- Vue « 7 derniers jours » : barres, moyenne, écart moyen vs objectif.
- Export / import JSON (sauvegarde réelle), suppression d'une ligne, changement de date.

## Structure

```
app/index.html        écran (3 onglets + feuille d'ajout)
app/styles.css        mise en forme mobile-first
app/logique.js        logique pure, testable sans navigateur (calculs, validation, dates)
app/base-aliments.js  base d'aliments locale (kcal / 100 g + portion type)
app/app.js            interface (rendu, événements, stockage)
app/test-logic.js     71 tests : node test-logic.js
docs/GUIDE_UTILISATEUR.html  guide illustré (captures réelles)
docs/captures/        captures d'écran mobiles (390 × 844)
```

## Tests

```bash
cd app && node test-logic.js     # → ✓ 71/71 tests OK
```

## Limites connues (assumées)

- Les valeurs nutritionnelles sont **indicatives** : la cuisson, l'huile et les quantités
  réelles font varier de 20 à 40 %. Les plats composés locaux (marqués ≈) sont des
  estimations grossières à ajuster par l'utilisateur.
- Pas de macros (protéines / glucides / lipides), pas de code-barres, pas de photos.
- Données locales au navigateur : vider les données du navigateur les efface → exporter
  régulièrement le JSON.
- L'objectif est appliqué de façon identique à tous les jours (pas d'historique de
  changement d'objectif).
- Ce n'est pas un outil médical.
