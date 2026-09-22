import type { SearchContent } from '@/content/types';

/**
 * Recherche du site (17/09/2026, demande de Martin : « même mécanique que celle d'apple.com »).
 * Arbitrages de Martin : une loupe dans la barre, un panneau qui s'ouvre dessous, AUCUNE PAGE DE
 * RÉSULTATS (deux rubriques, « Pages » et « Questions », Entrée ouvre le premier résultat) ; chaque
 * résultat mène au passage exact, extrait surligné ; accents, fautes de frappe et synonymes
 * tolérés ; recherches mesurées dans GA4 après consentement ; aucune précaution de conformité
 * propre aux extraits. Les liens rapides et les synonymes sont une PROPOSITION à valider par
 * l'équipe. L'index n'est pas écrit ici : scripts/search-index.mjs le tire du HTML publié.
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
