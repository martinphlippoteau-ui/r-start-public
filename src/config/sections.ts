import type { SectionKey, SectionMeta } from '@/content/types';

/**
 * Contrat des sections : ordre, ancres et présence dans la sous-navigation.
 * Fichier figé après la phase 0. Les composants de section lisent leur `id` ici.
 * `order` suit la trame de l'accueil du 10/09/2026 (Points forts avant « Ce qui change » : comprendre le
 * produit avant le modèle de frais ; Souscrire en chapitre court entre Stratégie et Presse depuis le
 * 11/09/2026) ; Revenus et Documents (12-13) n'y sont plus rendus (src/pages/index.astro, HOME_ORDER). La photo pleine largeur 03a-Immeuble (entre Confiance et Frais) n'a
 * ni titre, ni note, ni entrée ici : SectionKey (src/content/types.ts) ne la prévoit pas, elle porte son id.
 * Menu (réunion du 10/09/2026) : uniquement des pages (src/config/pages.ts), jamais d'ancre de section :
 * `inNav` est donc false partout et n'est conservé que pour la page de prévisualisation des sections.
 */
export const sections: Record<SectionKey, SectionMeta> = {
  hero: { id: 'apercu', label: 'Aperçu', order: 1, inNav: false },
  highlights: { id: 'points-forts', label: 'Points forts', order: 3, inNav: false },
  difference: { id: 'ce-qui-change', label: 'Ce qui change', order: 2, inNav: false },
  fees: { id: 'frais', label: 'Frais', order: 11, inNav: false },
  strategy: { id: 'strategie', label: 'Stratégie d’investissement', order: 5, inNav: false },
  income: { id: 'revenus', label: 'Revenus', order: 12, inNav: false },
  subscribe: { id: 'souscrire', label: 'Souscription', order: 6, inNav: false },
  corum: { id: 'corum', label: 'Confiance', order: 4, inNav: false },
  risks: { id: 'risques', label: 'Risques', order: 8, inNav: false },
  press: { id: 'presse-en-parle', label: 'La presse en parle', order: 7, inNav: false },
  documents: { id: 'documents', label: 'Documents', order: 13, inNav: false },
  faq: { id: 'faq', label: 'FAQ', order: 9, inNav: false },
  notes: { id: 'notes', label: 'Notes', order: 10, inNav: false },
};

/** Sections dans l'ordre d'affichage. */
export const orderedSections = (Object.keys(sections) as SectionKey[])
  .map((key) => ({ key, ...sections[key] }))
  .sort((a, b) => a.order - b.order);

/** Entrées de la sous-navigation sticky. */
export const navSections = orderedSections.filter((s) => s.inNav);
