import { documents as documentFacts } from '@/content/fr/facts';
import { PENDING_DOCUMENT_KEYS } from '@/content/fr/documentation';

/**
 * Ce fichier portait la section « Documents » de l'accueil (09-Documents.astro) : les fiches des PDF
 * réglementaires, leur poids lu dans le manifeste des médias et deux notes.
 * SECTION ET CONTENU SUPPRIMÉS le 15/09/2026 : elle ne figurait plus dans HOME_ORDER, donc plus rendue
 * nulle part. Les documents vivent sur /documentation, avec leurs avertissements reproduits in extenso.
 *
 * Il ne reste que la liste ci-dessous, lue par le pied de page (footer.ts).
 */

/**
 * Documents exclus de la publication : la même décision unique que les pages v2
 * (documentation.ts, PENDING_DOCUMENT_KEYS), pour que /documentation, /frais et le pied de page
 * servent toujours la même liste. « statuts » : le PDF fourni (public/documents/r-start-statuts.pdf,
 * 61 440 octets) est tronqué et illisible. « dic » : le fichier hébergé (V7, 20/05/2026) classe
 * R Start en 3 sur 7 quand le site affiche 4 sur 7 (décision client), publié dès réception du DIC à
 * jour. Retirer une clé de PENDING_DOCUMENT_KEYS dès réception du fichier correspondant.
 */
const EXCLUDED_KEYS: readonly string[] = PENDING_DOCUMENT_KEYS;

/** Documents effectivement publiés, partagés avec le pied de page (footer.ts). */
export const publishedDocuments = documentFacts.filter((d) => !EXCLUDED_KEYS.includes(d.key));
