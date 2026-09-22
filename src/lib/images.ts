import type { ImageMetadata } from 'astro';

/**
 * Résout un chemin de media.ts (relatif à src/assets/images) vers les métadonnées astro:assets.
 * ATTENTION : un `import.meta.glob` paresseux ne rend PAS les images inutilisées gratuites. Il crée
 * un import dynamique par fichier et, la clé étant calculée à l'exécution, Rollup ne peut élaguer
 * aucun d'eux : TOUT CE QUE LE MOTIF ATTRAPE PART EN PRODUCTION, cité ou non (25,7 Mo sur 33,7 Mo
 * de dist/_astro livrés pour rien, audit du 14/09/2026). D'où la règle : `src/assets/images` ne
 * contient QUE ce que media.ts cite ; une image qui n'est plus citée quitte le dossier dans le même
 * geste, l'historique git la garde.
 */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}'
);

export async function resolveImage(src: string): Promise<ImageMetadata> {
  const key = '/src/assets/images/' + src.replace(/^\/+/, '');
  const loader = images[key];
  if (!loader) throw new Error(`Image introuvable dans src/assets/images : ${src}`);
  return (await loader()).default;
}
