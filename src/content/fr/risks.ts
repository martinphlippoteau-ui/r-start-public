import type { LegalNote, RisksContent } from '@/content/types';
import { fees, product, risk } from '@/content/fr/facts';
import {
  arbitrageWarningBullets,
  arbitrageWarningTitle,
  bulletinWarning,
  dicWarning,
} from '@/content/fr/legal';

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');

/**
 * Section « Risques » (id : risques).
 * Contre-poids global de la page : même poids visuel que les sections avantages (fond ink, même
 * typographie). Six risques, avertissement du bulletin in extenso, avertissement du DIC et les trois
 * puces de la commission d'arbitrage reproduits à l'identique depuis legal.ts.
 */

/** Ordre de lecture des appels de note dans la section : sources (1er risque), sortie (liquidité), levier. */
export const notes: LegalNote[] = [
  {
    id: 'risques-sources',
    text: `Risques décrits d’après le document d’informations clés du ${product.dicDate.label} et le bulletin de souscription de mai 2026. L’ensemble des facteurs de risque figure dans la note d’information.`,
  },
  {
    id: 'risques-sortie',
    text: nb(
      'Modalités de sortie (retrait et cession de parts) et commission de retrait anticipé : voir la note d’information de R Start.'
    ),
  },
  {
    id: 'risques-levier',
    text: `Effet de levier : recours à l’endettement dans la limite de ${nb(risk.maxLeverage)} de la valeur d’expertise des actifs immobiliers. Cette limite est majorée des fonds collectés nets de frais non encore investis. Le montant maximum de l’emprunt est voté en assemblée générale. Source : document d’informations clés du ${product.dicDate.label}.`,
  },
];

/*
 * Type DÉCLARÉ et non `satisfies` depuis le 15/09/2026 : `intro` est devenue facultative et absente
 * de ce contenu. Avec `satisfies`, le type déduit est celui du littéral, et le composant qui lit
 * `risks.intro` ne compilait plus. L'annotation garde le contrôle du littéral et expose le champ.
 */
export const risks: RisksContent = {
  eyebrow: 'Risques',
  /** « R Start » en espace insécable : le nom de marque ne se coupe jamais dans le H2 (mobile 375 px). */
  title: 'Investir dans R Start comporte des risques.',
  /*
   * INTRODUCTION RETIRÉE LE 15/09/2026, demande de l'équipe. Elle disait :
   * « Ces risques ont le même poids que les avantages présentés sur cette page. Ils s'appliquent à tout
   * investissement dans R Start, quel que soit le montant. Prenez le temps de les lire avant de
   * souscrire. »
   * Aucun contrôle ne l'exigeait, ni check-compliance.mjs ni conformite.spec.ts : elle disait en mots ce
   * que la page fait déjà en structure, les six risques étant rendus au même poids typographique que les
   * avantages. Ce qui est contrôlé, c'est cette égalité-là, et elle ne bouge pas.
   * Pour la rétablir : remettre le champ `intro` ici, il reste facultatif dans le type.
   */

  items: [
    {
      title: 'Perte en capital',
      description:
        'Le capital investi n’est pas garanti. La valeur de vos parts suit celle des immeubles détenus et peut baisser. Vous pourriez perdre tout ou partie de votre investissement.',
      noteId: 'risques-sources',
    },
    {
      title: 'Revenus non garantis',
      description:
        'Les dividendes potentiels dépendent des loyers encaissés et des résultats de la SCPI. Ils varient à la hausse comme à la baisse, selon le marché immobilier et le cours des devises.',
    },
    {
      title: 'Liquidité limitée',
      description: `R Start ne garantit pas le rachat de vos parts : vous ne récupérez votre argent que si un autre épargnant les achète. Si personne ne se présente, votre argent reste investi. Avant ${fees.withdrawal.zeroAfterYears} ans de détention, une commission de retrait dégressive s’applique.`,
      noteId: 'risques-sortie',
    },
    {
      title: 'Risque de change',
      description:
        'R Start peut investir hors zone euro, notamment au Canada. La couverture du risque de devise n’est pas systématique. L’évolution des cours peut réduire la valeur de vos parts et vos revenus.',
    },
    {
      title: 'Effet de levier',
      description: `R Start peut emprunter jusqu’à ${nb(risk.maxLeverage)} de la valeur d’expertise de ses immeubles. L’endettement amplifie les variations de valeur, à la hausse comme à la baisse, et accroît le risque de perte.`,
      noteId: 'risques-levier',
    },
    {
      title: 'Absence d’historique',
      description: `R Start a ouvert ses souscriptions le ${product.openingDate.label}. Elle n’a pas encore d’historique propre. Les résultats passés des autres SCPI CORUM ne préjugent pas de ses résultats futurs.`,
    },
  ],

  warningsTitle: 'Les avertissements réglementaires',
  bulletinWarningTitle: 'Avertissement du bulletin de souscription',
  bulletinWarning,
  dicWarningTitle: 'Avertissement du document d’informations clés',
  dicWarning,
  arbitrageTitle: arbitrageWarningTitle,
  arbitrageBullets: [...arbitrageWarningBullets],

  notes,
};

export default risks;
