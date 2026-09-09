import type { NavContent } from '@/content/types';
import { publisher } from '@/content/fr/legal';

/**
 * En-tête, menu entre pages et sous-navigation sticky. Les entrées du menu viennent de
 * src/config/pages.ts (`menuPages`), celles de la sous-nav de src/config/sections.ts
 * (`navSections`) ; ce fichier ne porte que la marque, le CTA, le lien d'évitement et les libellés
 * d'accessibilité. Le libellé du CTA (« Souscrire en ligne » dans l'en-tête, « Souscrire » en version
 * courte dans la sous-navigation sticky, pour garder la liste des sections lisible à 375 px) ne doit
 * jamais coïncider avec celui d'une section (« Souscription ») ni d'une page du menu.
 */
export const nav = {
  brand: 'R Start',
  brandSuffix: `par ${publisher.name}`,
  cta: { label: 'Souscrire en ligne', position: 'nav' },
  subnavCtaLabel: 'Souscrire',
  skipLink: 'Aller au contenu',
  sectionsLabel: 'Sections',
  homeLinkLabel: 'R Start, retour à l’accueil',
  menuLabel: 'Menu',
  closeLabel: 'Fermer le menu',
  menuAriaLabel: 'Navigation principale',
  pagesLabel: 'Pages du site',
  breadcrumbLabel: 'Fil d’Ariane',
  noteRefLabel: 'Voir la note',
} satisfies NavContent;
