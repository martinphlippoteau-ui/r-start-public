// Prépare les images sources pour le site : redimensionne les originaux (trop lourds pour le repo)
// vers src/assets/images/*, copie les logos/favicons/PDF vers leurs emplacements, et écrit un manifeste
// (src/content/fr/media.manifest.json) que les agents de curation utilisent pour choisir les visuels.
//
// Usage : node scripts/prepare-images.mjs [--assets "C:\\chemin\\vers\\Assets R Start"]
// Idempotent : un fichier déjà présent et plus récent que sa source n'est pas retraité.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argIndex = process.argv.indexOf('--assets');
const ASSETS =
  argIndex > -1
    ? path.resolve(process.argv[argIndex + 1])
    : path.resolve(ROOT, '..', 'Assets R Start');

const OUT_IMAGES = path.join(ROOT, 'src', 'assets', 'images');
const OUT_LOGOS = path.join(ROOT, 'src', 'assets', 'logos');
const OUT_PUBLIC = path.join(ROOT, 'public');
const OUT_DOCS = path.join(OUT_PUBLIC, 'documents');
const MANIFEST = path.join(ROOT, 'src', 'content', 'fr', 'media.manifest.json');

/**
 * Jeux d'images raster : dossier source → dossier cible, taille max, format de sortie.
 * Le dossier « 4 - Pictogrammes 3D » n'est plus traité : les pictos sont des SVG au trait dessinés dans
 * src/components/ui/Picto.astro. (`alpha: true` reste géré pour un futur jeu WebP à transparence.)
 */
const RASTER_SETS = [
  { src: '3 - Photos immeubles', out: 'immeubles', maxWidth: 2400, format: 'jpg', quality: 84 },
  { src: '6 - Photos ambiance', out: 'ambiance', maxWidth: 2400, format: 'jpg', quality: 84 },
];

/** Logos vectoriels utiles (copie brute). */
const LOGOS = [
  ['1 - Logos R Start/R_Start_couleur_CMJN.svg', 'r-start-couleur.svg'],
  ['1 - Logos R Start/R_Start_blanc_CMJN.svg', 'r-start-blanc.svg'],
  ["1 - Logos R Start/CORUM L'Epargne_couleur_CMJN.svg", 'corum-lepargne-couleur.svg'],
  ['8 - Autres visuels/globe.svg', 'globe.svg'],
];

/** Fichiers copiés tels quels dans public/. */
const PUBLIC_FILES = [
  ['1 - Logos R Start/favicon.ico', 'favicon.ico'],
  ['1 - Logos R Start/favicon-r-start.svg', 'favicon.svg'],
  ['1 - Logos R Start/apple-touch-icon.png', 'apple-touch-icon.png'],
];

/** Documents réglementaires : nom source → slug public. */
const DOCUMENTS = [
  ['7 - Documents/R- Start - DIC - V7.pdf', 'r-start-dic.pdf'],
  [
    "7 - Documents/R Start - Note d'information - projet V8 24022026 V2.1-20260407T113945 (1).pdf",
    'r-start-note-information.pdf',
  ],
  ['7 - Documents/R Start - Statuts à jour V3.pdf', 'r-start-statuts.pdf'],
  [
    '7 - Documents/R Start - Bulletin de souscription partenaire - 2026.05.pdf',
    'r-start-bulletin-souscription.pdf',
  ],
  [
    '7 - Documents/R Start - Simulation des frais ex-ante 2026 V2-20260327T174149.pdf',
    'r-start-simulation-frais-ex-ante.pdf',
  ],
  [
    '7 - Documents/CORUM Start - Plan épargne immobilier V2.5.pdf',
    'r-start-adhesion-plan-epargne-immobilier.pdf',
  ],
  [
    '7 - Documents/CORUM Start - Réinvestissement des dividendes V2.5.pdf',
    'r-start-adhesion-reinvestissement-dividendes.pdf',
  ],
  [
    '7 - Documents/R Start- Mandat de prélèvement V2.1-20260414T141237.pdf',
    'r-start-mandat-prelevement.pdf',
  ],
  [
    '7 - Documents/CORUM AM - Formulaire de retrait de parts_2026 V2.2-20260414T141131.pdf',
    'corum-am-formulaire-retrait-parts.pdf',
  ],
  [
    '7 - Documents/CORUM AM - Formulaire de changement de coordonnées bancaires V2.1-20260414T141049.pdf',
    'corum-am-formulaire-changement-coordonnees-bancaires.pdf',
  ],
];

const slug = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(jpg|jpeg|png|webp)(\.webp)?$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

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

async function processSet(set) {
  const srcDir = path.join(ASSETS, set.src);
  const outDir = path.join(OUT_IMAGES, set.out);
  await fs.mkdir(outDir, { recursive: true });
  const entries = (await fs.readdir(srcDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const results = [];
  for (const file of entries) {
    const src = path.join(srcDir, file);
    const outName = `${slug(file)}.${set.format}`;
    const dst = path.join(outDir, outName);
    const fresh = await isFresh(dst, src);
    if (!fresh) {
      let pipeline = sharp(src, { failOn: 'none' }).rotate().resize({
        width: set.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });
      if (set.format === 'jpg')
        pipeline = pipeline
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: set.quality, mozjpeg: true });
      else pipeline = pipeline.webp({ quality: set.quality, alphaQuality: 90 });
      await pipeline.toFile(dst);
    }
    const meta = await sharp(dst).metadata();
    const stat = await fs.stat(dst);
    results.push({
      set: set.out,
      file: `${set.out}/${outName}`,
      source: file,
      width: meta.width,
      height: meta.height,
      orientation: meta.width >= meta.height ? 'paysage' : 'portrait',
      kb: Math.round(stat.size / 1024),
    });
    process.stdout.write(
      `${fresh ? '=' : '+'} ${set.out}/${outName} ${meta.width}x${meta.height}\n`
    );
  }
  return results;
}

async function main() {
  await fs.access(ASSETS).catch(() => {
    throw new Error(`Dossier d'assets introuvable : ${ASSETS}`);
  });
  const images = [];
  for (const set of RASTER_SETS) images.push(...(await processSet(set)));

  const logos = [];
  for (const [rel, out] of LOGOS) logos.push(await copyFile(rel, OUT_LOGOS, out));
  const publicFiles = [];
  for (const [rel, out] of PUBLIC_FILES) publicFiles.push(await copyFile(rel, OUT_PUBLIC, out));
  const documents = [];
  for (const [rel, out] of DOCUMENTS) {
    await copyFile(rel, OUT_DOCS, out);
    const stat = await fs.stat(path.join(OUT_DOCS, out));
    documents.push({ file: `documents/${out}`, kb: Math.round(stat.size / 1024), source: rel });
  }

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      {
        generatedFrom: ASSETS,
        images,
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
    `\nManifeste écrit : ${path.relative(ROOT, MANIFEST)} (${images.length} images, ${documents.length} documents)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
