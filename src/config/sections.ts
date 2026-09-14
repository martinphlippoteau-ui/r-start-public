import type { SectionKey, SectionMeta } from '@/content/types';

/**
 * Contrat des sections : ordre, ancres et présence dans la sous-navigation.
 * Fichier figé après la phase 0. Les composants de section lisent leur `id` ici.
 * `order` est un HÉRITAGE de la trame du 10/09/2026 et ne décrit plus l'ordre rendu : c'est HOME_ORDER,
 * dans src/pages/index.astro, qui fait foi, et il ne suit pas cet ordre-là. Six clés déclarées ici ne
 * sont rendues nulle part sur l'accueil : frais, revenus, presse, documents, strategy (sur /strategie)
 * et income. La photo pleine largeur 03a-Immeuble (entre Confiance et Souscrire) n'a
 * ni titre, ni note, ni entrée ici : SectionKey (src/content/types.ts) ne la prévoit pas, elle porte son id.
 * Menu (réunion du 10/09/2026) : uniquement des pages (src/config/pages.ts), jamais d'ancre de section :
 * `inNav` est donc false partout et n'est conservé que pour la page de prévisualisation des sections.
 */
export const sections: Record<SectionKey, SectionMeta> = {
  hero: { id: 'apercu', label: 'Aperçu', order: 1, inNav: false },
  highlights: { id: 'points-forts', label: 'Points forts', order: 3, inNav: false },
  difference: { id: 'ce-qui-change', label: 'Ce qui change', order: 2, inNav: false },
  fees: { id: 'frais', label: 'Frais', order: 10, inNav: false },
  strategy: { id: 'strategie', label: 'Stratégie d’investissement', order: 11, inNav: false },
  income: { id: 'revenus', label: 'Revenus', order: 12, inNav: false },
  subscribe: { id: 'souscrire', label: 'Souscription', order: 5, inNav: false },
  corum: { id: 'corum', label: 'Confiance', order: 4, inNav: false },
  risks: { id: 'risques', label: 'Risques', order: 6, inNav: false },
  press: { id: 'presse-en-parle', label: 'La presse en parle', order: 9, inNav: false },
  documents: { id: 'documents', label: 'Documents', order: 13, inNav: false },
  faq: { id: 'faq', label: 'FAQ', order: 7, inNav: false },
  notes: { id: 'notes', label: 'Notes', order: 8, inNav: false },
};

/*
 * `orderedSections` et `navSections` ont été SUPPRIMÉS le 14/09/2026 : plus aucun lecteur. Ils
 * servaient la sous-navigation par ancres, démantelée le 10/09/2026 quand le menu est passé aux pages
 * seules. `order` et `inNav` restent dans SectionMeta, mais plus rien ne les consomme : l'ordre rendu
 * est HOME_ORDER (src/pages/index.astro), et `inNav` vaut false partout.
 */
