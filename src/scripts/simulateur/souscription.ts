/**
 * SIMULATEUR : L'ADRESSE DE « COMMENCER MA SOUSCRIPTION » (20/09/2026, demande de Martin). Le bouton de
 * l'écran de résultat mène au tunnel de souscription avec les choix du visiteur en paramètres, pour que
 * sa première étape arrive préremplie. Fonction pure : ./page.ts l'appelle à chaque résultat,
 * tests/simulateur-moteur.spec.ts l'éprouve.
 *
 * CE QUI PART, ET CE QUI NE PART PAS. Le montant de départ, le versement programmé s'il y en a un, la
 * part des revenus réinvestie s'il y en a une, et l'origine (« simulateur »). NI LE TAUX NI LA DURÉE :
 * ce sont des hypothèses de simulation, pas des données de souscription, et un taux choisi pour
 * « voir » n'a rien à faire dans un dossier.
 * Rien ne part sans le clic : tant qu'il n'a pas lieu, les montants ne quittent pas le navigateur
 * (politique de confidentialité, src/content/fr/pages.ts).
 *
 * LES NOMS DES PARAMÈTRES SONT UN CONTRAT AVEC LE TUNNEL : ils viennent de src/content/fr/simulator.ts
 * (`next.params`), à un seul endroit, et le tunnel doit lire les mêmes. Les paramètres déjà présents
 * sur l'adresse (campagne, position du bouton) et son ancre sont conservés ; src/scripts/campagne.ts
 * ajoute les siens au moment du clic, sans toucher à ceux-ci.
 */
export interface NomsParametres {
  initial: string;
  monthly: string;
  reinvest: string;
  origin: string;
}

export interface ChoixSouscription {
  initial: number;
  monthly: number;
  /** De 0 (revenus perçus) à 1 (tout est réinvesti). */
  reinvestShare: number;
}

export const adresseDeSouscription = (
  base: string,
  choix: ChoixSouscription,
  noms: NomsParametres,
  origine: string
): string => {
  const url = new URL(base);
  const poser = (nom: string, valeur: number): void => {
    if (valeur > 0) url.searchParams.set(nom, String(Math.round(valeur)));
    else url.searchParams.delete(nom);
  };
  poser(noms.initial, choix.initial);
  poser(noms.monthly, choix.monthly);
  poser(noms.reinvest, Math.min(1, Math.max(0, choix.reinvestShare)) * 100);
  url.searchParams.set(noms.origin, origine);
  return url.toString();
};
