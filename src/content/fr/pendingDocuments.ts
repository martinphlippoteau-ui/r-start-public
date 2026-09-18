/**
 * DOCUMENTS EN ATTENTE DE PUBLICATION : la décision unique, lue à la fois par le site et par l'outillage.
 *
 * SANS AUCUN IMPORT, et c'est voulu : `scripts/prepare-images.mjs` le lit en Node natif, où l'alias
 * « @/ » n'existe pas. `src/content/fr/documentation.ts` le réexporte, ses consommateurs ne changent pas.
 *
 * POURQUOI CE FICHIER EXISTE (audit du 18/09/2026). La liste vivait dans documentation.ts et ne
 * retirait que les LIENS : prepare-images.mjs, qui ne pouvait pas la lire, copiait quand même les trois
 * PDF dans public/documents. Ils étaient versionnés, publiés, et répondaient 200 à leur adresse directe
 * (/documents/r-start-dic.pdf…), sans qu'aucune page ne les lie ni qu'aucun contrôle ne les voie. Un
 * document « exclu de la publication » doit être ABSENT du site, pas seulement sans lien.
 *
 * Désormais : une clé listée ici n'est ni liée (documentation.ts, documents.ts), ni copiée
 * (prepare-images.mjs, qui efface aussi une copie restée là), et scripts/check-compliance.mjs refuse
 * tout fichier de dist/documents qu'aucune page ne lie.
 *
 * Les raisons de chaque mise en attente sont écrites dans documentation.ts, au-dessus du réexport.
 * Clés : celles de `documents` et `forms` dans src/content/fr/facts.ts.
 */
export const PENDING_DOCUMENT_KEYS: readonly string[] = ['statuts', 'dic', 'simulation'];
