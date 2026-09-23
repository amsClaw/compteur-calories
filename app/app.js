/* app.js — interface du compteur de calories (tout est local, rien n'est envoyé) */
(function () {
  'use strict';

  var L = window.Logique;
  var B = window.BaseAliments;

  var CLE = 'mes-calories-v1';
  var OBJECTIF_DEFAUT = 2000;

  /* ---------- État ---------- */
  var etat = charger();
  var ecran = 'jour';
  var jourAffiche = L.jourISO(new Date());

  var feuille = { ouvert: false, mode: 'liste', repas: 'dejeuner', requete: '', aliment: null, grammes: null };

  function etatVide() {
    return { version: 1, profil: null, entrees: [], perso: [], objectifManuel: null, cree: new Date().toISOString() };
  }

  function charger() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return etatVide();
      var o = JSON.parse(brut);
      if (!o || typeof o !== 'object') return etatVide();
      return {
        version: 1,
        profil: o.profil || null,
        entrees: Array.isArray(o.entrees) ? o.entrees : [],
        perso: Array.isArray(o.perso) ? o.perso : [],
        objectifManuel: typeof o.objectifManuel === 'number' ? o.objectifManuel : null,
        cree: o.cree || new Date().toISOString()
      };
    } catch (e) {
      return etatVide();
    }
  }

  function sauvegarder() {
    try {
      localStorage.setItem(CLE, JSON.stringify(etat));
    } catch (e) {
      toast('Impossible d\'enregistrer (stockage plein ?)');
    }
  }

  function stockageDisponible() {
    try {
      localStorage.setItem('__test_stockage', '1');
      localStorage.removeItem('__test_stockage');
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Calculs dérivés ---------- */
  function objectifDuJour() {
    if (etat.objectifManuel) return etat.objectifManuel;
    if (etat.profil) {
      var v = L.validerProfil(etat.profil);
      if (v.ok) return L.calculerObjectif(L.calculerTDEE(L.calculerBMR(etat.profil), etat.profil.activite), etat.profil.objectif);
    }
    return OBJECTIF_DEFAUT;
  }

  function alimentComplet(a) {
    return { nom: a.nom, kcal: a.kcal, portion: a.portion, g: a.g, cat: a.cat, estime: !!a.estime };
  }

  function baseComplete() {
    var perso = etat.perso.map(function (p) {
      return { nom: p.nom, kcal: p.kcal100g, portion: '100 g', g: 100, cat: 'Mes aliments', estime: false };
    });
    return perso.concat(B.ALIMENTS);
  }

  /* ---------- Utilitaires d'affichage ---------- */
  var el = {
    vue: document.getElementById('vue'),
    date: document.getElementById('entete-date'),
    boutonJour: document.getElementById('bouton-aujourdhui'),
    voile: document.getElementById('voile'),
    feuille: document.getElementById('feuille'),
    feuilleTitre: document.getElementById('feuille-titre'),
    feuilleCorps: document.getElementById('feuille-corps'),
    toast: document.getElementById('toast')
  };

  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 1800);
  }

  function n(x) { return L.formaterNombre(x); }

  /* ---------- Écran « Aujourd'hui » ---------- */
  function vueJour() {
    var total = L.totalJour(etat.entrees, jourAffiche);
    var objectif = objectifDuJour();
    var reste = L.reste(objectif, total);
    var p = L.progression(objectif, total);
    var depasse = reste < 0;
    var C = 2 * Math.PI * 70;
    var offset = C * (1 - p);

    var html = '';
    html += '<section class="carte ring-card">';
    html += '<div class="ring' + (depasse ? ' depasse' : '') + '" id="ring">';
    html += '<svg viewBox="0 0 160 160" aria-hidden="true">';
    html += '<circle class="fond-cercle" cx="80" cy="80" r="70"></circle>';
    html += '<circle class="jauge" cx="80" cy="80" r="70" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"></circle>';
    html += '</svg>';
    html += '<div class="ring-centre">';
    html += '<div class="ring-reste' + (depasse ? ' depasse' : '') + '" id="valeur-reste">' + n(Math.abs(reste)) + '</div>';
    html += '<div class="ring-legende">' + (depasse ? 'kcal en trop' : 'kcal restantes') + '</div>';
    html += '</div></div>';
    html += '<p class="ring-detail">Consommé <b>' + n(total) + '</b> / Objectif <b>' + n(objectif) + '</b> kcal</p>';
    html += '</section>';

    html += '<section class="carte serre">';
    html += '<div class="duo" style="align-items:center">';
    html += '<button type="button" class="bouton discret mini" data-act="jour-prec">← Hier</button>';
    html += '<div style="text-align:center;font-weight:700;color:var(--encre)">' + L.echapper(L.libelleJour(jourAffiche, L.jourISO(new Date()))) + '</div>';
    html += '<button type="button" class="bouton discret mini" data-act="jour-suiv"' + (jourAffiche >= L.jourISO(new Date()) ? ' disabled style="opacity:.4"' : '') + '>Suivant →</button>';
    html += '</div></section>';

    L.REPAS.forEach(function (repas) {
      var lignes = L.entreesDuJour(etat.entrees, jourAffiche).filter(function (e) { return e.repas === repas; });
      var totRepas = L.totalParRepas(etat.entrees, jourAffiche, repas);
      html += '<section class="carte repas">';
      html += '<div class="repas-entete"><span class="repas-nom">' + L.LIBELLE_REPAS[repas] + '</span>';
      html += '<span class="repas-total">' + (lignes.length ? n(totRepas) + ' kcal' : '—') + '</span></div>';
      if (!lignes.length) {
        html += '<p class="vide">Rien d\'enregistré.</p>';
      } else {
        lignes.forEach(function (e) {
          html += '<div class="ligne-aliment">';
          html += '<div class="lal-nom"><b>' + L.echapper(e.nom) + '</b><span>' + n(e.grammes) + ' g</span></div>';
          html += '<div class="lal-kcal">' + n(e.kcal) + ' kcal</div>';
          html += '<button type="button" class="suppr" data-act="suppr" data-id="' + L.echapper(e.id) + '" aria-label="Supprimer">✕</button>';
          html += '</div>';
        });
      }
      html += '<button type="button" class="bouton-ajout" data-act="ajout" data-repas="' + repas + '">+ Ajouter</button>';
      html += '</section>';
    });

    return html;
  }

  /* ---------- Écran « Semaine » ---------- */
  function vueSemaine() {
    var objectif = objectifDuJour();
    var stats = L.stats7Jours(etat.entrees, L.jourISO(new Date()), objectif);
    var moy = L.moyenne(stats);
    var html = '';

    html += '<section class="carte">';
    html += '<h3>7 derniers jours</h3>';
    stats.forEach(function (s) {
      var largeur = Math.round(s.progression * 100);
      html += '<div class="barre-jour">';
      html += '<div class="bj-label">' + L.echapper(s.label) + '</div>';
      html += '<div class="bj-piste"><div class="bj-remplissage' + (s.total > objectif ? ' depasse' : '') + '" style="width:' + largeur + '%"></div></div>';
      html += '<div class="bj-valeur' + (s.total ? '' : ' vide') + '">' + (s.total ? n(s.total) : '—') + '</div>';
      html += '</div>';
    });
    html += '<p class="note">Barres bleu-vert = sous l\'objectif (' + n(objectif) + ' kcal). Rouge = dépassement. La ligne grise "—" signifie aucun repas enregistré.</p>';
    html += '</section>';

    html += '<section class="carte">';
    html += '<div class="ligne-calc"><span>Moyenne (jours notés)</span><b>' + n(moy) + ' kcal</b></div>';
    html += '<div class="ligne-calc"><span>Objectif</span><b>' + n(objectif) + ' kcal</b></div>';
    html += '<div class="ligne-calc fort"><span>Écart moyen</span><b>' + (moy ? (moy - objectif > 0 ? '+' : '') + n(moy - objectif) : '—') + ' kcal</b></div>';
    html += '<p class="note" style="margin-top:8px">Repère : environ 7 700 kcal = 1 kg de graisse. Un écart de −500 kcal/jour ≈ −0,5 kg par semaine.</p>';
    html += '</section>';

    return html;
  }

  /* ---------- Écran « Profil » ---------- */
  function vueProfil() {
    var p = etat.profil || { sexe: 'h', age: '', tailleCm: '', poidsKg: '', activite: 'modere', objectif: 'perdre' };
    var html = '';

    if (!etat.profil && !etat.objectifManuel) {
      html += '<div class="carte" style="border-color:var(--orange)">';
      html += '<h3>👋 Commence ici</h3>';
      html += '<p class="note">Ton objectif est pour l\'instant fixé à <b>' + n(OBJECTIF_DEFAUT) + ' kcal</b> (valeur passe-partout). Renseigne ton profil ci-dessous pour un objectif calculé pour toi (formule de Mifflin-St Jeor). Rien ne sort de ton téléphone.</p>';
      html += '</div>';
    }

    html += '<section class="carte">';
    html += '<h3>Mon profil</h3>';
    html += '<div class="champ"><label for="inp-sexe">Sexe</label><select id="inp-sexe">';
    html += '<option value="h"' + (p.sexe === 'h' ? ' selected' : '') + '>Homme</option>';
    html += '<option value="f"' + (p.sexe === 'f' ? ' selected' : '') + '>Femme</option>';
    html += '</select></div>';
    html += '<div class="duo">';
    html += '<div class="champ"><label for="inp-age">Âge (ans)</label><input type="text" inputmode="numeric" id="inp-age" value="' + L.echapper(p.age) + '" placeholder="35"></div>';
    html += '<div class="champ"><label for="inp-taille">Taille (cm)</label><input type="text" inputmode="numeric" id="inp-taille" value="' + L.echapper(p.tailleCm) + '" placeholder="175"></div>';
    html += '</div>';
    html += '<div class="champ"><label for="inp-poids">Poids (kg)</label><input type="text" inputmode="decimal" id="inp-poids" value="' + L.echapper(p.poidsKg) + '" placeholder="75"></div>';
    html += '<div class="champ"><label for="inp-activite">Activité physique</label><select id="inp-activite">';
    Object.keys(L.COEF_ACTIVITE).forEach(function (k) {
      html += '<option value="' + k + '"' + (p.activite === k ? ' selected' : '') + '>' + L.echapper(L.LIBELLE_ACTIVITE[k]) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="champ"><label for="inp-objectif">Mon but</label><select id="inp-objectif">';
    [['perdre', 'Perdre du poids (déficit 500 kcal/j)'], ['maintenir', 'Maintenir mon poids'], ['prendre', 'Prendre du poids (+300 kcal/j)']].forEach(function (o) {
      html += '<option value="' + o[0] + '"' + (p.objectif === o[0] ? ' selected' : '') + '>' + L.echapper(o[1]) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="champ"><label for="inp-manuel">Objectif manuel en kcal (facultatif — remplace le calcul)</label>';
    html += '<input type="text" inputmode="numeric" id="inp-manuel" value="' + (etat.objectifManuel ? String(etat.objectifManuel) : '') + '" placeholder="vide = calcul automatique"></div>';

    html += '<div class="jauge-calc" id="calc-apercu"></div>';
    html += '<div id="zone-erreurs"></div>';
    html += '<button type="button" class="bouton" data-act="enregistrer-profil" style="margin-top:12px">Enregistrer</button>';
    html += '</section>';

    html += '<section class="carte">';
    html += '<h3>Mes données</h3>';
    html += '<div class="ligne-calc"><span>Repas enregistrés</span><b>' + etat.entrees.length + '</b></div>';
    html += '<div class="ligne-calc"><span>Mes aliments perso</span><b>' + etat.perso.length + '</b></div>';
    html += '<div class="duo" style="margin-top:12px">';
    html += '<button type="button" class="bouton secondaire mini" data-act="exporter">Exporter (JSON)</button>';
    html += '<button type="button" class="bouton secondaire mini" data-act="importer">Importer</button>';
    html += '</div>';
    html += '<input type="file" id="fichier-import" accept="application/json,.json" hidden>';
    html += '<button type="button" class="bouton danger" data-act="reset" style="margin-top:10px">Tout effacer</button>';
    html += '<p class="note" style="margin-top:10px">⚠️ Les valeurs de la base sont <b>indicatives</b> (cuisson, huile et quantités varient beaucoup). Les plats locaux marqués ≈ sont des estimations grossières : ajuste avec tes propres repas. L\'app ne remplace pas un avis médical ou diététique.</p>';
    html += '</section>';

    return html;
  }

  /* ---------- Rendu ---------- */
  function rendre() {
    var aujourdhui = L.jourISO(new Date());
    el.date.textContent = L.libelleJour(jourAffiche, aujourdhui) + ' · ' + L.formaterNombre(L.totalJour(etat.entrees, jourAffiche)) + ' kcal';
    el.boutonJour.hidden = (jourAffiche === aujourdhui);

    if (ecran === 'jour') el.vue.innerHTML = vueJour();
    else if (ecran === 'semaine') el.vue.innerHTML = vueSemaine();
    else el.vue.innerHTML = vueProfil();

    Array.prototype.forEach.call(document.querySelectorAll('.onglet'), function (b) {
      b.classList.toggle('actif', b.getAttribute('data-ecran') === ecran);
    });

    if (ecran === 'profil') majApercu();
    rendreFeuille();
  }

  /* ---------- Aperçu du calcul sur l'écran Profil ---------- */
  function lireProfilFormulaire() {
    return {
      sexe: document.getElementById('inp-sexe').value,
      age: L.valeurNumerique(document.getElementById('inp-age').value),
      tailleCm: L.valeurNumerique(document.getElementById('inp-taille').value),
      poidsKg: L.valeurNumerique(document.getElementById('inp-poids').value),
      activite: document.getElementById('inp-activite').value,
      objectif: document.getElementById('inp-objectif').value
    };
  }

  function majApercu() {
    var zone = document.getElementById('calc-apercu');
    if (!zone) return;
    var p = lireProfilFormulaire();
    var manuel = L.valeurNumerique(document.getElementById('inp-manuel').value);
    var html = '';
    if (p.age && p.tailleCm && p.poidsKg) {
      var bmr = L.calculerBMR(p);
      var tdee = L.calculerTDEE(bmr, p.activite);
      var obj = L.calculerObjectif(tdee, p.objectif);
      var imc = L.calculerIMC(p.poidsKg, p.tailleCm);
      html += '<div class="ligne-calc"><span>Métabolisme de base</span><b>' + n(bmr) + ' kcal</b></div>';
      html += '<div class="ligne-calc"><span>Avec ton activité</span><b>' + n(tdee) + ' kcal</b></div>';
      html += '<div class="ligne-calc fort"><span>Objectif conseillé</span><b>' + n(obj) + ' kcal</b></div>';
      html += '<div class="ligne-calc"><span>IMC</span><b>' + String(imc).replace('.', ',') + ' — ' + L.categorieIMC(imc) + '</b></div>';
      if (manuel) html += '<p class="note" style="margin-top:8px">Objectif manuel actif : <b>' + n(manuel) + ' kcal</b> (remplace le calcul).</p>';
    } else {
      html += '<p class="note">Renseigne âge, taille et poids pour voir ton objectif calculé.</p>';
    }
    zone.innerHTML = html;
  }

  /* ---------- Feuille d'ajout ---------- */
  function ouvrirFeuille(repas) {
    feuille.ouvert = true;
    feuille.mode = 'liste';
    feuille.repas = repas || L.repasSelonHeure();
    feuille.requete = '';
    feuille.aliment = null;
    feuille.grammes = null;
    el.voile.hidden = false;
    el.feuille.hidden = false;
    rendreFeuille();
    var champ = document.getElementById('inp-recherche');
    if (champ) champ.focus();
  }

  function fermerFeuille() {
    feuille.ouvert = false;
    el.voile.hidden = true;
    el.feuille.hidden = true;
  }

  function rendreFeuille() {
    if (!feuille.ouvert) return;
    el.feuilleTitre.textContent = 'Ajouter — ' + L.LIBELLE_REPAS[feuille.repas];
    if (feuille.mode === 'liste') el.feuilleCorps.innerHTML = feuilleListe();
    else if (feuille.mode === 'quantite') el.feuilleCorps.innerHTML = feuilleQuantite();
    else el.feuilleCorps.innerHTML = feuilleLibre();
  }

  function feuilleListe() {
    var base = baseComplete();
    var res = L.rechercherAliments(base, feuille.requete, 25);
    var html = '';
    html += '<div class="champ"><input type="text" id="inp-recherche" placeholder="Chercher : riz, poulet, mango…" value="' + L.echapper(feuille.requete) + '" autocomplete="off"></div>';
    html += '<div class="chips" id="chips-repas">';
    L.REPAS.forEach(function (r) {
      html += '<button type="button" class="chip' + (feuille.repas === r ? ' actif' : '') + '" data-act="repas" data-repas="' + r + '">' + L.libelleCourtRepas(r) + '</button>';
    });
    html += '</div>';
    html += '<button type="button" class="lien" data-act="libre">Saisie libre (aliment absent de la liste)</button>';
    html += '<div id="liste-resultats">' + resultatsHtml(res) + '</div>';
    return html;
  }

  function resultatsHtml(res) {
    if (!res.length) return '<p class="vide">Aucun aliment trouvé. Utilise la saisie libre ci-dessus.</p>';
    var html = '';
    res.forEach(function (a, i) {
      var kcalPortion = L.kcalPortion(a.kcal, a.g);
      html += '<button type="button" class="resultat" data-act="choisir" data-index="' + i + '">';
      html += '<span><b>' + L.echapper(a.nom) + (a.estime ? ' ≈' : '') + '</b>';
      html += '<span>' + L.echapper(a.cat) + ' · ' + L.echapper(a.portion) + ' (' + n(a.g) + ' g)</span></span>';
      html += '<span class="r-kcal">' + n(kcalPortion) + ' kcal</span>';
      html += '</button>';
    });
    return html;
  }

  // petit helper local pour les libellés courts
  L.libelleCourtRepas = function (r) {
    return { 'petit-dej': 'Petit-déj', 'dejeuner': 'Déjeuner', 'collation': 'Collation', 'diner': 'Dîner' }[r] || r;
  };

  function feuilleQuantite() {
    var a = feuille.aliment;
    var g = feuille.grammes == null ? a.g : feuille.grammes;
    var kcal = L.kcalPortion(a.kcal, g);
    var portions = [[a.portion, a.g], ['50 g', 50], ['100 g', 100], ['200 g', 200], ['300 g', 300]];
    var html = '';
    html += '<h3 style="margin-bottom:2px">' + L.echapper(a.nom) + (a.estime ? ' ≈' : '') + '</h3>';
    html += '<p class="info">' + n(a.kcal) + ' kcal pour 100 g' + (a.estime ? ' (estimation)' : '') + '</p>';
    html += '<div class="chips" style="margin-top:12px">';
    portions.forEach(function (p) {
      html += '<button type="button" class="chip' + (g === p[1] ? ' actif' : '') + '" data-act="portion" data-g="' + p[1] + '">' + L.echapper(p[0]) + '</button>';
    });
    html += '</div>';
    html += '<div class="champ"><label for="inp-grammes">Quantité (g)</label><input type="text" inputmode="decimal" id="inp-grammes" value="' + String(g).replace('.', ',') + '"></div>';
    html += '<div class="calcul-live" id="calcul-live">' + n(kcal) + ' kcal<small>pour cette quantité</small></div>';
    html += '<div id="zone-erreurs"></div>';
    html += '<button type="button" class="bouton" data-act="valider-quantite">Ajouter au ' + L.echapper(L.LIBELLE_REPAS[feuille.repas].toLowerCase()) + '</button>';
    html += '<button type="button" class="lien" data-act="retour-liste" style="margin-top:8px">← Changer d\'aliment</button>';
    return html;
  }

  function feuilleLibre() {
    var html = '';
    html += '<div class="champ"><label for="inp-libre-nom">Nom de l\'aliment</label><input type="text" id="inp-libre-nom" placeholder="Ex. riz sauce arachide maison"></div>';
    html += '<div class="duo">';
    html += '<div class="champ"><label for="inp-libre-100g">kcal pour 100 g</label><input type="text" inputmode="decimal" id="inp-libre-100g" placeholder="175"></div>';
    html += '<div class="champ"><label for="inp-libre-g">Quantité (g)</label><input type="text" inputmode="decimal" id="inp-libre-g" placeholder="300"></div>';
    html += '</div>';
    html += '<div class="calcul-live" id="calcul-live">0 kcal<small>total estimé</small></div>';
    html += '<label style="display:flex;align-items:center;gap:8px;font-weight:400;margin-bottom:10px"><input type="checkbox" id="memoriser" style="width:20px;height:20px"> Garder cet aliment dans mes favoris</label>';
    html += '<div id="zone-erreurs"></div>';
    html += '<button type="button" class="bouton" data-act="valider-libre">Ajouter au ' + L.echapper(L.LIBELLE_REPAS[feuille.repas].toLowerCase()) + '</button>';
    html += '<button type="button" class="lien" data-act="retour-liste" style="margin-top:8px">← Revenir à la liste</button>';
    return html;
  }

  /* ---------- Actions ---------- */
  function ajouter(entree, memoriser) {
    var v = L.validerEntree(entree);
    if (!v.ok) { afficherErreurs(v.erreurs); return false; }
    etat.entrees.push(L.creerEntree(entree));
    if (memoriser) {
      etat.perso.push({ nom: entree.nom, kcal100g: Number(entree.kcal100g) });
    }
    sauvegarder();
    fermerFeuille();
    jourAffiche = entree.date;
    ecran = 'jour';
    rendre();
    toast('Ajouté : ' + entree.nom);
    return true;
  }

  function afficherErreurs(liste) {
    var zone = document.getElementById('zone-erreurs');
    if (!zone) { toast(liste[0]); return; }
    zone.innerHTML = '<div class="erreurs"><b>À corriger :</b><ul>' + liste.map(function (e) {
      return '<li>' + L.echapper(e) + '</li>';
    }).join('') + '</ul></div>';
  }

  function enregistrerProfil() {
    var p = lireProfilFormulaire();
    var manuelBrut = document.getElementById('inp-manuel').value;
    var manuel = L.valeurNumerique(manuelBrut);
    var v = L.validerProfil(p);
    if (!v.ok) { afficherErreurs(v.erreurs); return; }
    if (manuelBrut.trim() !== '' && (isNaN(manuel) || manuel < 800 || manuel > 6000)) {
      afficherErreurs(['Objectif manuel : un nombre entre 800 et 6000 kcal (ou vide).']);
      return;
    }
    etat.profil = p;
    etat.objectifManuel = manuelBrut.trim() === '' ? null : Math.round(manuel);
    sauvegarder();
    rendre();
    toast('Profil enregistré ✓ Objectif : ' + L.formaterNombre(objectifDuJour()) + ' kcal');
  }

  function exporter() {
    var donnees = JSON.stringify(etat, null, 2);
    var blob = new Blob([donnees], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mes-calories-' + L.jourISO(new Date()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Sauvegarde exportée ✓');
  }

  function importerDepuisTexte(txt) {
    try {
      var o = JSON.parse(txt);
      if (!o || !Array.isArray(o.entrees)) throw new Error('format');
      etat = {
        version: 1,
        profil: o.profil || null,
        entrees: o.entrees,
        perso: Array.isArray(o.perso) ? o.perso : [],
        objectifManuel: typeof o.objectifManuel === 'number' ? o.objectifManuel : null,
        cree: o.cree || new Date().toISOString()
      };
      sauvegarder();
      rendre();
      toast(etat.entrees.length + ' repas importés ✓');
    } catch (e) {
      toast('Fichier illisible : ce n\'est pas une sauvegarde de l\'app.');
    }
  }

  document.addEventListener('click', function (ev) {
    var cible = ev.target.closest ? ev.target.closest('[data-act]') : null;

    var onglet = ev.target.closest ? ev.target.closest('.onglet') : null;
    if (onglet) { ecran = onglet.getAttribute('data-ecran'); rendre(); window.scrollTo(0, 0); return; }

    if (!cible) {
      if (ev.target.id === 'fermer-feuille' || ev.target.id === 'voile') fermerFeuille();
      return;
    }
    var act = cible.getAttribute('data-act');

    if (act === 'ajout') { ouvrirFeuille(cible.getAttribute('data-repas')); return; }
    if (act === 'suppr') {
      etat.entrees = L.supprimerEntree(etat.entrees, cible.getAttribute('data-id'));
      sauvegarder(); rendre(); toast('Supprimé');
      return;
    }
    if (act === 'jour-prec') { jourAffiche = L.ajouterJours(jourAffiche, -1); rendre(); return; }
    if (act === 'jour-suiv') {
      var auj = L.jourISO(new Date());
      if (jourAffiche < auj) { jourAffiche = L.ajouterJours(jourAffiche, 1); rendre(); }
      return;
    }
    if (act === 'repas') { feuille.repas = cible.getAttribute('data-repas'); rendreFeuille(); return; }
    if (act === 'choisir') {
      var base = baseComplete();
      var res = L.rechercherAliments(base, feuille.requete, 25);
      var a = res[Number(cible.getAttribute('data-index'))];
      if (!a) return;
      feuille.aliment = a;
      feuille.grammes = a.g;
      feuille.mode = 'quantite';
      rendreFeuille();
      return;
    }
    if (act === 'portion') {
      feuille.grammes = Number(cible.getAttribute('data-g'));
      var inp = document.getElementById('inp-grammes');
      if (inp) inp.value = String(feuille.grammes).replace('.', ',');
      rendreFeuille();
      return;
    }
    if (act === 'retour-liste') { feuille.mode = 'liste'; rendreFeuille(); return; }
    if (act === 'libre') { feuille.mode = 'libre'; rendreFeuille(); return; }
    if (act === 'valider-quantite') {
      var g = L.valeurNumerique(document.getElementById('inp-grammes').value);
      var al = feuille.aliment;
      ajouter({ date: jourAffiche, repas: feuille.repas, nom: al.nom, grammes: g, kcal100g: al.kcal }, false);
      return;
    }
    if (act === 'valider-libre') {
      var nom = document.getElementById('inp-libre-nom').value;
      var k100 = L.valeurNumerique(document.getElementById('inp-libre-100g').value);
      var gg = L.valeurNumerique(document.getElementById('inp-libre-g').value);
      var caseMem = document.getElementById('memoriser');
      ajouter({ date: jourAffiche, repas: feuille.repas, nom: nom, grammes: gg, kcal100g: k100 }, !!(caseMem && caseMem.checked));
      return;
    }
    if (act === 'enregistrer-profil') { enregistrerProfil(); return; }
    if (act === 'exporter') { exporter(); return; }
    if (act === 'importer') { document.getElementById('fichier-import').click(); return; }
    if (act === 'reset') {
      if (window.confirm('Tout effacer (repas, profil) ? Cette action est définitive — pense à exporter d\'abord.')) {
        etat = etatVide();
        sauvegarder();
        rendre();
        toast('Données effacées');
      }
      return;
    }
  });

  document.addEventListener('input', function (ev) {
    var id = ev.target.id;
    if (id === 'inp-recherche') {
      feuille.requete = ev.target.value;
      var zone = document.getElementById('liste-resultats');
      if (zone) zone.innerHTML = resultatsHtml(L.rechercherAliments(baseComplete(), feuille.requete, 25));
      return;
    }
    if (id === 'inp-grammes') {
      feuille.grammes = L.valeurNumerique(ev.target.value);
      var live = document.getElementById('calcul-live');
      if (live && feuille.aliment) {
        live.innerHTML = L.formaterNombre(L.kcalPortion(feuille.aliment.kcal, feuille.grammes || 0)) + ' kcal<small>pour cette quantité</small>';
      }
      return;
    }
    if (id === 'inp-libre-100g' || id === 'inp-libre-g') {
      var k = L.valeurNumerique(document.getElementById('inp-libre-100g').value) || 0;
      var g = L.valeurNumerique(document.getElementById('inp-libre-g').value) || 0;
      var live2 = document.getElementById('calcul-live');
      if (live2) live2.innerHTML = L.formaterNombre(L.kcalPortion(k, g)) + ' kcal<small>total estimé</small>';
      return;
    }
    if (id === 'inp-age' || id === 'inp-taille' || id === 'inp-poids') { majApercu(); return; }
  }, true);

  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'fichier-import' && ev.target.files && ev.target.files[0]) {
      var f = ev.target.files[0];
      var r = new FileReader();
      r.onload = function () { importerDepuisTexte(String(r.result)); };
      r.readAsText(f);
      return;
    }
    if (['inp-sexe', 'inp-activite', 'inp-objectif'].indexOf(ev.target.id) !== -1) majApercu();
  });

  document.getElementById('fermer-feuille').addEventListener('click', fermerFeuille);
  document.getElementById('voile').addEventListener('click', fermerFeuille);
  el.boutonJour.addEventListener('click', function () {
    jourAffiche = L.jourISO(new Date());
    ecran = 'jour';
    rendre();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && feuille.ouvert) fermerFeuille();
  });

  /* ---------- Démarrage ---------- */
  if (!stockageDisponible()) {
    var bandeau = document.createElement('div');
    bandeau.className = 'erreurs';
    bandeau.style.margin = '14px';
    bandeau.innerHTML = '<b>Stockage indisponible dans ce navigateur.</b><br>Tu peux compter tes calories, mais rien ne sera conservé après fermeture de la page.';
    document.body.insertBefore(bandeau, document.getElementById('vue'));
  }

  rendre();
  if (!etat.profil && !etat.entrees.length) {
    ecran = 'profil';
    rendre();
  }

  // poignée de débogage / vérification (pas nécessaire au fonctionnement)
  window.App = {
    get etat() { return etat; },
    objectifDuJour: objectifDuJour,
    rendre: rendre,
    jourAffiche: function () { return jourAffiche; },
    ecran: function () { return ecran; },
    aller: function (e) { ecran = e; rendre(); },
    ouvrirFeuille: ouvrirFeuille,
    fermerFeuille: fermerFeuille,
    feuille: feuille
  };
})();
