/**
 * PLIAGE D'UN TEXTE POUR LE COMPARER : sans accent, sans ligature, en minuscules. UNE SEULE VERSION
 * (audit du 18/09/2026 : il en existait quatre, aux règles différentes, et l'une portait la plage
 * des diacritiques en caractères combinants BRUTS, qu'une normalisation Unicode du fichier par un
 * éditeur aurait cassée sans diff lisible ; ici, en échappements), lue par la recherche du site
 * (src/scripts/recherche/moteur.ts), le filtre de /faq (src/scripts/faqSearch.ts), les ancres
 * (src/lib/ancre.ts) et l'index de recherche (scripts/search-index.mjs). NFKD et non NFD : la
 * décomposition de compatibilité ramène aussi « 1ᵉʳ » à « 1er », « m² » à « m2 » et « ﬁ » à
 * « fi » ; « œ » et « æ » n'ont pas de décomposition, elles sont dépliées à la main. CE FICHIER
 * N'IMPORTE RIEN et n'emploie aucune syntaxe à transformer : scripts/search-index.mjs le lit par
 * l'import natif des .ts de Node, sans passer par Vite.
 */
export const plier = (texte: string): string =>
  texte
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae');

/**
 * TYPOGRAPHIE FRANÇAISE, UNE SEULE VERSION (audit du 22/09/2026 : onze copies dans src/content/fr,
 * en quatre variantes, dont quatre écrivaient l'espace insécable en caractère BRUT dans le source ;
 * ici, en échappements). `nb` pose l'apostrophe typographique, l'espace insécable (U+00A0) avant %
 * € : ; ? ! », après «, devant « Md€ » et entre les groupes de trois chiffres (« 10 000 € »). Elle
 * ne s'applique jamais aux mentions de legal.ts reproduites à l'identique.
 */
export const nb = (texte: string): string =>
  texte
    .replace(/'/g, '\u2019')
    .replace(/ ([%\u20ac:;?!\u00bb])/g, '\u00a0$1')
    .replace(/ (Md\u20ac)/g, '\u00a0$1')
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0')
    .replace(/\u00ab /g, '\u00ab\u00a0');

/** Minuscule sur la seule initiale : `toLowerCase()` abîmerait un sigle (« SCPI ») plus loin. */
export const lowerFirst = (texte: string): string => texte.charAt(0).toLowerCase() + texte.slice(1);
