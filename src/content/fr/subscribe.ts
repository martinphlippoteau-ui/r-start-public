import type { LegalNote, SubscribeContent } from '@/content/types';
import { fees, income as incomeFacts, risk, share, subscription } from '@/content/fr/facts';
import { withdrawalExemptions } from '@/content/fr/fees';

/**
 * Section « Souscrire » (id : souscrire).
 * Quatre étapes 100 % en ligne, options (versements programmés, réinvestissement des dividendes),
 * rappel des documents à lire et de la commission de retrait avant 8 ans. Le CTA renvoie vers le tunnel
 * de souscription (URL dans src/config/site.ts). Le minimum des versements programmés (50 € par mois,
 * adhésion PEI 04/2026) est affiché en badge sur l'option PEI, depuis facts.ts.
 * V2 (§3 ter, brochure partenaires 2026, p. 5) : l'intro porte le positionnement complémentaire de
 * R Start (stratégie patrimoniale plus dynamique, en contrepartie d'un risque plus élevé) et la note
 * `souscrire-non-eligible` porte le tableau d'éligibilité complet, modalités proposées comprises.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

const documentsList = subscription.documentsRequired.map(lowerFirst).join(', ');
const [w0, w1, w2, w3, w4] = fees.withdrawal.steps;
const zeroAfter = fees.withdrawal.zeroAfterYears;

export const notes: LegalNote[] = [
  {
    id: 'souscrire-reflexion',
    text: `${subscription.coolingOff}. Source : conditions générales de vente du bulletin de souscription, mai 2026.`,
  },
  {
    id: 'souscrire-reglement',
    text: `Moyens de règlement acceptés : ${subscription.paymentMethods.map(lowerFirst).join(' ou ')}. Source : bulletin de souscription, mai 2026.`,
  },
  {
    id: 'souscrire-non-eligible',
    text: nb(
      `Éligibilité de R Start : souscription ${subscription.onlineLabel}, ${subscription.options.rd.name} et ${subscription.options.pei.name} proposés. Modalités non proposées : ${subscription.notEligible.join(', ')}. Positionnement : R Start complète la gamme du groupe CORUM. Les premières SCPI du groupe visent des revenus potentiels réguliers ; R Start vise une stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé. Source : brochure partenaires 2026, p. 5.`
    ),
  },
];

export const subscribe = {
  eyebrow: 'Souscrire',
  /** « R Start » en espace insécable : le nom de marque ne se coupe jamais dans le H2 (mobile 375 px). */
  title: `Souscrire à R Start, ${nb(subscription.onlineLabel)}.`,
  intro: `La souscription se fait entièrement en ligne, en quatre étapes, à partir d’une part de ${nb(share.priceLabel)}. Aucune souscription papier n’est possible. R Start vise une stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé. Avant de vous engager, lisez le DIC et la note d’information. R Start comporte un risque de perte en capital.`,

  steps: [
    {
      title: 'Créer votre profil investisseur',
      description:
        'Vous renseignez votre identité, votre situation financière et vos objectifs. Ce questionnaire réglementaire permet de vérifier que R Start est adaptée à votre situation et à votre horizon de placement.',
    },
    {
      title: 'Signer en ligne',
      description:
        'Vous choisissez votre nombre de parts et, si vous le souhaitez, les versements programmés ou le réinvestissement des dividendes. Vous signez ensuite le bulletin de souscription par signature électronique.',
      noteId: 'souscrire-reflexion',
    },
    {
      title: 'Régler par virement ou prélèvement',
      description: `Vous réglez votre souscription par virement ou par prélèvement SEPA. Vos parts entrent en jouissance ${incomeFacts.enjoymentDate.toLowerCase()}. Aucun dividende n’est versé avant cette date.`,
      noteId: 'souscrire-reglement',
    },
    {
      title: 'Suivre votre épargne',
      description:
        'Vous suivez vos parts, vos dividendes potentiels et vos documents en ligne, sur le site de CORUM. Ces revenus ne sont pas garantis. Ils varient à la hausse comme à la baisse, selon les résultats de la SCPI.',
    },
  ],

  stepsLabel: 'Les quatre étapes de la souscription',
  stepPrefix: 'Étape',

  optionsTitle: 'Deux options facultatives',
  /** Chaque option = avantage (`description`) + contre-poids (`risk`), rendus en RiskPair, même taille. */
  options: [
    {
      title: subscription.options.pei.name,
      badge: `Dès ${nb(subscription.options.pei.minimumMonthlyLabel)}`,
      description:
        'Vous investissez régulièrement, à la fréquence de votre choix : mensuelle, trimestrielle, semestrielle ou annuelle. Chaque versement achète de nouvelles parts.',
      risk: 'Ces nouvelles parts sont exposées aux mêmes risques de perte en capital et de liquidité limitée. Les dividendes potentiels qu’elles produisent ne sont pas garantis.',
    },
    {
      title: subscription.options.rd.name,
      description:
        'Tout ou partie de vos dividendes potentiels est automatiquement réinvesti en parts de R Start.',
      risk: 'Vous ne percevez pas ces revenus et vous augmentez votre exposition à une SCPI dont le capital n’est pas garanti. Les parts ainsi acquises sont soumises aux mêmes risques de perte en capital et de liquidité limitée.',
    },
  ],

  beforeYouSubscribe: `Avant de souscrire, lisez le document d’informations clés (DIC) et la note d’information. Ils décrivent les caractéristiques, les risques et les frais de R Start. Préparez aussi : ${documentsList}.`,

  withdrawalReminder: `R Start est un placement de long terme : ${risk.recommendedHoldingLabel} recommandés. Si vous retirez vos parts avant ${zeroAfter} ans de détention, une commission de retrait dégressive s’applique. Elle est de ${nb(w0.rate)} avant 4 ans, ${nb(w1.rate)} la 5e et la 6e année, ${nb(w2.rate)} la 7e année, ${nb(w3.rate)} la 8e année, puis ${nb(w4.rate)}. ${withdrawalExemptions} Le rachat de vos parts n’est pas garanti : il dépend de l’existence d’une contrepartie à l’achat.`,

  cta: { label: 'Souscrire en ligne', position: 'souscrire' },

  notes,
} satisfies SubscribeContent;

export default subscribe;
