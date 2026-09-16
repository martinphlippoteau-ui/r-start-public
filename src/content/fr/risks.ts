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

  /*
   * LES QUATRE PREMIERS RISQUES SONT REPRIS DE corum.fr (16/09/2026, demande de l'équipe). La source est
   * la page de CORUM XL, et non celle de CORUM USA que l'équipe avait d'abord transmise : XL est la
   * seule SCPI du groupe dont le profil correspond à celui de R Start, un patrimoine européen qui sort
   * de la zone euro, donc les quatre mêmes rubriques dont le risque de devise. La page de CORUM USA
   * parle d'« exposition majoritaire au marché américain » et du « cours du dollar », que R Start n'a
   * ni l'un ni l'autre : son DIC la situe dans les pays du Conseil de l'Europe et au Canada.
   *
   * CE QUI EST REPRIS : les intitulés et la construction des phrases, mot pour mot quand le sens le
   * permet. CE QUI EST ADAPTÉ : le nom de la SCPI, et la géographie, qui est celle du DIC de R Start.
   *
   * LES DEUX DERNIERS RISQUES NE VIENNENT PAS DE corum.fr et sont PROPRES À R START : l'effet de levier
   * et l'absence d'historique (souscriptions ouvertes le 20 mai 2026). Les SCPI de corum.fr sont
   * établies depuis des années, elles n'ont pas le second, et c'est précisément ce qui distingue
   * R Start d'elles. Ils sont donc gardés. À dire si l'équipe veut s'en tenir aux quatre de corum.fr.
   */
  items: [
    {
      title: 'Risque de perte en capital',
      description:
        'La valeur des parts de R Start évolue avec la valeur de son patrimoine dans le temps. Elle peut donc varier à la hausse comme à la baisse en fonction de l’évolution des marchés immobiliers et des devises.',
      noteId: 'risques-sources',
    },
    {
      title: 'Revenus non garantis',
      description:
        'Les revenus potentiels distribués par R Start ne sont pas garantis et peuvent varier à la hausse comme à la baisse en fonction des loyers encaissés ainsi que des charges afférentes aux immeubles et au fonctionnement de la SCPI.',
    },
    {
      title: 'Risque de liquidité',
      description: `Comme tout placement immobilier, la SCPI est un placement peu liquide. Aussi, nous attirons votre attention sur la revente de vos parts, qui n’est pas garantie et peut être plus ou moins rapide en fonction de l’évolution du marché immobilier. Avant ${fees.withdrawal.zeroAfterYears} ans de détention, une commission de retrait dégressive s’applique.`,
      noteId: 'risques-sortie',
    },
    {
      title: 'Risque de devise',
      description:
        'La variation du cours des devises implique un risque de perte en capital et des fluctuations potentielles dans les revenus distribués. R Start peut investir hors zone euro, notamment au Canada, et n’aura pas recours à une couverture systématique du risque de change.',
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
