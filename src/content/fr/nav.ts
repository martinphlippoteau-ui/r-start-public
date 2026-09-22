import type { NavContent } from '@/content/types';

/**
 * Navigation unique (src/components/SiteNav.astro). Les entrées du menu viennent de
 * src/config/pages.ts (`menuPages`), des pages seulement ; ce fichier ne porte que la marque, le
 * CTA, le lien d'évitement et les libellés d'accessibilité. Le libellé du CTA (« Souscrire » en
 * version courte dans la barre, pour tenir sur une ligne à 375 px) ne doit jamais coïncider avec
 * celui d'une page du menu.
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
} satisfies NavContent;
