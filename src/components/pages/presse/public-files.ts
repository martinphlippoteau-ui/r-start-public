/**
 * Métadonnées des fichiers servis depuis `public/` (logos du kit média, communiqués PDF), résolues au
 * build : existence, poids en kilooctets (arrondi) et extension. Aucun poids n'est écrit en dur.
 *
 * `public/` est résolu depuis la racine du projet (`process.cwd()`, d'où Astro s'exécute), et non depuis
 * l'URL du module : dans le bundle SSR de `astro build`, les modules sont émis sous `dist/.prerender/chunks/`
 * et `import.meta.url` ne pointe plus sous `src/` (le plugin Vite qui réécrit `import.meta.url` ne
 * s'applique qu'au client). Le chemin relatif au module n'est conservé qu'en repli (Astro lancé depuis un
 * autre dossier de travail, avec `--root`). Si aucun des deux candidats n'existe, le module lève une erreur
 * plutôt que de laisser disparaître silencieusement les logos et les poids en production.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleRelativePublicDir = (): string | undefined => {
  try {
    return fileURLToPath(new URL('../../../../public/', import.meta.url));
  } catch {
    return undefined;
  }
};

const candidates = [path.resolve(process.cwd(), 'public'), moduleRelativePublicDir()].filter(
  (d): d is string => typeof d === 'string'
);
const found = candidates.find((d) => existsSync(d));
if (!found) {
  throw new Error(`public-files : dossier public/ introuvable (candidats : ${candidates.join(' ; ')})`);
}
const publicDir: string = found;

const resolvePublic = (file: string): string => path.join(publicDir, ...file.replace(/^\/+/, '').split('/'));

/** Vrai si le chemin public (ex. « /presse/r-start-logo-couleur.svg ») correspond à un fichier présent. */
export const publicFileExists = (file: string): boolean => file.trim() !== '' && existsSync(resolvePublic(file));

/** Poids du fichier en kilooctets (arrondi), ou `undefined` s'il est absent. */
export const publicFileKb = (file: string): number | undefined =>
  publicFileExists(file) ? Math.round(statSync(resolvePublic(file)).size / 1024) : undefined;

/** Extension du fichier en capitales (ex. « SVG », « PNG », « PDF »), vide s'il n'en a pas. */
export const fileExtension = (file: string): string => {
  const m = file.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : '';
};

/** Clé analytics d'un PDF (data-doc) : nom du fichier sans extension, comme la section Documents. */
export const fileKey = (file: string): string => file.replace(/^.*\//, '').replace(/\.[a-z0-9]+$/i, '');

/** Clé analytics d'un logo (data-doc) : nom du fichier avec son extension (un même logo existe en SVG et en PNG). */
export const fileName = (file: string): string => file.replace(/^.*\//, '');

/** Poids formaté en français (ex. « 2 232 »). */
export const kbFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
