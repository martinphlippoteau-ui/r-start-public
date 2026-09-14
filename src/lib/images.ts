import type { ImageMetadata } from 'astro';

/**
 * Résout un chemin de media.ts (relatif à src/assets/images) vers les métadonnées astro:assets.
 *
 * ATTENTION, ET C'EST LA RAISON D'ÊTRE DE `src/assets/vivier` : un `import.meta.glob` paresseux ne
 * rend PAS les images inutilisées gratuites. Il crée un import dynamique par fichier trouvé, et comme
 * la clé est calculée à l'exécution, Rollup ne peut élaguer aucun d'eux : TOUT CE QUE LE MOTIF ATTRAPE
 * PART EN PRODUCTION, cité ou non. Le commentaire disait ici le contraire ; il a coûté 25,7 Mo sur
 * 33,7 Mo de dist/_astro, soit trois quarts du poids des assets, livrés à chaque déploiement pour rien
 * (audit du 14/09/2026).
 *
 * D'où la règle : `src/assets/images` ne contient QUE ce que media.ts cite. Le vivier de curation vit
 * dans `src/assets/vivier`, hors du motif ci-dessous. Curer une photo, c'est la déplacer de l'un vers
 * l'autre, et l'ajouter à media.ts dans le même geste.
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
