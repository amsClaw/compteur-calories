/* test-logic.js — tests de la logique pure : `npm test` (ou `node app/test-logic.js`)
   Sortie TAP 13 (machine) + résumé lisible (humain), pour être lisible par l'échelle qualité
   comme par un humain. Les 71 assertions ci-dessous sont inchangées. */
var L = require('./logique.js');
var B = require('./base-aliments.js');

var reussis = 0;
var echecs = [];
var resultats = []; /* un point de test TAP par assertion, dans l'ordre d'écriture */

function test(nom, condition, detail) {
  if (condition) { reussis++; resultats.push({ nom: nom, ok: true }); return; }
  echecs.push(nom + (detail ? '  → ' + detail : ''));
  resultats.push({ nom: nom, ok: false, detail: detail });
}
function egal(nom, obtenu, attendu) {
  test(nom, obtenu === attendu, 'obtenu ' + JSON.stringify(obtenu) + ', attendu ' + JSON.stringify(attendu));
}

/* ---------- BMR / TDEE / objectif (Mifflin-St Jeor) ---------- */
egal('BMR homme 30a 70kg 175cm', L.calculerBMR({ sexe: 'h', age: 30, poidsKg: 70, tailleCm: 175 }), 1649);
egal('BMR femme 30a 60kg 165cm', L.calculerBMR({ sexe: 'f', age: 30, poidsKg: 60, tailleCm: 165 }), 1320);
egal('TDEE modéré homme', L.calculerTDEE(1649, 'modere'), 2556);
egal('TDEE sédentaire femme', L.calculerTDEE(1320, 'sedentaire'), 1584);
egal('Objectif perdre = TDEE - 500', L.calculerObjectif(2556, 'perdre'), 2056);
egal('Objectif maintenir = TDEE', L.calculerObjectif(2556, 'maintenir'), 2556);
egal('Objectif prendre = TDEE + 300', L.calculerObjectif(2556, 'prendre'), 2856);
egal('Plancher 1200 kcal', L.calculerObjectif(1500, 'perdre'), 1200);
test('Activité inconnue → erreur explicite', (function () {
  try { L.calculerTDEE(1600, 'sportif-de-haut-niveau'); return false; } catch (e) { return /activité/.test(e.message); }
})());

/* ---------- IMC ---------- */
egal('IMC 70kg / 175cm', L.calculerIMC(70, 175), 22.9);
test('IMC 22.9 = corpulence normale', L.categorieIMC(22.9) === 'Corpulence normale');
test('IMC 31 = obésité', L.categorieIMC(31) === 'Obésité');

/* ---------- Validation profil ---------- */
test('Profil valide accepté', L.validerProfil({ sexe: 'h', age: 35, tailleCm: 178, poidsKg: 82, activite: 'modere', objectif: 'perdre' }).ok);
test('Profil vide → erreurs', L.validerProfil({}).erreurs.length >= 5);
test('Âge aberrant refusé', !L.validerProfil({ sexe: 'h', age: 300, tailleCm: 178, poidsKg: 82, activite: 'modere', objectif: 'perdre' }).ok);
test('Poids en texte refusé', !L.validerProfil({ sexe: 'h', age: 35, tailleCm: 178, poidsKg: '82', activite: 'modere', objectif: 'perdre' }).ok);

/* ---------- Portions ---------- */
egal('150 g de riz à 130 kcal/100g', L.kcalPortion(130, 150), 195);
egal('30 g d\'arachides à 570 kcal/100g', L.kcalPortion(570, 30), 171);
egal('0 g', L.kcalPortion(130, 0), 0);

/* ---------- Recherche d'aliments ---------- */
test('Base ≥ 80 aliments', B.ALIMENTS.length >= 80, B.ALIMENTS.length + ' aliments');
test('Recherche "riz" trouve des plats', L.rechercherAliments(B.ALIMENTS, 'riz').length >= 4);
test('Recherche insensible aux accents ("attieke")', L.rechercherAliments(B.ALIMENTS, 'attieke').length === 1);
test('Recherche insensible à la casse ("POULET")', L.rechercherAliments(B.ALIMENTS, 'POULET').length >= 2);
test('Recherche multi-mots ("sauce arachide")', L.rechercherAliments(B.ALIMENTS, 'sauce arachide').length === 2);
test('Recherche vide → liste complète (limitée)', L.rechercherAliments(B.ALIMENTS, '').length === 30);
test('Recherche sans résultat → tableau vide', L.rechercherAliments(B.ALIMENTS, 'zzzzz').length === 0);
test('Chaque aliment a nom/kcal/portion/g/cat', B.ALIMENTS.every(function (a) {
  return typeof a.nom === 'string' && a.nom && typeof a.kcal === 'number' && typeof a.portion === 'string' && typeof a.g === 'number' && a.g > 0 && typeof a.cat === 'string';
}));

/* ---------- Dates ---------- */
var ref = new Date(2026, 8, 23); // 23 sept 2026
egal('jourISO format', L.jourISO(ref), '2026-09-23');
egal('ajouterJours -1', L.ajouterJours('2026-09-23', -1), '2026-09-22');
egal('ajouterJours +10 (passage de mois)', L.ajouterJours('2026-09-23', 10), '2026-10-03');
egal('libelleJour aujourd\'hui', L.libelleJour('2026-09-23', '2026-09-23'), "Aujourd'hui");
egal('libelleJour hier', L.libelleJour('2026-09-22', '2026-09-23'), 'Hier');
egal('libelleCourt', L.libelleCourt('2026-09-23'), 'mer. 23/9');

/* ---------- Journal ---------- */
var entrees = [];
entrees.push(L.creerEntree({ date: '2026-09-23', repas: 'petit-dej', nom: 'Pain baguette', grammes: 60, kcal100g: 270 }, 'a1'));
entrees.push(L.creerEntree({ date: '2026-09-23', repas: 'dejeuner', nom: 'Riz gras', grammes: 300, kcal100g: 175 }, 'a2'));
entrees.push(L.creerEntree({ date: '2026-09-22', repas: 'diner', nom: 'Poisson braisé', grammes: 250, kcal100g: 165 }, 'a3'));

egal('kcal entrée calculée', entrees[0].kcal, 162);
egal('Total du jour 23/09', L.totalJour(entrees, '2026-09-23'), 162 + 525);
egal('Total du jour 22/09 (isolation)', L.totalJour(entrees, '2026-09-22'), 413);
egal('Total par repas (déjeuner)', L.totalParRepas(entrees, '2026-09-23', 'dejeuner'), 525);
egal('Total d\'un repas vide = 0', L.totalParRepas(entrees, '2026-09-23', 'collation'), 0);
egal('Reste à consommer', L.reste(2056, 687), 1369);
egal('Reste négatif autorisé (dépassement)', L.reste(2000, 2300), -300);
egal('Progression 50%', L.progression(2000, 1000), 0.5);
egal('Progression plafonnée à 1', L.progression(2000, 3000), 1);
egal('Progression sans objectif = 0', L.progression(0, 500), 0);
egal('Suppression d\'entrée', L.supprimerEntree(entrees, 'a1').length, 2);
egal('Suppression d\'un id absent ne change rien', L.supprimerEntree(entrees, 'nope').length, 3);

/* ---------- Validation d'entrée ---------- */
test('Entrée valide acceptée', L.validerEntree({ date: '2026-09-23', repas: 'diner', nom: 'Riz', grammes: 200, kcal100g: 130 }).ok);
test('Entrée sans nom refusée', !L.validerEntree({ date: '2026-09-23', repas: 'diner', nom: '   ', grammes: 200, kcal100g: 130 }).ok);
test('Grammes = 0 refusé', !L.validerEntree({ date: '2026-09-23', repas: 'diner', nom: 'Riz', grammes: 0, kcal100g: 130 }).ok);
test('Quantité de 9 000 g refusée', !L.validerEntree({ date: '2026-09-23', repas: 'diner', nom: 'Riz', grammes: 9000, kcal100g: 130 }).ok);
test('1 000 kcal/100g refusé (impossible)', !L.validerEntree({ date: '2026-09-23', repas: 'diner', nom: 'Riz', grammes: 100, kcal100g: 1000 }).ok);
test('Repas inconnu refusé', !L.validerEntree({ date: '2026-09-23', repas: 'gouter', nom: 'Riz', grammes: 100, kcal100g: 130 }).ok);
test('Date mal formée refusée', !L.validerEntree({ date: '23/09/2026', repas: 'diner', nom: 'Riz', grammes: 100, kcal100g: 130 }).ok);
egal('creerEntree arrondit les grammes', L.creerEntree({ date: '2026-09-23', repas: 'diner', nom: 'Riz', grammes: 199.6, kcal100g: 130 }, 'x').grammes, 200);

/* ---------- Semaine ---------- */
var stats = L.stats7Jours(entrees, '2026-09-23', 2000);
egal('7 jours renvoyés', stats.length, 7);
egal('Le 1er jour est J-6', stats[0].date, '2026-09-17');
egal('Le dernier jour est aujourd\'hui', stats[6].date, '2026-09-23');
egal('Total du dernier jour', stats[6].total, 687);
egal('Écart vs objectif', stats[6].ecart, 687 - 2000);
egal('Moyenne des jours renseignés', L.moyenne(stats), Math.round((413 + 687) / 2));
egal('Moyenne à 0 sans donnée', L.moyenne([{ total: 0 }, { total: 0 }]), 0);

/* ---------- Sécurité & formats ---------- */
egal('Échappement XSS', L.echapper('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
egal('Échappement apostrophe', L.echapper("riz d'arachide"), 'riz d&#39;arachide');
egal('Échappement null', L.echapper(null), '');
egal('valeurNumerique "12,5"', L.valeurNumerique('12,5'), 12.5);
egal('valeurNumerique "1 234,5"', L.valeurNumerique('1 234,5'), 1234.5);
test('valeurNumerique "abc" → NaN', isNaN(L.valeurNumerique('abc')));
test('valeurNumerique "" → NaN', isNaN(L.valeurNumerique('')));
egal('Repas selon heure 8h', L.repasSelonHeure(8), 'petit-dej');
egal('Repas selon heure 13h', L.repasSelonHeure(13), 'dejeuner');
egal('Repas selon heure 16h', L.repasSelonHeure(16), 'collation');
egal('Repas selon heure 21h', L.repasSelonHeure(21), 'diner');

/* ---------- Résultat ---------- */
var total = reussis + echecs.length;

/* Sortie TAP 13 : un point de test par assertion, plan 1..N — lisible par un outil. */
console.log('TAP version 13');
resultats.forEach(function (r, i) {
  console.log((r.ok ? 'ok ' : 'not ok ') + (i + 1) + ' - ' + r.nom + (r.ok || !r.detail ? '' : '  → ' + r.detail));
});
console.log('1..' + total);
console.log('# tests ' + total);
console.log('# pass ' + reussis);
console.log('# fail ' + echecs.length);

if (echecs.length) {
  console.log('\n✗ ' + echecs.length + '/' + total + ' tests en échec :\n');
  echecs.forEach(function (e) { console.log('  - ' + e); });
  console.log('');
  process.exit(1);
}
console.log('✓ ' + reussis + '/' + total + ' tests OK');
process.exit(0);
