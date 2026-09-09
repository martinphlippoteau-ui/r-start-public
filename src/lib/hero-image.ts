import type { ImageMetadata } from 'astro';
import { media } from '@/content/fr/media';
import { resolveImage } from '@/lib/images';

/**
 * Visuel du hero (élément LCP). Une seule définition des largeurs, du format et du `sizes`,
 * partagée par le composant 01-Hero.astro (balise <Image>) et par index.astro
 * (<link rel="preload" imagesrcset>) : le préchargement et la balise <img> désignent ainsi
 * exactement les mêmes fichiers, sans double téléchargement.
 */
// 828 comble l'écart 640 → 1024 (+60 %) : sur mobile, le slot `sizes` (~320-370 px) multiplié par le
// device pixel ratio tombe souvent entre les deux, forçant le navigateur à prendre 1024 pour quelques
// centaines de px de trop (audit Lighthouse « uses-responsive-images », ~70 Ko constatés en surplus).
export const heroImageWidths: number[] = [640, 828, 1024, 1600, 2400];
export const heroImageSizes = '(min-width: 1360px) 1280px, calc(100vw - 2.5rem)';
export const heroImageFormat = 'webp';

export const loadHeroImage = (): Promise<ImageMetadata> => resolveImage(media.hero.main.src);
