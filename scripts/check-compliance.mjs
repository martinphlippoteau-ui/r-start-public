// Contrôle de conformité du HTML buildé (dist/). Exit 1 si une règle échoue.
// Règles : mentions obligatoires présentes, formulations interdites absentes, structure du hero,
// liens PDF valides, un seul H1, lang="fr", canonical, JSON-LD parsable, SRI égal à la valeur de
// facts.ts, citations de presse de l'accueil marquées et couvertes par l'avertissement, notes du
// registre toutes appelées (avertissement), mentions obligatoires jamais en text-xs.
// Les contenus sont importés directement des sources TypeScript (Node ≥ 22, sans alias `@/` :
// notes.ts, qui en dépend, est lu dans le HTML à la place).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as legal from '../src/content/fr/legal.ts';
/* `product` a quitté cet import le 15/09/2026 avec la neutralisation des deux contrôles de
   périmètre plus bas : à remettre en même temps qu'eux. */
import { marketComparison, press as pressFacts, risk } from '../src/content/fr/facts.ts';
import { comparator } from '../src/content/fr/comparator.ts';

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
 * interdites : ce sont des propos rapportés, marqués `data-press-quote` dans le HTML et couverts par
 * l'avertissement de la page « La presse en parle » (plan §5). Tout le reste de la page reste contrôlé.
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
     */
    except: ['a-propos'],
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
   * NEUTRALISÉ le 14/09/2026 avec les « Bon à savoir » : « supprime tous les bon à savoir du site. Le
   * service conformité va les placer manuellement plus tard. » RiskNote.astro ne rend plus rien, ces
   * contrôles n'ont donc plus d'objet tant que la Conformité n'a pas replacé les mentions. Ils sont
   * COMMENTÉS, pas supprimés : ils reprennent effet en même temps que RiskNote.
   */
  // requirePhrase(text, legal.shortRiskLine, 'ligne risques courte', file);
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
  if (!/<meta[^>]+name="description"/i.test(html))
    errors.push(`${file} : meta description absente`);

  const heroMatch = html.match(/<section[^>]*id="apercu"[^>]*>[\s\S]*?<\/section>/i);
  if (!heroMatch) errors.push(`${file} : section #apercu introuvable`);
  else {
    const hero = heroMatch[0];
    /* Voir le bandeau ci-dessus : plus de [data-risk] rendu, ce contrôle attend le retour de RiskNote. */
    const risk = hero.match(/<p[^>]*data-risk[^>]*>/i);
    if (risk && /data-animate/i.test(risk[0]))
      errors.push(`${file} : la ligne risques du hero est animée`);
    if (!/data-cta="souscrire"/i.test(hero))
      errors.push(`${file} : aucun CTA de souscription dans le hero`);
  }
  const risksAnimated =
    html.match(
      /<p[^>]*data-risk[^>]*data-animate[^>]*>|<p[^>]*data-animate[^>]*data-risk[^>]*>/gi
    ) || [];
  if (risksAnimated.length)
    errors.push(`${file} : ${risksAnimated.length} bloc(s) risque animé(s)`);
  /* Voir le bandeau ci-dessus. Les [data-advantage] restent en place dans les pages : ils sont la carte
     de ce que la Conformité a à contrebalancer. Le décompte reprendra avec RiskNote. */
  const nAdv = (html.match(/data-advantage/g) || []).length;
  const nRisk = (html.match(/data-risk/g) || []).length;
  // if (nAdv > nRisk) errors.push(`${file} : ${nAdv} avantages pour ${nRisk} risques`);
  void [nAdv, nRisk];

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

  // « La presse en parle » : la section a quitté l'accueil le 11/09/2026, puis son composant
  // (08b-Press.astro) et son contenu (pressHome.ts) ont été SUPPRIMÉS le 15/09/2026. Ce contrôle ne peut
  // donc plus se déclencher aujourd'hui. Il est gardé tel quel : il est le filet qui attend le retour
  // d'une revue de presse sur l'accueil, et il exigera alors ce qu'exige déjà /presse, citations de tiers
  // marquées data-press-quote et avertissement de couverture présent. Rien à corriger tant qu'il dort.
  const pressMatch = html.match(/<section[^>]*id="presse-en-parle"[^>]*>[\s\S]*?<\/section>/i);
  if (pressMatch) {
    const press = pressMatch[0];
    requirePhrase(
      toText(press),
      pressFacts.coverageDisclaimer.slice(0, 120),
      'avertissement de la revue de presse (#presse-en-parle)',
      file
    );
    const quotes = press.match(/<blockquote\b[^>]*>/gi) || [];
    const unmarked = quotes.filter((q) => !/\sdata-press-quote\b/i.test(q));
    // À passer en erreur le jour où une revue de presse revient sur l'accueil : le composant devra
    // alors poser data-press-quote sur chaque citation, comme le fait déjà /presse.
    if (unmarked.length)
      warnings.push(
        `${file} : ${unmarked.length} <blockquote> de #presse-en-parle sans data-press-quote`
      );
  }

  // Notes orphelines : chaque note du registre de l'accueil (li id="notes-N" de la section #notes)
  // doit être appelée au moins une fois (href="#notes-N"). notes.ts n'est pas importable ici (alias
  // `@/`) : on lit les ancres rendues.
  const noteIds = [...html.matchAll(/<li[^>]*\bid="notes-(\d+)"/g)].map((m) => m[1]);
  const noteRefs = new Set([...html.matchAll(/href="#notes-(\d+)"/g)].map((m) => m[1]));
  const orphans = noteIds.filter((n) => !noteRefs.has(n));
  /*
   * Une page sans note NI appel de note est un état cohérent, plus un contrôle en panne : l'accueil est
   * dans ce cas depuis le 14/09/2026 (registre vidé dans content/fr/notes.ts, section retirée de
   * index.astro). L'avertissement ne se déclenche donc que si l'un des deux existe sans l'autre, ce qui
   * signale un exposant qui ne mène nulle part, ou une note que personne n'appelle.
   */
  if (!noteIds.length && noteRefs.size)
    errors.push(`${file} : ${noteRefs.size} appel(s) de note sans section #notes (ancres mortes)`);
  if (orphans.length)
    warnings.push(`${file} : note(s) sans appel dans la page, notes-${orphans.join(', notes-')}`);

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

/** Sous-pages produit : mêmes interdits, ligne risques dans l'en-tête, mentions obligatoires, structure. */
async function checkSubPages() {
  for (const p of [
    'frais',
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
    // interdites (elles portent data-press-quote) ; l'avertissement qui les couvre est exigé.
    checkForbidden(p === 'presse' ? toText(stripPressQuotes(html)) : text, p);
    checkHeroClaims(text, p);
    /*
     * LA LIGNE RISQUES N'EST PLUS EXIGÉE SUR LES SOUS-PAGES depuis le 14/09/2026, demande expresse de
     * l'équipe : « supprime les bon à savoir de tous les hero sauf celui de la home ». Le « Bon à
     * savoir : … » sous le H1 a disparu de toutes les sous-pages ; seul l'accueil le porte, et checkIndex
     * continue de l'y exiger.
     *
     * CE QUE CELA CHANGE, ET QUI DOIT ÊTRE SU : une sous-page peut désormais être publiée sans aucune
     * mention de risque dans son en-tête. Ce qui protège encore ces pages, c'est le contenu de leurs
     * propres sections (contre-poids [data-risk], toujours contrôlés) et le pied de page, présent
     * partout : mention de caractère commercial et visa AMF, tous deux exigés juste en dessous.
     * Pour rétablir : décommenter la ligne, et remettre `riskLine: shortRiskLine` dans les en-têtes de
     * aboutPage.ts, press.ts, pressRoom.ts, documentation.ts, feesPage.ts et strategyPage.ts.
     */
    // requirePhrase(text, legal.shortRiskLine, 'ligne risques (en-tête de page)', file);
    requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
    requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
    const h1 = html.match(/<h1\b[^>]*>/gi) || [];
    if (h1.length !== 1) errors.push(file + ' : ' + h1.length + ' balise(s) <h1> (attendu : 1)');
    if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(file + ' : canonical absent');
    const risksAnimated =
      html.match(
        /<p[^>]*data-risk[^>]*data-animate[^>]*>|<p[^>]*data-animate[^>]*data-risk[^>]*>/gi
      ) || [];
    if (risksAnimated.length)
      errors.push(file + ' : ' + risksAnimated.length + ' bloc(s) risque animé(s)');
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
       * par RiskNote sur les fiches de documents : ils sont donc partis le 14/09/2026 avec tous les
       * « Bon à savoir », et ces deux exigences sont commentées comme les autres. CE SONT DEUX TEXTES
       * RÉGLEMENTAIRES, pas des contre-poids rédigés : ils figurent en tête de la liste de ce que la
       * Conformité a à replacer. Leur contenu reste dans src/content/fr/legal.ts.
       */
      // requirePhrase(text, legal.bulletinWarning.slice(0, 120), 'avertissement du bulletin', file);
      // requirePhrase(text, legal.dicWarning, 'avertissement du DIC', file);
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
       * donc levée en connaissance de cause, et le rapport le redit à chaque exécution.
       * Pour rétablir : remettre `disclaimer` dans press.ts (`coverage`) et repasser ce contrôle en
       * erreur.
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
      // Bascule des frais : une SCPI du panel ne peut être citée que dans le périmètre de l'analyse,
      // et l'encadré « Une innovation, pas une révolution » accompagne toujours la comparaison.
      const lower = text.toLowerCase();
      const named = marketComparison.panel.filter((n) => lower.includes(norm(n).toLowerCase()));
      if (named.length) {
        // Nommer une autre SCPI oblige à trois choses : dire ce que la comparaison compare, d'où
        // viennent les chiffres, et rappeler que R Start n'est pas une SCPI sans frais. Le périmètre
        // accepté est celui du comparateur SCPI par SCPI (comparator.ts) OU celui des moyennes de
        // marché de la brochure, selon la comparaison présente sur la page.
        /*
         * DEUX EXIGENCES NEUTRALISÉES le 14/09/2026, l'équipe ayant fourni le contenu exact de /frais
         * (« je veux ce contenu là »). Elles sont COMMENTÉES, pas supprimées : une ligne à décommenter.
         *
         * CE QUI A DISPARU DU SITE AVEC ELLES, et ne se trouve plus nulle part ailleurs :
         *  - le périmètre du comparatif : ce que le tableau compare (des taux affichés, pas des coûts
         *    réels), et le fait qu'il ne porte pas sur l'ensemble du marché mais sur les seules SCPI de
         *    la liste. Le tableau nomme dix-sept sociétés de gestion ;
         *  - l'encadré « Une innovation, pas une révolution », reproduit de la brochure page 4, seul
         *    endroit du site à écrire que R Start n'est pas une SCPI sans frais, qu'elle n'est pas moins
         *    chère qu'une SCPI traditionnelle, et que le coût total n'est pas connu à la souscription.
         * Les deux textes restent dans comparator.ts et legal.ts. Rien n'est perdu dans le code, tout
         * l'est à l'écran.
         */
        // const perimetres = [
        //   comparator.perimeter.slice(0, 80),
        //   marketComparison.perimeterLead.slice(0, 80),
        // ];
        // if (!perimetres.some((ph) => text.toLowerCase().includes(norm(ph).toLowerCase())))
        //   errors.push(file + ' : mention absente, périmètre du comparatif');
        // requirePhrase(text, legal.innovationNotRevolution.title,
        //   'encadré « Une innovation, pas une révolution »', file);

        /*
         * Sources du comparatif : contrôle RESSERRÉ le 14/09/2026. Il cherchait la chaîne « Sources : »
         * n'importe où dans la page, et c'était le bloc « Notes et sources », en bas, qui la fournissait,
         * pas le comparateur. Les notes sont parties avec le nouveau contenu, et le contrôle est tombé
         * alors que les sources du tableau, elles, sont toujours là. Il vise désormais le bloc du
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
    if (!html) {
      warnings.push(`page /${p} absente`);
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

await checkIndex();
await checkOtherPages();
await checkNoSourceFiles();
await checkSubPages();

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} erreur(s) de conformité.`);
  process.exit(1);
}
console.log(`✔ Conformité : ${warnings.length} avertissement(s), 0 erreur.`);
