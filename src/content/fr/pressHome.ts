import type { LegalNote } from '@/content/types';
import type { PressQuote } from '@/content/types-v2';
import { pages } from '@/config/pages';
import { press as pressFacts } from '@/content/fr/facts';

/**
 * Bloc « La presse en parle » de la page d'accueil (plan V2, §5) : deux citations et un renvoi vers
 * la page /presse, qui porte la revue complète.
 *
 * Règles appliquées, identiques à celles de la page :
 *  - les citations sont des propos de tiers, reproduits mot pour mot depuis facts.ts, avec leur média
 *    et leur date ; elles n'engagent que leurs auteurs ;
 *  - seuls des médias d'information sont cités sur l'accueil : les plateformes de distribution de SCPI
 *    (DISTRIBUTION_PLATFORMS) en sont écartées, l'intro dit « plusieurs médias » sans les qualifier ;
 *  - aucun logo de média (aucune licence) : les noms sont en typographie ;
 *  - aucune donnée de performance, aucun chiffre repris des articles ;
 *  - l'avertissement de CORUM est reproduit dans le bloc, en texte normal, jamais animé : c'est le
 *    contre-poids des citations, il ne part pas en note de bas de page.
 * Ce fichier a ses propres notes (identifiants distincts de press.ts) : l'accueil et /presse
 * numérotent leurs notes séparément.
 */

/** Espace insécable avant % € : ; ? ! ; apostrophe typographique. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
const typo = (s: string): string => nb(s.replace(/'/g, '’'));

/**
 * Sources qui ne sont pas des médias d'information : plateformes de distribution de SCPI (facts.ts,
 * `coverageArchive`, qualifie MeilleureSCPI.com d'« avis de plateforme de distribution »). Leur citation
 * sur l'accueil, à côté de deux titres de presse, s'apparenterait à une recommandation d'intermédiaire :
 * elles restent sur /presse, dans la revue complète, avec leur avertissement.
 */
const DISTRIBUTION_PLATFORMS: readonly string[] = ['MeilleureSCPI.com'];

/** Les deux premières citations de médias de facts.ts : la revue complète vit sur /presse. */
const quotes: PressQuote[] = pressFacts.quotes
  .filter((q) => !DISTRIBUTION_PLATFORMS.includes(q.media))
  .slice(0, 2)
  .map((q) => ({
    text: typo(q.text),
    media: q.media,
    date: q.date.label,
    dateIso: q.date.iso,
  }));
if (quotes.length !== 2) {
  throw new Error(
    `pressHome.ts : ${quotes.length} citation(s) de médias trouvée(s), deux attendues`
  );
}

/** « mai 2026 » ou « mai et juillet 2026 » : mois de publication des citations retenues, dérivés de leurs dates ISO. */
const quoteMonths = [...new Set(quotes.map((q) => q.dateIso.slice(0, 7)))].sort().map((ym) => {
  const [year, month] = ym.split('-');
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
  });
  return { name, year };
});
const quotePeriod =
  quoteMonths.length === 1
    ? `${quoteMonths[0].name} ${quoteMonths[0].year}`
    : `${quoteMonths.map((m) => m.name).join(' et ')} ${quoteMonths[quoteMonths.length - 1].year}`;

export const notes: LegalNote[] = [
  {
    id: 'presse-accueil-citations',
    text: nb(
      `Citations extraites d’articles publiés par des médias tiers en ${quotePeriod}, reproduites mot pour mot avec leur média et leur date, telles que transmises par CORUM L’Épargne le 10 septembre 2026. Elles n’engagent que leurs auteurs et ne constituent ni une recommandation, ni un avis de CORUM Asset Management sur R Start. La revue de presse complète, ${pressFacts.coverage.length} articles, est publiée sur la page « La presse en parle ».`
    ),
  },
];

export const pressHome = {
  eyebrow: 'La presse en parle',
  title: 'Ce qu’en dit la presse.',
  intro:
    'À son lancement en mai 2026, R Start a été commentée par plusieurs médias. Voici deux extraits, repris tels qu’ils ont été publiés.',
  quotes,
  /** Contre-poids des citations, dans le même bloc et la même taille. Jamais animé. */
  disclaimer: pressFacts.coverageDisclaimer,
  noteId: 'presse-accueil-citations',
  link: { label: 'Lire la revue de presse', href: pages.press.path },
  quotesListLabel: 'Citations de la presse sur R Start',
  notes,
};

export default pressHome;
