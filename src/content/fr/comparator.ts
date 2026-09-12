/*
 * Imports RELATIFS, contrairement au reste du dossier : scripts/check-compliance.mjs charge ce fichier
 * avec node, qui ne connaît pas l'alias « @/ » du projet. facts.ts et legal.ts sont dans le même cas.
 */
import { fees, product } from './facts.ts';
import { innovationNotRevolution } from './legal.ts';

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
  /** Précision sous un taux (palier, condition), quand le taux seul ne suffit pas. */
  details?: Partial<Record<ComparatorRowKey, string>>;
  /** Document et date d'où viennent les taux. Obligatoire dès qu'une valeur est renseignée. */
  source?: string;
  /**
   * Renseigné = la SCPI N'EST PAS proposée au choix, et pourquoi. On ne laisse pas dans une liste
   * publique un nom qu'on n'a pas pu vérifier : ce serait une erreur de fait dans un comparatif.
   */
  unavailable?: string;
}

export type ComparatorRowKey =
  'subscription' | 'acquisition' | 'broker' | 'management' | 'works' | 'disposal' | 'withdrawal';

/**
 * Hypothèse de lecture du tableau (12/09/2026, demande de l'équipe) : le souscripteur garde ses parts au
 * moins huit ans, la durée après laquelle R Start ne prélève plus de commission de retrait. Elle est dite
 * en clair sous le tableau, parce qu'elle change la ligne « retrait » de toutes les SCPI.
 */
const HOLDING_YEARS = fees.withdrawal.zeroAfterYears;

/** Fourchette d'un barème à paliers : « de 0 % à 12 % » se lit mieux que « 0 / 6 / 12 % ». */
const range = (rates: readonly string[]): string => {
  const nums = rates.map((r) => parseFloat(r.replace(',', '.')));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? `${min} %` : `de ${min} % à ${max} %`;
};

/** Taux de retrait de R Start au-delà de la durée retenue : le dernier palier du barème. */
const withdrawalAfterHolding = fees.withdrawal.steps[fees.withdrawal.steps.length - 1].rate;

export const comparator = {
  title: 'Comparer les frais, SCPI par SCPI',
  intro:
    'R Start d’un côté, une autre SCPI de l’autre. Les sept lignes ci-dessous sont les frais que prélève une société de gestion, de la souscription au retrait. Un taux bas sur une ligne ne dit rien du coût total : c’est la combinaison des sept qui compte, et elle dépend de ce que la SCPI gagne.',
  /** Colonne de gauche, toujours R Start. */
  leftLabel: product.name,
  leftManager: 'CORUM Asset Management',
  selectLabel: 'SCPI à comparer avec R Start',
  /** Affiché tant que la SCPI n'a pas été documentée du tout (aucune source). */
  pendingLabel: 'À compléter',
  /**
   * Affiché quand la source A ÉTÉ consultée mais ne publie pas ce frais. Ce n'est pas la même chose
   * qu'une donnée manquante, et ce n'est surtout pas 0 % : une absence de mention ne vaut pas gratuité.
   */
  notPublishedLabel: 'Non publié',
  /**
   * Le taux le plus bas d'une ligne est mis en avant par la COULEUR et la GRAISSE, l'autre est atténué.
   * Jamais par la TAILLE : un frais affiché plus petit que ses voisins est précisément ce que l'AMF a
   * reproché à la brochure, et tests/conformite.spec.ts le vérifie.
   * Ce libellé n'est pas affiché : il est lu par les lecteurs d'écran, pour qui une différence de couleur
   * ne dit rien. Il n'apparaît que si LES DEUX cases portent un pourcentage unique et comparable.
   */
  bestLabel: 'taux le plus bas de la ligne',
  /** Bandeau d'avertissement tant qu'une seule valeur manque pour la SCPI choisie. */
  pendingNotice:
    'Les taux de cette SCPI ne sont pas encore relevés. Tant qu’ils manquent, ce tableau ne compare rien : il ne montre que les frais de R Start. Aucune conclusion ne peut en être tirée.',
  /** Hypothèse de lecture, affichée au-dessus du tableau : elle change la ligne « retrait ». */
  holdingNotice: `La ligne « frais de retrait anticipé » suppose une détention d’au moins ${HOLDING_YEARS} ans, la durée de placement recommandée de ${product.name}. Sortir plus tôt coûte davantage : le barème complet de chaque SCPI figure sous son taux.`,
  /** Rappel permanent sous le tableau : une case vide n'est pas un zéro. */
  notPublishedNotice:
    'Une ligne « non publié » signifie que le document consulté ne mentionne pas ce frais. Cela ne veut pas dire qu’il n’est pas prélevé.',
  /** Source à afficher sous le tableau. Celle de R Start est connue ; celles des autres SCPI viendront. */
  sourceLabel: 'Sources des données',
  /** Qui publie les chiffres de la colonne de gauche, et dans quels documents. */
  sourceRStartLabel: 'CORUM Asset Management',
  sourceRStart: `document d’informations clés du ${product.dicDate.label}, note d’information visée par l’AMF et brochure partenaires 2026.`,
  sourceOthers:
    'Frais des autres SCPI : à relever dans le document d’informations clés et la note d’information de chacune, avec leur date d’arrêté. Un taux change : la date fait foi.',
  /**
   * Périmètre du comparatif, obligatoire dès qu'une autre SCPI est nommée : il dit ce qui est comparé et
   * ce qui ne l'est pas. Ce tableau compare des TAUX AFFICHÉS, SCPI par SCPI — ce n'est ni la moyenne de
   * marché de la brochure, ni une comparaison de résultats.
   */
  perimeter:
    'Ce tableau compare les taux de frais affichés dans les documents de chaque SCPI, lus sous une même hypothèse de durée de détention. Quand les deux taux d’une ligne sont directement comparables, le plus bas est mis en avant : cette mise en avant ne porte que sur cette ligne et ne dit rien du coût total, qui dépend de ce que la SCPI encaisse et de votre durée de détention. Il ne compare pas les résultats. Il ne porte pas sur l’ensemble du marché : seules les SCPI de la liste y figurent. R Start n’a pas d’historique et aucune donnée de performance n’est communiquée sur ce site.',
  /**
   * Base de comparaison HT / TTC. Sans elle, on opposerait un taux TTC à un taux HT sans le dire, ce que
   * l'AMF a déjà reproché à la brochure. R Start étant exonérée de TVA, ses deux montants sont égaux.
   */
  vatNotice:
    'Chaque taux est reproduit tel que la société de gestion le publie. Ceux de R Start sont hors taxes, sauf la commission de cession et la commission de retrait, exprimées toutes taxes comprises ; R Start étant exonérée de TVA, ses montants hors taxes et toutes taxes comprises sont égaux. Vérifiez la base retenue par chaque SCPI avant toute conclusion.',
  /** Encadré de la brochure (p.4), à afficher avec tout comparatif de frais. */
  innovationBox: innovationNotRevolution,

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
      rstart: range(fees.disposal.tiers.map((t) => t.rate)),
      /** Le taux dépend de la plus-value réalisée : le détail des paliers accompagne la fourchette. */
      rstartDetail: fees.disposal.tiers.map((t) => `${t.rate} ${t.condition}`).join(', '),
    },
    {
      key: 'withdrawal' as const,
      label: 'Frais de retrait anticipé',
      basis: 'en % de la valeur de retrait',
      rstart: withdrawalAfterHolding,
      rstartDetail: `au-delà de ${HOLDING_YEARS} ans de détention ; avant, le barème est dégressif : ${fees.withdrawal.steps
        .slice(0, -1)
        .map((s) => `${s.rate} ${s.short}`)
        .join(', ')}`,
    },
  ],

  /**
   * Les SCPI proposées au choix. Iroko Zen en tête : c'est celle que l'équipe veut voir d'abord.
   * Orthographes et sociétés de gestion À VÉRIFIER sur les documents au moment de relever les taux.
   */
  scpis: [
    {
      name: 'Iroko Zen',
      manager: 'Iroko',
      /**
       * Taux repris MOT POUR MOT de la page « Nos frais » d'Iroko, consultée le 11/09/2026. Ils y sont
       * exprimés TTC, là où ceux de R Start sont HT sauf cession et retrait — la comparaison tient parce
       * que R Start est exonérée de TVA (son HT égale son TTC), et le tableau le dit sous les sources.
       * À CONFIRMER SUR LA NOTE D'INFORMATION D'IROKO ZEN avant publication : une page marketing n'est pas
       * un document réglementaire, et un taux change.
       */
      values: {
        subscription: '0 %',
        acquisition: '3,60 % TTC',
        broker: '0,20 % TTC',
        management: '14,40 % TTC',
        works: '6,00 % TTC',
        disposal: '5 % TTC',
        withdrawal: '0 %',
      },
      details: {
        broker: 'taux 2025 des acquisitions de gré à gré, plafonné à 6,00 % TTC',
        management: 'sur les loyers perçus',
        disposal: 'sur le prix de vente, en cas de plus-value',
        withdrawal: 'au-delà de 6 ans ; avant, 6,00 % TTC du capital retiré',
      },
      /** Le nom de la SCPI est déjà l'intitulé de la ligne de sources : il ne se répète pas ici. */
      source:
        'taux publiés sur iroko.eu/nos-frais, consultés le 11 septembre 2026. À confirmer sur la note d’information avant publication.',
    },
    {
      name: 'Transitions Europe',
      manager: 'Arkéa REIM',
      values: {
        subscription: '12 % TTC',
        acquisition: '0 %',
        management: '12 % TTC',
        works: '6 % TTC',
        disposal: '2,40 % TTC',
        withdrawal: '0 %',
      },
      details: {
        subscription: '10 % HT maximum du prix de souscription, incluse dans la prime d’émission',
        acquisition:
          'la société de gestion ne perçoit pas de commission sur l’acquisition des actifs',
        management: '10 % HT maximum des produits locatifs et financiers encaissés',
        works: '5 % HT du montant des travaux réalisés',
        disposal: 'commission sur arbitrages, 2 % HT du prix de vente net vendeur',
        withdrawal: 'aucun coût de sortie, selon le document d’informations clés',
      },
      source:
        'note d’information, chapitre 3, et document d’informations clés du 31 décembre 2025, consultés le 12 septembre 2026 sur arkea-reim.com. Les 0 % viennent d’une mention explicite d’absence de commission, non d’un silence.',
    },
    {
      name: 'Comète',
      manager: 'Alderan',
      values: {
        subscription: '12 % TTC',
        acquisition: '1,20 % TTC',
        management: '13,20 % TTC',
        works: '3,60 % TTC',
        disposal: '1,20 % TTC',
      },
      details: {
        subscription: '10 % HT maximum du prix de souscription des parts',
        acquisition:
          '1 % HT, assise sur le prix d’acquisition de l’actif et les droits immobiliers',
        management: '11 % HT des recettes de toute nature encaissées par la SCPI',
        works: '3 % HT du montant des travaux réalisés',
        disposal: '1 % HT, assise sur le prix de cession de l’actif hors droits',
      },
      source:
        'page « Carte d’identité » d’Alderan (visa SCPI 26-16 du 7 juillet 2026), consultée le 12 septembre 2026 sur alderan.fr. Aucune commission de retrait n’y figure.',
    },
    {
      name: 'Épargne Pierre Europe',
      manager: 'Atland Voisin',
      values: {
        subscription: '12 % TTC',
        management: '12 % TTC',
        works: '3 % TTC',
        disposal: '1,20 % TTC',
      },
      details: {
        subscription: '10 % HT du prix de souscription, prime d’émission incluse',
        management: '10 % HT du montant total des recettes brutes encaissées',
        works: '2,5 % HT du montant des travaux immobilisés',
        disposal:
          '1 % HT du prix net vendeur si la plus-value nette fiscale est de 5 à 10 %, 1,25 % HT au-delà',
      },
      source:
        'fiche produit d’Atland Voisin, consultée le 12 septembre 2026 sur atland-voisin.com. Aucun taux n’y est exprimé sur un prix d’achat : la ligne acquisition reste vide plutôt que d’être déduite.',
    },
    {
      /** Attention : les taux d'Atlas diffèrent de ceux de Zen sur la même page d'Iroko. */
      name: 'Iroko Atlas',
      manager: 'Iroko',
      values: {
        subscription: '0 %',
        acquisition: '4,80 % TTC',
        management: '15,36 % TTC',
        works: '6,00 % TTC',
        disposal: '5 % TTC',
        withdrawal: '0 %',
      },
      details: {
        management: 'des loyers perçus',
        disposal: 'sur le prix de vente d’un actif, en cas de plus-value seulement',
        withdrawal: 'au-delà de 6 ans ; avant, 6,00 % TTC du capital retiré',
      },
      source:
        'page « Nos frais » d’Iroko, colonne Iroko Atlas, consultée le 12 septembre 2026 sur iroko.eu. Les frais de brokerage n’y figurent que pour Iroko Zen : la ligne reste vide pour Atlas.',
    },
    {
      name: 'EDR Europa',
      manager: 'Edmond de Rothschild REIM',
      values: {
        subscription: '12 % TTC',
        acquisition: '1,50 % TTC',
        management: '12,60 % TTC',
        works: '3 % TTC',
        disposal: '1,50 % TTC',
      },
      details: {
        acquisition: 'du prix d’acquisition net vendeur des actifs immobiliers',
        management: 'des produits locatifs hors taxes et des produits financiers nets encaissés',
        works: 'du montant des travaux hors taxes réalisés',
        disposal: 'en cas de plus-value nette fiscale seulement',
      },
      source:
        'tableau « Frais et commissions » du site de la SCPI, consulté le 12 septembre 2026 sur edr-europa.com. L’assiette de la commission de cession y est libellée « prix d’acquisition », ce qui semble une coquille : à lever sur la note d’information de juin 2026 avant publication.',
    },
    {
      name: 'Cristal Life',
      manager: 'Inter Gestion',
      values: {
        subscription: '12,00 % TTI',
        acquisition: '1,50 % TTI',
        broker: '3,50 %',
        management: '13,20 % TTC',
        works: '3 % TTC',
        disposal: '2,50 % TTI',
      },
      details: {
        subscription: 'du prix de souscription, dont 10 % de frais de collecte et 2 % de recherche',
        acquisition: 'du prix d’acquisition tous frais inclus',
        broker:
          'commission d’intermédiation HT, dégressive : 3,50 % sous 5 M€, puis 1,75 %, 1,50 % et 1,25 %',
        management: 'des produits locatifs hors taxes et des produits financiers nets encaissés',
        works: '2,50 % HT du montant global des travaux réalisés',
        disposal: 'du prix de vente net',
      },
      source:
        'note d’information et statuts, version du 15 janvier 2026, consultés le 12 septembre 2026 depuis inter-gestion.com. Aucune commission de retrait n’y figure : la ligne reste vide.',
    },
    {
      name: 'Sofidynamic',
      manager: 'Tikehau IM',
      values: {
        subscription: '2,40 % TTC',
        acquisition: '3,00 % TTC',
        management: '14,40 % TTC',
        works: '1,80 % TTC',
        disposal: '3,00 % TTC',
        withdrawal: '0 %',
      },
      details: {
        subscription: '2,00 % HT du prix de souscription, primes d’émission incluses',
        acquisition: '2,50 % HT du prix d’acquisition net vendeur',
        management: '12,00 % HT des produits locatifs et financiers encaissés',
        works: '1,50 % HT, pour tout programme supérieur à 100 000 € HT',
        disposal: '2,50 % HT du prix de vente du bien cédé',
        withdrawal: 'au-delà de 8 ans ; avant, 4,17 % HT (5,00 % TTC) du montant remboursé',
      },
      source:
        'note d’information, version de juillet 2026, chapitre III, consultée le 12 septembre 2026 sur sofidy.com.',
    },
    {
      name: 'Wemo One',
      manager: 'Wemo REIM',
      values: {
        subscription: '12 % TTC',
        acquisition: '2,40 % TTC',
        management: '13,20 % TTC',
        works: 'Néant',
        disposal: '2,40 % TTC',
      },
      details: {
        subscription: '10 % HT maximum du montant de la souscription',
        acquisition: '2 % HT maximum du prix d’acquisition hors taxes, hors droits et hors frais',
        management: '11 % HT maximum des produits locatifs et autres produits encaissés',
        disposal: '2 % HT maximum du prix de cession net vendeur, en cas de plus-value seulement',
      },
      source:
        'note d’information du 24 juin 2026, consultée le 12 septembre 2026 sur wemo-reim.fr. Les commissions d’acquisition et de cession ont été introduites dans cette version : la précédente indiquait « Néant ». Aucune commission de retrait n’y figure.',
    },
    {
      name: 'Remake Live',
      manager: 'Remake AM',
      values: {
        subscription: '0 %',
        acquisition: '5 % TTC',
        management: '18 % TTC',
        works: '5 % TTC',
        withdrawal: '0 %',
      },
      details: {
        acquisition: '4,17 % HT du prix d’acquisition net vendeur',
        management: '15 % HT des produits locatifs et autres produits encaissés',
        works: '4,17 % HT du montant des travaux de gros entretien et d’investissement',
        withdrawal:
          'au-delà de 5 ans ; avant, 4,17 % HT (5 % TTC) du montant remboursé, avec exonérations prévues',
      },
      source:
        'note d’information du 30 juin 2026, consultée le 12 septembre 2026 sur remake.fr. Aucune commission de cession d’immeubles ni d’intermédiation n’y figure : ces lignes restent vides.',
    },
    {
      name: 'Cœur d’Europe',
      manager: 'Sogenial Immobilier',
      values: {
        subscription: '12 % TTC',
        management: '12 % TTC',
        works: '6 % TTC',
        disposal: '6 % TTC',
      },
      details: {
        subscription: '10 % HT du prix de souscription, prélevée sur la prime d’émission',
        management: '10 % HT des produits locatifs et financiers encaissés',
        works: 'au maximum, du montant des travaux hors taxes réalisés',
        disposal: 'commission d’arbitrage, au maximum, du prix de vente net',
      },
      source:
        'note d’information d’août 2026, chapitre 3, consultée le 12 septembre 2026 sur sogenial.fr. Aucune commission d’acquisition, d’intermédiation ni de retrait n’y figure.',
    },
    {
      name: 'Osmo Énergie',
      manager: 'Mata Capital IM',
      values: {
        subscription: '12 % TTC',
        acquisition: '1,20 % TTC',
        management: '10,80 % TTC',
        works: '0 %',
        disposal: '1,20 % TTC',
        withdrawal: '0 %',
      },
      details: {
        acquisition: '1,00 % HT maximum du prix d’acquisition hors taxes et hors droits',
        management: '9,00 % HT maximum des produits locatifs encaissés',
        works: 'la société de gestion ne perçoit pas de commission de travaux',
        disposal: '1,00 % HT maximum, en cas de plus-value seulement',
        withdrawal: 'la société de gestion ne perçoit pas de commission de retrait',
      },
      source:
        'note d’information du 1er août 2026, chapitre III, consultée le 12 septembre 2026 sur osmo-energie.com.',
    },
    {
      name: 'Allianz Diverscity',
      manager: 'Allianz Immovalor',
      values: {
        subscription: '9,60 % TTC',
        management: '9,60 % TTC',
        disposal: '2,40 % TTC',
      },
      details: {
        subscription: '8 % HT maximum du produit de chaque souscription, prime d’émission incluse',
        management: '8 % HT maximum des produits locatifs et financiers encaissés',
        disposal: '2 % HT maximum du produit des ventes constatées par acte notarié',
      },
      source:
        'note d’information du 30 avril 2026, chapitre 3, consultée le 12 septembre 2026 sur immovalor.fr. Ce chapitre ne prévoit ni commission d’acquisition, ni frais d’agent immobilier, ni commission de travaux ou de retrait : ces lignes restent vides plutôt que d’être supposées nulles.',
    },
    {
      name: 'Epsicap Nano',
      manager: 'Epsicap REIM',
      values: {
        subscription: '5 % HT',
        acquisition: '5 % HT',
        management: '10 % HT',
        works: '0 %',
        disposal: '0 %',
        withdrawal: '0 %',
      },
      details: {
        management: 'des loyers perçus par la SCPI',
        works: 'pas de commission de suivi de travaux',
        disposal: 'pas de commission de cession',
        withdrawal: 'pas de frais de sortie',
      },
      source:
        'page « Nos frais » d’Epsicap REIM, consultée le 12 septembre 2026 sur epsicap.fr. Les trois 0 % y sont affirmés, non déduits.',
    },
    {
      name: 'Alta Convictions',
      manager: 'Altarea IM',
      values: {
        subscription: '10,14 % TTC',
        acquisition: '1,50 % TTC',
        management: '13,74 % TTC',
        works: '3,60 % TTC',
        disposal: '3 % TTC',
      },
      details: {
        subscription: '8,45 % HT maximum du montant de la souscription, prime d’émission incluse',
        acquisition:
          '1,25 % HT du prix d’acquisition hors droits, sauf acquisitions consécutives à de nouvelles souscriptions',
        management: '11,45 % HT maximum des produits locatifs et autres produits encaissés',
        works: '3 % HT maximum du montant des travaux réalisés',
        disposal: '2,50 % HT du prix de cession net vendeur',
      },
      source:
        'note d’information de juin 2026, chapitre 3, consultée le 12 septembre 2026 sur altarea-im.com. Aucune commission de retrait n’y figure : la ligne reste vide.',
    },
    {
      name: 'Volt Europe',
      manager: 'Volt AM',
      values: {
        subscription: '12 % TTC',
        acquisition: '0 %',
        management: '12 % TTC',
        works: '6 % TTC',
        disposal: 'de 1 % à 5 %',
      },
      details: {
        subscription: '10 % HT maximum du prix de souscription, inclus dans la prime d’émission',
        acquisition:
          'la société de gestion ne perçoit pas de commission sur l’acquisition des actifs',
        management: '10 % HT maximum des produits locatifs et financiers',
        works: '5 % HT maximum du montant des travaux réalisés',
        disposal:
          'en cas de plus-value seulement : 1 % de 1 à 5 %, 3 % de 5 à 10 %, 5 % au-delà de 10 %',
      },
      source:
        'note d’information visée par l’AMF le 29 mai 2026 (visa 26-14), chapitre 3, consultée le 12 septembre 2026 sur volt-am.com.',
    },
    {
      name: 'Immo France Territoires',
      manager: 'Amundi Immobilier',
      unavailable:
        'Aucune SCPI de ce nom chez Amundi Immobilier au 12 septembre 2026 : leur site ne liste ni ce fonds, ni un nom approchant. Nom à vérifier auprès de l’équipe avant de la proposer au choix.',
    },
    {
      /** Nom officiel : « PPG PremEurope », société de gestion « Pierre 1er Gestion ». */
      name: 'PPG PremEurope',
      manager: 'Pierre 1er Gestion',
      values: {
        subscription: '9,60 % TTC',
        acquisition: '3,60 % TTC',
        management: '12 % TTC',
        works: '1,20 % TTC',
        disposal: '1,20 % TTC',
        withdrawal: '0 %',
      },
      details: {
        subscription: '8 % HT du montant de la souscription',
        acquisition:
          '3 % HT jusqu’à 10 M€, 2 % HT de 10 à 25 M€, 1,5 % HT au-delà, sur le prix d’acquisition',
        management: '10 % HT maximum des produits locatifs et autres produits encaissés',
        works: '1 % HT maximum du montant des travaux réalisés',
        disposal: '1 % HT maximum du prix de vente hors droits, en cas de plus-value seulement',
        withdrawal: 'la note d’information ne prévoit aucune commission de retrait',
      },
      source:
        'page produit de Pierre 1er Gestion, consultée le 12 septembre 2026 sur pierrepremiergestion.fr, qui renvoie au document d’informations clés et à la note d’information.',
    },
    {
      name: 'Atream Atwin',
      manager: 'Atream',
      unavailable:
        'Société constituée le 29 avril 2026 mais absente du site d’Atream au 12 septembre 2026, sans document d’informations clés ni note d’information publiés : elle ne semble pas ouverte à la souscription. Rien à comparer tant qu’elle ne publie pas ses frais.',
    },
  ] as ComparedScpi[],
};

/** Les SCPI réellement proposées au choix : celles qu'on a pu vérifier. */
export const comparatorScpis = comparator.scpis.filter((s) => !s.unavailable);

/**
 * Vrai tant qu'une SCPI proposée n'a PAS ÉTÉ DOCUMENTÉE (aucune source). Une SCPI documentée dont un
 * frais n'est pas publié n'est pas un trou : c'est une information, affichée « non publié ».
 */
export const comparatorIsIncomplete = comparatorScpis.some((s) => !s.source);

export default comparator;
