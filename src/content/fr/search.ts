import type { SearchContent } from '@/content/types';

/**
 * Recherche du site (17/09/2026, demande de Martin : « même mécanique que celle d'apple.com »).
 *
 * Arbitrages du 17/09/2026 :
 *  - une loupe dans la barre, à gauche de Souscrire, sur toutes les largeurs ; la pastille s'allonge vers
 *    le bas en un panneau, la page se floute derrière ;
 *  - AUCUNE PAGE DE RÉSULTATS : tout se lit dans le panneau, en deux rubriques, « Pages » (les sections
 *    des pages du menu) et « Questions » (les questions de /faq) ; Entrée ouvre le premier résultat ;
 *  - chaque résultat porte son titre et un extrait où le mot cherché est surligné ; il mène au passage
 *    exact, la question visée s'ouvre à l'arrivée ;
 *  - panneau vide : des liens rapides ;
 *  - accents, fautes de frappe et synonymes tolérés ;
 *  - recherches mesurées dans GA4, après consentement (src/scripts/analytics.ts) ;
 *  - aucune précaution de conformité propre aux extraits (choix de Martin).
 *
 * Les liens rapides et les synonymes sont une PROPOSITION du 17/09/2026, à valider par l'équipe.
 * L'index lui-même n'est pas écrit ici : il est tiré du HTML publié à chaque build
 * (scripts/search-index.mjs).
 */
export const search = {
  openLabel: 'Rechercher sur R Start',
  closeLabel: 'Fermer la recherche',
  dialogLabel: 'Rechercher sur R Start',
  inputLabel: 'Rechercher sur R Start',
  placeholder: 'Rechercher sur R Start',
  quickLinksTitle: 'Liens rapides',
  quickLinks: [
    { page: 'fees' },
    { question: 'Quels sont les frais de R Start ?' },
    { question: 'Quel est le niveau de risque de R Start ?' },
    { question: 'À partir de quand touche-t-on les premiers revenus (délai de jouissance) ?' },
    { page: 'press', label: 'La presse en parle' },
  ],
  groups: { pages: 'Pages', questions: 'Questions' },
  countOne: '1 résultat',
  countMany: '{n} résultats',
  empty: 'Aucun résultat pour « {q} ».',
  emptyLink: { label: 'Voir toutes les questions', page: 'faq' },
  loading: 'Recherche en cours…',
  error: 'La recherche est momentanément indisponible. Réessayez dans un instant.',
  synonyms: [
    ['frais', 'commission', 'commissions', 'coût', 'coûts', 'tarif', 'tarifs', 'prélèvements'],
    ['frais d’entrée', 'frais de souscription', 'droits d’entrée'],
    ['frais d’acquisition', 'frais sur les achats d’immeubles'],
    ['DIC', 'KID', 'document d’informations clés'],
    ['note d’information', 'prospectus'],
    ['revenus', 'dividendes', 'loyers', 'distribution', 'rendement'],
    ['plus-value', 'plus-values', 'gain', 'gains'],
    ['retrait', 'revente', 'revendre', 'sortie', 'sortir', 'rachat', 'vendre'],
    ['délai de jouissance', 'jouissance', 'premiers revenus'],
    ['risque', 'risques', 'perte', 'pertes', 'garantie'],
    ['souscrire', 'souscription', 'investir', 'acheter', 'placer'],
    ['part', 'parts', 'prix', 'ticket', 'minimum'],
    ['immeubles', 'immobilier', 'biens', 'bureaux', 'commerces', 'hôtels', 'logistique'],
    ['pays', 'Europe', 'international', 'étranger'],
    ['change', 'devise', 'devises'],
    ['démembrement', 'nue-propriété', 'usufruit'],
    ['crédit', 'emprunt', 'prêt', 'financement'],
    ['assurance-vie', 'CORUM Life', 'contrat'],
    ['fiscalité', 'impôts', 'impôt', 'imposition', 'imposés', 'fiscal'],
    ['avis', 'Trustpilot', 'clients'],
    ['presse', 'journalistes', 'médias', 'articles'],
    ['CORUM', 'groupe', 'société de gestion'],
    ['parrainage', 'Coup de Pouce', 'offres promotionnelles', 'promotion'],
    ['versements programmés', 'réinvestissement', 'options'],
  ],
} satisfies SearchContent;
