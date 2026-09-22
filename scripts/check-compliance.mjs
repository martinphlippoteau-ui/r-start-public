// Contrôle de conformité du HTML buildé (dist/). Exit 1 si une règle échoue.
// Règles : mentions obligatoires présentes, formulations interdites absentes, structure du hero,
// liens PDF valides, un seul H1, lang="fr", canonical, JSON-LD parsable, SRI égal à la valeur de
// facts.ts, citations de presse marquées, mentions obligatoires jamais en text-xs.
// Les contenus sont importés directement des sources TypeScript (Node ≥ 22, sans alias `@/`).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as legal from '../src/content/fr/legal.ts';
import { marketComparison, risk } from '../src/content/fr/facts.ts';
import { comparator } from '../src/content/fr/comparator.ts';
import { lignesOg } from './og-lignes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
// Le site peut être construit sous un sous-chemin (GitHub Pages de projet) : les liens du HTML le
// portent, pas l'arborescence de dist. On le retire avant de vérifier l'existence des fichiers.
const BASE_SEGMENTS = (process.env.PUBLIC_BASE_PATH || '').split('/').filter(Boolean);
const BASE_PREFIX = BASE_SEGMENTS.length ? '/' + BASE_SEGMENTS[BASE_SEGMENTS.length - 1] : '';
const stripBase = (p) =>
  BASE_PREFIX && p.startsWith(BASE_PREFIX + '/') ? p.slice(BASE_PREFIX.length) : p;
const errors = [];
const warnings = [];

const norm = (s) =>
  s
    .replace(/&nbsp;|&#160;| /g, ' ')
    .replace(/&#39;|&apos;|’/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
/**
 * Retire les citations de tiers (propos rapportés, marqués `data-press-quote`) avant le contrôle
 * des formulations interdites. L'avertissement qui les couvrait n'existe plus ; son absence est
 * signalée à chaque exécution. Tout le reste de la page reste contrôlé.
 */
const stripPressQuotes = (html) =>
  html.replace(/<([a-z]+)[^>]*\sdata-press-quote[^>]*>[\s\S]*?<\/\1>/gi, ' ');

const toText = (html) =>
  norm(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );

async function readHtml(rel) {
  return fs.readFile(path.join(DIST, rel), 'utf8');
}

function requirePhrase(text, phrase, label, file) {
  if (!text.toLowerCase().includes(norm(phrase).toLowerCase()))
    errors.push(`${file} : mention absente, ${label}`);
}

const FORBIDDEN = [
  {
    re: /sans frais/gi,
    label: '« sans frais »',
    // Autorisé : le démenti de la brochure et tout « sans frais » IMMÉDIATEMENT QUALIFIÉ, de
    // souscription, d'entrée, d'acquisition. Reste interdit le « sans frais » absolu, qui laisserait
    // croire qu'il n'y a aucun frais.
    allow:
      /n'est pas une scpi sans frais|frais de souscription|sans frais d['’](entrée|acquisition)/i,
    /* Forme RAPPORTÉE : « … dites « sans frais » » nomme une catégorie du marché (formulation de la
       brochure), sans rien affirmer. Exemption étroite à dessein : collée à « dites », et seulement
       si la page explique ailleurs ce que la catégorie recouvre (`requires`) ; sinon, erreur. */
    reported: /\bdites\s*[«"“]\s*$/i,
    requires: /ne prélève pas de frais de souscription/i,
  },
  { re: /\bgratuit/gi, label: '« gratuit »', allow: /saisir gratuitement le médiateur/i },
  {
    re: /\bgaranti(e|s|es)?\b/gi,
    label: '« garanti »',
    /* « ne peut pas être garantie » est admis : la règle vise les PROMESSES de garantie, et « pas
       garanti » ne couvrait pas cette négation (« être » s'intercale). Faux positif, pas un
       assouplissement. */
    allow:
      /(non|pas|aucune|ni)\s+(de\s+)?garanti|ne (sont|est) pas garanti|ne (peut|peuvent) pas être garanti|ne garantit pas|aucune garantie|sans garantie|n'offrent aucune garantie|ne présagent|garantie en capital/i,
  },
  {
    re: /sécuris/gi,
    label: '« sécurisé »',
    allow: /sécurisé(e)? par (https|tls)|connexion sécurisée/i,
  },
  { re: /protection du capital|capital protégé/gi, label: '« protection du capital »' },
  { re: /meilleures? scpi/gi, label: '« meilleure SCPI »' },
  { re: /en toute confiance/gi, label: '« en toute confiance »' },
  {
    /* INDICATEURS DE PERFORMANCE. La règle existe parce que R Start N'EN A AUCUN : sans historique,
       une communication commerciale ne peut pas en laisser espérer un.
       EXEMPTION DE /a-propos (16/09/2026, contenu fourni par l'équipe) : seule page à publier les
       chiffres des QUATRE AUTRES SCPI DU GROUPE, chacun avec sa définition et la mention sur les
       performances passées (src/content/fr/corumRange.ts). ELLE VAUT POUR LA PAGE, PAS POUR R START
       : la page ne doit jamais lui attribuer un chiffre, à surveiller à chaque relecture puisque la
       règle ne le verra plus.
       EXEMPTION DE /simulateur (19/09/2026, demande de Martin) : son curseur EST un taux de
       distribution, celui que le visiteur choisit de tester. La règle change de forme :
       `checkSimulateur` exige ce qui rend la page défendable. */
    except: ['a-propos', 'simulateur'],
    re: /taux de distribution|\bTRI\b|rendement (cible|garanti|attendu|estimé|annuel)|objectif de rendement/g,
    label: 'indicateur de performance',
    allow: /(pas|aucun|sans)\s+(d'|de\s)?(objectif de rendement|taux de distribution)/i,
  },
  {
    re: /\d+(?:[,.]\d+)?\s?%\s?(?:de\s)?(?:rendement|performance|par an|annuel)/gi,
    label: 'pourcentage de performance',
  },
  /* MENTION DU CRÉDIT. Présenter l'achat de parts à crédit oblige à avertir que le souscripteur
     reste tenu de rembourser son prêt même si le placement perd de la valeur, sans compter sur ses
     revenus. EXEMPTION (16/09/2026, texte fourni par l'équipe) pour la question « Peut-on financer
     R Start à crédit ? », dont la PREMIÈRE phrase est une négation. CE QUI N'EST PAS RÉGLÉ, une
     dette : la SECONDE phrase (« … par exemple via un crédit obtenu auprès de sa banque ») SUGGÈRE
     de souscrire à crédit sans cet avertissement, ce que la règle existe pour attraper. L'équipe a
     tranché en connaissance de cause : garder le texte et lever la règle, point à faire arbitrer
     avant toute ouverture au public. Pour rétablir le contrôle : retirer `via un crédit obtenu` de
     `allow`. */
  {
    re: /\bcrédit\b/gi,
    label: 'mention du crédit',
    allow: /financement à crédit n'est pas proposé|via un crédit obtenu|carte de crédit/i,
  },
  // Quatre formulations ne sont pas BLOQUÉES mais SIGNALÉES EN AVERTISSEMENT (checkHeroClaims),
  // l'équipe ayant demandé le 14/09/2026 que son document soit respecté à la lettre : formule
  // d'alignement, allégation de rang sans périmètre, « objectifs tenus », « diversifié ».
];

function checkForbidden(text, file) {
  for (const rule of FORBIDDEN) {
    if (rule.except && rule.except.some((p) => file.includes(p))) continue;
    const matches = [...text.matchAll(rule.re)];
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
      if (rule.allow && rule.allow.test(ctx)) continue;
      // Forme rapportée, et page qui explique la catégorie : ce n'est pas une affirmation.
      const gauche = text.slice(Math.max(0, m.index - 30), m.index);
      if (rule.reported && rule.reported.test(gauche) && rule.requires && rule.requires.test(text))
        continue;
      errors.push(`${file} : formulation interdite ${rule.label}, « …${ctx.trim()}… »`);
    }
  }
}

/** Pour checkNoticeSize, qui parcourt la pile des balises ouvertes du HTML, sans parseur : la
    mention 1 ne doit pas être en text-xs, ni directement ni par un ancêtre (une <section> l'a
    portée). */
const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
/**
 * Formulations « à défendre en compliance » : signalées en AVERTISSEMENT, traçables jusqu'à
 * l'arbitrage, jamais bloquantes. APPELÉE SUR TOUTES LES PAGES : limitée à l'accueil, elle est
 * devenue muette le jour où l'accroche « la seule SCPI… gagnant-gagnant » est passée dans l'en-tête
 * de /frais.
 */
function checkHeroClaims(text, file) {
  // « la seule » : exclusivité sur tout le marché, sans périmètre ni preuve ; « gagnant-gagnant »
  // suggère un gain, capital non garanti. Publiée en connaissance du risque ; à passer en erreur si
  // la compliance la refuse.
  for (const [re_, quoi] of [
    [
      /\bla seule\s+SCPI/gi,
      'allégation d’exclusivité « la seule SCPI » (sans périmètre ni preuve)',
    ],
    [/gagnant\s*-\s*gagnant/gi, '« gagnant-gagnant » (suggère un gain, capital non garanti)'],
    [
      /ne touchons rien|ne touche rien tant que|tant que vous n['’]avez pas gagné/gi,
      "formule d'alignement inexacte : les frais de gestion sont prélevés sur les loyers encaissés, y compris quand la valeur des parts baisse",
    ],
    [
      /premi[èe]re\s+SCPI(?!\s+du groupe CORUM)/gi,
      'allégation de rang « première SCPI » sans périmètre de marché (le périmètre est en note)',
    ],
    [/objectifs? tenus?/gi, '« objectifs tenus » (allégation de performance)'],
    /* /strategie : « … plus systématique que d'autres SCPI », comparaison sans périmètre ni source,
       suivie comme « la seule SCPI ». Le motif vise la COMPARAISON, pas « systématique » seul. */
    [
      /(plus|davantage|moins)\s+(syst[ée]matique|souvent|fr[ée]quemment)[^.]{0,40}\bque\s+d['’]autres\s+SCPI/gi,
      'comparaison avec les autres SCPI (« plus systématique que d’autres SCPI ») sans périmètre ni source',
    ],
    [
      /atteint ou d[ée]pass[ée]|objectifs? de performance/gi,
      'allégation de performance PASSÉE sur des SCPI tierces, sans source, sans période, et sans la mention que les performances passées ne préjugent pas des performances futures',
    ],
    [
      /\bleader\b/gi,
      'allégation de rang « leader » (de quoi, mesuré comment, à quelle date, selon quelle source ?)',
    ],
    [
      /\bdiversifi/gi,
      '« diversifié » présenté comme un acquis (R Start n’a pas encore de patrimoine à diversifier)',
    ],
  ]) {
    const n = (text.match(re_) || []).length;
    if (n) warnings.push(`${file} : ${n} occurrence(s) à défendre en compliance, ${quoi}`);
  }
}

function checkNoticeSize(html, file) {
  const start = norm(legal.commercialNotice).slice(0, 40).toLowerCase();
  const stack = [];
  const tagRe = /<(\/?)([a-z][a-z0-9-]*)([^>]*)>/gi;
  let m;
  let found = false;
  while ((m = tagRe.exec(html))) {
    const [, closing, name, attrs] = m;
    if (name === 'script' || name === 'style') continue;
    if (closing) {
      const i = stack.map((t) => t.name).lastIndexOf(name.toLowerCase());
      if (i !== -1) stack.length = i;
      continue;
    }
    if (VOID_TAGS.test(name) || /\/\s*$/.test(attrs)) continue;
    const cls = (attrs.match(/\sclass="([^"]*)"/i) || [, ''])[1];
    stack.push({ name: name.toLowerCase(), cls });
    if (name.toLowerCase() !== 'p') continue;
    const close = html.indexOf('</p>', tagRe.lastIndex);
    const inner = toText(
      html.slice(tagRe.lastIndex, close === -1 ? undefined : close)
    ).toLowerCase();
    if (!inner.startsWith(start)) continue;
    found = true;
    const small = stack.filter((t) => /(^|\s)text-xs(\s|$)/.test(t.cls));
    if (small.length)
      errors.push(
        `${file} : mention 1 (caractère commercial) en text-xs via <${small.map((t) => t.name).join('>, <')}>, text-caption (14 px) minimum`
      );
  }
  if (!found)
    warnings.push(`${file} : aucun <p> ne commence par la mention 1, contrôle de taille inopérant`);
}

async function checkIndex() {
  const file = 'index.html';
  const html = await readHtml(file);
  const text = toText(html);

  // Mentions obligatoires
  requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
  requirePhrase(
    text,
    legal.documentsNotice.replace(/\.$/, ''),
    "mention 2 (documents d'information)",
    file
  );
  requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
  /* PLUS AUCUN CONTRÔLE DE CONTRE-POIDS : ils visaient les « Bon à savoir », retirés le 14/09/2026
     à la demande de l'équipe (« supprime tous les bon à savoir du site »). Le site ne porte plus de
     contre-poids à côté de ses avantages ; restent la section Risques et le pied de page, exigés
     ici. */
  requirePhrase(text, legal.gdpr.dpoEmail, 'e-mail DPO', file);
  /* PLUS DE CONTRÔLE DU PÉRIMÈTRE DE L'ALLÉGATION DE RANG : la phrase bornée « du groupe CORUM » a
     été retirée le 15/09/2026 à la demande de l'équipe. L'accueil ne porte plus qu'une allégation
     de rang NON BORNÉE, celle du hero, signalée en avertissement. */
  requirePhrase(text, 'GP-11000012', 'agrément AMF de la société de gestion', file);
  requirePhrase(text, legal.publisher.rcs, "RCS de l'éditeur", file);
  requirePhrase(text, '15 %', 'frais de gestion 15 %', file);

  checkForbidden(text, file);

  // Structure
  const h1 = html.match(/<h1\b[^>]*>/gi) || [];
  if (h1.length !== 1) errors.push(`${file} : ${h1.length} balise(s) <h1> (attendu : 1)`);
  if (h1[0] && /data-animate/i.test(h1[0]))
    errors.push(`${file} : le H1 est animé (data-animate interdit)`);
  if (!/<html[^>]*\blang="fr"/i.test(html)) errors.push(`${file} : lang="fr" absent`);
  if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(`${file} : canonical absent`);

  const heroMatch = html.match(/<section[^>]*id="apercu"[^>]*>[\s\S]*?<\/section>/i);
  if (!heroMatch) errors.push(`${file} : section #apercu introuvable`);
  else {
    const hero = heroMatch[0];
    if (!/data-cta="souscrire"/i.test(hero))
      errors.push(`${file} : aucun CTA de souscription dans le hero`);
  }

  // Indicateur synthétique de risque : toute occurrence « N sur 7 » doit être la valeur de facts.ts
  // (risk.sriLabel). Un « 3 sur 7 » hérité du DIC hébergé ou une coquille est une erreur.
  if (text.includes('sur 7')) {
    const sris = [...text.matchAll(/\b\d+\s?sur 7\b/g)].map((m) => norm(m[0]));
    if (!sris.length)
      warnings.push(`${file} : « sur 7 » présent sans valeur numérique devant (SRI illisible)`);
    const wrong = sris.filter((v) => v !== norm(risk.sriLabel));
    for (const v of new Set(wrong))
      errors.push(
        `${file} : SRI « ${v} » (× ${wrong.filter((w) => w === v).length}) différent de facts.risk.sriLabel (« ${risk.sriLabel} »)`
      );
  }

  checkHeroClaims(text, file);

  // Mentions obligatoires : jamais en text-xs (12 px), ni sur le <p> ni par un ancêtre.
  checkNoticeSize(html, file);

  // Documents PDF
  const pdfLinks = [...new Set([...html.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => m[1]))];
  /* AVERTISSEMENT ET NON PLUS ERREUR (16/09/2026, arbitrage de l'équipe : « ne rends rien dispo là,
     on verra plus tard »). La règle attendait la note d'information et le bulletin, seuls documents
     publiables (statuts tronqués à la source, DIC hébergé à 3 sur 7 quand le site affiche 4 sur 7,
     retour AMF du 10/09/2026) ; le pied de page n'en sert plus aucun. Ce n'est plus une erreur
     parce que la mention obligatoire renvoie toujours vers ces documents sur www.corum.fr : l'accès
     est renvoyé hors du site, pas supprimé. À rebasculer en erreur le jour où les documents sont
     publiés ici. */
  if (pdfLinks.length < 2)
    warnings.push(
      `${file} : ${pdfLinks.length} lien(s) PDF (attendu : ≥ 2) — aucun document servi depuis la page, la mention obligatoire renvoie à corum.fr`
    );
  for (const link of pdfLinks) {
    const local = stripBase(link.replace(/^https?:\/\/[^/]+/, ''));
    if (!local.startsWith('/')) continue;
    try {
      await fs.access(path.join(DIST, local));
    } catch {
      errors.push(`${file} : PDF manquant dans dist, ${local}`);
    }
  }

  // JSON-LD
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ld.length) warnings.push(`${file} : aucun JSON-LD`);
  for (const [, body] of ld) {
    try {
      JSON.parse(body);
    } catch (e) {
      errors.push(`${file} : JSON-LD invalide, ${e.message}`);
    }
  }
}

/**
 * /SIMULATEUR : LES CONDITIONS DE SON EXEMPTION. Seule page, avec /a-propos, à pouvoir écrire «
 * taux de distribution », le build vérifie ce qui la rend défendable pour une SCPI sans historique.
 * Tout se lit dans le HTML publié : src/content/fr/simulator.ts importe par l'alias `@/`, que ce
 * script ne résout pas.
 */
async function checkSimulateur() {
  const file = 'simulateur/index.html';
  let html;
  try {
    html = await readHtml(file);
  } catch {
    return; // l'absence de la page est déjà une erreur de checkSubPages
  }
  const text = toText(html);
  const balise = (motif) => html.match(motif)?.[0] ?? '';

  /* LA FENÊTRE D'ACCÈS : le simulateur arrive inerte, derrière une fenêtre qui reproduit l'avertissement
     du bulletin mot pour mot. RENDUE PAR LE SERVEUR ET VISIBLE SANS SCRIPT : c'est ce qui garantit
     qu'aucun formulaire ne s'affiche nu avant elle (un <dialog> ouvert par `showModal()`
     n'apparaissait qu'à l'exécution d'un module différé). Le <dialog> et un `hidden` à retirer
     sont donc refusés. */
  const voile =
    html.match(/<div\b[^>]*data-simu-acces-voile[\s\S]*?data-simu-accepter[\s\S]*?<\/div>/i)?.[0] ??
    '';
  if (!voile) errors.push(file + ' : fenêtre d’accès absente ([data-simu-acces-voile])');
  else {
    requirePhrase(
      toText(voile),
      legal.bulletinWarning,
      'avertissement du bulletin dans la fenêtre d’accès',
      file
    );
    const enveloppe = voile.slice(0, voile.indexOf('>') + 1);
    if (/\bhidden\b/.test(enveloppe))
      errors.push(
        file + ' : la fenêtre d’accès doit être visible sans script, sans attribut hidden'
      );
  }
  if (/<dialog\b[^>]*data-simu-acces/i.test(html))
    errors.push(
      file +
        ' : la fenêtre d’accès ne doit pas être un <dialog>, qui n’existe qu’une fois ouvert par script'
    );
  if (!/\binert\b/.test(balise(/<div\b[^>]*data-simulateur[^>]*>/i)))
    errors.push(
      file + ' : le simulateur doit arriver inerte, tant que la fenêtre d’accès n’est pas acceptée'
    );

  /* AUCUN TAUX PRÉSÉLECTIONNÉ : le curseur arrive à son minimum, et le libellé dit « à choisir ». */
  const curseur = balise(/<input\b[^>]*data-simu-taux[^>]*>/i);
  if (!curseur) errors.push(file + ' : curseur du taux introuvable ([data-simu-taux])');
  else {
    const valeur = curseur.match(/\bvalue="([^"]*)"/)?.[1];
    const minimum = curseur.match(/\bmin="([^"]*)"/)?.[1];
    if (valeur === undefined || valeur !== minimum)
      errors.push(
        `${file} : le curseur du taux arrive à ${valeur} (minimum ${minimum}) : aucun taux ne doit être présélectionné`
      );
  }

  /* AUCUN RÉSULTAT À L'ARRIVÉE : la page s'ouvre sur le parcours, la zone des résultats est masquée.
     Que le parcours ne se franchisse pas sans taux choisi, c'est tests/simulateur.spec.ts qui le tient :
     cela ne se lit pas dans du HTML statique. */
  const racine = balise(/<div\b[^>]*data-simulateur[^>]*>/i);
  const zone = balise(/<section\b[^>]*data-simu-resultats[^>]*>/i);
  if (!/data-mode="parcours"/.test(racine))
    errors.push(file + ' : le simulateur doit s’ouvrir sur le parcours (data-mode="parcours")');
  if (!zone || !/\bhidden\b/.test(zone))
    errors.push(
      file + ' : la zone des résultats doit arriver masquée ([data-simu-resultats] hidden)'
    );

  /* L'AVERTISSEMENT EST DANS LE BLOC DES RÉSULTATS : on ne lit pas un montant sans lui. */
  const debut = html.indexOf('data-simu-etat="sorties"');
  const avertissement = html.indexOf('data-simu-avertissement');
  const graphique = html.indexOf('data-simu-graphique');
  if (!(debut !== -1 && avertissement > debut && graphique > avertissement))
    errors.push(
      file + ' : l’avertissement doit se trouver dans le bloc des résultats, avant le graphique'
    );
  for (const [quoi, motif] of [
    ['« ni un objectif, ni une prévision »', /ni un objectif, ni une prévision/i],
    [
      'la mention sur les performances passées',
      /performances passées ne préjugent pas des performances futures/i,
    ],
    ['le risque de perte en capital', /risque de perte en capital/i],
    ['« simulation non contractuelle »', /simulation non contractuelle/i],
  ])
    if (!motif.test(text)) errors.push(`${file} : ${quoi} absent de la page`);

  /* CHAQUE REPÈRE DE MARCHÉ PORTE SON ANNÉE ET SA SOURCE. */
  const reperes = html.match(/<button\b[^>]*data-simu-repere[\s\S]*?<\/button>/gi) ?? [];
  if (!reperes.length) warnings.push(file + ' : aucun repère de marché sous le curseur du taux');
  reperes.forEach((repere, i) => {
    const contenu = toText(repere);
    if (!/\b20\d\d\b/.test(contenu))
      errors.push(`${file} : le repère de marché n° ${i + 1} ne dit pas son année`);
    if (!/source|publiés sur/i.test(contenu))
      errors.push(`${file} : le repère de marché n° ${i + 1} ne dit pas sa source`);
  });
}

/** Sous-pages produit : mêmes interdits, mentions obligatoires, structure. */
async function checkSubPages() {
  for (const p of [
    'frais',
    'simulateur',
    'strategie',
    'a-propos',
    'documentation',
    'faq',
    'presse',
  ]) {
    const file = p + '/index.html';
    let html;
    try {
      html = await readHtml(file);
    } catch {
      errors.push('page /' + p + ' absente de dist');
      continue;
    }
    const text = toText(html);
    // Sur « La presse en parle », les citations de tiers (data-press-quote) sont exclues du
    // contrôle des formulations interdites ; voir stripPressQuotes.
    checkForbidden(p === 'presse' ? toText(stripPressQuotes(html)) : text, p);
    checkHeroClaims(text, p);
    /* LA LIGNE RISQUES N'EST PLUS EXIGÉE SUR LES SOUS-PAGES (14/09/2026, demande expresse de
       l'équipe : « supprime les bon à savoir de tous les hero »). CE QUE CELA CHANGE, ET QUI DOIT
       ÊTRE SU : une sous-page peut être publiée sans aucune mention de risque dans son en-tête.
       Restent son texte (les avertissements de /documentation, exigés plus bas) et le pied de page
       : mention de caractère commercial et visa AMF, exigés juste en dessous. */
    requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
    requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
    const h1 = html.match(/<h1\b[^>]*>/gi) || [];
    if (h1.length !== 1) errors.push(file + ' : ' + h1.length + ' balise(s) <h1> (attendu : 1)');
    if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(file + ' : canonical absent');
    if (p === 'frais' && !/15\s?%/.test(text))
      errors.push(file + ' : frais de gestion 15 % absents');
    if (p === 'frais' && /data-comparator\b/.test(html)) {
      // Comparateur de frais : tant qu'une SCPI proposée n'a pas ses sept taux, la page montrerait les
      // zéros de R Start face à des cases vides, une comparaison trompeuse qui ne doit pas être
      // mise en ligne. Avertissement tant que le comparateur est en construction ; à passer en
      // erreur le jour où la page part en production.
      const scpis = (html.match(/<option value="\d+"/g) || []).length;
      const nonDocumentees = comparator.scpis.filter((s) => !s.unavailable && !s.source);
      if (nonDocumentees.length)
        warnings.push(
          `${file} : comparateur INCOMPLET, ${nonDocumentees.length} SCPI sur ${scpis} sans source : ` +
            nonDocumentees.map((s) => s.name).join(', ') +
            '. Ne pas mettre en ligne tant qu’elles opposent les frais de R Start à des cases vides.'
        );
      if (!/Sources/.test(text)) errors.push(file + ' : comparateur sans ligne de sources');
    }
    if (p === 'documentation') {
      /* Avertissements reproduits in extenso (MandatoryWarnings.astro) : DEUX TEXTES
         RÉGLEMENTAIRES, pas des contre-poids rédigés, ils n'ont pas suivi les « Bon à savoir ». */
      requirePhrase(text, legal.bulletinWarning.slice(0, 120), 'avertissement du bulletin', file);
      requirePhrase(text, legal.dicWarning, 'avertissement du DIC', file);
      for (const b of legal.arbitrageWarningBullets)
        requirePhrase(text, b.slice(0, 100), "puce commission d'arbitrage", file);
    }
    if (p === 'presse') {
      /* AVERTISSEMENT ET NON PLUS ERREUR (16/09/2026, arbitrage de l'équipe). La règle exigeait
         l'avertissement de la revue de presse (publications indépendantes, n'engageant pas la
         société de gestion, ne valant pas conseil, risque de perte en capital), qui qualifiait des
         citations reproduites mot pour mot, certaines avec « sans frais ». Il ne reste autour
         d'elles que le pied de page. Texte archivé hors du dépôt (.claude/audits) : s'il revient,
         repasser en erreur. */
      warnings.push(
        file +
          ' : avertissement de la revue de presse absent — les titres et citations de tiers ne sont plus qualifiés que par le pied de page'
      );
      const quoted = (html.match(/data-press-quote/g) || []).length;
      if (!quoted)
        errors.push(file + ' : aucune citation marquée data-press-quote (contrôle inopérant)');
    }
    if (p === 'frais') {
      // SCPI nommées sur /frais : nommer une autre SCPI obligeait à dire ce que la comparaison
      // compare, d'où viennent les chiffres, et que R Start n'est pas une SCPI sans frais. Le
      // contrôle n'exige plus que la source : LES DEUX AUTRES EXIGENCES SONT PARTIES avec leurs
      // textes (14/09/2026, « je veux ce contenu là »), périmètre du comparatif (taux affichés, pas
      // coûts réels ; la liste, pas le marché) et encadré « pas une SCPI sans frais, pas moins
      // chère, coût total inconnu ».
      const lower = text.toLowerCase();
      const named = marketComparison.panel.filter((n) => lower.includes(norm(n).toLowerCase()));
      if (named.length) {
        /* Sources du comparatif : le contrôle vise le bloc du comparateur lui-même, par l'attribut
           de chaque source de colonne ; « Sources : » n'importe où dans la page ne prouvait
           rien. */
        if (!/data-comparator-source\b/.test(html))
          errors.push(file + ' : mention absente, sources du comparatif');
      }
    }
    for (const [, body] of html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    )) {
      try {
        JSON.parse(body);
      } catch (e) {
        errors.push(file + ' : JSON-LD invalide, ' + e.message);
      }
    }
  }
}

async function checkOtherPages() {
  const pages = ['mentions-legales', 'politique-de-confidentialite', 'cookies'];
  for (const p of pages) {
    const candidates = [`${p}/index.html`, `${p}.html`];
    let html = null;
    for (const c of candidates) {
      try {
        html = await readHtml(c);
        break;
      } catch {}
    }
    /* ERREUR et non avertissement : un site publié sans ses mentions légales ou sa politique de
       confidentialité passait le contrôle avec « 0 erreur ». */
    if (!html) {
      errors.push(`page /${p} absente de dist`);
      continue;
    }
    checkForbidden(toText(html), `${p}`);
  }
}

/** Le dossier de sources de rédaction ne doit jamais atterrir dans le site publié. */
async function checkNoSourceFiles() {
  const walk = async (dir, base = '') => {
    let out = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = base ? base + '/' + entry.name : entry.name;
      if (entry.isDirectory()) out = out.concat(await walk(path.join(dir, entry.name), rel));
      else out.push(rel);
    }
    return out;
  };
  const files = await walk(DIST);
  const leaked = files.filter((p) => /assets r start|brochure/i.test(p));
  for (const p of leaked) errors.push('source de rédaction publiée dans dist, ' + p);
}

/**
 * CONTRÔLES SUR TOUT LE SITE CONSTRUIT (checkWholeSite), et non sur une liste de pages : une page
 * ajoutée demain y entre sans que personne y pense.
 * 1. AUCUN DOCUMENT ORPHELIN : retirer un lien ne retire pas un fichier, et les PDF « en attente »
 *    répondaient 200 à leur adresse directe. Oubli de publication ou document indu, le build
 *    s'arrête (src/content/fr/pendingDocuments.ts).
 * 2. AUCUN LIEN INTERNE SANS LE PRÉFIXE DU SITE : sous un sous-chemin (PUBLIC_BASE_PATH), un
 *    `href="/faq"` tombe en 404. Invisible en local, la règle ne mord que sur la forge.
 */
/**
 * CE QUI SE LIT HORS DU CORPS DE LA PAGE : meta description, Open Graph et Twitter, `alt`,
 * `aria-label`, `title` et données structurées, que `toText` retire avec les balises. Ce sont les
 * textes les plus diffusés HORS du site : l'extrait de Google, l'aperçu partagé, la réponse d'un
 * assistant.
 */
function texteHorsCorps(html) {
  const morceaux = [];
  for (const [, balise] of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const nom = /\b(?:name|property)="([^"]+)"/i.exec(balise)?.[1] ?? '';
    const contenu = /\bcontent="([^"]*)"/i.exec(balise)?.[1];
    if (contenu && /^(description|og:|twitter:)/i.test(nom) && !/(:url|:image$|:type|:locale|:card|:site)/i.test(nom))
      morceaux.push(contenu);
  }
  for (const [, , valeur] of html.matchAll(/\s(alt|aria-label|title)="([^"]+)"/gi)) morceaux.push(valeur);
  const chaines = (v) => {
    if (typeof v === 'string') morceaux.push(v);
    else if (Array.isArray(v)) v.forEach(chaines);
    else if (v && typeof v === 'object')
      for (const [cle, val] of Object.entries(v))
        if (/^(name|description|headline|text|alternateName|slogan)$/.test(cle) || typeof val === 'object') chaines(val);
  };
  for (const [, corps] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      chaines(JSON.parse(corps));
    } catch {
      /* JSON-LD invalide : déjà signalé par le contrôle de la page */
    }
  }
  return norm(morceaux.join(' · '));
}

/** Pages dont le corps est déjà contrôlé, avec leurs exigences propres, par les fonctions ci-dessus. */
const PAGES_DEJA_CONTROLEES = new Set([
  'index.html',
  ...['frais', 'simulateur', 'strategie', 'a-propos', 'documentation', 'faq', 'presse'].map(
    (p) => p + '/index.html'
  ),
  ...['mentions-legales', 'politique-de-confidentialite', 'cookies'].map((p) => p + '/index.html'),
]);

/**
 * L'IMAGE OPEN GRAPH AFFICHE-T-ELLE LES CHIFFRES DU SITE ? Un JPEG ne se relit pas : on compare les
 * lignes consignées par scripts/make-og.mjs à celles que les sources donnent aujourd'hui
 * (scripts/og-lignes.mjs). Un écart : l'aperçu partagé affiche une ancienne valeur.
 */
async function checkOgImage() {
  let consignees;
  try {
    consignees = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts', 'og-lignes.json'), 'utf8'));
  } catch {
    errors.push('scripts/og-lignes.json illisible : relancer node scripts/make-og.mjs');
    return;
  }
  const attendues = lignesOg();
  if (JSON.stringify(consignees) !== JSON.stringify(attendues))
    errors.push(
      `image Open Graph périmée : elle affiche « ${[consignees.chiffres, ...(consignees.risques ?? [])].join(' ')} », les sources donnent « ${[attendues.chiffres, ...attendues.risques].join(' ')} » ; relancer node scripts/make-og.mjs`
    );
}

async function checkWholeSite() {
  const walk = async (dir, base = '') => {
    let out = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = base ? base + '/' + entry.name : entry.name;
      if (entry.isDirectory()) out = out.concat(await walk(path.join(dir, entry.name), rel));
      else out.push(rel);
    }
    return out;
  };
  const files = await walk(DIST);
  const pages = files.filter((f) => f.endsWith('.html'));
  const linked = new Set();

  for (const file of pages) {
    const html = await readHtml(file);

    /* 3. TOUTES LES PAGES, pas une liste (/test et 404.html échappaient à tout contrôle). Celles
       qui ont leur contrôle dédié ne sont pas relues deux fois. */
    if (!PAGES_DEJA_CONTROLEES.has(file)) {
      const texte = toText(html);
      checkForbidden(texte, file);
      checkHeroClaims(texte, file);
    }
    /* 4. Et, sur toutes, ce qui se lit hors du corps : meta, attributs, données structurées. Les
       citations de presse sont retirées avant, comme pour le corps de /presse. */
    checkForbidden(texteHorsCorps(stripPressQuotes(html)), `${file} (meta, attributs, JSON-LD)`);

    /* 5. ON NE BALISE QUE CE QUE LE VISITEUR PEUT LIRE : chaque question d'un FAQPage doit figurer
       dans le texte de la page (/frais a publié quatre jours les questions d'une section retirée).
       Règle de src/lib/seo.ts, et celle des moteurs de recherche. */
    const visible = toText(html).toLowerCase();
    for (const [, corps] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      let blocs;
      try {
        blocs = [JSON.parse(corps)].flat();
      } catch {
        continue;
      }
      for (const bloc of blocs.filter((b) => b && b['@type'] === 'FAQPage'))
        for (const q of bloc.mainEntity ?? [])
          if (!visible.includes(norm(String(q.name ?? '')).toLowerCase()))
            errors.push(`${file} : question balisée en FAQPage mais absente de la page, « ${q.name} »`);
    }

    /* 6. UNE DESCRIPTION SUR CHAQUE PAGE : /faq a publié six jours une meta description vide, et le
       contrôle ne regardait que la présence de la balise. Titre de l'accueil : 20 à 70
       caractères. */
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? '';
    if (!description.trim()) errors.push(`${file} : meta description vide ou absente`);
    if (file === 'index.html') {
      const titre = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
      if (titre.length < 20 || titre.length > 70)
        errors.push(`${file} : titre de ${titre.length} caractères (attendu : 20 à 70)`);
    }

    const urls = [];
    for (const [, attr, value] of html.matchAll(/\s(href|src|action|poster|data-index)="([^"]*)"/gi))
      urls.push([attr, value]);
    for (const [, value] of html.matchAll(/\ssrcset="([^"]*)"/gi))
      for (const candidat of value.split(',')) urls.push(['srcset', candidat.trim().split(/\s+/)[0] ?? '']);
    for (const [attr, value] of urls) {
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      const clean = value.split('#')[0].split('?')[0];
      linked.add(decodeURI(stripBase(clean)));
      /* UNE PAGE S'ADRESSE AVEC SA BARRE FINALE : l'hébergeur redirige sinon (301), et chaque clic paie
         l'aller-retour. `withBase` la pose ; un lien écrit à la main sans elle s'arrête ici. */
      if (attr === 'href' && !clean.endsWith('/') && !/\.[a-z0-9]+$/i.test(clean))
        errors.push(
          `${file} : href="${value}" sans barre finale, redirigé par l'hébergeur ; passer par withBase()`
        );
      if (BASE_PREFIX && clean !== BASE_PREFIX && !clean.startsWith(BASE_PREFIX + '/'))
        errors.push(
          `${file} : ${attr}="${value}" sans le préfixe du site (${BASE_PREFIX}), 404 en ligne ; passer par withBase()`
        );
    }
  }

  for (const f of files.filter((f) => f.startsWith('documents/'))) {
    if (!linked.has('/' + f))
      errors.push(
        `dist/${f} : document publié qu'aucune page ne lie ; le lier, ou le retirer de public/documents (src/content/fr/pendingDocuments.ts)`
      );
  }
}

await checkIndex();
await checkOtherPages();
await checkNoSourceFiles();
await checkSubPages();
await checkSimulateur();
await checkWholeSite();
await checkOgImage();

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} erreur(s) de conformité.`);
  process.exit(1);
}
console.log(`✔ Conformité : ${warnings.length} avertissement(s), 0 erreur.`);
