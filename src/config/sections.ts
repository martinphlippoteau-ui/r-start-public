import type { SectionKey, SectionMeta } from '@/content/types';

/**
 * Ancres des sections : chaque composant de section lit ici l'`id` de sa <section>. L'ORDRE RENDU
 * sur l'accueil est HOME_ORDER (src/pages/index.astro) ; /strategie rend 04-Strategy elle-même. La photo pleine largeur 03a-Immeuble n'a ni titre ni entrée ici : elle porte
 * son id.
 *
 * NETTOYÉ LE 22/09/2026 : les libellés, l'ordre et la présence dans la sous-navigation (`label`,
 * `order`, `inNav`) n'avaient plus de lecteur depuis la fin de la sous-navigation par ancres (10/09/2026),
 * et les entrées `income`, `press` et `documents` survivaient à leurs sections, supprimées le 15/09/2026.
 */
export const sections: Record<SectionKey, SectionMeta> = {
  hero: { id: 'apercu' },
  highlights: { id: 'points-forts' },
  difference: { id: 'ce-qui-change' },
  fees: { id: 'frais' },
  strategy: { id: 'strategie' },
  subscribe: { id: 'souscrire' },
  corum: { id: 'corum' },
  risks: { id: 'risques' },
  faq: { id: 'faq' },
};
