import type { LegalNote } from '@/content/types';

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
/*
 * REGISTRE VIDE depuis le 14/09/2026 (demande de l'équipe) : l'accueil ne porte plus d'appels de note
 * en exposant, ni de section « Notes et sources » en bas de page. `noteNumber` renvoie donc `null`
 * pour tout identifiant, et NoteRef ne rend rien : aucun exposant orphelin, aucune ancre morte.
 *
 * CE QUI EST PERDU, pour que ce soit dit : les sources des valeurs affichées sur l'accueil ne sont plus
 * atteignables depuis l'accueil. Le prix de la part, le niveau de risque, la zone d'investissement, le
 * délai de jouissance, la fréquence des dividendes avaient chacun leur note, qui citait le document et
 * sa page. Les notes elles-mêmes n'ont pas disparu du dépôt : chaque fichier de contenu les exporte
 * toujours, et les sous-pages les rendent (/frais, /strategie, /a-propos, /presse, /documentation,
 * /salle-de-presse), chacune passant sa propre liste à LegalNotes.
 *
 * Pour les rétablir sur l'accueil : remettre les imports et les listes ci-dessous, et le
 * `<LegalNotes />` dans src/pages/index.astro.
 *   hero · difference · highlights · corum (homeNotes) · subscribe (homeNotes) · risks · faq (homeNotes)
 */
export const allNotes: LegalNote[] = [];

export const noteNumber = (id: string): number | null => {
  const index = allNotes.findIndex((n) => n.id === id);
  return index === -1 ? null : index + 1;
};
