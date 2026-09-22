import type { StatItem } from '@/content/types';
import type { TrustContent } from '@/content/types-v2';
import { corumGroup, product, trust as trustFacts } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';
import { nb } from '@/lib/texte';

/** Numéro d'agrément AMF, extrait de la mention légale (jamais recopié en dur). */
const amfApprovalNumber = managementCompany.amfApproval.match(/GP-\d+/)?.[0] ?? '';

/** Chiffre du groupe repris de facts.corumGroup.stats ; erreur explicite si le libellé y disparaît. */
const groupStat = (fragment: string) => {
  const found = corumGroup.stats.find((s) => s.label.includes(fragment));
  if (!found) throw new Error(`Chiffre absent de facts.corumGroup.stats : ${fragment}`);
  return found;
};

const savings = groupStat('épargne gérée');
const savers = groupStat('épargnants');

/**
 * Les chiffres du groupe (brochure partenaires 2026, p. 7), dans l'ordre de la trame : ancienneté,
 * épargne gérée, épargnants, SCPI gérées depuis 2012, bureaux. Le « + » devant les épargnants vient
 * de facts.corumGroup.stats (savers.prefix). Partenaires et collaborateurs ne sont pas repris :
 * hors trame. Rendus par 07-Trust.astro sur l'accueil et par CorumRange.astro sur /a-propos.
 */
export const experienceStats: StatItem[] = [
  {
    value: nb(corumGroup.experienceLabel),
    /** Libellé du document de l'équipe (14/09/2026), « objectifs tenus » compris : une allégation
        de performance, que le contrôle signale à chaque exécution sans la bloquer. */
    label: 'd’expertise et d’objectifs tenus',
  },
  {
    value: nb(savings.value),
    label: nb(savings.label),
  },
  {
    value: `${savers.prefix}${nb(savers.value)}`,
    label: nb(savers.label),
  },
  {
    value: String(corumGroup.scpiCount),
    label: `SCPI gérées depuis ${corumGroup.scpiSince}`,
  },
  /* Cinquième chiffre, ajouté le 14/09/2026 (document de l'équipe pour /a-propos), même source. */
  {
    value: String(corumGroup.offices),
    label: 'bureaux dans le monde',
  },
];

const tp = trustFacts.trustpilot;
/** Nom du distributeur en apostrophe typographique (titre du bloc Trustpilot). */
const company = nb(tp.company);

export const trust = {
  amf: {
    title: 'Le cadre réglementaire',
    items: [
      {
        label: 'Note d’information',
        value: `Visée par l’AMF, visa SCPI n° ${product.visa.number} du ${product.visa.date}`,
      },
      {
        label: 'Société de gestion',
        value: `${managementCompany.name}, agréée et réglementée par l’AMF depuis le ${corumGroup.amfSince}${amfApprovalNumber ? ` (n° ${amfApprovalNumber})` : ''}`,
      },
      {
        label: 'Dépositaire',
        value: trustFacts.amf.depositary,
      },
      {
        label: 'Autorité compétente',
        value: trustFacts.amf.supervisorNote,
      },
      {
        label: 'Classification SFDR',
        /** Citée avec sa portée réelle : aucune performance, aucun objectif durable attesté. */
        value: `${trustFacts.amf.sfdrLabel}. Cette classification n’atteste d’aucune performance ni d’aucun objectif d’investissement durable.`,
      },
    ],
    disclaimer: trustFacts.amf.disclaimer,
    /*
     * PASTILLE DU HERO, à côté des avis Trustpilot (15/09/2026, demande de l'équipe, en
     * connaissance de cause). Le TEXTE dit « société de gestion agréée », jamais « R Start
     * agréé » : R Start n'est pas agréé, il est VISÉ (visa SCPI n° 26-06 du 4 mars 2026),
     * formulation demandée par l'AMF dans ses retours sur la brochure (09/2026). Le logo de l'AMF
     * n'est pas concédé aux communications commerciales (fichier venu de Wikipédia France, usage
     * non libre) et, posé près d'une note Trustpilot, se lit comme une caution, ce que la mention
     * du pied de page dit ne pas être le cas : sur l'accueil l'écusson est dessiné (Picto.astro,
     * `institution`), le logo ne reste que sur /a-propos (CorumRange.astro). Le NUMÉRO D'AGRÉMENT
     * est retiré de la pastille (« supprime le code technique ») : le pied de page le donne sur
     * toutes les pages (legal.managementCompany.amfApproval), et c'est lui qui satisfait
     * check-compliance.mjs, qui exige « GP-11000012 » sur l'accueil.
     */
    heroBadge: {
      label: 'Société de gestion agréée par l’AMF',
      /** Ce que les lecteurs d'écran entendent à la place du logo (écusson de CorumRange, /a-propos). */
      logoAlt: 'Autorité des marchés financiers',
    },
  },

  trustpilot: {
    title: `Les avis sur ${company}`,
    linkLabel: 'Lire les avis sur Trustpilot',
    /** Nom accessible des deux TrustBox (le contenu arrive dans une iframe servie par Trustpilot). */
    widgetLabel: `Avis Trustpilot sur ${company}`,
    url: tp.url,
    externalLinkHint: 'nouvelle fenêtre',
  },

  stats: {
    /** Libellé du document de l'équipe (14/09/2026), ex-« Le groupe CORUM en chiffres ». */
    title: 'Le groupe CORUM en quelques chiffres',
    items: experienceStats,
  },
} satisfies TrustContent;
