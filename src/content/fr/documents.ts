import type { DocumentItem, DocumentsContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { documents as documentFacts, externalLinks, product } from '@/content/fr/facts';
import { documentsNotice } from '@/content/fr/legal';
import { PENDING_DOCUMENT_KEYS } from '@/content/fr/documentation';
import manifest from '@/content/fr/media.manifest.json';

/**
 * Section « Documents » : les documents réglementaires de R Start (PDF servis depuis
 * public/documents), avec leur poids issu de media.manifest.json et le renvoi vers corum.fr.
 * Titres, descriptions, chemins et versions viennent de facts.documents ; la mention 2 vient de
 * legal.documentsNotice et se reproduit à l'identique.
 */

/**
 * Documents exclus de la publication : la même décision unique que les pages v2
 * (documentation.ts, PENDING_DOCUMENT_KEYS), pour que l'accueil, /documentation et /frais servent
 * toujours la même liste. « statuts » : le PDF fourni (public/documents/r-start-statuts.pdf,
 * 61 440 octets) est tronqué et illisible. « dic » : le fichier hébergé (V7, 20/05/2026) classe
 * R Start en 3 sur 7 quand le site affiche 4 sur 7 (décision client) — publié dès réception du DIC à
 * jour. Retirer une clé de PENDING_DOCUMENT_KEYS dès réception du fichier correspondant.
 */
const EXCLUDED_KEYS: readonly string[] = PENDING_DOCUMENT_KEYS;

/** Documents effectivement publiés, partagés avec le pied de page (footer.ts). */
export const publishedDocuments = documentFacts.filter((d) => !EXCLUDED_KEYS.includes(d.key));

/** Poids (ko) des PDF indexé par chemin public, depuis le manifeste des médias (`documents[].kb`). */
const kbByFile = new Map<string, number>(
  manifest.documents.map((d) => ['/' + d.file.replace(/^\/+/, ''), d.kb] as const)
);

export const notes: LegalNote[] = [
  {
    id: 'documents-versions',
    text:
      'Versions publiées sur ce site : ' +
      publishedDocuments.map((d) => `${d.title} : ${d.version}`).join(' ; ') +
      `. Le DIC est daté du ${product.dicDate.label}. En cas de mise à jour, les versions disponibles sur www.corum.fr prévalent.`,
  },
  {
    id: 'documents-corum',
    text: `La documentation légale obligatoire de R Start (statuts, note d’information, bulletins trimestriels d’information, rapports annuels) et les documents de souscription sont disponibles sur www.corum.fr. Source : DIC R Start du ${product.dicDate.label}.`,
  },
  {
    id: 'documents-poids',
    text: 'Le poids indiqué pour chaque fichier est exprimé en kilooctets (ko) et arrondi.',
  },
];

export const documents = {
  eyebrow: 'Documents',
  title: 'Les documents à lire avant de souscrire.',
  intro:
    'Ces documents décrivent R Start : son fonctionnement, ses frais, ses risques. Ce sont eux qui font foi. Prenez le temps de les lire avant toute décision.',
  items: publishedDocuments.map((d): DocumentItem => {
    const kb = kbByFile.get(d.file);
    return {
      key: d.key,
      title: d.title,
      description: d.description,
      file: d.file,
      version: d.version,
      ...(kb !== undefined ? { kb } : {}),
    };
  }),
  corumLink: { label: 'Retrouver ces documents sur corum.fr', href: externalLinks.corum },
  allDocumentsLink: { label: 'Toute la documentation', href: pages.documentation.path },
  fileTypeLabel: 'PDF',
  sizeUnit: 'ko',
  newTabHint: 'nouvelle fenêtre',
  listLabel: 'Documents réglementaires de R Start',
  mention: documentsNotice,
  notes,
} satisfies DocumentsContent;
