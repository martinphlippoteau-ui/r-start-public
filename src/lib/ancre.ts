/**
 * Ancre d'une question de la FAQ, pour la recherche du site : un résultat « Questions » mène à
 * /faq#<ancre>, et la question visée s'ouvre à l'arrivée. DÉRIVÉE DU LIBELLÉ, et non d'un
 * identifiant saisi à la main : aucune question ne peut en manquer, et 10-Faq.astro, les liens
 * rapides et l'index de recherche en tombent d'accord sans rien se transmettre. Contrepartie :
 * renommer une question change son ancre ; les liens rapides le détectent au build
 * (SiteSearch.astro), l'index est régénéré à chaque build. Accents retirés, apostrophes et espaces
 * en tirets : « Quel est le prix d’une part ? » donne « question-quel-est-le-prix-d-une-part ».
 * `slug` est le pliage seul, sans préfixe : les pages légales s'en servent pour leurs sections, les
 * ancres qu'on cite pour renvoyer à une mention légale précise. Le pliage est celui de tout le site
 * (src/lib/texte.ts) : « œ » y donne « oe ».
 */
import { plier } from '@/lib/texte';

export const slug = (texte: string): string =>
  plier(texte)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');

export const ancreQuestion = (question: string): string => 'question-' + slug(question);
