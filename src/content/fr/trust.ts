import type { LegalNote, StatItem } from '@/content/types';
import type { TrustContent } from '@/content/types-v2';
import { sections } from '@/config/sections';
import { corumGroup, product, risk as riskFacts, trust as trustFacts } from '@/content/fr/facts';
import { managementCompany, visaNotice } from '@/content/fr/legal';

/**
 * Section « Confiance » (id : corum, sections.corum) — accueil, rappelée sur /frais et /documentation.
 * Trois blocs factuels, chacun daté et sourcé : le cadre réglementaire (visa de la note d'information,
 * agrément de la société de gestion, dépositaire, autorité compétente au sens du DIC, classification SFDR),
 * l'instantané Trustpilot sur le distributeur CORUM L'Épargne et les chiffres clés du groupe CORUM. Aucun logo AMF,
 * aucun visuel Trustpilot, aucune formulation de caution : le visa n'est pas une approbation du produit.
 * La mention visa (legal.visaNotice, bulletin p.4) est reproduite à l'identique dans la note « confiance-visa ».
 * La classification SFDR figure dans une carte du cadre réglementaire, avec sa portée réelle (elle n'atteste
 * d'aucune performance ni d'aucun objectif durable), et dans la note « confiance-agrement ».
 * Chaque bloc porte son contre-poids risque, de longueur comparable au bloc rendu (items et disclaimer
 * compris pour le cadre réglementaire) : champs `risk` (amf, stats) et fin du champ `scope` (trustpilot,
 * dont le type ne prévoit pas de champ `risk`).
 * Les chiffres du groupe suivent facts.corumGroup.stats sans exclusion locale : même liste que la section
 * CORUM de l'accueil (corum.ts). Tout arbitrage (ex. « partenaires professionnels » : 2 500 sur corum.fr
 * au 08/09/2026, 3 000 dans la brochure 2026) se fait dans facts.ts, jamais ici.
 * Notes : les quatre notes exportées ici (agrément, visa, Trustpilot, chiffres) sont agrégées par corum.ts
 * avec les siennes (mention légale de l'agrément, gamme, compensation) dans l'ordre de lecture de la section ;
 * notes.ts n'importe que corum.ts. La note « chiffres » n'existe qu'ici (corum.ts ne la double plus).
 */

/** Ancre HTML de la section (sous-navigation et rappels sur /frais et /documentation), dérivée de config/sections. */
export const trustSectionId = sections.corum.id;

/** Espace insécable (U+00A0, en échappement) avant % € : ; ? ! et devant « Md€ » : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1').replace(/ (Md€)/g, ' $1');
/** Espace insécable entre groupes de trois chiffres (ex. « 160 000 »). */
const nbDigits = (s: string): string => s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
/** Apostrophe typographique (’) : facts.ts écrit « CORUM L'Épargne » avec l'apostrophe droite. */
const typo = (s: string): string => s.replace(/'/g, '’');

/** Numéro d'agrément AMF, extrait de la mention légale (jamais recopié en dur). */
const amfApprovalNumber = managementCompany.amfApproval.match(/GP-\d+/)?.[0] ?? '';

/** Chiffres groupe (facts.corumGroup.stats, dans l'ordre et sans exclusion), espaces insécables appliquées, compteurs conservés. */
const groupStats: StatItem[] = corumGroup.stats.map((s) => ({
  value: nbDigits(nb(s.value)),
  numeric: s.numeric,
  suffix: nb(s.suffix),
  label: typo(s.label),
}));

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
      `Note de ${tp.scoreLabel} et ${tp.reviewsLabel} relevés sur ${tp.url} le ${tp.snapshotDate.label}, profil revendiqué par ${company}. Trustpilot est une plateforme d’avis indépendante de CORUM. Les avis portent sur les services du distributeur ${company}, non sur R Start. Ils évoluent en permanence : seule la page Trustpilot fait foi à la date de consultation. Ils ne constituent ni une recommandation ni une indication sur les résultats futurs de R Start.`
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
    url: tp.url,
    externalLinkHint: 'nouvelle fenêtre',
    /** Périmètre des avis puis contre-poids risque, affichés ensemble et à la même taille que la note. */
    scope: nb(
      `${tp.scope} Ils ne constituent pas une recommandation. Ils ne réduisent pas les risques de R Start : perte en capital, revenus non garantis, liquidité limitée.`
    ),
  },

  stats: {
    title: 'Le groupe CORUM en chiffres',
    items: groupStats,
    source: nb(corumGroup.statsSource),
    risk: `Ces chiffres sont ceux du groupe CORUM, pas ceux de R Start. R Start a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas d’historique propre. La taille du groupe ne préjuge ni de ses résultats, ni de la liquidité de ses parts.`,
  },

  notes,
} satisfies TrustContent;

export default trust;
