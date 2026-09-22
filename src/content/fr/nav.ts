import type { NavContent } from '@/content/types';

/**
 * Navigation unique (src/components/SiteNav.astro). Les entrées du menu viennent de
 * src/config/pages.ts (`menuPages`), uniquement des pages depuis le 10/09/2026, plus aucune section ;
 * ce fichier ne porte que la marque, le CTA, le lien d'évitement et les libellés d'accessibilité.
 * Le libellé du CTA (« Souscrire en ligne » dans le panneau, « Souscrire » en version courte dans la
 * barre, pour garder la liste des pages lisible à 375 px) ne doit jamais coïncider avec celui d'une
 * page du menu.
 */
export const nav = {
  brand: 'R Start',
  cta: { label: 'Souscrire en ligne', position: 'nav' },
  subnavCtaLabel: 'Souscrire',
  skipLink: 'Aller au contenu',
  homeLinkLabel: 'R Start, retour à l’accueil',
  menuLabel: 'Menu',
  closeLabel: 'Fermer le menu',
  menuAriaLabel: 'Navigation principale',
  breadcrumbLabel: 'Fil d’Ariane',
  noteRefLabel: 'Voir la note',
} satisfies NavContent;
