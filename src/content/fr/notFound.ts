import { menuPages } from '@/config/pages';

/**
 * Page 404. Aucune allégation commerciale : pas de chiffre, pas de CTA de souscription, donc pas de
 * contre-poids risque à afficher. Servie avec un vrai code 404 (nginx / Static Web Apps) et en noindex.
 */
export const notFound = {
  seo: {
    title: 'Page introuvable | R Start, SCPI CORUM',
    description: 'Cette page n’existe pas ou a été déplacée. Retrouvez R Start, ses frais, sa documentation et son espace presse.',
  },
  code: '404',
  title: 'Cette page n’existe pas.',
  intro: 'Le lien est peut-être ancien, ou l’adresse comporte une erreur. Voici les pages du site.',
  linksLabel: 'Pages du site',
  links: menuPages.map((p) => ({ label: p.label, href: p.path })),
};
