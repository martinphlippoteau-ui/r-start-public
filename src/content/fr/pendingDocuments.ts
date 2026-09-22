/**
 * DOCUMENTS EN ATTENTE DE PUBLICATION : la décision unique, lue par le site et par l'outillage.
 * SANS AUCUN IMPORT, et c'est voulu : scripts/prepare-images.mjs le lit en Node natif, où l'alias
 * « @/ » n'existe pas ; les pages le lisent par documentation.ts (`isDocumentPublished`).
 *
 * Une clé listée ici n'est ni liée (documentation.ts) ni copiée dans public/documents
 * (prepare-images.mjs, qui efface aussi une copie restée là), et scripts/check-compliance.mjs
 * refuse tout fichier de dist/documents qu'aucune page ne lie. Un document « exclu de la
 * publication » doit être ABSENT du site, pas seulement sans lien : tant que la liste ne retirait
 * que les liens (jusqu'au 18/09/2026), les PDF répondaient 200 à leur adresse directe.
 *
 * Les raisons de chaque mise en attente sont dans documentation.ts, au-dessus
 * d'`isDocumentPublished`. Clés : celles de `documents` et `documentsExtra` dans facts.ts.
 */
export const PENDING_DOCUMENT_KEYS: readonly string[] = ['statuts', 'dic', 'simulation'];
