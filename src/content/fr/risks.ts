import type { RisksContent } from '@/content/types';
import { fees } from '@/content/fr/facts';
import {
  arbitrageWarningBullets,
  arbitrageWarningTitle,
  bulletinWarning,
  dicWarning,
} from '@/content/fr/legal';

/**
 * Section « Risques » (id : risques), contre-poids global de l'accueil : même poids visuel que les
 * sections avantages (fond ink, même typographie), et c'est cette égalité qui est contrôlée. Quatre
 * risques repris de corum.fr (voir `items`). L'avertissement du bulletin in extenso, celui du DIC
 * et les trois puces de la commission d'arbitrage, importés de legal.ts à l'identique, sont aussi
 * dans ce contenu : la section ne les rend pas, MandatoryWarnings.astro les lit sur /documentation.
 */

/*
 * Type DÉCLARÉ et non `satisfies` : `intro` est facultative et absente d'ici ; avec `satisfies`, le
 * type déduit est celui du littéral, et le composant qui lit `risks.intro` ne compilait plus.
 */
export const risks: RisksContent = {
  /** « R Start » en espace insécable : le nom de marque ne se coupe jamais dans le H2 (mobile 375 px). */
  title: 'Investir dans R Start comporte des risques.',
  /* Introduction retirée le 15/09/2026, demande de l'équipe : elle disait en mots ce que la page
     fait en structure. Le champ `intro` reste facultatif dans le type. */

  /*
   * Les quatre risques sont repris de corum.fr (16/09/2026, demande de l'équipe), de la page de
   * CORUM XL et non de CORUM USA d'abord transmise : XL est la seule SCPI du groupe au profil de R
   * Start, un patrimoine européen qui sort de la zone euro, donc les mêmes rubriques dont le risque
   * de devise. Intitulés et phrases repris mot pour mot quand le sens le permet ; le nom de la SCPI
   * et la géographie sont ceux du DIC de R Start.
   */
  items: [
    {
      title: 'Risque de perte en capital',
      description:
        'La valeur des parts de R Start évolue avec la valeur de son patrimoine dans le temps. Elle peut donc varier à la hausse comme à la baisse en fonction de l’évolution des marchés immobiliers et des devises.',
    },
    {
      title: 'Revenus non garantis',
      description:
        'Les revenus potentiels distribués par R Start ne sont pas garantis et peuvent varier à la hausse comme à la baisse en fonction des loyers encaissés ainsi que des charges afférentes aux immeubles et au fonctionnement de la SCPI.',
    },
    {
      title: 'Risque de liquidité',
      description: `Comme tout placement immobilier, la SCPI est un placement peu liquide. Aussi, nous attirons votre attention sur la revente de vos parts, qui n’est pas garantie et peut être plus ou moins rapide en fonction de l’évolution du marché immobilier. Avant ${fees.withdrawal.zeroAfterYears} ans de détention, une commission de retrait dégressive s’applique.`,
    },
    {
      title: 'Risque de devise',
      description:
        'La variation du cours des devises implique un risque de perte en capital et des fluctuations potentielles dans les revenus distribués. R Start peut investir hors zone euro, notamment au Canada, et n’aura pas recours à une couverture systématique du risque de change.',
    },
    /*
     * EFFET DE LEVIER ET ABSENCE D'HISTORIQUE, propres à R Start, RETIRÉS le 16/09/2026 à la
     * demande de l'équipe, qui s'en tient aux quatre de corum.fr. Le second était la SEULE
     * occurrence de « ne préjugent pas » sur l'accueil, où scripts/check-compliance.mjs signale une
     * allégation de performance passée (« objectifs tenus ») sans cette mention ; l'explication de
     * la carte « Horizon d'investissement » l'a portée jusqu'au 22/09/2026 (highlights.ts). Elle ne
     * subsiste que sur /a-propos, sous la gamme en chiffres.
     */
  ],

  warningsTitle: 'Les avertissements réglementaires',
  bulletinWarningTitle: 'Avertissement du bulletin de souscription',
  bulletinWarning,
  dicWarningTitle: 'Avertissement du document d’informations clés',
  dicWarning,
  arbitrageTitle: arbitrageWarningTitle,
  arbitrageBullets: [...arbitrageWarningBullets],
};
