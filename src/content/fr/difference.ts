import type { DifferenceContent } from '@/content/types-v2';
import type { LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { corumGroup, fees as feeFacts, product } from '@/content/fr/facts';
import { arbitrageWarningBullets } from '@/content/fr/legal';

/**
 * Section 2, « Pourquoi gagnant-gagnant ? » (zone 2 de la V2). Titre et copie fournis par l'équipe le
 * 11/09/2026 et repris tels quels. DEUX POINTS À ARBITRER EN COMPLIANCE, tous deux signalés en
 * avertissement par scripts/check-compliance.mjs pour rester traçables :
 *  1. « nous, on ne touche rien tant que vous n'avez pas gagné d'argent », inexact en lecture stricte :
 *     les frais de gestion sont prélevés sur les loyers encaissés, y compris quand la valeur des parts
 *     baisse ; la société de gestion peut donc se rémunérer alors que l'épargnant est en perte ;
 *  2. « La première SCPI sans frais d'entrée ni frais d'acquisition », allégation de rang SANS périmètre
 *     de marché. Le périmètre (les cinq SCPI du groupe CORUM) est porté par l'appel de note qui la suit.
 * Explique quand la société de gestion se rémunère, sans jamais promettre de résultat : deux moteurs
 * (les loyers encaissés puis redistribués, la plus-value réalisée à la vente), la formule d'alignement
 * au vouvoiement, le mécanisme de réserve en cas de moins-value (brochure partenaires 2026, p.4) et le
 * contre-poids chiffré des frais réellement prélevés.
 * Exactitude de la formule d'alignement : les 15 % de frais de gestion sont prélevés sur les loyers
 * encaissés, y compris quand la valeur des parts baisse. On écrit donc « se rémunère sur les loyers
 * encaissés et les plus-values réalisées, jamais sur le montant que vous versez », et jamais « nous ne
 * touchons rien tant que vous n'avez pas gagné d'argent », qui serait faux.
 * Garde-fous : aucune donnée de performance, aucun exemple d'investissement, l'allégation de rang
 * (facts.product.definition) ouvre le bloc du contre-poids depuis le hero minimal du 10/09/2026, avec son
 * périmètre en note et les frais réels juste après. Chaque avantage porte son risque dans le même bloc
 * et à la même taille. Toutes les valeurs viennent de facts.fees ; la deuxième puce de la commission
 * d'arbitrage est reproduite à l'identique depuis legal.ts.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

const zeroAfter = feeFacts.withdrawal.zeroAfterYears;

/** Notes dans l'ordre de leur premier appel dans la section. */
export const notes: LegalNote[] = [
  {
    id: 'difference-definition',
    /**
     * Cette note est le PÉRIMÈTRE de l'allégation affichée juste au-dessus, que l'équipe a voulue courte
     * (« La première SCPI sans frais d'entrée ni frais d'acquisition. »). Elle ouvre donc sur la
     * formulation bornée exacte, « la première SCPI DU GROUPE CORUM… », avant d'en donner la portée :
     * sans elle, l'accueil ne porterait plus que la version non bornée.
     */
    text: nb(
      `${product.definition}. ${product.definitionScope} Les cinq SCPI concernées : ${corumGroup.scpiNames.join(', ')}.`
    ),
  },
  {
    id: 'difference-remuneration',
    text: nb(
      `Rémunération de la société de gestion : ${feeFacts.management.label} de frais de gestion, ${feeFacts.management.base}, une commission sur les cessions d’immeubles de ${feeFacts.disposal.label}, ${feeFacts.disposal.base}, selon la plus-value réalisée, et une commission de retrait dégressive avant ${zeroAfter} ans de détention. Aucune commission de souscription, aucun frais d’acquisition, d’intermédiation ou de travaux. ${feeFacts.vatNote} Sources : brochure partenaires 2026, p. 4 et p. 6 ; document d’informations clés du ${product.dicDate.label} ; note d’information visée par l’AMF.`
    ),
  },
];

export const difference = {
  eyebrow: 'Le modèle',
  /** Titre et copie fournis par l'équipe le 11/09/2026, repris tels quels (deux points à défendre en
   *  compliance, signalés en avertissement par scripts/check-compliance.mjs, voir l'en-tête du fichier). */
  title: 'Pourquoi gagnant-gagnant ?',
  intro: 'Qui a envie de payer avant de gagner ?',
  lead: 'Quand vous détenez des parts de R Start, on ne vous prélève des frais que dans deux situations :',
  /** Les deux situations, en liste. `strong` est le mot mis en valeur par le gabarit. */
  situations: [
    { text: 'Quand elle encaisse des loyers qu’elle vous redistribue', strong: 'loyers' },
    {
      text: 'Quand elle réalise une plus-value sur la vente d’immeubles',
      strong: 'plus-value',
    },
  ],
  counterweight: {
    title: undefined,
    /**
     * Allégation de rang de l'équipe, reprise mot pour mot le 11/09/2026 : elle N'EST PAS bornée au
     * périmètre du groupe CORUM, contrairement à `product.definition`. Le périmètre est donc porté par
     * l'appel de note `difference-definition`, qui le dit en toutes lettres (les cinq SCPI du groupe,
     * comparaison qui ne porte pas sur l'ensemble du marché). Jamais affichée sans cet appel.
     * À arbitrer en compliance : le script la signale en avertissement.
     */
    claim: {
      text: 'La première SCPI sans frais d’entrée ni frais d’acquisition.',
      noteId: 'difference-definition',
    },
    /**
     * Conclusion de l'équipe, reprise mot pour mot (11/09/2026). À DÉFENDRE EN COMPLIANCE : en lecture
     * stricte elle est inexacte, les frais de gestion sont prélevés sur les loyers encaissés, y compris
     * quand la valeur des parts baisse, donc la société de gestion peut se rémunérer alors que l'épargnant
     * est en perte. Le contre-poids chiffré `risk` suit dans le même bloc et à la même taille.
     */
    pedagogy: [
      nb(
        'En clair : nous, on ne touche rien tant que vous n’avez pas gagné d’argent. C’est gagnant-gagnant.'
      ),
    ],
    risk: nb(
      `En contrepartie, R Start prélève ${feeFacts.management.label} de frais de gestion sur les loyers. S’y ajoutent une commission sur les cessions d’immeubles (${feeFacts.disposal.label}) et une commission de retrait avant ${zeroAfter} ans. ${arbitrageWarningBullets[1]} Votre coût total n’est pas connu à la souscription.`
    ),
    noteId: 'difference-remuneration',
  },
  /** Seul accès aux frais depuis l'accueil (11/09/2026 : la section Frais a quitté la page). */
  cta: { label: 'Voir le comparateur', href: pages.fees.path },
  notes,
} satisfies DifferenceContent;
