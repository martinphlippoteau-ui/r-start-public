import type { HighlightsContent, LegalNote } from '@/content/types';
import { fees, income, product, risk, share, strategy, subscription } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';

/**
 * Section 2 — Points forts (id « points-forts »).
 * Quatre cartes : 200 € la part · revenus potentiels chaque mois · Europe et Canada · 100 % en ligne.
 * Chaque carte porte son contre-poids risque (champ `risk`), de longueur comparable à `description`.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');
/** Apostrophe typographique (’) : certains libellés de facts.ts sont saisis avec l'apostrophe droite. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export const notes: LegalNote[] = [
  {
    id: 'points-forts-prix-de-part',
    text: `Prix de souscription de ${nb(share.priceLabel)} par part, dont ${share.nominal} € de valeur nominale et ${share.premium} € de prime d’émission. Les parts peuvent être fractionnées en ${share.fractions}. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`,
  },
  {
    id: 'points-forts-jouissance',
    text: `Date de jouissance des parts : « ${income.enjoymentDate} ». La fréquence de versement des dividendes potentiels est mensuelle. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`,
  },
  {
    id: 'points-forts-zone',
    text: typo(
      `Zone d’investissement selon le DIC du ${product.dicDate.label} : ${lower(strategy.zoneDetail)}. Les investissements portent sur tous types d’actifs immobiliers professionnels.`
    ),
  },
  {
    id: 'points-forts-en-ligne',
    text: `R Start se souscrit uniquement en ligne. Le démembrement, la souscription papier et CORUM Life ne sont pas proposés pour cette SCPI. Pièces à préparer : ${subscription.documentsRequired.map(lower).join(', ')}. Sources : brochure R Start 2026 et bulletin de souscription, mai 2026.`,
  },
];

export const highlights = {
  eyebrow: 'Points forts',
  title: `L’immobilier à partir de ${nb(share.minimumLabel)}.`,
  intro: `R Start est une société civile de placement immobilier à capital variable, gérée par ${managementCompany.name}. Quatre repères pour la comprendre, chacun avec sa contrepartie.`,
  cards: [
    {
      icon: 'argent',
      value: nb(share.priceLabel),
      label: 'la part',
      description: `Une part de R Start coûte ${nb(share.priceLabel)}. Le minimum de souscription est d’une seule part, réglée en ligne par virement ou par prélèvement SEPA.`,
      risk: `Placement de long terme, ${risk.recommendedHoldingLabel} recommandés. Le capital n’est pas garanti : vous pouvez perdre tout ou partie de la somme investie.`,
      noteId: 'points-forts-prix-de-part',
    },
    {
      icon: 'calendrier',
      value: 'Chaque mois',
      label: 'des revenus potentiels',
      description:
        'Les dividendes potentiels sont versés chaque mois. Vos parts y ouvrent droit le premier jour du sixième mois qui suit votre souscription et son règlement.',
      risk: 'Ces revenus ne sont pas garantis. Ils varient à la hausse comme à la baisse, selon l’évolution du marché immobilier et du cours des devises.',
      noteId: 'points-forts-jouissance',
    },
    {
      icon: 'exploration',
      value: 'Europe et Canada',
      label: 'zone d’investissement',
      description:
        'R Start peut investir dans les pays du Conseil de l’Europe, en zone euro ou non, et au Canada. Tous les secteurs de l’immobilier professionnel sont visés.',
      risk: 'Hors zone euro, la variation des devises peut réduire vos revenus et la valeur de vos parts. La couverture du risque de change n’est pas systématique.',
      noteId: 'points-forts-zone',
    },
    {
      icon: 'document-valide',
      value: nb(subscription.onlineLabel.replace(' en ligne', '')),
      label: 'en ligne',
      description:
        'La souscription se fait entièrement en ligne. Vous créez votre profil, signez en ligne, puis réglez par virement ou par prélèvement SEPA.',
      risk: `La sortie est moins simple que l’entrée. Le rachat de vos parts n’est pas garanti. Une commission de retrait s’applique avant ${fees.withdrawal.zeroAfterYears} ans de détention.`,
      noteId: 'points-forts-en-ligne',
    },
  ],
  notes,
} satisfies HighlightsContent;
