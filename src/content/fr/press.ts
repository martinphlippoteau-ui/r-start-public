import type { LegalNote } from '@/content/types';
import type { PressArticle, PressContent, PressQuote } from '@/content/types-v2';
import { pages } from '@/config/pages';
import { fees, press as pressFacts } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Page /presse, « La presse en parle » (grand public, arbitrage du 10/09/2026).
 * Trois citations mises en avant, la revue des neuf articles avec leur média et leur date, puis
 * l'avertissement livré par CORUM. Les communiqués, les contacts et le kit média ont quitté cette page :
 * ils vivent sur /salle-de-presse (pressRoom.ts), en pied de page seulement.
 *
 * Règles appliquées :
 *  - les titres et les citations sont des propos de tiers, reproduits mot pour mot depuis facts.ts et
 *    couverts par `coverage.disclaimer` ; ils ne sont ni réécrits ni neutralisés (le filtre historique
 *    sur « sans frais » est retiré, plan §5). L'introduction de la revue rappelle, dans le même bloc,
 *    les frais réellement prélevés par R Start : R Start n'est pas une SCPI sans frais ;
 *  - un article dont l'adresse n'a pas été vérifiée s'affiche sans lien, avec son média et sa date ;
 *  - aucun logo de média (aucune licence) : les noms sont en typographie ;
 *  - aucune donnée de performance, aucun chiffre repris des articles : seuls les faits de facts.ts sont
 *    cités, et R Start n'a pas d'historique propre.
 */

/** Espace insécable (U+00A0) avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique pour les libellés écrits avec une apostrophe droite, puis `nb`. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));

/** Date à laquelle la sélection d'articles a été livrée par CORUM et les adresses vérifiées. */
const coverageCheckedOn = { label: '10 septembre 2026', iso: '2026-09-10' } as const;

/**
 * Revue de presse : la sélection de facts.ts, dans son ordre. Le titre est reproduit tel qu'il a été
 * publié ; `url` n'est transmise que si elle est renseignée, sinon l'article s'affiche sans lien.
 */
const articles: PressArticle[] = pressFacts.coverage.map((a) => ({
  media: a.media,
  title: typo(a.title),
  date: a.date.label,
  dateIso: a.date.iso,
  ...(a.url.trim() !== '' ? { url: a.url } : {}),
}));

/** Citations mises en avant : propos de tiers, avec leur média et leur date. */
const quotes: PressQuote[] = pressFacts.quotes.map((q) => ({
  text: typo(q.text),
  media: q.media,
  date: q.date.label,
  dateIso: q.date.iso,
}));

const linkedCount = articles.filter((a) => a.url).length;

const rawNotes: LegalNote[] = [
  {
    id: 'presse-citations',
    text: `Citations extraites d’articles publiés par des médias tiers, reproduites mot pour mot avec leur média et leur date, telles que transmises par CORUM L’Épargne le ${coverageCheckedOn.label}. Elles n’engagent que leurs auteurs et ne constituent ni une recommandation, ni un avis de CORUM Asset Management sur R Start.`,
  },
  {
    id: 'presse-revue',
    text: `Revue de presse : ${articles.length} articles de médias tiers publiés au lancement de R Start, sélection transmise par CORUM L’Épargne le ${coverageCheckedOn.label}. ${linkedCount} article${linkedCount > 1 ? 's renvoient' : ' renvoie'} vers sa publication d’origine ; pour les autres, l’adresse n’a pas été communiquée et seuls le média et la date sont indiqués. Les titres sont ceux des articles : ils peuvent employer des formulations, des comparaisons ou des chiffres absents des documents réglementaires de R Start. Seuls le document d’informations clés et la note d’information font foi. Aucune donnée de performance de R Start n’est communiquée : la SCPI a moins de douze mois d’existence.`,
  },
];

/** Notes de la page, typographiées (espace insécable avant : ; ? ! % €). */
export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

export const press = {
  seo: {
    /** ≤ 60 caractères. Contient « R Start » et « CORUM ». */
    title: 'La presse en parle : R Start, SCPI CORUM',
    /** 140 à 155 caractères, avec rappel de risque. */
    description:
      'Ce que la presse a écrit sur R Start, la SCPI du groupe CORUM, à son lancement. Placement à risque de perte en capital, revenus non garantis.',
  },

  hero: {
    eyebrow: 'La presse en parle',
    title: 'Ce qu’en dit la presse',
    intro:
      'Mai 2026. R Start débarque sur le marché. La presse économique et financière s’en empare. Voici ce qu’elle en dit.',
    riskLine: shortRiskLine,
  },

  quotes: {
    title: 'Ce qu’en a écrit la presse spécialisée',
    intro:
      'Ces citations sont des extraits d’articles de tiers. Elles n’engagent que leurs auteurs et ne portent sur aucun résultat de R Start.',
    items: quotes,
  },

  coverage: {
    title: 'La revue de presse',
    intro: nb(
      `Au lancement de R Start, ${articles.length} articles de la presse économique et financière, avec leur média et leur date. Les titres sont ceux des articles, reproduits tels quels. R Start n’est pas une SCPI sans frais : ${nb(fees.management.label)} de frais de gestion sur les loyers HT, commissions sur les cessions d’immeubles et commission de retrait avant ${fees.withdrawal.zeroAfterYears} ans s’appliquent.`
    ),
    items: articles,
    disclaimer: pressFacts.coverageDisclaimer,
  },

  /** Renvoi vers /salle-de-presse, absente du menu principal (arbitrage du 10/09/2026). */
  pressRoomLink: {
    title: 'Vous êtes journaliste ?',
    body: 'La salle de presse réunit les communiqués, les contacts presse, le kit média et le texte de présentation de CORUM L’Épargne.',
    label: 'Aller à la salle de presse',
    href: pages.pressRoom.path,
  },

  /** Micro-textes du composant (libellés d'accessibilité). */
  labels: {
    newTabHint: 'nouvelle fenêtre',
    coverageListLabel: 'Articles de presse sur R Start',
    quotesListLabel: 'Citations de la presse sur R Start',
  },

  notes,
} satisfies PressContent;

export default press;
