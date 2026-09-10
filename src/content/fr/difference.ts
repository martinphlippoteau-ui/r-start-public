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
 * Garde-fous : aucune donnée de performance, aucun exemple d'investissement, aucune allégation de rang
 * (elle est portée par le hero, avec son périmètre). Chaque avantage porte son risque dans le même bloc
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
    'Depuis 2012, CORUM gère ses SCPI avec des frais affichés dès la souscription. Avec R Start, la rémunération de la société de gestion dépend des résultats. Elle repose sur deux moteurs.',
  enginesTitle: 'Deux moteurs',
  enginesLabel: 'Les deux moteurs de rémunération de la société de gestion',
  engines: [
    {
      title: 'Quand elle encaisse des loyers qu’elle vous redistribue',
      description: nb(
        `R Start perçoit les loyers de ses immeubles, puis distribue chaque mois des dividendes potentiels. La société de gestion prélève alors ${feeFacts.management.label} de frais de gestion, ${feeFacts.management.base}.`
      ),
      risk: 'Les loyers dépendent des locataires et des marchés immobiliers. Les revenus ne sont pas garantis et peuvent varier, à la hausse comme à la baisse.',
      noteId: 'difference-remuneration',
    },
    {
      title: 'Quand elle réalise une plus-value sur la vente d’un immeuble',
      description: nb(
        `Selon l’analyse de CORUM Asset Management, R Start vise à acquérir des immeubles décotés, à les valoriser, puis à les revendre. Sur chaque vente, la commission est de ${feeFacts.disposal.label} selon la plus-value réalisée.`
      ),
      risk: 'Une plus-value n’est jamais acquise d’avance. Une vente peut se solder par une moins-value et faire baisser la valeur de vos parts.',
    },
  ],
  counterweight: {
    title: 'Une rémunération conditionnée aux résultats',
    /**
     * Les deux phrases de l'équipe produit, descendues du hero par l'audit UX : elles ouvraient la page
     * avant même que le lecteur sache ce qu'est R Start, et repoussaient les CTA sous le bandeau cookies
     * sur mobile. Elles sont à leur place ici, où le sujet est justement le moment du prélèvement, et
     * partagent le contre-poids chiffré du bloc (`risk` ci-dessous), dans la même taille.
     */
    pedagogy: [
      nb('Payer des frais si notre travail vous fait gagner de l’argent : oui.'),
      nb('Payer avant même qu’on ait commencé à travailler : non.'),
    ],
    advantage: nb(
      'Aucune commission n’est prélevée à votre souscription, ni à l’achat des immeubles, ni sur les travaux. En d’autres termes : nous ne touchons rien tant que vous n’avez pas gagné d’argent.'
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
