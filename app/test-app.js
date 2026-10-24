/* Régressions d'interface : vrai app.js, horloge et DOM minimal en mémoire.
   Aucune dépendance navigateur nécessaire pour npm test. */
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

function demarrer(etatInitial) {
  var maintenant = new Date(2026, 9, 3, 23, 55).getTime();
  class DateSimulee extends Date {
    constructor(...args) { super(...(args.length ? args : [maintenant])); }
    static now() { return maintenant; }
  }
  function cibleEvenements() {
    var ecouteurs = {};
    return {
      addEventListener: function (nom, fn) {
        (ecouteurs[nom] || (ecouteurs[nom] = [])).push(fn);
      },
      emettre: function (nom, ev) {
        (ecouteurs[nom] || []).forEach(function (fn) { fn(ev); });
      }
    };
  }
  var elements = {};
  function element(id) {
    if (!elements[id]) {
      elements[id] = Object.assign(cibleEvenements(), {
        id: id, textContent: '', innerHTML: '', value: '', hidden: true,
        focus: function () {}
      });
    }
    return elements[id];
  }
  var document = Object.assign(cibleEvenements(), {
    visibilityState: 'visible',
    getElementById: element,
    querySelectorAll: function () { return []; }
  });
  if (etatInitial === undefined) etatInitial = {
    entrees: [{ id: 'veille', date: '2026-10-03', repas: 'diner', nom: 'Riz', grammes: 100, kcal: 130 }]
  };
  var stockage = etatInitial === null ? {} : { 'mes-calories-v1': JSON.stringify(etatInitial) };
  var confirmations = [];
  var confirmer = false;
  var ecritures = 0;
  var refuser = false;
  var toasts = [];
  var window = Object.assign(cibleEvenements(), { scrollTo: function () {} });
  window.confirm = function (message) { confirmations.push(message); return confirmer; };
  var contexte = vm.createContext({
    window: window, document: document, Date: DateSimulee,
    localStorage: {
      getItem: function (cle) { return stockage[cle] || null; },
      setItem: function (cle, valeur) {
        if (refuser) { var err = new Error('quota'); err.name = 'QuotaExceededError'; throw err; }
        stockage[cle] = valeur;
        if (cle === 'mes-calories-v1') ecritures++;
      },
      removeItem: function (cle) { delete stockage[cle]; }
    },
    setTimeout: function () {}, clearTimeout: function () {}
  });
  ['logique.js', 'base-aliments.js'].forEach(function (fichier) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, fichier), 'utf8'), contexte);
  });
  window.Logique = contexte.Logique;
  window.BaseAliments = contexte.BaseAliments;
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), contexte);
  var toastEl = element('toast');
  var texteToast = toastEl.textContent;
  Object.defineProperty(toastEl, 'textContent', {
    get: function () { return texteToast; },
    set: function (v) { texteToast = v; toasts.push(v); }
  });
  return {
    refuserEcriture: function (v) { refuser = v; },
    contexte: contexte,
    changer: function (id, fichiers) { document.emettre('change', { target: { id: id, files: fichiers } }); },
    toasts: toasts,
    app: window.App, element: element,
    confirmations: confirmations,
    confirmer: function (valeur) { confirmer = valeur; },
    ecritures: function () { return ecritures; },
    date: function (jour, heure) { maintenant = new Date(2026, 9, jour, heure || 8).getTime(); },
    retour: function (type, visible) {
      document.visibilityState = visible === false ? 'hidden' : 'visible';
      (type === 'focus' ? window : document).emettre(type, {});
    },
    clic: function (act, id) {
      var cible = {
        getAttribute: function (nom) {
          return nom === 'data-act' ? act : nom === 'data-id' ? id : null;
        },
        closest: function (selecteur) { return selecteur === '[data-act]' ? cible : null; }
      };
      document.emettre('click', { target: cible });
    },
    saisir: function (id) { document.emettre('input', { target: { id: id } }); },
    sauvegarde: function () { return JSON.parse(stockage['mes-calories-v1']); }
  };
}

module.exports = function (test, egal) {
  var manuelSeul = demarrer({ profil: null, entrees: [], objectifManuel: 1800 });
  egal('Démarrage avec objectif manuel seul : écran jour', manuelSeul.app.ecran(), 'jour');
  egal('Démarrage avec objectif manuel seul : objectif conservé', manuelSeul.app.objectifDuJour(), 1800);
  egal('Démarrage avec stockage vide : écran profil', demarrer(null).app.ecran(), 'profil');

  ['visibilitychange', 'focus'].forEach(function (type) {
    var ui = demarrer();
    ui.date(4);
    ui.retour(type);
    egal(type + ' : passage au nouveau jour', ui.app.jourAffiche(), '2026-10-04');
    egal(type + ' : entête Aujourd\'hui actualisé', ui.element('entete-date').textContent, "Aujourd'hui · 0 kcal");
    test(type + ' : vue Aujourd\'hui actualisée', ui.element('vue').innerHTML.includes("Aujourd&#39;hui"));
    test(type + ' : bouton de retour masqué', ui.element('bouton-aujourdhui').hidden);
    ui.app.ouvrirFeuille();
    egal(type + ' : repas recalculé le matin', ui.app.feuille.repas, 'petit-dej');
    ui.clic('choisir');
    ui.element('inp-grammes').value = '100';
    ui.clic('valider-quantite');
    egal(type + ' : ajout de la liste daté du nouveau jour', ui.sauvegarde().entrees[1].date, '2026-10-04');
    ui.app.ouvrirFeuille();
    ui.clic('libre');
    ui.element('inp-libre-nom').value = 'Pain maison';
    ui.element('inp-libre-100g').value = '250';
    ui.element('inp-libre-g').value = '60';
    ui.clic('valider-libre');
    egal(type + ' : saisie libre datée du nouveau jour', ui.sauvegarde().entrees[2].date, '2026-10-04');
    egal(type + ' : entrée de la veille conservée', ui.sauvegarde().entrees[0].date, '2026-10-03');
    ui.date(7);
    ui.retour(type);
    egal(type + ' : nouveau retour après plusieurs jours', ui.app.jourAffiche(), '2026-10-07');

    var historique = demarrer();
    historique.clic('jour-prec');
    var entete = historique.element('entete-date').textContent;
    historique.date(4);
    historique.retour(type);
    egal(type + ' : consultation volontaire du passé conservée', historique.app.jourAffiche(), '2026-10-02');
    egal(type + ' : aucun rendu imposé sur le passé', historique.element('entete-date').textContent, entete);
    historique.element('bouton-aujourdhui').emettre('click', {});
    historique.date(5);
    historique.retour(type);
    egal(type + ' : suit à nouveau aujourd\'hui après retour explicite', historique.app.jourAffiche(), '2026-10-05');
  });

  var ui = demarrer();
  ui.app.ouvrirFeuille();
  egal('Feuille ouverte le soir : dîner', ui.app.feuille.repas, 'diner');
  ui.element('feuille-corps').innerHTML = 'saisie en cours';
  ui.retour('focus');
  ui.retour('visibilitychange');
  egal('Retour le même jour : ne détruit pas la saisie', ui.element('feuille-corps').innerHTML, 'saisie en cours');
  ui.date(4);
  ui.retour('visibilitychange', false);
  egal('Document caché : ne change pas le jour', ui.app.jourAffiche(), '2026-10-03');
  ui.retour('visibilitychange');
  egal('Document redevenu visible : change le jour', ui.app.jourAffiche(), '2026-10-04');
  ui.element('feuille-corps').innerHTML = 'nouvelle saisie';
  ui.retour('focus');
  egal('Focus après visibilité : ne rend pas une deuxième fois', ui.element('feuille-corps').innerHTML, 'nouvelle saisie');

  var suppression = demarrer();
  var vueAvant = suppression.element('vue').innerHTML;
  var donneesAvant = JSON.stringify(suppression.sauvegarde());
  suppression.clic('suppr', 'veille');
  egal('Suppression : confirmation avec nom et kcal', suppression.confirmations[0], 'Supprimer « Riz » (130 kcal) ?');
  egal('Annuler : entrée en mémoire conservée', suppression.app.etat.entrees.length, 1);
  egal('Annuler : ligne affichée conservée', suppression.element('vue').innerHTML, vueAvant);
  egal('Annuler : stockage inchangé', JSON.stringify(suppression.sauvegarde()), donneesAvant);
  egal('Annuler : aucune sauvegarde', suppression.ecritures(), 0);
  test('Annuler : aucun toast de suppression', suppression.element('toast').hidden);

  suppression.app.etat.entrees.push({ id: 'autre', date: '2026-10-02', repas: 'diner', nom: 'Pain', grammes: 60, kcal: 162 });
  suppression.confirmer(true);
  suppression.clic('suppr', 'veille');
  egal('OK : seule l\'entrée ciblée est supprimée', suppression.app.etat.entrees.length, 1);
  egal('OK : autre entrée conservée', suppression.sauvegarde().entrees[0].id, 'autre');
  egal('OK : une sauvegarde', suppression.ecritures(), 1);
  test('OK : ligne retirée de la vue', !suppression.element('vue').innerHTML.includes('data-id="veille"'));
  egal('OK : total recalculé', suppression.element('entete-date').textContent, "Aujourd'hui · 0 kcal");
  egal('OK : message Supprimé', suppression.element('toast').textContent, 'Supprimé');
  test('OK : toast visible', !suppression.element('toast').hidden);

  suppression.clic('suppr', 'absent');
  egal('Identifiant absent : aucune confirmation', suppression.confirmations.length, 2);
  egal('Identifiant absent : aucune sauvegarde supplémentaire', suppression.ecritures(), 1);

  /* Stockage qui refuse l'écriture : aucun succès annoncé, l'échec reste le dernier message. */
  function echecVisible(nom, ui) {
    test(nom + ' : un message d\'échec affiché', ui.toasts.length > 0);
    test(nom + ' : dernier message = échec', /Pas enregistré/.test(ui.toasts[ui.toasts.length - 1] || ''));
    test(nom + ' : toast visible', !ui.element('toast').hidden);
  }

  var plein = demarrer();
  plein.date(4, 12);
  plein.refuserEcriture(true);
  plein.app.ouvrirFeuille();
  plein.clic('libre');
  plein.element('inp-libre-nom').value = 'Pain';
  plein.element('inp-libre-100g').value = '250';
  plein.element('memoriser').checked = true;
  plein.element('inp-libre-g').value = '60';
  plein.clic('valider-libre');
  test('Stockage plein, ajout : jamais « Ajouté »', plein.toasts.every(function (t) { return t.indexOf('Ajouté') === -1; }));
  echecVisible('Stockage plein, ajout', plein);
  egal('Stockage plein, ajout : entrée retirée de l\'état', plein.app.etat.entrees.length, 1);
  egal('Stockage plein, ajout : aliment perso retiré', plein.app.etat.perso.length, 0);
  test('Stockage plein, ajout : feuille restée ouverte', plein.app.feuille.ouvert);
  plein.app.ouvrirFeuille();
  plein.clic('choisir');
  plein.element('inp-grammes').value = '100';
  plein.toasts.length = 0;
  plein.clic('valider-quantite');
  test('Stockage plein, ajout liste : jamais « Ajouté »', plein.toasts.every(function (t) { return t.indexOf('Ajouté') === -1; }));
  echecVisible('Stockage plein, ajout liste', plein);
  egal('Stockage plein, ajout liste : entrée retirée', plein.app.etat.entrees.length, 1);

  var profil = demarrer();
  profil.refuserEcriture(true);
  profil.app.aller('profil');
  profil.element('inp-sexe').value = 'h';
  profil.element('inp-activite').value = 'modere';
  profil.element('inp-objectif').value = 'perdre';
  profil.element('inp-manuel').value = '1800';
  profil.clic('enregistrer-profil');
  test('Stockage plein, profil : jamais « enregistré ✓ »', profil.toasts.every(function (t) { return t.indexOf('enregistré ✓') === -1; }));
  echecVisible('Stockage plein, profil', profil);

  var suppr = demarrer();
  suppr.refuserEcriture(true);
  suppr.confirmer(true);
  suppr.clic('suppr', 'veille');
  test('Stockage plein, suppression : jamais « Supprimé »', suppr.toasts.indexOf('Supprimé') === -1);
  echecVisible('Stockage plein, suppression', suppr);

  var imp = demarrer();
  imp.refuserEcriture(true);
  var fichier = { name: 'x.json' };
  var lecteur = null;
  imp.contexte.FileReader = function () { lecteur = this; this.readAsText = function () {}; };
  imp.changer('fichier-import', [fichier]);
  lecteur.result = JSON.stringify({ entrees: [{ id: 'i1', date: '2026-10-01', repas: 'diner', nom: 'Riz', grammes: 100, kcal: 130 }] });
  lecteur.onload();
  test('Stockage plein, import : jamais « importés ✓ »', imp.toasts.every(function (t) { return t.indexOf('importés') === -1; }));
  echecVisible('Stockage plein, import', imp);

  var ok = demarrer();
  ok.app.aller('profil');
  ok.element('inp-manuel').value = '1800';
  ok.clic('enregistrer-profil');
  test('Stockage OK, profil : succès annoncé', /^Objectif manuel enregistré ✓ Objectif : 1.800 kcal$/.test(ok.toasts[ok.toasts.length - 1]));
  ok.contexte.FileReader = function () { lecteur = this; this.readAsText = function () {}; };
  ok.changer('fichier-import', [fichier]);
  lecteur.result = JSON.stringify({ entrees: [] });
  lecteur.onload();
  egal('Stockage OK, import : succès annoncé', ok.toasts[ok.toasts.length - 1], '0 repas importés ✓');

  function apercu(valeurs) {
    var profil = demarrer();
    profil.app.aller('profil');
    Object.keys(valeurs).forEach(function (id) { profil.element(id).value = valeurs[id]; });
    profil.saisir('inp-taille');
    return profil.element('calc-apercu').innerHTML;
  }
  var base = { 'inp-sexe': 'h', 'inp-age': '35', 'inp-poids': '75', 'inp-activite': 'modere', 'inp-objectif': 'perdre', 'inp-manuel': '' };
  var metres = apercu(Object.assign({}, base, { 'inp-taille': '1,75' }));
  test('Aperçu taille 1,75 : aucun IMC', !metres.includes('IMC'));
  test('Aperçu taille 1,75 : aucun objectif conseillé', !metres.includes('Objectif conseillé') && !metres.includes('kcal'));
  test('Aperçu taille 1,75 : message de correction', metres.includes('Taille : entre 100 et 230 cm.'));
  test('Aperçu taille 1,75 : suggestion en cm', metres.includes('en cm, ex. 175'));
  var aberrant = apercu(Object.assign({}, base, { 'inp-taille': '175', 'inp-age': '5' }));
  test('Aperçu âge hors bornes : message, sans chiffres', aberrant.includes('Âge : un nombre entre 10 et 110.') && !aberrant.includes('IMC'));
  test('Aperçu taille hors bornes hors 1–2,5 : pas de suggestion cm', !apercu(Object.assign({}, base, { 'inp-taille': '50' })).includes('en cm'));
  egal('Aperçu profil valide (35 ans, 175 cm, 75 kg) : identique à avant',
    apercu(Object.assign({}, base, { 'inp-taille': '175' })),
    '<div class="ligne-calc"><span>Métabolisme de base</span><b>1\u202f674 kcal</b></div><div class="ligne-calc"><span>Avec ton activité</span><b>2\u202f595 kcal</b></div><div class="ligne-calc fort"><span>Objectif conseillé</span><b>2\u202f095 kcal</b></div><div class="ligne-calc"><span>IMC</span><b>24,5 — Corpulence normale</b></div>');
  egal('Aperçu profil incomplet : invitation inchangée', apercu(Object.assign({}, base, { 'inp-taille': '' })),
    '<p class="note">Renseigne âge, taille et poids pour voir ton objectif calculé.</p>');
};
