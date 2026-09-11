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
import { marketComparison, press as pressFacts, product, risk } from '../src/content/fr/facts.ts';

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
    errors.push(`${file} : mention absente — ${label}`);
}

const FORBIDDEN = [
  {
    re: /sans frais/gi,
    label: '« sans frais »',
    // Autorisé : le démenti de la brochure et tout « sans frais » IMMÉDIATEMENT QUALIFIÉ — de
    // souscription, d'entrée, d'acquisition. Reste interdit le « sans frais » absolu, qui laisserait
    // croire qu'il n'y a aucun frais.
    allow:
      /n'est pas une scpi sans frais|frais de souscription|sans frais d['’](entrée|acquisition)/i,
  },
  { re: /\bgratuit/gi, label: '« gratuit »', allow: /saisir gratuitement le médiateur/i },
  {
    re: /\bgaranti(e|s|es)?\b/gi,
    label: '« garanti »',
    allow:
      /(non|pas|aucune|ni)\s+(de\s+)?garanti|ne (sont|est) pas garanti|ne garantit pas|aucune garantie|sans garantie|n'offrent aucune garantie|ne présagent|garantie en capital/i,
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
    re: /taux de distribution|\bTRI\b|rendement (cible|garanti|attendu|estimé|annuel)|objectif de rendement/g,
    label: 'indicateur de performance',
    allow: /(pas|aucun|sans)\s+(d'|de\s)?(objectif de rendement|taux de distribution)/i,
  },
  {
    re: /\d+(?:[,.]\d+)?\s?%\s?(?:de\s)?(?:rendement|performance|par an|annuel)/gi,
    label: 'pourcentage de performance',
  },
  { re: /\bcrédit\b/gi, label: 'mention du crédit', allow: /carte de crédit/i },
  { re: /objectifs? tenus?/gi, label: '« objectifs tenus » (allégation de performance)' },
  // NOTE (11/09/2026) : la formule d'alignement (« on ne touche rien tant que vous n'avez pas gagné
  // d'argent ») et l'allégation de rang sans périmètre sont désormais SIGNALÉES EN AVERTISSEMENT plus bas,
  // et non plus bloquées : l'équipe les a reprises mot pour mot dans la zone 2. Elles restent tracées à
  // chaque exécution pour l'arbitrage de la compliance.
  {
    // « Diversification » n'est admis qu'accompagné de sa limite (« ne supprime pas / ne garantit
    // pas le risque… ») ou présenté comme un objectif (« objectif », « vise »), jamais comme un acquis.
    re: /\bdiversifi/gi,
    label: '« diversifié » présenté comme un acquis',
    allow: /ne (supprime|garantit)|objectif|vise/i,
  },
];

function checkForbidden(text, file) {
  for (const rule of FORBIDDEN) {
    if (rule.except && rule.except.some((p) => file.includes(p))) continue;
    const matches = [...text.matchAll(rule.re)];
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
      if (rule.allow && rule.allow.test(ctx)) continue;
      errors.push(`${file} : formulation interdite ${rule.label} — « …${ctx.trim()}… »`);
    }
  }
}

/**
 * Le paragraphe qui porte le début de la mention 1 (caractère commercial) ne doit pas être en text-xs,
 * directement ni par un ancêtre (la régression du 10/09/2026 tenait à la classe posée sur la <section>
 * du bloc légal). Petit parcours de la pile des balises ouvertes sur le HTML de la page, sans parseur.
 */
const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
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
        `${file} : mention 1 (caractère commercial) en text-xs via <${small.map((t) => t.name).join('>, <')}> — text-caption (14 px) minimum`
      );
  }
  if (!found)
    warnings.push(
      `${file} : aucun <p> ne commence par la mention 1 — contrôle de taille inopérant`
    );
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
  requirePhrase(text, legal.shortRiskLine, 'ligne risques courte', file);
  requirePhrase(text, legal.gdpr.dpoEmail, 'e-mail DPO', file);
  requirePhrase(text, product.definition, 'ligne de définition du hero', file);
  requirePhrase(text, 'groupe CORUM', 'périmètre de l’allégation de rang', file);
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
    const risk = hero.match(/<p[^>]*data-risk[^>]*>/i);
    if (!risk) errors.push(`${file} : aucune ligne risques ([data-risk]) dans le hero`);
    else if (/data-animate/i.test(risk[0]))
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
  const nAdv = (html.match(/data-advantage/g) || []).length;
  const nRisk = (html.match(/data-risk/g) || []).length;
  if (nAdv > nRisk) errors.push(`${file} : ${nAdv} avantages pour ${nRisk} risques`);

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

  // Accroche du hero (décision de l'équipe du 11/09/2026, prise en connaissance du risque) : signalée en
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
  ]) {
    const n = (text.match(re_) || []).length;
    if (n) warnings.push(`${file} : ${n} occurrence(s) à défendre en compliance — ${quoi}`);
  }

  // « La presse en parle » : la section a quitté l'accueil le 11/09/2026 (la revue complète est sur /presse,
  // au menu). Si elle y revient un jour, elle doit satisfaire les mêmes exigences que /presse — citations de
  // tiers marquées data-press-quote, avertissement de couverture présent — d'où le contrôle conservé, mais
  // sans exiger sa présence.
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
    // À passer en erreur après ajout de l'attribut dans 08b-Press.astro (hors lot) : aujourd'hui les
    // blockquotes de l'accueil ne portent pas data-press-quote.
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
  if (!noteIds.length)
    warnings.push(`${file} : aucune note (li id="notes-N") — contrôle inopérant`);
  if (orphans.length)
    warnings.push(`${file} : note(s) sans appel dans la page — notes-${orphans.join(', notes-')}`);

  // Mentions obligatoires : jamais en text-xs (12 px), ni sur le <p> ni par un ancêtre.
  checkNoticeSize(html, file);

  // Documents PDF
  const pdfLinks = [...new Set([...html.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => m[1]))];
  // 2 tant que les statuts (PDF tronqué à la source) et le DIC (SRI 3/7 contredisant le 4/7 du site,
  // retour AMF du 10/09/2026) sont exclus de PENDING_DOCUMENT_KEYS (documentation.ts) : il reste la note
  // d'information et le bulletin. Repasser à 4 dès que les deux fichiers sont remplacés.
  if (pdfLinks.length < 2) errors.push(`${file} : ${pdfLinks.length} lien(s) PDF (attendu : ≥ 2)`);
  for (const link of pdfLinks) {
    const local = stripBase(link.replace(/^https?:\/\/[^/]+/, ''));
    if (!local.startsWith('/')) continue;
    try {
      await fs.access(path.join(DIST, local));
    } catch {
      errors.push(`${file} : PDF manquant dans dist — ${local}`);
    }
  }

  // JSON-LD
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ld.length) warnings.push(`${file} : aucun JSON-LD`);
  for (const [, body] of ld) {
    try {
      JSON.parse(body);
    } catch (e) {
      errors.push(`${file} : JSON-LD invalide — ${e.message}`);
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
    'presse',
    'salle-de-presse',
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
    requirePhrase(text, legal.shortRiskLine, 'ligne risques (en-tête de page)', file);
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
      const manquants = (html.match(/À compléter/g) || []).length;
      if (manquants)
        warnings.push(
          `${file} : comparateur INCOMPLET — ${scpis} SCPI proposées, des taux manquent. ` +
            'Ne pas mettre en ligne : le tableau opposerait les frais de R Start à des cases vides. ' +
            'Relever les sept taux de chaque SCPI dans son DIC et sa note d’information, avec la date.'
        );
      if (!/Sources/.test(text))
        errors.push(file + ' : comparateur sans ligne de sources');
    }
    if (p === 'documentation') {
      // Avertissements reproduits in extenso, descendus de l'accueil le 11/09/2026 : ils doivent rester
      // publiés quelque part sur le site, à côté des documents dont ils sont extraits.
      requirePhrase(text, legal.bulletinWarning.slice(0, 120), 'avertissement du bulletin', file);
      requirePhrase(text, legal.dicWarning, 'avertissement du DIC', file);
      for (const b of legal.arbitrageWarningBullets)
        requirePhrase(text, b.slice(0, 100), "puce commission d'arbitrage", file);
    }
    if (p === 'presse') {
      // Les titres et citations reproduits ne valent que couverts par l'avertissement fourni.
      requirePhrase(
        text,
        pressFacts.coverageDisclaimer.slice(0, 120),
        'avertissement de la revue de presse',
        file
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
        requirePhrase(
          text,
          marketComparison.perimeterLead.slice(0, 80),
          'périmètre du comparatif',
          file
        );
        requirePhrase(
          text,
          legal.innovationNotRevolution.title,
          'encadré « Une innovation, pas une révolution »',
          file
        );
        requirePhrase(text, marketComparison.source.slice(0, 40), 'source du comparatif', file);
      }
    }
    for (const [, body] of html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    )) {
      try {
        JSON.parse(body);
      } catch (e) {
        errors.push(file + ' : JSON-LD invalide — ' + e.message);
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
  for (const p of leaked) errors.push('source de rédaction publiée dans dist — ' + p);
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
