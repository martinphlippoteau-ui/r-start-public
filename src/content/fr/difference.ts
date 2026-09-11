import type { DifferenceContent } from '@/content/types-v2';
import type { LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { fees as feeFacts, product } from '@/content/fr/facts';
import { arbitrageWarningBullets } from '@/content/fr/legal';

/**
 * Section 2 — « Ce qui change vraiment » (zone 2 de la V2).
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
    id: 'difference-remuneration',
    text: nb(
      `Rémunération de la société de gestion : ${feeFacts.management.label} de frais de gestion, ${feeFacts.management.base}, une commission sur les cessions d’immeubles de ${feeFacts.disposal.label}, ${feeFacts.disposal.base}, selon la plus-value réalisée, et une commission de retrait dégressive avant ${zeroAfter} ans de détention. Aucune commission de souscription, aucun frais d’acquisition, d’intermédiation ou de travaux. ${feeFacts.vatNote} Sources : brochure partenaires 2026, p. 4 et p. 6 ; document d’informations clés du ${product.dicDate.label} ; note d’information visée par l’AMF.`
    ),
  },
  {
    id: 'difference-reserve',
    text: nb(
      'Le détail du mécanisme de compensation figure au chapitre III, section 4 de la note d’information de R Start. Source : brochure partenaires 2026, p. 4.'
    ),
  },
];

export const difference = {
  eyebrow: 'Le modèle',
  title: 'Ce qui change vraiment',
  intro:
    'Dans une SCPI classique, vous payez des frais d’entrée le jour où vous souscrivez, avant qu’un seul immeuble soit acheté. Avec R Start, la société de gestion se rémunère plus tard, de deux façons.',
  enginesTitle: 'Deux façons de gagner de l’argent',
  enginesLabel: 'Les deux façons dont la société de gestion se rémunère',
  engines: [
    {
      title: 'Quand les locataires paient leur loyer',
      description: nb(
        `R Start perçoit les loyers de ses immeubles, puis distribue chaque mois des dividendes potentiels. La société de gestion prélève alors ${feeFacts.management.label} de frais de gestion, ${feeFacts.management.base}.`
      ),
      risk: 'Les loyers dépendent des locataires et des marchés immobiliers. Les revenus ne sont pas garantis et peuvent varier, à la hausse comme à la baisse.',
      noteId: 'difference-remuneration',
    },
    {
      title: 'Quand un immeuble est revendu plus cher',
      description: nb(
        `Selon l’analyse de CORUM Asset Management, R Start vise à acheter des immeubles vendus sous leur valeur, à les valoriser, puis à les revendre. Si un immeuble est revendu plus cher qu’il n’a été payé, cet écart s’appelle une plus-value : la commission est alors de ${feeFacts.disposal.label} selon son ampleur.`
      ),
      risk: 'Une plus-value n’est jamais acquise d’avance. Un immeuble peut se revendre moins cher qu’il n’a été payé : c’est une moins-value, et elle fait baisser la valeur de vos parts. La commission sur les ventes est due dès que le bilan des ventes est positif, même si la valeur de vos parts a diminué.',
    },
  ],
  counterweight: {
    title: 'Une rémunération sans commission à l’entrée',
    /** Trame, zone 1 → ouverture de la zone 2 (hero minimal du 10/09/2026). Formulation exacte : les frais de gestion sont prélevés sur les loyers encaissés. */
    pedagogy: [
      // Claim de l'équipe marketing, repris mot pour mot (décision du 11/09/2026, à défendre en compliance :
      // lecture stricte = les frais de gestion sont prélevés sur les loyers encaissés, y compris quand la
      // valeur des parts baisse ; le contre-poids chiffré `risk` suit dans le même bloc).
      nb('Payer des frais si notre travail vous fait gagner de l’argent : oui.'),
      nb('Payer avant même qu’on ait commencé à travailler : non.'),
    ],
    advantage: nb(
      'Aucune commission n’est prélevée à votre souscription, ni à l’achat des immeubles, ni sur les travaux. En d’autres termes : la société de gestion se rémunère sur les loyers encaissés et les plus-values réalisées, jamais sur le montant que vous versez.'
    ),
    risk: nb(
      `En contrepartie, R Start prélève ${feeFacts.management.label} de frais de gestion sur les loyers. S’y ajoutent une commission sur les cessions d’immeubles (${feeFacts.disposal.label}) et une commission de retrait avant ${zeroAfter} ans. ${arbitrageWarningBullets[1]} Votre coût total n’est pas connu à la souscription.`
    ),
    noteId: 'difference-remuneration',
  },
  lossMechanism: {
    title: 'En cas de moins-value',
    body: [
      'Si une vente génère une moins-value, celle-ci est inscrite dans une réserve dédiée.',
      'Tant que des plus-values futures ne l’ont pas compensée, la société de gestion ne perçoit aucune commission sur les ventes.',
    ],
    risk: nb(
      `Ce mécanisme porte sur les commissions de cession, pas sur la valeur de vos parts. Les frais de gestion restent dus sur les loyers, comme la commission de retrait avant ${zeroAfter} ans.`
    ),
    noteId: 'difference-reserve',
  },
  cta: { label: 'En savoir plus sur les frais', href: pages.fees.path },
  notes,
} satisfies DifferenceContent;
