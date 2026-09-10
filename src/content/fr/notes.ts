import type { LegalNote } from '@/content/types';
import { notes as heroNotes } from '@/content/fr/hero';
import { notes as differenceNotes } from '@/content/fr/difference';
import { notes as highlightsNotes } from '@/content/fr/highlights';
import { notes as feesNotes } from '@/content/fr/fees';
import { notes as strategyNotes } from '@/content/fr/strategy';
import { notes as incomeNotes } from '@/content/fr/income';
import { notes as subscribeNotes } from '@/content/fr/subscribe';
import { notes as corumNotes } from '@/content/fr/corum';
import { notes as risksNotes } from '@/content/fr/risks';
import { notes as documentsNotes } from '@/content/fr/documents';
import { notes as faqNotes } from '@/content/fr/faq';

/**
 * Registre des notes légales numérotées (façon Apple).
 * Concatène les `notes` exportées par chaque fichier de contenu, dans l'ordre des sections
 * (src/config/sections.ts). <NoteRef id="…" /> résout le numéro via noteNumber() ;
 * LegalNotes.astro rend la liste et pose les ancres `${sections.notes.id}-${n}`.
 */
export const allNotes: LegalNote[] = [
  ...heroNotes,
  ...differenceNotes,
  ...highlightsNotes,
  ...feesNotes,
  ...strategyNotes,
  ...incomeNotes,
  ...subscribeNotes,
  ...corumNotes,
  ...risksNotes,
  ...documentsNotes,
  ...faqNotes,
];

export const noteNumber = (id: string): number | null => {
  const index = allNotes.findIndex((n) => n.id === id);
  return index === -1 ? null : index + 1;
};
