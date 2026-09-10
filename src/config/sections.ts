import type { SectionKey, SectionMeta } from '@/content/types';

/**
 * Contrat des sections : ordre, ancres et présence dans la sous-navigation.
 * Fichier figé après la phase 0. Les composants de section lisent leur `id` ici.
 */
export const sections: Record<SectionKey, SectionMeta> = {
  hero: { id: 'apercu', label: 'Aperçu', order: 1, inNav: true },
  difference: { id: 'ce-qui-change', label: 'Ce qui change', order: 2, inNav: false },
  highlights: { id: 'points-forts', label: 'Points forts', order: 3, inNav: false },
  fees: { id: 'frais', label: 'Frais', order: 4, inNav: true },
  strategy: { id: 'strategie', label: 'Stratégie', order: 5, inNav: true },
  income: { id: 'revenus', label: 'Revenus', order: 6, inNav: false },
  subscribe: { id: 'souscrire', label: 'Souscription', order: 7, inNav: true },
  corum: { id: 'corum', label: 'Confiance', order: 8, inNav: true },
  risks: { id: 'risques', label: 'Risques', order: 9, inNav: true },
  documents: { id: 'documents', label: 'Documents', order: 10, inNav: false },
  faq: { id: 'faq', label: 'FAQ', order: 11, inNav: true },
  notes: { id: 'notes', label: 'Notes', order: 12, inNav: false },
};

/** Sections dans l'ordre d'affichage. */
export const orderedSections = (Object.keys(sections) as SectionKey[])
  .map((key) => ({ key, ...sections[key] }))
  .sort((a, b) => a.order - b.order);

/** Entrées de la sous-navigation sticky. */
export const navSections = orderedSections.filter((s) => s.inNav);
