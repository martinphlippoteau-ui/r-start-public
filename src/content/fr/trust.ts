import type { LegalNote, StatItem } from '@/content/types';
import type { TrustContent } from '@/content/types-v2';
import { corumGroup, product, risk as riskFacts, trust as trustFacts } from '@/content/fr/facts';
import { managementCompany, visaNotice } from '@/content/fr/legal';

/** Espace insécable (U+00A0, en échappement) avant % € : ; ? ! et devant « Md€ » : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1').replace(/ (Md€)/g, ' $1');
/** Espace insécable entre groupes de trois chiffres (ex. « 160 000 »). */
const nbDigits = (s: string): string => s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
/** Apostrophe typographique (’) : facts.ts écrit « CORUM L'Épargne » avec l'apostrophe droite. */
const typo = (s: string): string => s.replace(/'/g, '’');

/** Numéro d'agrément AMF, extrait de la mention légale (jamais recopié en dur). */
const amfApprovalNumber = managementCompany.amfApproval.match(/GP-\d+/)?.[0] ?? '';

/** Chiffre du groupe repris de facts.corumGroup.stats ; erreur explicite si le libellé y disparaît. */
const groupStat = (fragment: string): StatItem => {
  const found = corumGroup.stats.find((s) => s.label.includes(fragment));
  if (!found) throw new Error(`Chiffre absent de facts.corumGroup.stats : ${fragment}`);
  return found;
};

const savings = groupStat('épargne gérée');
const savers = groupStat('épargnants');

/**
 * Les quatre chiffres de la zone 4 (brochure partenaires 2026, p. 7), dans l'ordre de la trame :
 * ancienneté, épargne gérée, épargnants, SCPI gérées depuis 2012. Espaces insécables appliquées,
 * compteurs (numeric / prefix / suffix) conservés. Le « + » devant le nombre d'épargnants vient de
 * facts.corumGroup.stats (savers.prefix), sourcé de la brochure p. 7. Partenaires et collaborateurs
 * (facts.corumGroup.stats) ne sont pas repris : hors trame. Réutilisés par corum.ts (`stats`) ; rendus
 * ici, dans trust.stats, par 07-Trust.astro.
 */
export const experienceStats: StatItem[] = [
  {
    value: nb(corumGroup.experienceLabel),
    numeric: corumGroup.experienceYears,
    suffix: ' ans',
    /**
     * Libellé du document de l'équipe (14/09/2026), « objectifs tenus » compris. C'est une allégation
     * de performance : le contrôle de conformité ne la bloque plus mais la signale à chaque exécution,
     * pour l'arbitrage de la compliance.
     */
    label: 'd’expertise et d’objectifs tenus',
  },
  {
    value: nb(savings.value),
    numeric: savings.numeric,
    suffix: nb(savings.suffix ?? ''),
    label: typo(savings.label),
  },
  {
    value: `${savers.prefix}${nbDigits(savers.value)}`,
    numeric: savers.numeric,
    prefix: savers.prefix,
    label: typo(savers.label),
  },
  {
    value: String(corumGroup.scpiCount),
    numeric: corumGroup.scpiCount,
    label: `SCPI gérées depuis ${corumGroup.scpiSince}`,
  },
  /*
   * CINQUIÈME CHIFFRE ajouté le 14/09/2026, document de l'équipe pour /a-propos. Il vivait jusque-là
   * dans le texte de la gamme (« 5 SCPI, avec 7 bureaux »), pas dans la bande. Source inchangée :
   * brochure partenaires 2026, p. 7, comme les quatre autres.
   */
  {
    value: String(corumGroup.offices),
    numeric: corumGroup.offices,
    label: 'bureaux dans le monde',
  },
];

const tp = trustFacts.trustpilot;
/** Nom du distributeur en apostrophe typographique (titre et note Trustpilot). */
const company = typo(tp.company);

/** Notes de la section, dans l'ordre de lecture (cadre réglementaire, visa, avis, chiffres). */
export const notes: LegalNote[] = [
  {
    id: 'confiance-agrement',
    text: nb(
      `${trustFacts.amf.managementCompanyApproval} ${trustFacts.amf.supervisorNote} ${trustFacts.amf.depositarySentence} R Start relève de l’${lowerFirst(trustFacts.amf.sfdrLabel)}, règlement (UE) 2019/2088. Ce texte encadre la publication d’informations en matière de durabilité. Cette classification n’atteste d’aucune performance ni d’aucun objectif d’investissement durable. Sources : bulletin de souscription, mai 2026 ; document d’informations clés du ${product.dicDate.label}.`
    ),
  },
  {
    id: 'confiance-visa',
    /** legal.visaNotice en tête, à l'identique (`nb` n'y modifie aucun caractère), puis la réserve standard de facts.ts. */
    text: nb(
      `${visaNotice} ${trustFacts.amf.disclaimer} La note d’information est disponible sur www.corum.fr et sur la page Documentation. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`
    ),
  },
  {
    id: 'confiance-trustpilot',
    text: nb(
      `Note et avis affichés en direct par Trustpilot depuis le profil ${tp.url}, revendiqué par ${company}. Trustpilot est une plateforme d’avis indépendante de CORUM : elle publie et modère ces avis, et CORUM ne les modifie pas. Le carrousel affiché ici est paramétré pour ne présenter que les avis notés 4 et 5 étoiles : il ne reflète donc pas l’ensemble des avis publiés. La note globale et la totalité des avis, toutes notes confondues, sont consultables sur le profil Trustpilot. Les avis portent sur les services du distributeur ${company}, non sur R Start. Ils évoluent en permanence : seule la page Trustpilot fait foi à la date de consultation. Ils ne constituent ni une recommandation ni une indication sur les résultats futurs de R Start, et ne réduisent aucun de ses risques : perte en capital, revenus non garantis, liquidité limitée.`
    ),
  },
  {
    id: 'confiance-chiffres',
    text: nb(
      `${corumGroup.statsSource} Ils décrivent l’activité du groupe à la date de consultation et peuvent évoluer. R Start a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas d’historique propre : la taille du groupe ne préjuge ni de ses résultats, ni de la liquidité de ses parts.`
    ),
  },
];

export const trust = {
  eyebrow: 'Confiance',
  title: 'Un cadre réglementé, des chiffres sourcés.',
  intro: nb(
    'R Start s’inscrit dans un cadre réglementé. Visa, agrément, dépositaire, avis publics, chiffres du groupe : chaque élément a sa source et sa date. Aucun d’eux ne réduit les risques de l’investissement.'
  ),

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
        /** Mention légale de l'agrément in extenso (legal.managementCompany.amfApproval), note définie dans corum.ts. */
        noteId: 'corum-agrement',
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
     * PASTILLE DU HERO (15/09/2026), posée à côté des avis Trustpilot.
     *
     * LOGO AMF ET SUPPRESSION DU NUMÉRO : demande de l'équipe, réitérée après mise en garde. Ce qui
     * avait été signalé, et qui reste vrai, pour que la conformité l'ait sous les yeux :
     *  - le logo de l'AMF n'est pas concédé aux communications commerciales ; le fichier vient de
     *    Wikipédia France, où il est hébergé au titre d'un usage non libre, pas de Wikimedia Commons ;
     *  - posé près d'une note Trustpilot, un logo d'autorité se lit comme une caution, ce que la
     *    mention standard du pied de page dit explicitement ne pas être le cas.
     * Ce qui a été tenu malgré tout : le TEXTE. Il dit « société de gestion agréée », pas « R Start
     * agréé ». R Start n'est pas agréé, il est VISÉ (visa SCPI n° 26-06 du 4 mars 2026). La formulation
     * est celle que l'AMF a demandée dans ses retours sur la brochure (09/2026), mot pour mot.
     *
     * LE NUMÉRO D'AGRÉMENT EST RETIRÉ de la pastille (« supprime le code technique »). Il n'est pas
     * perdu : `amf.items` le porte toujours dans le bloc de confiance, avec sa note légale, et le
     * contrôle de conformité continue d'exiger « GP-11000012 » sur l'accueil (check-compliance.mjs).
     */
    heroBadge: {
      label: 'Société de gestion agréée par l’AMF',
      /** Ce que les lecteurs d'écran entendent à la place du logo. */
      logoAlt: 'Autorité des marchés financiers',
    },
    /** Contre-poids du bloc de réassurance : longueur comparable aux items et au disclaimer réunis, sans nouveau chiffre. */
    risk: nb(
      `Le visa et l’agrément n’écartent aucun risque. Le visa porte sur la note d’information, pas sur l’opportunité d’investir. Vous pouvez perdre tout ou partie du capital investi. Les revenus ne sont pas garantis, le rachat de vos parts non plus : la liquidité est limitée. R Start peut investir hors zone euro : sa valeur et ses revenus dépendent aussi du cours des devises. La durée de placement recommandée est de ${riskFacts.recommendedHoldingLabel}.`
    ),
  },

  trustpilot: {
    title: `Les avis sur ${company}`,
    scoreLabel: tp.scoreLabel,
    /** Compteur animé : valeur numérique et suffixe (« /5 ») dérivés de facts ; scoreLabel reste la valeur affichée. */
    score: tp.score,
    scoreSuffix: tp.scoreLabel.replace(/^[\d,.]+/, ''),
    reviewsLabel: nbDigits(tp.reviewsLabel),
    dateLabel: `au ${tp.snapshotDate.label}`,
    linkLabel: 'Lire les avis sur Trustpilot',
    /** Nom accessible des deux TrustBox (le contenu arrive dans une iframe servie par Trustpilot). */
    widgetLabel: `Avis Trustpilot sur ${company}`,
    /** Portée, visible sous le bandeau du hero : les avis ne parlent pas de R Start. */
    heroCaption: `Avis sur ${company}, distributeur de R Start.`,
    url: tp.url,
    externalLinkHint: 'nouvelle fenêtre',
    /** Périmètre des avis puis contre-poids risque, affichés ensemble et à la même taille que la note. */
    scope: nb(
      `${tp.scope} Ils ne constituent pas une recommandation. Ils ne réduisent pas les risques de R Start : perte en capital, revenus non garantis, liquidité limitée.`
    ),
  },

  stats: {
    /** Libellé du document de l'équipe (14/09/2026), ex-« Le groupe CORUM en chiffres ». */
    title: 'Le groupe CORUM en quelques chiffres',
    items: experienceStats,
    source: nb(corumGroup.statsSource),
    risk: `Ces chiffres sont ceux du groupe CORUM, pas ceux de R Start. R Start a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas d’historique propre. La taille du groupe ne préjuge ni de ses résultats, ni de la liquidité de ses parts.`,
  },

  notes,
} satisfies TrustContent;

export default trust;
