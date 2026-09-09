// Contrôle de conformité du HTML buildé (dist/). Exit 1 si une règle échoue.
// Règles : mentions obligatoires présentes, formulations interdites absentes, structure du hero,
// liens PDF valides, un seul H1, lang="fr", canonical, JSON-LD parsable.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as legal from '../src/content/fr/legal.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
// Le site peut être construit sous un sous-chemin (GitHub Pages de projet) : les liens du HTML le
// portent, pas l'arborescence de dist. On le retire avant de vérifier l'existence des fichiers.
const BASE_SEGMENTS = (process.env.PUBLIC_BASE_PATH || '').split('/').filter(Boolean);
const BASE_PREFIX = BASE_SEGMENTS.length ? '/' + BASE_SEGMENTS[BASE_SEGMENTS.length - 1] : '';
const stripBase = (p) => (BASE_PREFIX && p.startsWith(BASE_PREFIX + '/') ? p.slice(BASE_PREFIX.length) : p);
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
const toText = (html) => norm(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));

async function readHtml(rel) {
  return fs.readFile(path.join(DIST, rel), 'utf8');
}

function requirePhrase(text, phrase, label, file) {
  if (!text.toLowerCase().includes(norm(phrase).toLowerCase())) errors.push(`${file} : mention absente — ${label}`);
}

const FORBIDDEN = [
  { re: /sans frais/gi, label: '« sans frais »', allow: /n'est pas une scpi sans frais|frais de souscription/i },
  { re: /\bgratuit/gi, label: '« gratuit »', allow: /saisir gratuitement le médiateur/i },
  { re: /\bgaranti(e|s|es)?\b/gi, label: '« garanti »', allow: /(non|pas|aucune|ni)\s+(de\s+)?garanti|ne (sont|est) pas garanti|ne garantit pas|aucune garantie|sans garantie|n'offrent aucune garantie|ne présagent|garantie en capital/i },
  { re: /sécuris/gi, label: '« sécurisé »', allow: /sécurisé(e)? par (https|tls)|connexion sécurisée/i },
  { re: /protection du capital|capital protégé/gi, label: '« protection du capital »' },
  { re: /meilleures? scpi/gi, label: '« meilleure SCPI »' },
  { re: /en toute confiance/gi, label: '« en toute confiance »' },
  { re: /taux de distribution|\bTRI\b|rendement (cible|garanti|attendu|estimé|annuel)|objectif de rendement/g, label: 'indicateur de performance', allow: /(pas|aucun|sans)\s+(d'|de\s)?(objectif de rendement|taux de distribution)/i },
  { re: /\d+(?:[,.]\d+)?\s?%\s?(?:de\s)?(?:rendement|performance|par an|annuel)/gi, label: 'pourcentage de performance' },
  { re: /\bcrédit\b/gi, label: 'mention du crédit', allow: /carte de crédit/i },
];

function checkForbidden(text, file) {
  for (const rule of FORBIDDEN) {
    const matches = [...text.matchAll(rule.re)];
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
      if (rule.allow && rule.allow.test(ctx)) continue;
      errors.push(`${file} : formulation interdite ${rule.label} — « …${ctx.trim()}… »`);
    }
  }
}

async function checkIndex() {
  const file = 'index.html';
  const html = await readHtml(file);
  const text = toText(html);

  // Mentions obligatoires
  requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
  requirePhrase(text, legal.documentsNotice.replace(/\.$/, ''), 'mention 2 (documents d\'information)', file);
  requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
  requirePhrase(text, legal.shortRiskLine, 'ligne risques courte', file);
  requirePhrase(text, legal.bulletinWarning.slice(0, 120), 'avertissement du bulletin', file);
  requirePhrase(text, legal.dicWarning, 'avertissement du DIC', file);
  for (const b of legal.arbitrageWarningBullets) requirePhrase(text, b.slice(0, 100), 'puce commission d\'arbitrage', file);
  requirePhrase(text, legal.gdpr.dpoEmail, 'e-mail DPO', file);
  requirePhrase(text, 'GP-11000012', 'agrément AMF de la société de gestion', file);
  requirePhrase(text, legal.publisher.rcs, 'RCS de l\'éditeur', file);
  requirePhrase(text, '15 %', 'frais de gestion 15 %', file);

  checkForbidden(text, file);

  // Structure
  const h1 = html.match(/<h1\b[^>]*>/gi) || [];
  if (h1.length !== 1) errors.push(`${file} : ${h1.length} balise(s) <h1> (attendu : 1)`);
  if (h1[0] && /data-animate/i.test(h1[0])) errors.push(`${file} : le H1 est animé (data-animate interdit)`);
  if (!/<html[^>]*\blang="fr"/i.test(html)) errors.push(`${file} : lang="fr" absent`);
  if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(`${file} : canonical absent`);
  if (!/<meta[^>]+name="description"/i.test(html)) errors.push(`${file} : meta description absente`);

  const heroMatch = html.match(/<section[^>]*id="apercu"[^>]*>[\s\S]*?<\/section>/i);
  if (!heroMatch) errors.push(`${file} : section #apercu introuvable`);
  else {
    const hero = heroMatch[0];
    const risk = hero.match(/<p[^>]*data-risk[^>]*>/i);
    if (!risk) errors.push(`${file} : aucune ligne risques ([data-risk]) dans le hero`);
    else if (/data-animate/i.test(risk[0])) errors.push(`${file} : la ligne risques du hero est animée`);
    if (!/data-cta="souscrire"/i.test(hero)) errors.push(`${file} : aucun CTA de souscription dans le hero`);
  }
  const risksAnimated = html.match(/<p[^>]*data-risk[^>]*data-animate[^>]*>|<p[^>]*data-animate[^>]*data-risk[^>]*>/gi) || [];
  if (risksAnimated.length) errors.push(`${file} : ${risksAnimated.length} bloc(s) risque animé(s)`);
  const nAdv = (html.match(/data-advantage/g) || []).length;
  const nRisk = (html.match(/data-risk/g) || []).length;
  if (nAdv > nRisk) errors.push(`${file} : ${nAdv} avantages pour ${nRisk} risques`);

  // Documents PDF
  const pdfLinks = [...new Set([...html.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => m[1]))];
  // 3 tant que le PDF des statuts (tronqué à la source) est exclu ; repasser à 4 dès qu'il est remplacé.
  if (pdfLinks.length < 3) errors.push(`${file} : ${pdfLinks.length} lien(s) PDF (attendu : ≥ 3)`);
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
  for (const p of ['frais', 'documentation', 'presse']) {
    const file = p + '/index.html';
    let html;
    try {
      html = await readHtml(file);
    } catch {
      errors.push('page /' + p + ' absente de dist');
      continue;
    }
    const text = toText(html);
    checkForbidden(text, p);
    requirePhrase(text, legal.shortRiskLine, 'ligne risques (en-tête de page)', file);
    requirePhrase(text, legal.commercialNotice, 'mention 1 (caractère commercial)', file);
    requirePhrase(text, 'visa S.C.P.I. n° 26-06 en date du 4 mars 2026', 'visa AMF', file);
    const h1 = html.match(/<h1\b[^>]*>/gi) || [];
    if (h1.length !== 1) errors.push(file + ' : ' + h1.length + ' balise(s) <h1> (attendu : 1)');
    if (!/<link[^>]+rel="canonical"/i.test(html)) errors.push(file + ' : canonical absent');
    const risksAnimated = html.match(/<p[^>]*data-risk[^>]*data-animate[^>]*>|<p[^>]*data-animate[^>]*data-risk[^>]*>/gi) || [];
    if (risksAnimated.length) errors.push(file + ' : ' + risksAnimated.length + ' bloc(s) risque animé(s)');
    if (p === 'frais' && !/15\s?%/.test(text)) errors.push(file + ' : frais de gestion 15 % absents');
    for (const [, body] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
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

await checkIndex();
await checkOtherPages();
await checkSubPages();

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} erreur(s) de conformité.`);
  process.exit(1);
}
console.log(`✔ Conformité : ${warnings.length} avertissement(s), 0 erreur.`);
