/* logique.js — logique PURE du compteur de calories (aucun accès DOM, testable avec node) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logique = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COEF_ACTIVITE = {
    sedentaire: 1.2,   // peu ou pas d'exercice
    leger: 1.375,      // 1-3 séances / semaine
    modere: 1.55,      // 3-5 séances / semaine
    actif: 1.725,      // 6-7 séances / semaine
    tres_actif: 1.9    // métier physique + sport
  };

  var LIBELLE_ACTIVITE = {
    sedentaire: 'Peu ou pas de sport',
    leger: '1 à 3 séances / semaine',
    modere: '3 à 5 séances / semaine',
    actif: '6 à 7 séances / semaine',
    tres_actif: 'Métier physique + sport'
  };

  var REPAS = ['petit-dej', 'dejeuner', 'collation', 'diner'];

  var LIBELLE_REPAS = {
    'petit-dej': 'Petit-déjeuner',
    'dejeuner': 'Déjeuner',
    'collation': 'Collation',
    'diner': 'Dîner'
  };

  var JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  var JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS_COURTS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

  function arrondi(n, decimales) {
    var f = Math.pow(10, decimales || 0);
    return Math.round(n * f) / f;
  }

  function estNombre(v) {
    return typeof v === 'number' && isFinite(v);
  }

  /* ---------- Profil / besoins ---------- */

  // Mifflin-St Jeor
  function calculerBMR(p) {
    var base = 10 * p.poidsKg + 6.25 * p.tailleCm - 5 * p.age;
    return arrondi(p.sexe === 'f' ? base - 161 : base + 5, 0);
  }

  function calculerTDEE(bmr, activite) {
    var c = COEF_ACTIVITE[activite];
    if (!c) throw new Error('niveau d\'activité inconnu : ' + activite);
    return arrondi(bmr * c, 0);
  }

  // Déficit 500 kcal/j = ~0,5 kg/semaine ; surplus 300 kcal/j
  function calculerObjectif(tdee, objectif) {
    if (objectif === 'perdre') return Math.max(1200, arrondi(tdee - 500, 0));
    if (objectif === 'prendre') return arrondi(tdee + 300, 0);
    return arrondi(tdee, 0);
  }

  function calculerIMC(poidsKg, tailleCm) {
    var m = tailleCm / 100;
    return arrondi(poidsKg / (m * m), 1);
  }

  function categorieIMC(imc) {
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Corpulence normale';
    if (imc < 30) return 'Surpoids';
    return 'Obésité';
  }

  function validerProfil(p) {
    var e = [];
    if (!p || typeof p !== 'object') return { ok: false, erreurs: ['Profil absent'] };
    if (p.sexe !== 'h' && p.sexe !== 'f') e.push('Sexe : choisis homme ou femme.');
    if (!estNombre(p.age) || p.age < 10 || p.age > 110) e.push('Âge : un nombre entre 10 et 110.');
    if (!estNombre(p.tailleCm) || p.tailleCm < 100 || p.tailleCm > 230) e.push('Taille : entre 100 et 230 cm.');
    if (!estNombre(p.poidsKg) || p.poidsKg < 25 || p.poidsKg > 300) e.push('Poids : entre 25 et 300 kg.');
    if (!COEF_ACTIVITE[p.activite]) e.push('Activité : choisis un niveau dans la liste.');
    if (['perdre', 'maintenir', 'prendre'].indexOf(p.objectif) === -1) e.push('Objectif : perdre, maintenir ou prendre.');
    return { ok: e.length === 0, erreurs: e };
  }

  /* ---------- Aliments & portions ---------- */

  function kcalPortion(kcal100g, grammes) {
    return arrondi((kcal100g * grammes) / 100, 0);
  }

  function normaliser(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function rechercherAliments(base, requete, limite) {
    var q = normaliser(requete);
    var max = limite || 30;
    if (!q) return base.slice(0, max);
    var mots = q.split(' ');
    return base.filter(function (a) {
      var cible = normaliser(a.nom + ' ' + (a.cat || ''));
      return mots.every(function (m) { return cible.indexOf(m) !== -1; });
    }).slice(0, max);
  }

  /* ---------- Journal ---------- */

  function jourISO(d) {
    var an = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var j = String(d.getDate()).padStart(2, '0');
    return an + '-' + mo + '-' + j;
  }

  function depuisISO(iso) {
    var p = String(iso).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function ajouterJours(iso, n) {
    var d = depuisISO(iso);
    d.setDate(d.getDate() + n);
    return jourISO(d);
  }

  function libelleJour(iso, aujourdhui) {
    if (iso === aujourdhui) return "Aujourd'hui";
    if (iso === ajouterJours(aujourdhui, -1)) return 'Hier';
    var d = depuisISO(iso);
    return JOURS_LONGS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_COURTS[d.getMonth()];
  }

  function libelleCourt(iso) {
    var d = depuisISO(iso);
    return JOURS_COURTS[d.getDay()] + '. ' + d.getDate() + '/' + (d.getMonth() + 1);
  }

  function entreesDuJour(entrees, iso) {
    return (entrees || []).filter(function (e) { return e.date === iso; });
  }

  function totalJour(entrees, iso) {
    return entreesDuJour(entrees, iso).reduce(function (s, e) { return s + (Number(e.kcal) || 0); }, 0);
  }

  function totalParRepas(entrees, iso, repas) {
    return entreesDuJour(entrees, iso)
      .filter(function (e) { return e.repas === repas; })
      .reduce(function (s, e) { return s + (Number(e.kcal) || 0); }, 0);
  }

  function reste(objectif, total) {
    return objectif - total;
  }

  function progression(objectif, total) {
    if (!objectif) return 0;
    return Math.max(0, Math.min(1, total / objectif));
  }

  function validerEntree(e) {
    var err = [];
    if (!e || typeof e !== 'object') return { ok: false, erreurs: ['Entrée absente'] };
    if (!String(e.nom || '').trim()) err.push('Donne un nom à l\'aliment.');
    if (!estNombre(Number(e.grammes)) || Number(e.grammes) <= 0) err.push('Quantité en grammes : nombre positif.');
    if (Number(e.grammes) > 5000) err.push('Quantité invraisemblable (max 5000 g).');
    if (!estNombre(Number(e.kcal100g)) || Number(e.kcal100g) < 0) err.push('Calories pour 100 g : nombre positif.');
    if (Number(e.kcal100g) > 900) err.push('Max 900 kcal / 100 g (huile = 900).');
    if (REPAS.indexOf(e.repas) === -1) err.push('Repas inconnu.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date))) err.push('Date invalide.');
    return { ok: err.length === 0, erreurs: err };
  }

  function creerEntree(e, id) {
    var v = validerEntree(e);
    if (!v.ok) throw new Error(v.erreurs.join(' '));
    var g = Number(e.grammes);
    return {
      id: id || ('e' + Date.now() + Math.floor(Math.random() * 1000)),
      date: e.date,
      repas: e.repas,
      nom: String(e.nom).trim(),
      grammes: arrondi(g, 0),
      kcal100g: arrondi(Number(e.kcal100g), 0),
      kcal: kcalPortion(Number(e.kcal100g), g)
    };
  }

  function supprimerEntree(entrees, id) {
    return entrees.filter(function (e) { return e.id !== id; });
  }

  /* ---------- Semaine ---------- */

  function stats7Jours(entrees, aujourdhui, objectif) {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var iso = ajouterJours(aujourdhui, -i);
      var t = totalJour(entrees, iso);
      out.push({
        date: iso,
        label: libelleCourt(iso),
        total: t,
        objectif: objectif,
        progression: progression(objectif, t),
        ecart: t - objectif
      });
    }
    return out;
  }

  function moyenne(stats) {
    var jours = stats.filter(function (s) { return s.total > 0; });
    if (!jours.length) return 0;
    return arrondi(jours.reduce(function (s, j) { return s + j.total; }, 0) / jours.length, 0);
  }

  /* ---------- Divers ---------- */

  function echapper(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formaterNombre(n) {
    try { return new Intl.NumberFormat('fr-FR').format(n); }
    catch (e) { return String(n); }
  }

  function valeurNumerique(s) {
    // accepte "1 234,5" ou "1234.5" ou "12,5"
    if (typeof s === 'number') return s;
    var t = String(s == null ? '' : s).replace(/\s|\u00a0|\u202f/g, '').replace(',', '.');
    if (!t || !/^-?\d*\.?\d*$/.test(t)) return NaN;
    return t === '' ? NaN : Number(t);
  }

  function repasSelonHeure(heure) {
    var h = estNombre(heure) ? heure : new Date().getHours();
    if (h < 11) return 'petit-dej';
    if (h < 15) return 'dejeuner';
    if (h < 18) return 'collation';
    return 'diner';
  }

  return {
    COEF_ACTIVITE: COEF_ACTIVITE,
    LIBELLE_ACTIVITE: LIBELLE_ACTIVITE,
    REPAS: REPAS,
    LIBELLE_REPAS: LIBELLE_REPAS,
    arrondi: arrondi,
    estNombre: estNombre,
    calculerBMR: calculerBMR,
    calculerTDEE: calculerTDEE,
    calculerObjectif: calculerObjectif,
    calculerIMC: calculerIMC,
    categorieIMC: categorieIMC,
    validerProfil: validerProfil,
    kcalPortion: kcalPortion,
    normaliser: normaliser,
    rechercherAliments: rechercherAliments,
    jourISO: jourISO,
    depuisISO: depuisISO,
    ajouterJours: ajouterJours,
    libelleJour: libelleJour,
    libelleCourt: libelleCourt,
    entreesDuJour: entreesDuJour,
    totalJour: totalJour,
    totalParRepas: totalParRepas,
    reste: reste,
    progression: progression,
    validerEntree: validerEntree,
    creerEntree: creerEntree,
    supprimerEntree: supprimerEntree,
    stats7Jours: stats7Jours,
    moyenne: moyenne,
    echapper: echapper,
    formaterNombre: formaterNombre,
    valeurNumerique: valeurNumerique,
    repasSelonHeure: repasSelonHeure
  };
});
