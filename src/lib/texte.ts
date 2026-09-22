/**
 * PLIAGE D'UN TEXTE POUR LE COMPARER : sans accent, sans ligature, en minuscules. UNE SEULE VERSION
 * (audit du 18/09/2026), lue par la recherche du site (src/scripts/recherche/moteur.ts), le filtre de
 * /faq (src/scripts/faqSearch.ts), les ancres (src/lib/ancre.ts) et l'index de recherche
 * (scripts/search-index.mjs).
 *
 * Il en existait quatre, avec des règles différentes : « oeuvre » trouvait « œuvre » dans la recherche
 * du site et pas dans le filtre de /faq, et l'une d'elles portait la plage des diacritiques en
 * caractères combinants BRUTS dans le source, qu'une normalisation Unicode du fichier par un éditeur
 * aurait cassée sans qu'aucun diff lisible le montre. Ici, la plage est écrite en échappements.
 *
 * NFKD et non NFD : la décomposition de compatibilité ramène aussi « 1ᵉʳ » à « 1er », « m² » à « m2 »
 * et « ﬁ » à « fi ». « œ » et « æ » n'ont pas de décomposition, elles sont dépliées à la main.
 *
 * CE FICHIER N'IMPORTE RIEN et n'emploie aucune syntaxe à transformer : scripts/search-index.mjs le lit
 * par l'import natif des .ts de Node, sans passer par Vite.
 */
export const plier = (texte: string): string =>
  texte
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae');

/**
 * TYPOGRAPHIE FRANÇAISE, UNE SEULE VERSION (audit du 22/09/2026). Il en existait onze copies dans
 * src/content/fr, en quatre variantes qui ne faisaient pas toutes la même chose ; quatre écrivaient
 * l'espace insécable en caractère BRUT dans le source (voir `plier` ci-dessus pour ce que cela
 * coûte). Ici, en échappements.
 *
 * Ce que fait `nb` : apostrophe typographique ; espace insécable (U+00A0) avant % € : ; ? ! », après
 * «, devant « Md€ » et entre les groupes de trois chiffres (« 10 000 € »). Elle ne s'applique jamais
 * aux mentions de legal.ts reproduites à l'identique.
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
