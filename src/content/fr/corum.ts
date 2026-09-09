import type { CorumContent, LegalNote } from '@/content/types';
import { corumGroup, product } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';
import { notes as trustNotes } from '@/content/fr/trust';

/**
 * Section « CORUM » (id : corum), rendue avec trust.ts dans la section « Confiance » (07-Trust.astro).
 * Gamme de SCPI gérées depuis 2012, alignement d'intérêts sur les cessions (brochure p.4) immédiatement
 * contrebalancé par les effets de seuil de la commission d'arbitrage (DIC). Aucune performance, aucun
 * superlatif. Les chiffres du groupe (9,6 Md€, + 160 000 épargnants, 100 % indépendant) ne sont pas
 * publiés tant que facts.corumGroup.statsSource n'est pas daté par CORUM (README) : voir STATS_DATED.
 * Sur l'accueil, la section affiche les chiffres de trust.stats (même source) ; `stats` reste disponible
 * pour les rappels hors accueil.
 * Notes : `notes` agrège les notes de trust.ts (cadre réglementaire, visa, Trustpilot, chiffres) et celles
 * définies ici (mention légale de l'agrément, gamme, compensation) dans l'ordre de lecture de 07-Trust.astro ;
 * notes.ts n'importe que ce fichier. La source des chiffres du groupe n'apparaît que dans la note
 * « confiance-chiffres » (trust.ts) ; la note « corum-gamme » ne source que le nombre de SCPI et de bureaux.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

/**
 * Passer à true une fois la date de référence des chiffres groupe confirmée par CORUM et reportée dans
 * facts.corumGroup.statsSource (ex. « Source : CORUM, données au 30 juin 2026. »).
 */
const STATS_DATED = true; // chiffres sourcés corum.fr, consulté le 08/09/2026 (facts.corumGroup.statsDate)

/** Chiffres groupe (facts.corumGroup.stats), espaces insécables appliquées. */
const groupStats = corumGroup.stats
  .map((s) => ({ ...s, value: nb(s.value) }));

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
    text: `Nombre de SCPI gérées et de bureaux : source CORUM, brochure R Start 2026. ${otherScpi} sont des SCPI distinctes de R Start. Chacune a sa propre stratégie et ses propres frais.`,
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
export const notes: LegalNote[] = [...trustNotes, ...corumNotes].sort((a, b) => rank(a.id) - rank(b.id));

export const corum = {
  eyebrow: 'CORUM',
  title: `CORUM gère des SCPI depuis ${corumGroup.scpiSince}.`,
  intro: `R Start est gérée par ${managementCompany.name}, société de gestion agréée par l’AMF depuis le ${corumGroup.amfSince}. Sur les ventes d’immeubles, CORUM ne se rémunère que si le bilan global des cessions est positif. Cette commission d’arbitrage a des effets de seuil : elle peut capter une partie significative de la plus-value. CORUM peut aussi être rémunérée sur une plus-value alors même que la valeur de vos parts diminue.`,

  /** Bloc vide tant que STATS_DATED est false : le composant n'affiche alors ni chiffres ni source. */
  stats: STATS_DATED ? groupStats : [],
  statsSource: STATS_DATED ? nb(corumGroup.statsSource) : '',

  range: {
    title: `Des SCPI gérées depuis ${corumGroup.scpiSince}`,
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte aujourd’hui ${corumGroup.scpiCount}, avec ${corumGroup.offices} bureaux. ${product.name} est la plus récente. Elle a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas encore d’historique propre. Les résultats des autres SCPI CORUM ne préjugent pas des siens.`,
    scpiNames: [...corumGroup.scpiNames],
  },

  /** Titre du bloc facultatif de la section Confiance : `intro` en est le corps (rémunération sur les ventes, brochure p.4). */
  alignmentTitle: 'La rémunération de CORUM sur les ventes',

  disclaimer: corumGroup.disposalsDisclaimer,

  notes,
} satisfies CorumContent;

export default corum;
