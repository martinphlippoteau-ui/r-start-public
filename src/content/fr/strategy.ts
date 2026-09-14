import type { StrategyContent } from '@/content/types';

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
 * LE TEXTE N'EST PAS CONTREBALANCÉ, sur demande expresse de l'équipe (« ne prends pas en compte les
 * gardes fous »), ET L'EN-TÊTE N'A PLUS DE LIGNE RISQUES depuis le 14/09/2026 (« ne crée pas de bon à
 * savoir »). /strategie ne porte donc AUCUNE mention de risque en propre : seul le pied de page, commun
 * à tout le site, en porte encore. Aucun [data-advantage] n'est posé ici, faute de quoi le garde-fou
 * qui exige un contre-poids dans le même bloc réclamerait un texte que la page ne doit plus contenir.
 * check-compliance.mjs n'exige plus la ligne risques sur les sous-pages, la règle y est commentée.
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
  },
};
