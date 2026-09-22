// Prépare les fichiers sources pour le site : copie les logos, les favicons et les documents
// réglementaires (PDF) vers leurs emplacements, et écrit un manifeste (src/content/fr/media.manifest.json)
// dont le site lit la liste des documents et leur poids.
//
// PLUS DE PHOTOS depuis le 22/09/2026. Le script redimensionnait les photos de la source vers une réserve
// de curation (src/assets/vivier) ; le site n'affiche plus aucune photographie depuis le 15/09/2026, et la
// réserve a été supprimée. Les illustrations d'immeubles sont déposées à la main dans src/assets/images
// et citées par src/content/fr/media.ts.
//
// Usage : node scripts/prepare-images.mjs [--assets "C:\\chemin\\vers\\Assets R Start"]
// Idempotent : un fichier déjà présent et plus récent que sa source n'est pas retraité.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PENDING_DOCUMENT_KEYS } from '../src/content/fr/pendingDocuments.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argIndex = process.argv.indexOf('--assets');
const ASSETS =
  argIndex > -1
    ? path.resolve(process.argv[argIndex + 1])
    : path.resolve(ROOT, '..', 'Assets R Start');

const OUT_LOGOS = path.join(ROOT, 'src', 'assets', 'logos');
const OUT_PUBLIC = path.join(ROOT, 'public');
const OUT_DOCS = path.join(OUT_PUBLIC, 'documents');
const MANIFEST = path.join(ROOT, 'src', 'content', 'fr', 'media.manifest.json');

/* Logos vectoriels réellement importés par un composant (copie brute). `globe.svg` en est sorti le
   14/09/2026 : aucun fichier ne l'importait. */
const LOGOS = [
  ['1 - Logos R Start/R_Start_couleur_CMJN.svg', 'r-start-couleur.svg'],
  ['1 - Logos R Start/R_Start_blanc_CMJN.svg', 'r-start-blanc.svg'],
  ["1 - Logos R Start/CORUM L'Epargne_couleur_CMJN.svg", 'corum-lepargne-couleur.svg'],
];

/** Fichiers copiés tels quels dans public/. */
const PUBLIC_FILES = [
  ['1 - Logos R Start/favicon.ico', 'favicon.ico'],
  ['1 - Logos R Start/favicon-r-start.svg', 'favicon.svg'],
  ['1 - Logos R Start/apple-touch-icon.png', 'apple-touch-icon.png'],
];

/**
 * Documents réglementaires : clé (celle de facts.ts), nom source, slug public.
 * Une clé listée dans PENDING_DOCUMENT_KEYS n'est PAS copiée, et une copie restée dans
 * public/documents est effacée : voir src/content/fr/pendingDocuments.ts.
 */
const DOCUMENTS = [
  ['dic', '7 - Documents/R- Start - DIC - V7.pdf', 'r-start-dic.pdf'],
  [
    'note',
    "7 - Documents/R Start - Note d'information - projet V8 24022026 V2.1-20260407T113945 (1).pdf",
    'r-start-note-information.pdf',
  ],
  ['statuts', '7 - Documents/R Start - Statuts à jour V3.pdf', 'r-start-statuts.pdf'],
  [
    'bulletin',
    '7 - Documents/R Start - Bulletin de souscription partenaire - 2026.05.pdf',
    'r-start-bulletin-souscription.pdf',
  ],
  [
    'simulation',
    '7 - Documents/R Start - Simulation des frais ex-ante 2026 V2-20260327T174149.pdf',
    'r-start-simulation-frais-ex-ante.pdf',
  ],
  [
    'pei',
    '7 - Documents/CORUM Start - Plan épargne immobilier V2.5.pdf',
    'r-start-adhesion-plan-epargne-immobilier.pdf',
  ],
  [
    'rd',
    '7 - Documents/CORUM Start - Réinvestissement des dividendes V2.5.pdf',
    'r-start-adhesion-reinvestissement-dividendes.pdf',
  ],
  [
    'mandat',
    '7 - Documents/R Start- Mandat de prélèvement V2.1-20260414T141237.pdf',
    'r-start-mandat-prelevement.pdf',
  ],
  [
    'retrait',
    '7 - Documents/CORUM AM - Formulaire de retrait de parts_2026 V2.2-20260414T141131.pdf',
    'corum-am-formulaire-retrait-parts.pdf',
  ],
  [
    'rib-change',
    '7 - Documents/CORUM AM - Formulaire de changement de coordonnées bancaires V2.1-20260414T141049.pdf',
    'corum-am-formulaire-changement-coordonnees-bancaires.pdf',
  ],
];

async function isFresh(target, source) {
  try {
    const [t, s] = await Promise.all([fs.stat(target), fs.stat(source)]);
    return t.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

async function copyFile(rel, outDir, outName) {
  const src = path.join(ASSETS, rel);
  const dst = path.join(outDir, outName);
  await fs.mkdir(outDir, { recursive: true });
  if (await isFresh(dst, src)) return { file: outName, skipped: true };
  await fs.copyFile(src, dst);
  return { file: outName, skipped: false };
}

async function main() {
  await fs.access(ASSETS).catch(() => {
    throw new Error(`Dossier d'assets introuvable : ${ASSETS}`);
  });
  const logos = [];
  for (const [rel, out] of LOGOS) logos.push(await copyFile(rel, OUT_LOGOS, out));
  const publicFiles = [];
  for (const [rel, out] of PUBLIC_FILES) publicFiles.push(await copyFile(rel, OUT_PUBLIC, out));
  const documents = [];
  for (const [cle, rel, out] of DOCUMENTS) {
    if (PENDING_DOCUMENT_KEYS.includes(cle)) {
      await fs.rm(path.join(OUT_DOCS, out), { force: true });
      console.log(`  document en attente, non copié : ${out}`);
      continue;
    }
    await copyFile(rel, OUT_DOCS, out);
    const stat = await fs.stat(path.join(OUT_DOCS, out));
    documents.push({ file: `documents/${out}`, kb: Math.round(stat.size / 1024), source: rel });
  }

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      {
        /* Le NOM du dossier source, pas son chemin : le manifeste est versionné, et il publiait le
           chemin absolu du poste qui l'avait généré (nom d'utilisateur compris). */
        generatedFrom: path.basename(ASSETS),
        logos: logos.map((l) => `logos/${l.file}`),
        publicFiles: publicFiles.map((p) => p.file),
        documents,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  console.log(
    `\nManifeste écrit : ${path.relative(ROOT, MANIFEST)} (${documents.length} documents)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
