/* base-aliments.js — base locale indicative (kcal / 100 g).
   ⚠️ Valeurs approximatives, à ajuster : `estime: true` = plat composé, estimation grossière.
   Aucune donnée envoyée nulle part : tout est dans ton navigateur. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BaseAliments = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* nom, kcal pour 100 g, portion typique (libellé + poids en g), catégorie, estime */
  var ALIMENTS = [
    // --- Plats & féculents d'Afrique de l'Ouest (estimes) ---
    { nom: 'Riz blanc cuit', kcal: 130, portion: 'bol moyen', g: 200, cat: 'Féculents' },
    { nom: 'Riz gras (riz au gras)', kcal: 175, portion: 'assiette normale', g: 300, cat: 'Plats', estime: true },
    { nom: 'Riz sauce arachide', kcal: 195, portion: 'assiette normale', g: 350, cat: 'Plats', estime: true },
    { nom: 'Riz sauce feuille (fouti)', kcal: 150, portion: 'assiette normale', g: 350, cat: 'Plats', estime: true },
    { nom: 'Riz sauce tomate', kcal: 165, portion: 'assiette normale', g: 350, cat: 'Plats', estime: true },
    { nom: 'Attiéké', kcal: 145, portion: 'bol moyen', g: 200, cat: 'Féculents' },
    { nom: 'Foutou (banane / manioc)', kcal: 160, portion: 'boule moyenne', g: 250, cat: 'Féculents', estime: true },
    { nom: 'Tô (pâte de mil / maïs)', kcal: 130, portion: 'boule moyenne', g: 250, cat: 'Féculents', estime: true },
    { nom: 'Manioc cuit', kcal: 160, portion: 'morceau', g: 150, cat: 'Féculents' },
    { nom: 'Igname cuite', kcal: 115, portion: 'morceau', g: 150, cat: 'Féculents' },
    { nom: 'Patate douce cuite', kcal: 90, portion: 'morceau', g: 150, cat: 'Féculents' },
    { nom: 'Pomme de terre cuite', kcal: 85, portion: '2 moyennes', g: 200, cat: 'Féculents' },
    { nom: 'Banane plantain mûre cuite', kcal: 120, portion: '1 plantain', g: 180, cat: 'Féculents' },
    { nom: 'Maïs en épi', kcal: 110, portion: '1 épi', g: 150, cat: 'Féculents' },
    { nom: 'Haricots niébé cuits', kcal: 115, portion: 'louche', g: 150, cat: 'Légumineuses' },
    { nom: 'Arachides grillées', kcal: 570, portion: 'poignée', g: 30, cat: 'Oléagineux' },
    { nom: 'Huile de palme rouge', kcal: 880, portion: 'cuillère à soupe', g: 12, cat: 'Matières grasses' },
    { nom: 'Huile végétale', kcal: 900, portion: 'cuillère à soupe', g: 12, cat: 'Matières grasses' },
    { nom: 'Pâte d\'arachide (beurre de cacahuète)', kcal: 590, portion: 'cuillère à soupe', g: 20, cat: 'Matières grasses' },

    // --- Céréales, pain ---
    { nom: 'Pain baguette', kcal: 270, portion: '1/4 de baguette', g: 60, cat: 'Féculents' },
    { nom: 'Pain complet', kcal: 250, portion: '1 tranche', g: 35, cat: 'Féculents' },
    { nom: 'Flocons d\'avoine', kcal: 380, portion: 'bol', g: 60, cat: 'Céréales' },
    { nom: 'Semoule de couscous cuite', kcal: 115, portion: 'assiette', g: 250, cat: 'Féculents' },
    { nom: 'Pâtes cuites', kcal: 150, portion: 'assiette', g: 250, cat: 'Féculents' },

    // --- Protéines animales ---
    { nom: 'Poulet (cuisse, grillée)', kcal: 180, portion: '1 cuisse', g: 150, cat: 'Viandes' },
    { nom: 'Poulet (blanc, grillé)', kcal: 165, portion: '1 filet', g: 150, cat: 'Viandes' },
    { nom: 'Bœuf grillé (steak)', kcal: 220, portion: '1 steak', g: 150, cat: 'Viandes' },
    { nom: 'Viande de chèvre / mouton cuite', kcal: 250, portion: 'portion', g: 150, cat: 'Viandes', estime: true },
    { nom: 'Poisson braisé (tilapia, capitaine)', kcal: 165, portion: '1 poisson entier', g: 250, cat: 'Poissons', estime: true },
    { nom: 'Poisson frit', kcal: 230, portion: '1 portion', g: 150, cat: 'Poissons', estime: true },
    { nom: 'Thon en conserve au naturel', kcal: 115, portion: '1 petite boîte', g: 100, cat: 'Poissons' },
    { nom: 'Sardines à l\'huile', kcal: 210, portion: '1 petite boîte', g: 90, cat: 'Poissons' },
    { nom: 'Œuf de poule', kcal: 145, portion: '1 œuf', g: 55, cat: 'Œufs' },
    { nom: 'Œufs brouillés', kcal: 165, portion: '2 œufs', g: 110, cat: 'Œufs' },
    { nom: 'Omelette', kcal: 155, portion: '2 œufs', g: 120, cat: 'Œufs' },
    { nom: 'Lait en poudre entier', kcal: 490, portion: '2 cuillères à soupe', g: 25, cat: 'Produits laitiers' },
    { nom: 'Yaourt nature', kcal: 60, portion: '1 pot', g: 125, cat: 'Produits laitiers' },
    { nom: 'Yaourt sucré', kcal: 95, portion: '1 pot', g: 125, cat: 'Produits laitiers' },
    { nom: 'Fromage (type gouda)', kcal: 350, portion: '1 part', g: 30, cat: 'Produits laitiers' },
    { nom: 'Lait de vache demi-écrémé', kcal: 47, portion: '1 verre', g: 250, cat: 'Produits laitiers' },

    // --- Sauces, plats cuisinés ---
    { nom: 'Sauce tomate cuisinée', kcal: 60, portion: 'louche', g: 150, cat: 'Sauces', estime: true },
    { nom: 'Sauce arachide', kcal: 170, portion: 'louche', g: 150, cat: 'Sauces', estime: true },
    { nom: 'Sauce feuille (au poisson)', kcal: 90, portion: 'louche', g: 150, cat: 'Sauces', estime: true },
    { nom: 'Sauce claire (légumes)', kcal: 55, portion: 'louche', g: 150, cat: 'Sauces', estime: true },
    { nom: 'Mayonnaise', kcal: 680, portion: '1 cuillère à soupe', g: 15, cat: 'Sauces' },
    { nom: 'Ketchup', kcal: 100, portion: '1 cuillère à soupe', g: 15, cat: 'Sauces' },
    { nom: 'Bouillon cube', kcal: 200, portion: '1 cube', g: 4, cat: 'Sauces' },
    { nom: 'Sucre en morceau', kcal: 400, portion: '1 morceau', g: 6, cat: 'Sucres' },
    { nom: 'Sucre en poudre', kcal: 400, portion: '1 cuillère à soupe', g: 12, cat: 'Sucres' },
    { nom: 'Miel', kcal: 320, portion: '1 cuillère à soupe', g: 20, cat: 'Sucres' },

    // --- Légumes ---
    { nom: 'Tomate', kcal: 18, portion: '1 tomate', g: 120, cat: 'Légumes' },
    { nom: 'Oignon', kcal: 40, portion: '1 oignon', g: 100, cat: 'Légumes' },
    { nom: 'Carotte', kcal: 40, portion: '1 carotte', g: 100, cat: 'Légumes' },
    { nom: 'Chou', kcal: 30, portion: '1 portion', g: 150, cat: 'Légumes' },
    { nom: 'Épinards / feuilles vertes', kcal: 25, portion: '1 portion', g: 150, cat: 'Légumes' },
    { nom: 'Gombo', kcal: 35, portion: '1 portion', g: 120, cat: 'Légumes' },
    { nom: 'Aubergine', kcal: 25, portion: '1 portion', g: 150, cat: 'Légumes' },
    { nom: 'Concombre', kcal: 15, portion: '1/2 concombre', g: 150, cat: 'Légumes' },
    { nom: 'Poivron', kcal: 30, portion: '1 poivron', g: 120, cat: 'Légumes' },
    { nom: 'Salade verte', kcal: 15, portion: 'assiette', g: 80, cat: 'Légumes' },
    { nom: 'Piment frais', kcal: 40, portion: '1 piment', g: 10, cat: 'Légumes' },

    // --- Fruits ---
    { nom: 'Banane douce', kcal: 90, portion: '1 banane', g: 120, cat: 'Fruits' },
    { nom: 'Mangue', kcal: 60, portion: '1 mangue', g: 200, cat: 'Fruits' },
    { nom: 'Orange', kcal: 45, portion: '1 orange', g: 150, cat: 'Fruits' },
    { nom: 'Ananas', kcal: 50, portion: '1 tranche', g: 150, cat: 'Fruits' },
    { nom: 'Papaye', kcal: 45, portion: '1 tranche', g: 200, cat: 'Fruits' },
    { nom: 'Pomme', kcal: 52, portion: '1 pomme', g: 150, cat: 'Fruits' },
    { nom: 'Pastèque', kcal: 30, portion: '1 tranche', g: 250, cat: 'Fruits' },
    { nom: 'Avocat', kcal: 160, portion: '1/2 avocat', g: 100, cat: 'Fruits' },
    { nom: 'Goyave', kcal: 55, portion: '1 goyave', g: 150, cat: 'Fruits' },

    // --- Boissons ---
    { nom: 'Eau', kcal: 0, portion: '1 verre', g: 250, cat: 'Boissons' },
    { nom: 'Café noir sans sucre', kcal: 2, portion: '1 tasse', g: 200, cat: 'Boissons' },
    { nom: 'Thé sans sucre', kcal: 1, portion: '1 verre', g: 200, cat: 'Boissons' },
    { nom: 'Soda (cola)', kcal: 42, portion: '1 canette 33 cl', g: 330, cat: 'Boissons' },
    { nom: 'Jus de fruit industriel', kcal: 45, portion: '1 verre', g: 250, cat: 'Boissons' },
    { nom: 'Jus de bissap sucré', kcal: 45, portion: '1 verre', g: 250, cat: 'Boissons', estime: true },
    { nom: 'Jus de gingembre sucré', kcal: 50, portion: '1 verre', g: 250, cat: 'Boissons', estime: true },
    { nom: 'Bière', kcal: 43, portion: '1 bouteille 33 cl', g: 330, cat: 'Boissons' },

    // --- En-cas / divers ---
    { nom: 'Biscuits secs', kcal: 450, portion: '3 biscuits', g: 30, cat: 'En-cas' },
    { nom: 'Chips', kcal: 530, portion: 'petit paquet', g: 40, cat: 'En-cas' },
    { nom: 'Chocolat noir', kcal: 550, portion: '2 carrés', g: 20, cat: 'En-cas' },
    { nom: 'Beignet (pâte frite)', kcal: 350, portion: '1 beignet', g: 60, cat: 'En-cas', estime: true },
    { nom: 'Croissant', kcal: 400, portion: '1 croissant', g: 60, cat: 'En-cas' },
    { nom: 'Pizza', kcal: 270, portion: '1 part', g: 150, cat: 'Plats', estime: true },
    { nom: 'Hamburger', kcal: 250, portion: '1 burger', g: 220, cat: 'Plats', estime: true },
    { nom: 'Frites', kcal: 310, portion: '1 portion', g: 150, cat: 'Plats' },
    { nom: 'Sandwich (pain + garniture)', kcal: 230, portion: '1 sandwich', g: 200, cat: 'Plats', estime: true }
  ];

  var CATEGORIES = [];
  ALIMENTS.forEach(function (a) {
    if (CATEGORIES.indexOf(a.cat) === -1) CATEGORIES.push(a.cat);
  });

  return { ALIMENTS: ALIMENTS, CATEGORIES: CATEGORIES };
});
