import type { NavContent } from '@/content/types';
import { publisher } from '@/content/fr/legal';

/**
 * Navigation unique (src/components/SiteNav.astro). Les entrées du menu viennent de
 * src/config/pages.ts (`menuPages`), uniquement des pages depuis le 10/09/2026, plus aucune section ;
 * ce fichier ne porte que la marque, le CTA, le lien d'évitement et les libellés d'accessibilité.
 * Le libellé du CTA (« Souscrire en ligne » dans le panneau, « Souscrire » en version courte dans la
 * barre, pour garder la liste des pages lisible à 375 px) ne doit jamais coïncider avec celui d'une
 * page du menu. `brandSuffix` n'est plus affiché nulle part (retiré de la barre le 10/09/2026) : il
 * reste tant que NavContent l'exige. `sectionsLabel` (aria-label de l'ex-sous-navigation) est retiré.
 */
export const nav = {
  brand: 'R Start',
  brandSuffix: `par ${publisher.name}`,
  cta: { label: 'Souscrire en ligne', position: 'nav' },
  subnavCtaLabel: 'Souscrire',
  skipLink: 'Aller au contenu',
  homeLinkLabel: 'R Start, retour à l’accueil',
  menuLabel: 'Menu',
  closeLabel: 'Fermer le menu',
  menuAriaLabel: 'Navigation principale',
  pagesLabel: 'Pages du site',
  breadcrumbLabel: 'Fil d’Ariane',
  noteRefLabel: 'Voir la note',
} satisfies NavContent;
