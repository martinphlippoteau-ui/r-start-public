import type { LegalNote } from '@/content/types';
import { notes as heroNotes } from '@/content/fr/hero';
import { notes as highlightsNotes } from '@/content/fr/highlights';
import { notes as differenceNotes } from '@/content/fr/difference';
import { homeNotes as corumNotes } from '@/content/fr/corum';
import { notes as feesNotes } from '@/content/fr/fees';
import { homeNotes as subscribeNotes } from '@/content/fr/subscribe';
import { notes as pressHomeNotes } from '@/content/fr/pressHome';
import { notes as risksNotes } from '@/content/fr/risks';
import { homeNotes as faqNotes } from '@/content/fr/faq';

/**
 * Registre des notes légales numérotées (façon Apple).
 * Concatène les `notes` exportées par chaque fichier de contenu, dans l'ordre d'affichage de l'accueil
 * (trame du 10/09/2026, src/pages/index.astro HOME_ORDER ; `order` dans src/config/sections.ts) : la
 * numérotation des appels reste croissante à la lecture. <NoteRef id="…" /> résout le numéro via noteNumber() ;
 * LegalNotes.astro rend la liste et pose les ancres `${sections.notes.id}-${n}`.
 * La Stratégie en chapitre court (04, `compact`) ne rend que les piliers, sans appel de note : ses notes ne
 * sont numérotées que sur /strategie (prop `pageNotes`), jamais ici. Souscrire en chapitre court (06,
 * `compact`, entre Stratégie et Presse) n'appelle que les notes de ses étapes (`homeNotes`).
 */
export const allNotes: LegalNote[] = [
  ...heroNotes,
  ...highlightsNotes,
  ...differenceNotes,
  ...corumNotes,
  ...feesNotes,
  ...subscribeNotes,
  ...pressHomeNotes,
  ...risksNotes,
  ...faqNotes,
  // Hors accueil : Revenus et Documents (10/09/2026) ; le cadre réglementaire, dix des seize questions de
  // la FAQ et le guide complet de souscription (11/09/2026) — d'où les registres partiels `homeNotes` de
  // corum.ts, faq.ts et subscribe.ts (06 en `compact` n'appelle que les notes de ses étapes).
];

export const noteNumber = (id: string): number | null => {
  const index = allNotes.findIndex((n) => n.id === id);
  return index === -1 ? null : index + 1;
};
