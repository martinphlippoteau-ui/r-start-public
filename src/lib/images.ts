import type { ImageMetadata } from 'astro';

/**
 * Résout un chemin de media.ts (relatif à src/assets/images) vers les métadonnées astro:assets.
 * Import paresseux : seules les images réellement utilisées sont traitées au build.
 */
const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}');

export async function resolveImage(src: string): Promise<ImageMetadata> {
  const key = '/src/assets/images/' + src.replace(/^\/+/, '');
  const loader = images[key];
  if (!loader) throw new Error(`Image introuvable dans src/assets/images : ${src}`);
  return (await loader()).default;
}
