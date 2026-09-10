import type { CorumContent, LegalNote, StatItem } from '@/content/types';
import { corumGroup, product } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';
import { notes as trustNotes } from '@/content/fr/trust';

/**
 * Section « L'expérience derrière R Start » (id : corum), rendue avec trust.ts dans la section
 * « Confiance » (07-Trust.astro). Zone 4 de la page d'accueil, réunion produit du 10/09/2026.
 * Quatre chiffres repris de la brochure partenaires 2026, p. 7 : ancienneté, épargne gérée,
 * épargnants, SCPI gérées depuis 2012. La formule « objectifs tenus » de la brochure n'est pas
 * reprise (allégation de performance) : l'ancienneté est décrite comme une durée d'activité,
 * « 15 ans à investir en immobilier d'entreprise ». Le montant de plus-values redistribuées cité
 * dans la brochure reste hors du site tant que CORUM n'a pas répondu à l'AMF.
 * Chaque bloc porte son contre-poids risque, à la même taille : `intro` (l'expérience du groupe ne
 * préjuge de rien), `statsRisk` (chiffres du groupe, pas de R Start), `disclaimer` (les cessions
 * passées ne préjugent pas des performances futures) et `alignmentBody` (effets de seuil de la
 * commission d'arbitrage, énoncés dans le même paragraphe que l'alignement d'intérêts).
 * Les chiffres du groupe restent gouvernés par facts.corumGroup : aucun arbitrage ici.
 * Sur l'accueil, la bande de chiffres rendue est celle de trust.stats (même source) ; `stats` porte
 * les quatre chiffres de la zone 4.
 * Notes : `notes` agrège les notes de trust.ts (cadre réglementaire, visa, Trustpilot, chiffres) et
 * celles définies ici (mention légale de l'agrément, gamme, compensation) dans l'ordre de lecture de
 * 07-Trust.astro ; notes.ts n'importe que ce fichier.
 */

/** Espace insécable avant % € : ; ? ! et devant « Md€ » : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1').replace(/ (Md€)/g, ' $1');
/** Espace insécable entre groupes de trois chiffres (ex. « 160 000 »). */
const nbDigits = (s: string): string => s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
/** Apostrophe typographique (’) : facts.ts écrit certains libellés avec l'apostrophe droite. */
const typo = (s: string): string => s.replace(/'/g, '’');

/**
 * Passer à true une fois la date de référence des chiffres groupe confirmée par CORUM et reportée dans
 * facts.corumGroup.statsSource (ex. « Source : CORUM, données au 30 juin 2026. »).
 */
const STATS_DATED = true; // chiffres sourcés corum.fr, consulté le 08/09/2026 (facts.corumGroup.statsDate)

/** Chiffre du groupe repris de facts.corumGroup.stats ; erreur explicite si le libellé y disparaît. */
const groupStat = (fragment: string): StatItem => {
  const found = corumGroup.stats.find((s) => s.label.includes(fragment));
  if (!found) throw new Error(`Chiffre absent de facts.corumGroup.stats : ${fragment}`);
  return found;
};

const savings = groupStat('épargne gérée');
const savers = groupStat('épargnants');

/**
 * Les quatre chiffres de la zone 4 (brochure partenaires 2026, p. 7), espaces insécables appliquées.
 * Le « + » devant le nombre d'épargnants vient de facts.corumGroup.stats (savers.prefix), sourcé de la
 * brochure partenaires 2026, p. 7 : aucun arbitrage chiffré n'est pris hors de la source de vérité.
 */
const experienceStats: StatItem[] = [
  {
    value: nb(corumGroup.experienceLabel),
    numeric: corumGroup.experienceYears,
    suffix: ' ans',
    label: 'à investir en immobilier d’entreprise',
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
];

const others = corumGroup.scpiNames.slice(0, -1);
const otherScpi = `${others.slice(0, -1).join(', ')} et ${others[others.length - 1]}`;

/** Notes propres à ce fichier (mention légale de l'agrément, gamme, compensation). */
const corumNotes: LegalNote[] = [
  {
    id: 'corum-agrement',
    text: `${managementCompany.name} : ${managementCompany.amfApproval}`,
  },
  {
    id: 'corum-gamme',
    text: `Nombre de SCPI gérées, ancienneté du groupe et nombre de bureaux : source CORUM, brochure partenaires 2026, p. 7. ${otherScpi} sont des SCPI distinctes de R Start. Chacune a sa propre stratégie et ses propres frais. Leurs résultats ne préjugent pas de ceux de R Start.`,
  },
  {
    id: 'corum-compensation',
    text: 'Mécanisme de compensation des moins-values : lorsqu’une vente génère une moins-value, celle-ci est enregistrée dans une réserve dédiée. Aucune commission sur les cessions n’est perçue tant que cette réserve n’est pas intégralement compensée par des plus-values futures. Détail au chapitre III, section 4 de la note d’information de R Start.',
  },
];

/** Ordre de lecture des appels de note dans 07-Trust.astro ; une note non listée irait en fin. */
const readingOrder = [
  'confiance-agrement',
  'corum-agrement',
  'confiance-visa',
  'confiance-trustpilot',
  'confiance-chiffres',
  'corum-gamme',
  'corum-compensation',
];
const rank = (id: string): number => {
  const i = readingOrder.indexOf(id);
  return i === -1 ? readingOrder.length : i;
};

/** Toutes les notes de la section Confiance (trust.ts + corum.ts), numérotées dans l'ordre de lecture. */
export const notes: LegalNote[] = [...trustNotes, ...corumNotes].sort(
  (a, b) => rank(a.id) - rank(b.id)
);

export const corum = {
  eyebrow: 'CORUM',
  title: 'L’expérience derrière R Start',
  /** Phrase d'ouverture de la zone 4, suivie de son contre-poids dans le même bloc et à la même taille. */
  intro: nb(
    `R Start s’appuie sur ${corumGroup.experienceLabel} d’expertise du groupe CORUM dans l’investissement immobilier. Cette expérience ne préjuge pas des résultats de R Start. La SCPI a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas d’historique propre.`
  ),

  /** Bloc vide tant que STATS_DATED est false : le composant n'affiche alors ni chiffres ni source. */
  stats: STATS_DATED ? experienceStats : [],
  statsSource: STATS_DATED
    ? nb(
        `${corumGroup.statsSource} Ancienneté du groupe et nombre de SCPI gérées : brochure partenaires 2026, p. 7.`
      )
    : '',
  /** Contre-poids des quatre chiffres, rendu avec eux et à la même taille. */
  statsRisk: nb(
    `Ces chiffres décrivent le groupe CORUM, pas R Start. Ils peuvent évoluer. La taille du groupe ne préjuge ni des résultats de R Start, ni de la liquidité de ses parts. Le capital investi n’est pas garanti.`
  ),

  range: {
    title: `Des SCPI gérées depuis ${corumGroup.scpiSince}`,
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte aujourd’hui ${corumGroup.scpiCount}, avec ${corumGroup.offices} bureaux. ${product.name} est la plus récente. Elle a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas encore d’historique propre. Les résultats des autres SCPI CORUM ne préjugent pas des siens.`,
    scpiNames: [...corumGroup.scpiNames],
  },

  /** Titre du bloc facultatif de la section : `alignmentBody` en est le corps (brochure p. 4). */
  alignmentTitle: 'La rémunération de CORUM sur les ventes',
  /** Avantage et contrepartie dans le même paragraphe, à la même taille (exigence AMF). */
  alignmentBody: nb(
    `Sur les ventes d’immeubles, CORUM ne se rémunère que si le bilan global des cessions est positif. Cette commission d’arbitrage a des effets de seuil : elle peut capter une partie significative de la plus-value. CORUM peut aussi être rémunérée sur une plus-value alors même que la valeur de vos parts diminue.`
  ),

  disclaimer: corumGroup.disposalsDisclaimer,

  notes,
} satisfies CorumContent;

export default corum;
