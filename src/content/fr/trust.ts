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
     * Cadre réglementaire de /a-propos (CorumRange.astro), une phrase (22/09/2026, texte de Martin ;
     * elle remplace les deux phrases du bulletin, visa puis agrément). Elle porte les DEUX faits sans
     * les confondre : R Start est VISÉE (visa SCPI n° 26-06 du 4 mars 2026), la société de gestion
     * est AGRÉÉE, formulation demandée par l'AMF dans ses retours sur la brochure (09/2026). Les
     * numéros et dates viennent de facts.ts et legal.ts. Plus aucun logo de l'AMF sur le site depuis
     * le même jour (« on n'a pas le droit de l'utiliser ») : c'est le logo R Start qui l'accompagne.
     * La mention « Société de gestion agréée par l'AMF » du hero est partie le même jour ; le numéro
     * d'agrément reste au pied de page (legal.managementCompany.amfApproval), et c'est lui qui
     * satisfait check-compliance.mjs.
     */
    aboutSentence: nb(
      `${product.name}, visa S.C.P.I. n° ${product.visa.number} en date du ${product.visa.date}, est gérée par ${managementCompany.name}, société de gestion de portefeuille, agréée et réglementée par l’AMF (Autorité des marchés financiers) le ${corumGroup.amfSince} sous le numéro ${amfApprovalNumber} et sous le régime de la directive AIFM 2011/61/UE.`
    ),
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
