import type { HighlightsContent, LegalNote } from '@/content/types';
import { fees, income, product, risk, share, strategy, subscription } from '@/content/fr/facts';

/**
 * Section 2 — « R Start en six repères » (id « points-forts »).
 * Six encarts repris de la brochure partenaires 2026, p. 3 (ticket d'entrée, niveau de risque,
 * distribution des revenus potentiels, zone d'investissement, délai de jouissance), plus la
 * souscription 100 % en ligne (brochure p. 7).
 * Ordre : ticket d'entrée, niveau de risque en deuxième position (réunion produit du 10/09/2026, donc
 * haut dans la page), souscription 100 % en ligne en troisième (audit UX : le parcours avant le
 * fonctionnement), puis revenus, zone, jouissance. La valeur du niveau de risque est celle du document
 * d'informations clés, cité avec sa date : une communication commerciale ne peut pas contredire le DIC
 * (retour AMF sur la brochure, qui annonçait une autre valeur).
 * La carte zone ne parle plus de « stratégie diversifiée » (brochure) : le patrimoine peut être
 * concentré au démarrage (strategy.ts, pilier « Où »), le mot contredirait ce risque.
 * Chaque encart porte son contre-poids risque (champ `risk`), de longueur comparable à
 * `description` et rendu à la même taille : la page « modèle unique » de la brochure n'est jamais
 * reprise sans ses contreparties. Aucune donnée de performance, aucun exemple d'investissement.
 * Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
 */

/** Espace insécable avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique (’) : certains libellés de facts.ts sont saisis avec l'apostrophe droite. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export const notes: LegalNote[] = [
  {
    id: 'points-forts-prix-de-part',
    text: nb(
      `Prix de souscription de ${share.priceLabel} par part, dont ${share.nominal} € de valeur nominale et ${share.premium} € de prime d’émission. Les parts peuvent être fractionnées en ${share.fractions}. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`
    ),
  },
  {
    id: 'points-forts-risque',
    text: nb(
      `Le niveau de risque est exprimé sur une échelle réglementaire de 1 à ${risk.sriMax}, où 1 correspond au risque le plus faible. R Start y est classée ${risk.sriLabel}, soit une ${risk.sriClass}, dans son document d’informations clés du ${product.dicDate.label}, qui seul fait foi et suppose une détention de ${risk.recommendedHoldingLabel}. Cette échelle ne mesure pas tous les risques : elle ne dit rien de la liquidité de vos parts, ni du risque de change, ni de l’effet de levier. Source : document d’informations clés de R Start du ${product.dicDate.label}, p. 2.`
    ),
  },
  {
    id: 'points-forts-en-ligne',
    text: nb(
      `R Start se souscrit uniquement en ligne. Le démembrement, la souscription papier et CORUM Life ne sont pas proposés pour cette SCPI. Pièces à préparer : ${subscription.documentsRequired.map(lower).join(', ')}. Sources : brochure partenaires 2026, p. 5 et p. 7 ; bulletin de souscription, mai 2026.`
    ),
  },
  {
    id: 'points-forts-distribution',
    text: nb(
      `Fréquence de versement des dividendes potentiels : ${lower(income.frequency)}. Leur montant dépend des loyers encaissés et de la décision de la société de gestion. Aucun montant n’est annoncé à l’avance. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
  {
    id: 'points-forts-zone',
    text: typo(
      `Zone d’investissement selon le DIC du ${product.dicDate.label} : ${lower(strategy.zoneDetail)}. Les investissements portent sur tous types d’actifs immobiliers professionnels. Cette zone décrit où R Start peut investir, pas un patrimoine existant : il se constitue au fil des collectes et peut rester concentré sur peu d’immeubles, de pays ou de secteurs. L’étendue de la zone ne supprime aucun des risques du placement.`
    ),
  },
  {
    id: 'points-forts-approche',
    text: typo(
      `Approche de R Start selon le DIC du ${product.dicDate.label} : « ${lower(strategy.approach)} ». Une approche n’est pas un résultat : elle n’assure ni plus-value, ni revenu, et ne met pas le capital à l’abri d’une perte. Le patrimoine se constitue au fil des collectes et peut rester concentré sur peu d’immeubles, de pays ou de secteurs.`
    ),
  },
  {
    id: 'points-forts-automatique',
    text: nb(
      `Versements programmés (${lower(subscription.options.pei.name)}) : à partir de ${subscription.options.pei.minimumMonthlyLabel}, sous réserve de ${lower(subscription.options.pei.requirement)}. Réinvestissement des dividendes : ${lower(subscription.options.rd.description)} potentiels en nouvelles parts. Ces deux options s’interrompent et se modifient à tout demande ; elles ne garantissent aucun revenu. Sources : brochure partenaires 2026, p. 5 ; bulletins d’adhésion, avril 2026.`
    ),
  },
  {
    id: 'points-forts-jouissance',
    text: nb(
      `Date de jouissance des parts : « ${income.enjoymentDate} », soit un délai de ${income.enjoymentDelayLabel}. Aucun dividende n’est versé pendant ce délai. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
];

export const highlights = {
  eyebrow: 'Points forts',
  title: 'R Start en six repères',
  intro: nb(
    'R Start est une SCPI : une société qui achète des immeubles loués à des entreprises et vous en reverse les loyers, après frais de gestion. Vous achetez des parts de cette société, pas les immeubles.'
  ),
  /**
   * Six repères en blocs simples (11/09/2026, trame de l'équipe) : un libellé, une valeur, un appel de
   * note. Les descriptions et les contre-poids par carte ont disparu ; un seul contre-poids couvre
   * désormais la section, sous la grille.
   * TROIS VALEURS DE LA TRAME NE SONT PAS REPRISES TELLES QUELLES, elles contredisaient les documents :
   *  - niveau de risque « 4/7 » : le document d'informations clés du produit dit 3 sur 7. Une
   *    communication commerciale ne peut pas contredire le DIC (retour AMF sur la brochure) ;
   *  - zone « Monde » : le DIC borne la zone aux pays du Conseil de l'Europe et au Canada ;
   *  - approche « Diversifiée » : le mot est interdit comme acquis (le patrimoine peut rester concentré
   *    au démarrage). La valeur reprend le terme du DIC, la valorisation.
   * Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
   */
  cards: [
    { label: 'Ticket d’entrée', value: nb(share.priceLabel), noteId: 'points-forts-prix-de-part' },
    { label: 'Niveau de risque', value: risk.sriLabel, noteId: 'points-forts-risque' },
    /** income.frequency vaut « Mensuelle » ; accordé ici au libellé (« revenus »). */
    { label: 'Revenus potentiels', value: 'Mensuels', noteId: 'points-forts-distribution' },
    { label: 'Approche', value: 'Valorisation', noteId: 'points-forts-approche' },
    { label: 'Zone d’investissement', value: 'Europe et Canada', noteId: 'points-forts-zone' },
    {
      label: 'Délai de jouissance',
      value: nb(income.enjoymentDelayLabel),
      noteId: 'points-forts-jouissance',
    },
  ],
  /** Septième information de la trame, hors grille : elle n'a pas de valeur chiffrée. */
  banner: nb(subscription.onlineLabel),
  bannerNoteId: 'points-forts-en-ligne',
  /** Les deux automatismes de la trame, sous la grille. */
  options: [
    {
      label: 'Versements automatiques',
      value: nb(`dès ${subscription.options.pei.minimumMonthlyLabel}`),
      noteId: 'points-forts-automatique',
    },
    { label: 'Réinvestissement automatique', value: 'des dividendes potentiels' },
  ],
  /** Contre-poids unique de la section : les six repères sont des caractéristiques, pas des promesses. */
  risk: nb(
    `Ces repères décrivent le produit, ils ne réduisent aucun de ses risques. Le capital n’est pas garanti : vous pouvez perdre tout ou partie de la somme investie. Les revenus ne sont pas garantis et varient. La revente de vos parts n’est pas garantie et une commission de retrait s’applique avant ${fees.withdrawal.zeroAfterYears} ans. R Start peut investir hors zone euro : le cours des devises peut réduire la valeur de vos parts. Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`
  ),
  notes,
} satisfies HighlightsContent;
