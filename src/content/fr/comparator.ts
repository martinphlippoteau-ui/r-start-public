import { fees, product } from '@/content/fr/facts';

/**
 * Comparateur de frais, page /frais (11/09/2026, demande de l'équipe, inspiré des comparateurs
 * e-commerce) : R Start à gauche, une SCPI choisie dans une liste à droite, sept lignes de frais.
 *
 * ⚠ NON PUBLIABLE EN L'ÉTAT. Les valeurs des autres SCPI sont vides : le comparateur afficherait les
 * zéros de R Start face à des cases blanches, ce qui est une comparaison trompeuse. Le composant
 * l'annonce à l'écran et scripts/check-compliance.mjs le signale à chaque exécution.
 *
 * Ce qu'il faut pour publier, SCPI par SCPI :
 *  1. les sept taux, relevés dans le document d'informations clés et la note d'information de la SCPI ;
 *  2. la date d'arrêté de ces documents, car un taux change ;
 *  3. la source exacte (document, page), qui doit apparaître sous le tableau.
 * Sans ces trois éléments, la ligne reste « à compléter » et la SCPI ne doit pas être proposée au choix.
 *
 * Les valeurs de R Start ne sont JAMAIS saisies ici : elles viennent de facts.fees, comme partout.
 */

/** Une SCPI du comparateur. `values` vide = données à relever ; la ligne s'affiche « à compléter ». */
export interface ComparedScpi {
  /** Nom commercial, à vérifier sur les documents de la SCPI au moment de relever les taux. */
  name: string;
  /** Société de gestion, même réserve. */
  manager: string;
  /** Taux par clé de ligne (voir `rows`). Absent = non relevé. */
  values?: Partial<Record<ComparatorRowKey, string>>;
  /** Document et date d'où viennent les taux. Obligatoire dès qu'une valeur est renseignée. */
  source?: string;
}

export type ComparatorRowKey =
  | 'subscription'
  | 'acquisition'
  | 'broker'
  | 'management'
  | 'works'
  | 'disposal'
  | 'withdrawal';

/** Barème de retrait de R Start, reconstruit depuis facts : jamais réécrit à la main. */
const withdrawalLabel = fees.withdrawal.steps.map((s) => s.rate).join(' / ');

export const comparator = {
  title: 'Comparer les frais, SCPI par SCPI',
  intro:
    'R Start d’un côté, une autre SCPI de l’autre. Les sept lignes ci-dessous sont les frais que prélève une société de gestion, de la souscription au retrait. Un taux bas sur une ligne ne dit rien du coût total : c’est la combinaison des sept qui compte, et elle dépend de ce que la SCPI gagne.',
  /** Colonne de gauche, toujours R Start. */
  leftLabel: product.name,
  leftManager: 'CORUM Asset Management',
  selectLabel: 'SCPI à comparer avec R Start',
  /** Affiché à la place d'un taux non relevé. */
  pendingLabel: 'À compléter',
  /** Bandeau d'avertissement tant qu'une seule valeur manque pour la SCPI choisie. */
  pendingNotice:
    'Les taux de cette SCPI ne sont pas encore relevés. Tant qu’ils manquent, ce tableau ne compare rien : il ne montre que les frais de R Start. Aucune conclusion ne peut en être tirée.',
  /** Source à afficher sous le tableau. Celle de R Start est connue ; celles des autres SCPI viendront. */
  sourceLabel: 'Sources',
  sourceRStart: `Frais de ${product.name} : document d’informations clés du ${product.dicDate.label}, note d’information visée par l’AMF et brochure partenaires 2026.`,
  sourceOthers:
    'Frais des autres SCPI : à relever dans le document d’informations clés et la note d’information de chacune, avec leur date d’arrêté. Un taux change : la date fait foi.',

  /** Les sept lignes, dans l'ordre du tableau fourni par l'équipe. */
  rows: [
    {
      key: 'subscription' as const,
      label: 'Frais de souscription',
      basis: 'en % du montant investi',
      rstart: fees.subscription.label,
    },
    {
      key: 'acquisition' as const,
      label: 'Frais d’acquisition',
      basis: 'en % du prix d’achat',
      rstart: fees.acquisition.label,
    },
    {
      key: 'broker' as const,
      label: 'Frais d’agent immobilier',
      basis: 'en % du prix d’acquisition',
      rstart: fees.broker.label,
    },
    {
      key: 'management' as const,
      label: 'Frais de gestion',
      basis: 'en % des loyers encaissés',
      rstart: fees.management.label,
    },
    {
      key: 'works' as const,
      label: 'Frais de travaux',
      basis: 'en % du montant des travaux',
      rstart: fees.works.label,
    },
    {
      key: 'disposal' as const,
      label: 'Frais de cession d’immeubles',
      basis: 'en % du prix de vente',
      rstart: fees.disposal.label,
      /** Le taux dépend de la plus-value réalisée : le détail des paliers accompagne la valeur. */
      rstartDetail: fees.disposal.tiers.map((t) => `${t.rate} ${t.condition}`).join(', '),
    },
    {
      key: 'withdrawal' as const,
      label: 'Frais de retrait anticipé',
      basis: 'en % de la valeur de retrait',
      rstart: withdrawalLabel,
      rstartDetail: fees.withdrawal.steps.map((s) => `${s.rate} ${s.short}`).join(', '),
    },
  ],

  /**
   * Les SCPI proposées au choix. Iroko Zen en tête : c'est celle que l'équipe veut voir d'abord.
   * Orthographes et sociétés de gestion À VÉRIFIER sur les documents au moment de relever les taux.
   */
  scpis: [
    { name: 'Iroko Zen', manager: 'Iroko' },
    { name: 'Transitions Europe', manager: 'Arkéa REIM' },
    { name: 'Comète', manager: 'Alderan' },
    { name: 'Épargne Pierre Europe', manager: 'Atland Voisin' },
    { name: 'Iroko Atlas', manager: 'Iroko' },
    { name: 'EDR Europa', manager: 'Edmond de Rothschild REIM' },
    { name: 'Cristal Life', manager: 'Inter Gestion' },
    { name: 'Sofidynamic', manager: 'Tikehau IM' },
    { name: 'Wemo One', manager: 'Wemo REIM' },
    { name: 'Remake Live', manager: 'Remake AM' },
    { name: 'Cœur d’Europe', manager: 'Sogenial Immobilier' },
    { name: 'Osmo Énergie', manager: 'Mata Capital IM' },
    { name: 'Allianz Diverscity', manager: 'Allianz Immovalor' },
    { name: 'Epsicap Nano', manager: 'Epsicap REIM' },
    { name: 'Alta Convictions', manager: 'Altarea IM' },
    { name: 'Volt Europe', manager: 'Volt AM' },
    { name: 'Immo France Territoires', manager: 'Amundi Immobilier' },
    { name: 'PPG Preum’Europe', manager: 'Pierre 1er de Gestion' },
    { name: 'Atream Atwin', manager: 'Atream' },
  ] as ComparedScpi[],
};

/** Vrai tant qu'une seule des SCPI proposées n'a pas ses sept taux : le comparateur n'est pas publiable. */
export const comparatorIsIncomplete = comparator.scpis.some(
  (s) => comparator.rows.filter((r) => s.values?.[r.key]).length < comparator.rows.length
);

export default comparator;
