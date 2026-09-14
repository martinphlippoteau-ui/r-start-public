import type { StrategyContent } from '@/content/types';
import { corumProductsDisclaimer } from '@/content/fr/legal';

/**
 * Page /strategie, « Stratégie d'investissement ». CONTENU FOURNI PAR L'ÉQUIPE le 14/09/2026 et repris
 * mot pour mot, « ni plus ni moins » : trois chapitres, les deux moteurs de performance, le « Quoi » et
 * le « Où ». L'en-tête de la page porte le titre (strategyPage.ts) ; ce fichier porte le corps.
 *
 * CE QUI A QUITTÉ LA PAGE, et ne vit plus nulle part sur le site : le mot d'ordre « Acheter décoté,
 * valoriser, revendre » et son contre-poids, les trois piliers avec les leurs, la carte des pays du
 * Conseil de l'Europe et du Canada (elle disait l'inverse de « partout dans le monde »), la liste des
 * types d'actifs du DIC, l'effet de levier et son plafond d'endettement, et les quatre notes de sources
 * (la page n'a donc plus de bloc « Notes » : il n'aurait rien à déplier). Les chiffres correspondants
 * restent dans facts.ts, d'où les autres pages les tirent.
 *
 * UNE SEULE MENTION DE RISQUE, celle que la Conformité a placée elle-même en fin de zone 2 le
 * 14/09/2026 (`disclaimer` ci-dessous, texte de legal.ts reproduit mot pour mot). L'en-tête n'en porte
 * plus, et le corps n'est pas contrebalancé avantage par avantage : c'est la suite du retrait de tous
 * les « Bon à savoir » du site, la Conformité replaçant les siennes une par une. Aucun [data-advantage]
 * n'est posé ici, faute de quoi le garde-fou qui exige un contre-poids dans le même bloc réclamerait un
 * texte que la page ne prévoit pas. La mention passe par ui/NoteConformite.astro, pas par RiskNote.
 */

export const strategy: StrategyContent = {
  engines: {
    title: 'R Start table sur deux moteurs de performance',
    intro: '',
    items: [
      { lead: 'Les loyers', rest: 'versés par les entreprises locataires' },
      { lead: 'Les plus-values', rest: 'réalisées sur les ventes d’immeuble' },
    ],
    outro:
      'Les opportunités ne tombent pas du ciel : nous suivons une méthode d’investissement précise pour dénicher les bons immeubles, loués par les bonnes entreprises, et générer du rendement potentiel.',
    /** Mention de la Conformité, en fin de zone 2. Reproduite à l'identique depuis legal.ts. */
    disclaimer: corumProductsDisclaimer,
  },

  what: {
    eyebrow: 'Quoi',
    title: 'Des immeubles offrant un double potentiel',
    intro: 'L’équipe cible des immeubles avec à la fois :',
    items: [
      { lead: 'Un fort potentiel de rendement locatif ;' },
      { lead: 'Et un fort potentiel de plus-value.' },
    ],
    outro:
      'Il s’agit principalement d’immeubles de taille intermédiaire, un secteur où la concurrence est relativement limitée.',
  },

  where: {
    eyebrow: 'Où',
    title: 'Une vaste zone d’investissement',
    intro: 'Pas de limite ! R Start investit :',
    items: [
      { lead: 'partout dans le monde' },
      {
        lead: 'et dans tous les secteurs',
        rest: '(bureaux, commerces, santé, logistique, hôtellerie…)',
      },
    ],
    outro: 'Seul mot d’ordre : identifier une opportunité.',
    /*
     * CARTE DU MONDE (14/09/2026, demande de l'équipe : « adapte la map au texte »). La carte d'origine
     * montrait le Conseil de l'Europe et le Canada, soit le périmètre du DIC du 20/05/2026, à côté d'un
     * « partout dans le monde » : elle disait moins que le texte. Elle a été régénérée en planisphère
     * (node scripts/make-map.mjs <countries.geo.json> monde), l'ancienne version reste disponible par
     * le mode `univers` du même script.
     * CE QUI RESTE À TRANCHER, et qui n'est pas une affaire de dessin : le DIC borne la zone aux pays du
     * Conseil de l'Europe et au Canada. Le site dit « Monde » depuis le 14/09/2026, décision de l'équipe
     * (facts.strategy.zoneLabel), et la carte le suit désormais. À faire valider par la Conformité.
     * La légende est rendue par la section, la carte elle-même est décorative (aria-hidden).
     */
    map: {
      legend:
        'Carte simplifiée, à titre d’illustration : elle ne représente aucun immeuble détenu par R Start.',
    },
  },

  /** 4. Comment (zone 5 du document de l'équipe, reçue le 14/09/2026 après les trois autres). */
  how: {
    eyebrow: 'Comment',
    title: 'Les bons immeubles, au bon prix',
    intro: 'La base de notre travail ?',
    items: [
      {
        lead: 'Repérer des immeubles moins chers que leur vraie valeur et les acheter aux meilleures conditions ;',
      },
      { lead: 'Travailler à leur donner plus de valeur au fil des années ;' },
      {
        lead: 'Choisir le bon moment pour vendre un immeuble afin d’en tirer la plus-value la plus intéressante possible.',
      },
    ],
    outro:
      'Bien acheter ne suffit pas. Ce qui crée de la valeur, c’est aussi de savoir bien gérer et bien vendre !',
  },
};
