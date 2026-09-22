// Contrôle de conformité du HTML buildé (dist/). Exit 1 si une règle échoue.
// Règles : mentions obligatoires présentes, formulations interdites absentes, structure du hero,
// liens PDF valides, un seul H1, lang="fr", canonical, JSON-LD parsable, SRI égal à la valeur de
// facts.ts, citations de presse marquées, mentions obligatoires jamais en text-xs.
// Les contenus sont importés directement des sources TypeScript (Node ≥ 22, sans alias `@/`).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as legal from '../src/content/fr/legal.ts';
/* `product` a quitté cet import le 15/09/2026 avec la neutralisation des deux contrôles de
   périmètre plus bas : à remettre en même temps qu'eux. */
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
 * Retire les citations de tiers (titres d'articles, extraits) avant le contrôle des formulations
 * interdites : ce sont des propos rapportés, marqués `data-press-quote` dans le HTML (plan §5).
 * L'avertissement de la page « La presse en parle » qui les couvrait a été retiré le 16/09/2026 ;
 * son absence est signalée à chaque exécution. Tout le reste de la page reste contrôlé.
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
    /*
     * Forme RAPPORTÉE : « … dites « sans frais » ». Le mot « dites » et les guillemets nomment une
     * catégorie employée par le marché, ils n'affirment rien. C'est la formulation de la brochure pour
     * désigner les SCPI sans commission de souscription.
     * L'exemption est étroite à dessein : elle ne vaut que collée à « dites », et seulement si la page
     * explique ailleurs ce que la catégorie recouvre (`requires`). Sans cette explication, l'exemption
     * tombe et l'occurrence redevient une erreur, car plus rien ne protégerait le lecteur.
     */
    reported: /\bdites\s*[«"“]\s*$/i,
    requires: /ne prélève pas de frais de souscription/i,
  },
  { re: /\bgratuit/gi, label: '« gratuit »', allow: /saisir gratuitement le médiateur/i },
  {
    re: /\bgaranti(e|s|es)?\b/gi,
    label: '« garanti »',
    /*
     * « ne peut pas être garantie » ajouté le 16/09/2026 : la règle vise les PROMESSES de garantie, et
     * cette tournure en est la négation, mais aucune des formes admises ne la couvrait (« pas garanti »
     * suppose les deux mots accolés, ici « être » s'intercale). Faux positif, pas un assouplissement.
     */
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
    /*
     * INDICATEURS DE PERFORMANCE. La règle existe parce que R Start N'EN A AUCUN : la SCPI n'a pas
     * d'historique, et une communication commerciale ne peut pas en laisser espérer un.
     *
     * EXEMPTION DE /a-propos, posée le 16/09/2026 avec le carrousel de la gamme (contenu fourni par
     * l'équipe). Cette page, et elle seule, publie les chiffres des QUATRE AUTRES SCPI DU GROUPE :
     * TRI depuis la création, objectif de TRI pour CORUM USA, taux de distribution 2025, indicateur de
     * risque, minimum d'investissement. Ce sont des performances réalisées par d'autres produits,
     * chacune accompagnée de sa définition intégrale et précédée de la mention réglementaire sur les
     * performances passées (src/content/fr/corumRange.ts).
     *
     * L'EXEMPTION VAUT POUR LA PAGE, PAS POUR R START. Aucun de ces chiffres ne porte sur R Start, et
     * la page ne doit jamais lui en attribuer un : c'est le point à surveiller à chaque relecture,
     * puisque la règle ne le verra plus. Toutes les autres pages restent couvertes.
     *
     * SECONDE EXEMPTION, /simulateur, posée le 19/09/2026 avec la page (demande de Martin). Le
     * simulateur ne peut pas se passer du mot : son curseur EST un taux de distribution, celui que le
     * visiteur choisit de tester. La règle ne tombe pas pour autant, elle change de forme :
     * `checkSimulateur`, plus bas, exige ce qui rend la page défendable. Une fenêtre d'avertissement
     * avant tout accès, qui reproduit l'avertissement du bulletin ; aucun taux présélectionné,
     * aucun résultat à l'arrivée (la page s'ouvre sur la première question du parcours),
     * l'avertissement dans le bloc des résultats, la mention sur les performances passées, et des
     * repères de marché qui portent leur année et leur source.
     */
    except: ['a-propos', 'simulateur'],
    re: /taux de distribution|\bTRI\b|rendement (cible|garanti|attendu|estimé|annuel)|objectif de rendement/g,
    label: 'indicateur de performance',
    allow: /(pas|aucun|sans)\s+(d'|de\s)?(objectif de rendement|taux de distribution)/i,
  },
  {
    re: /\d+(?:[,.]\d+)?\s?%\s?(?:de\s)?(?:rendement|performance|par an|annuel)/gi,
    label: 'pourcentage de performance',
  },
  /*
   * MENTION DU CRÉDIT. La règle bloque le mot, parce que présenter l'achat de parts à crédit oblige à
   * avertir que le souscripteur reste tenu de rembourser son prêt même si le placement perd de la
   * valeur, et qu'il ne doit pas compter sur les revenus du placement pour y parvenir.
   *
   * EXEMPTION POSÉE LE 16/09/2026 pour la question « Peut-on financer R Start à crédit ? », dont le
   * texte a été fourni par l'équipe. Sa PREMIÈRE phrase est une négation (« Le financement à crédit
   * n'est pas proposé à ce jour par CORUM pour R Start »), elle ne promeut rien.
   *
   * CE QUI N'EST PAS RÉGLÉ, et qu'il faut lire comme une dette : la SECONDE phrase de la réponse,
   * « rien n'empêche un épargnant de financer son investissement par ses propres moyens, par exemple
   * via un crédit obtenu auprès de sa banque », SUGGÈRE de souscrire à crédit sans porter
   * l'avertissement ci-dessus. C'est précisément ce que cette règle existe pour attraper.
   *
   * L'ÉQUIPE A TRANCHÉ LE 16/09/2026, en connaissance de cause, entre trois issues : ne garder que la
   * première phrase, garder le texte entier en lui adjoignant l'avertissement, ou garder le texte et
   * lever la règle. C'est la troisième qui a été retenue. Le site part donc avec une mention du crédit
   * sans son avertissement, et c'est un point à faire arbitrer par la Conformité avant toute
   * ouverture au public.
   *
   * POUR RÉTABLIR LE CONTRÔLE : retirer `via un crédit obtenu` de `allow`. La règle redeviendra
   * bloquante sur cette réponse, et il faudra alors choisir l'une des deux autres issues.
   */
  {
    re: /\bcrédit\b/gi,
    label: 'mention du crédit',
    allow: /financement à crédit n'est pas proposé|via un crédit obtenu|carte de crédit/i,
  },
  // NOTE (11/09/2026, complétée le 14/09/2026) : quatre formulations ne sont plus BLOQUÉES mais
  // SIGNALÉES EN AVERTISSEMENT plus bas, l'équipe les ayant reprises mot pour mot dans son document.
  // La formule d'alignement (« on ne touche rien tant que vous n'avez pas gagné d'argent ») et
  // l'allégation de rang sans périmètre depuis le 11/09 ; « objectifs tenus » et « diversifié » depuis
  // le 14/09, demande explicite de l'équipe de respecter son document à la lettre. Elles restent
  // tracées à chaque exécution, pour l'arbitrage de la compliance.
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

/**
 * Le paragraphe qui porte le début de la mention 1 (caractère commercial) ne doit pas être en text-xs,
 * directement ni par un ancêtre (la régression du 10/09/2026 tenait à la classe posée sur la <section>
 * du bloc légal). Petit parcours de la pile des balises ouvertes sur le HTML de la page, sans parseur.
 */
const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
/**
 * Formulations « à défendre en compliance » : signalées en AVERTISSEMENT, pour rester traçables jusqu'à
 * l'arbitrage, jamais bloquantes.
 *
 * APPELÉE SUR TOUTES LES PAGES depuis le 14/09/2026. Elle ne l'était que sur l'accueil, et le jour où
 * l'accroche « la seule SCPI… c'est gagnant-gagnant » est passée dans l'en-tête de /frais, le contrôle
 * est devenu muet sur les deux formulations qu'il existait précisément pour suivre. Une règle qui ne
 * regarde qu'une page ne protège qu'une page.
 */
function checkHeroClaims(text, file) {
  // (règles historiquement écrites pour l'accroche de l'accueil du 11/09/2026, prise en connaissance du risque) : signalée en
  // AVERTISSEMENT pour rester traçable jusqu'à l'arbitrage de la compliance. « la seule » est une allégation
  // d'exclusivité sur tout le marché, sans périmètre ni preuve ; « gagnant-gagnant » suggère un gain, alors
  // que le capital n'est pas garanti. À passer en erreur si la compliance la refuse.
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
    /*
     * Ajoutée le 16/09/2026 avec le texte du moteur « Les plus-values » de /strategie : « R Start vise
     * à dégager des plus-values sur vente d'immeubles de façon plus systématique que d'autres SCPI ».
     * C'est une comparaison avec le reste du marché, comme « la seule SCPI » et « première SCPI », et
     * elle n'a ni périmètre ni source : elle est donc suivie ici comme les deux autres, en
     * avertissement, jusqu'à ce que CORUM fournisse la base de la comparaison ou que la compliance
     * tranche. Le motif vise la COMPARAISON, pas le mot « systématique » seul.
     */
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
  /*
   * PLUS AUCUN CONTRÔLE DE CONTRE-POIDS depuis le 22/09/2026 : la ligne risques du hero, l'équilibre
   * entre avantages et risques et l'interdiction d'animer un risque visaient les « Bon à savoir »,
   * retirés de l'écran le 14/09/2026 (« supprime tous les bon à savoir du site ») puis du code. Le
   * site ne porte plus de contre-poids à côté de ses avantages ; restent la section Risques et les
   * mentions du pied de page, exigées ici.
   */
  requirePhrase(text, legal.gdpr.dpoEmail, 'e-mail DPO', file);
  /*
   * NEUTRALISÉES LE 15/09/2026 avec le retrait de l'allégation de rang du bloc « Le modèle » (demande
   * de l'équipe : « Supprimer dernière phrase : la première SCPI… »). Cette phrase, `product.definition`,
   * était la SEULE occurrence du périmètre « du groupe CORUM » sur l'accueil : les deux contrôles
   * ci-dessous n'ont donc plus d'objet, et échoueraient sur une page dont le contenu a été arbitré.
   * L'accueil ne porte plus qu'une allégation de rang NON BORNÉE, celle de l'accroche du hero (« La
   * première SCPI sans frais de souscription ni frais d'acquisition »), signalée par ailleurs en
   * avertissement. COMMENTÉES, pas supprimées : elles reprennent effet dès que le périmètre revient.
   */
  // requirePhrase(text, product.definition, 'ligne de définition du hero', file);
  // requirePhrase(text, 'groupe CORUM', 'périmètre de l’allégation de rang', file);
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
  /*
   * AVERTISSEMENT ET NON PLUS ERREUR depuis le 16/09/2026, arbitrage de l'équipe (« dans tous les cas
   * ne rends rien dispo là, on verra plus tard »).
   *
   * LA RÈGLE ATTENDAIT DEUX PDF servis depuis la page : la note d'information et le bulletin, les deux
   * documents publiables (les statuts sont tronqués à la source et le DIC hébergé classe R Start en
   * 3 sur 7 quand le site affiche 4 sur 7, retour AMF du 10/09/2026). Le pied de page les servait.
   *
   * IL N'EN SERT PLUS AUCUN : la colonne Documents annonce les cinq documents réglementaires en
   * « bientôt disponible », et le lien vers /documentation a été retiré de la colonne R Start. Plus
   * aucun fichier n'est donc atteignable depuis l'accueil.
   *
   * CE QUI RESTE, ET QUI EST LA RAISON POUR LAQUELLE CE N'EST PLUS UNE ERREUR : la mention obligatoire
   * du pied de page invite toujours à consulter la note d'information et le DIC, et dit où ils se
   * trouvent (www.corum.fr). L'accès aux documents réglementaires n'est donc pas supprimé, il est
   * renvoyé hors du site. À rebasculer en erreur le jour où les documents sont publiés ici.
   */
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
 * /SIMULATEUR : LES CONDITIONS DE SON EXEMPTION (19/09/2026). La page est la seule, avec /a-propos, à
 * pouvoir écrire « taux de distribution » ; en échange, le build vérifie ce qui la rend défendable pour
 * une SCPI sans historique. Tout se lit dans le HTML publié : src/content/fr/simulator.ts importe par
 * l'alias `@/`, que ce script ne résout pas.
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
     du bulletin de souscription de R Start, mot pour mot. ELLE EST RENDUE PAR LE SERVEUR ET VISIBLE
     SANS SCRIPT : c'est ce qui garantit qu'aucun formulaire ne s'affiche nu avant elle (21/09/2026 ;
     ouverte par `showModal()`, elle n'apparaissait qu'à l'exécution d'un module différé). Le <dialog>
     est donc refusé ici, comme l'est un `hidden` qu'il faudrait retirer. */
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

/**
 * Sous-pages produit : mêmes interdits, mentions obligatoires, structure. La ligne risques de
 * l'en-tête n'y est plus exigée depuis le 14/09/2026 (voir plus bas).
 */
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
    // Sur « La presse en parle », les citations de tiers sont exclues du contrôle des formulations
    // interdites (elles portent data-press-quote). L'avertissement qui les couvrait n'est plus
    // exigé depuis le 16/09/2026 : son absence est signalée plus bas, en avertissement.
    checkForbidden(p === 'presse' ? toText(stripPressQuotes(html)) : text, p);
    checkHeroClaims(text, p);
    /*
     * LA LIGNE RISQUES N'EST PLUS EXIGÉE SUR LES SOUS-PAGES depuis le 14/09/2026, demande expresse
     * de l'équipe (« supprime les bon à savoir de tous les hero »). Elle ne figure plus que dans les
     * mentions légales. CE QUE CELA CHANGE, ET QUI DOIT ÊTRE SU : une sous-page peut être publiée
     * sans aucune mention de risque dans son en-tête. Ce qui protège encore ces pages, c'est leur
     * texte quand il en porte (les avertissements réglementaires de /documentation, exigés plus bas)
     * et le pied de page, présent partout : mention de caractère commercial et visa AMF, tous deux
     * exigés juste en dessous.
     */
    requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
    requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
    const h1 = html.match(/<h1\b[^>]*>/gi) || [];
    if (h1.length !== 1) errors.push(file + ' : ' + h1.length + ' balise(s) <h1> (attendu : 1)');
    if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(file + ' : canonical absent');
    if (p === 'frais' && !/15\s?%/.test(text))
      errors.push(file + ' : frais de gestion 15 % absents');
    if (p === 'frais' && /data-comparator\b/.test(html)) {
      // Comparateur de frais : tant qu'une SCPI proposée n'a pas ses sept taux, la page montrerait les
      // zéros de R Start face à des cases vides. C'est une comparaison trompeuse : elle ne doit pas être
      // mise en ligne. Avertissement tant que le comparateur est en construction ; à passer en erreur le
      // jour où la page part en production.
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
      /*
       * Avertissements reproduits in extenso, descendus de l'accueil le 11/09/2026. Ils étaient rendus
       * par le composant des « Bon à savoir » sur les fiches de documents, et sont partis avec eux le
       * 14/09/2026. CE SONT DEUX TEXTES RÉGLEMENTAIRES, pas des contre-poids rédigés : depuis le
       * 18/09/2026 la page les rend en paragraphes directs (MandatoryWarnings.astro), et les deux
       * exigences sont de nouveau actives.
       */
      requirePhrase(text, legal.bulletinWarning.slice(0, 120), 'avertissement du bulletin', file);
      requirePhrase(text, legal.dicWarning, 'avertissement du DIC', file);
      for (const b of legal.arbitrageWarningBullets)
        requirePhrase(text, b.slice(0, 100), "puce commission d'arbitrage", file);
    }
    if (p === 'presse') {
      /*
       * AVERTISSEMENT ET NON PLUS ERREUR depuis le 16/09/2026, arbitrage de l'équipe.
       *
       * LA RÈGLE EXIGEAIT l'avertissement de la revue de presse, parce que les titres et les citations
       * sont reproduits mot pour mot : certains emploient « sans frais », et c'est ce bloc qui les
       * qualifiait. Il disait que les articles sont des publications indépendantes, qu'ils n'engagent
       * pas la société de gestion, qu'ils ne valent pas conseil, et que l'investissement comporte un
       * risque de perte en capital.
       *
       * L'ÉQUIPE L'A RETIRÉ, avec l'introduction de la revue qui portait le contre-poids sur les frais.
       * Il ne reste, autour des citations, que la mention obligatoire du pied de page. La règle est
       * donc levée en connaissance de cause, et le rapport le redit à chaque exécution. Le texte a
       * quitté le code le 22/09/2026 (archivé hors du dépôt, .claude/audits) : s'il revient, repasser
       * ce contrôle en erreur.
       */
      warnings.push(
        file +
          ' : avertissement de la revue de presse absent — les titres et citations de tiers ne sont plus qualifiés que par le pied de page'
      );
      const quoted = (html.match(/data-press-quote/g) || []).length;
      if (!quoted)
        errors.push(file + ' : aucune citation marquée data-press-quote (contrôle inopérant)');
    }
    if (p === 'frais') {
      // SCPI nommées sur /frais : le comparateur nomme des SCPI du panel. Nommer une autre SCPI
      // obligeait à trois choses : dire ce que la comparaison compare, d'où viennent les chiffres,
      // et rappeler que R Start n'est pas une SCPI sans frais. Le contrôle n'exige plus que la
      // source. LES DEUX AUTRES EXIGENCES SONT PARTIES avec leurs textes : le périmètre du
      // comparatif (des taux affichés, pas des coûts réels ; les seules SCPI de la liste, pas le
      // marché) et l'encadré « Une innovation, pas une révolution » (R Start n'est pas une SCPI sans
      // frais, n'est pas moins chère, coût total inconnu à la souscription) ont quitté l'écran le
      // 14/09/2026 (« je veux ce contenu là ») et le code le 22/09/2026. Le tableau nomme dix-neuf
      // sociétés de gestion sans plus rien dire de tout cela.
      const lower = text.toLowerCase();
      const named = marketComparison.panel.filter((n) => lower.includes(norm(n).toLowerCase()));
      if (named.length) {
        /*
         * Sources du comparatif : contrôle RESSERRÉ le 14/09/2026. Il cherchait la chaîne « Sources : »
         * n'importe où dans la page, et c'était le bloc « Notes et sources », en bas, qui la fournissait,
         * pas le comparateur. Les notes sont parties ce jour-là, et le contrôle est tombé alors que les
         * sources du tableau, elles, sont toujours là. Il vise désormais le bloc du
         * comparateur lui-même, par l'attribut que porte chaque source de colonne.
         */
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
    /* ERREUR et non plus avertissement (audit du 18/09/2026) : un site publié sans ses mentions légales
       ou sa politique de confidentialité passait le contrôle avec « 0 erreur ». */
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
 * CONTRÔLES SUR TOUT LE SITE CONSTRUIT (audit du 18/09/2026), et non sur une liste de pages : ils
 * parcourent chaque fichier HTML de dist, une page ajoutée demain y entre sans que personne y pense.
 *
 * 1. AUCUN DOCUMENT ORPHELIN. Tout fichier de dist/documents doit être lié par au moins une page. Les
 *    trois PDF « en attente » (DIC, statuts, simulation des frais) n'étaient liés nulle part et
 *    répondaient pourtant 200 à leur adresse directe : retirer un lien ne retire pas un fichier. Un
 *    document sans lien est soit un oubli de publication, soit un document qui ne devrait pas être là ;
 *    dans les deux cas le build s'arrête. Voir src/content/fr/pendingDocuments.ts.
 *
 * 2. AUCUN LIEN INTERNE SANS LE PRÉFIXE DU SITE. Sous un sous-chemin (PUBLIC_BASE_PATH, GitHub Pages de
 *    projet), un `href="/faq"` sort du site et tombe en 404. Invisible en local, où la base vaut « / » :
 *    la règle ne mord donc que là où le défaut existe, c'est-à-dire sur la forge. Elle a été écrite pour
 *    le renvoi « Voir toutes les questions » de /documentation, seul lien du site posé sans withBase,
 *    cassé en ligne depuis sa création.
 */
/**
 * CE QUI SE LIT HORS DU CORPS DE LA PAGE (audit du 18/09/2026). `toText` retire les <script> et toutes
 * les balises avec leurs attributs : la meta description, les balises Open Graph et Twitter, les
 * `alt`, `aria-label` et `title`, et les données structurées échappaient donc aux formulations
 * interdites. Ce sont pourtant les textes les plus diffusés HORS du site : l'extrait affiché par
 * Google, l'aperçu partagé sur les réseaux, la réponse reprise par un assistant.
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
 * lignes que scripts/make-og.mjs a consignées à sa dernière génération avec celles que facts.ts et
 * legal.ts donnent aujourd'hui (scripts/og-lignes.mjs). Un écart veut dire que l'aperçu partagé sur les
 * réseaux affiche une ancienne valeur.
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

    /* 3. TOUTES LES PAGES, pas une liste : une page ajoutée dans src/pages partait en production sans
       aucun contrôle de formulation, et le script affichait « 0 erreur » (/test et 404.html y
       échappaient). Celles qui ont déjà leur contrôle dédié ne sont pas relues deux fois. */
    if (!PAGES_DEJA_CONTROLEES.has(file)) {
      const texte = toText(html);
      checkForbidden(texte, file);
      checkHeroClaims(texte, file);
    }
    /* 4. Et, sur toutes, ce qui se lit hors du corps : meta, attributs, données structurées. Les
       citations de presse sont retirées avant, comme pour le corps de /presse. */
    checkForbidden(texteHorsCorps(stripPressQuotes(html)), `${file} (meta, attributs, JSON-LD)`);

    /* 5. ON NE BALISE QUE CE QUE LE VISITEUR PEUT LIRE. Chaque question d'un FAQPage doit figurer dans
       le texte de la même page : /frais a publié pendant quatre jours les quatre questions d'une
       section retirée, réponses chiffrées comprises, que personne ne pouvait lire ni relire. C'est la
       règle écrite de src/lib/seo.ts, et celle des moteurs de recherche. */
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

    /* 6. UNE DESCRIPTION SUR CHAQUE PAGE (22/09/2026). /faq a publié pendant six jours une meta
       description vide : son introduction, vidée au lieu d'être retirée, lui servait de description.
       Le contrôle ne regardait que la présence de la balise, et sur l'accueil seulement. Le titre de
       l'accueil garde sa borne de 20 à 70 caractères (reprise d'un test de qualite.spec.ts, doublon). */
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
