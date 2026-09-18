/**
 * Ancre d'une question de la FAQ (17/09/2026), pour la recherche du site : un résultat « Questions »
 * mène à /faq#<ancre>, et la question visée s'ouvre à l'arrivée.
 *
 * DÉRIVÉE DU LIBELLÉ, et non d'un identifiant saisi à la main : aucune question ne peut en manquer, et
 * 10-Faq.astro, les liens rapides de la recherche et l'index en tombent tous d'accord sans rien se
 * transmettre. Contrepartie : renommer une question change son ancre. Les liens rapides le détectent au
 * build (src/components/SiteSearch.astro), l'index est régénéré à chaque build.
 *
 * Accents retirés, apostrophes et espaces en tirets : « Quel est le prix d’une part ? » donne
 * « question-quel-est-le-prix-d-une-part ».
 *
 * `slug` est le pliage seul, sans préfixe : les pages légales s'en servent pour leurs sections depuis le
 * 18/09/2026. Elles pliaient de leur côté, SANS retirer les accents, qui devenaient des séparateurs :
 * « s--diteur-du-site », « s-r-clamations », « s-h-bergement ». Ce sont les ancres qu'on cite pour
 * renvoyer à une mention légale précise.
 */
export const slug = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');

export const ancreQuestion = (question: string): string => 'question-' + slug(question);
