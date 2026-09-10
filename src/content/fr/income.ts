import type { IncomeContent, LegalNote } from '@/content/types';
import { income as incomeFacts, risk, fees } from '@/content/fr/facts';

/**
 * Section « Revenus » (id : revenus).
 * Distribution mensuelle des dividendes potentiels, entrée en jouissance, SRI et horizon de placement.
 * Aucune donnée de performance : R Start a moins de 12 mois d'historique. Chaque avantage embarque
 * son contre-poids (`risk`), affiché à côté et dans la même taille.
 */

const zeroAfter = fees.withdrawal.zeroAfterYears;

/** Ordre de lecture des appels de note dans la section : dividendes (« Chaque mois »), jouissance, SRI. */
export const notes: LegalNote[] = [
  {
    id: 'revenus-dividendes',
    text: 'Dividendes potentiels : revenus issus des loyers encaissés par la SCPI et distribués chaque mois. Leur montant dépend des résultats de R Start. Source : bulletin de souscription, mai 2026.',
  },
  {
    id: 'revenus-jouissance',
    text: `Date d’entrée en jouissance des parts : ${incomeFacts.enjoymentDate.toLowerCase()}. Source : conditions générales de vente du bulletin de souscription, mai 2026.`,
  },
  {
    id: 'revenus-sri',
    text: `Indicateur synthétique de risque (SRI) : échelle de 1 (risque le plus faible) à ${risk.sriMax} (risque le plus élevé). Il est calculé sur l’hypothèse d’une détention de ${risk.recommendedHoldingLabel}. Niveau communiqué par CORUM Asset Management ; le document d’informations clés fait foi.`,
  },
];

export const income = {
  eyebrow: 'Revenus',
  title: 'Des revenus potentiels chaque mois.',
  intro:
    'R Start distribue ses dividendes potentiels chaque mois, à partir des loyers encaissés. Ces revenus ne sont pas garantis. Ils varient à la hausse comme à la baisse, selon le marché immobilier et le cours des devises.',

  distribution: {
    value: 'Chaque mois',
    label: 'Fréquence de distribution',
    advantage:
      'Les dividendes potentiels sont versés chaque mois, dès que vos parts entrent en jouissance. Vous pouvez les percevoir sur votre compte ou les réinvestir automatiquement en parts.',
    risk: 'Ces dividendes potentiels ne sont pas garantis. Ils varient à la hausse comme à la baisse. Leur montant dépend des loyers encaissés, du marché immobilier et du cours des devises.',
  },

  enjoyment: {
    value: incomeFacts.enjoymentShort,
    label: 'Entrée en jouissance',
    advantage:
      'Vos parts entrent en jouissance le premier jour du sixième mois qui suit votre souscription et son règlement. Ce délai est prévu par la note d’information et rappelé dans le bulletin de souscription.',
    risk: 'Pendant ce délai, vos parts ne donnent droit à aucun dividende. Vous ne percevez donc aucun revenu pendant les premiers mois. Votre épargne est pourtant déjà versée, et exposée au risque de perte en capital.',
    /** Frise « mois 1 → mois 6 » : la 6e pastille (entrée en jouissance) est mise en avant. */
    timeline: {
      label: 'Calendrier de l’entrée en jouissance, du mois 1 au mois 6 après la souscription réglée',
      monthPrefix: 'Mois',
      count: 6,
      startCaption: 'Souscription réglée',
      endCaption: 'Premiers dividendes potentiels',
    },
  },

  sri: {
    value: risk.sri,
    max: risk.sriMax,
    label: 'Indicateur synthétique de risque',
    description: `R Start est classée ${risk.sriLabel}, une ${risk.sriClass}, sur l’hypothèse d’une détention de ${risk.recommendedHoldingLabel}. Cette classification tient compte du caractère récent de R Start et peut évoluer dans le temps. Elle n’intègre pas les risques de change et de liquidité, ni l’effet de levier éventuel. Vous pourriez perdre tout ou partie de votre investissement.`,
    ariaLabel: `Indicateur synthétique de risque : ${risk.sriLabel}, sur une échelle de 1 (risque le plus faible) à ${risk.sriMax} (risque le plus élevé).`,
    scaleLow: 'Risque le plus faible',
    scaleHigh: 'Risque le plus élevé',
  },

  horizon: {
    value: risk.recommendedHoldingLabel,
    label: 'Durée de placement recommandée',
    description: `R Start est un investissement immobilier de long terme. La durée de placement recommandée est de ${risk.recommendedHoldingLabel}. Avant ${zeroAfter} ans de détention, une commission de retrait dégressive s’applique. Le rachat de vos parts n’est pas garanti : il dépend de l’existence d’une contrepartie.`,
  },

  notes,
} satisfies IncomeContent;

export default income;
