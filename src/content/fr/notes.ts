import type { LegalNote } from '@/content/types';

/**
 * Registre des notes de l'accueil. PLUS AUCUNE NOTE N'EST RENDUE SUR LE SITE depuis le 14/09/2026 :
 * LegalNotes.astro et NoteRef.astro, le composant d'appel de note, portent chacun un commutateur
 * `AFFICHER = false` (demande de l'équipe : « enlève les notes et les sources de tout le site sauf
 * du tableau de la page frais »). Les registres `notes` des onze fichiers de contenu qui en
 * exportent un restent intacts avec leurs sources et leurs dates, et celui-ci aussi : remettre
 * `AFFICHER` à `true` dans les deux composants les fait revenir, appels compris.
 * Ce fichier garde donc son rôle : il est la source de vérité de la NUMÉROTATION, et c'est lui qui
 * garantit que deux sections ne se disputent pas un numéro le jour du retour.
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
 * toujours. Aucune page ne les rend : /a-propos, /presse et /documentation montent encore
 * LegalNotes avec leur propre liste, mais le composant ne rend rien tant que `AFFICHER` vaut false
 * (la salle de presse, qui en passait une aussi, a été supprimée le 22/09/2026).
 *
 * Pour les rétablir sur l'accueil : remettre les imports et les listes ci-dessous, le
 * `<LegalNotes />` dans src/pages/index.astro, et `AFFICHER` à `true`.
 *   hero · difference · highlights · corum (homeNotes) · subscribe (homeNotes) · risks · faq (homeNotes)
 */
export const allNotes: LegalNote[] = [];

export const noteNumber = (id: string): number | null => {
  const index = allNotes.findIndex((n) => n.id === id);
  return index === -1 ? null : index + 1;
};
