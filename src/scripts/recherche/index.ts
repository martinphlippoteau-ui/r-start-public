/**
 * RECHERCHE DU SITE : LE POINT D'ENTRÉE, importé par src/components/SiteSearch.astro, donc par toutes
 * les pages. Trois modules, trois métiers (audit du 18/09/2026 : ils tenaient en un fichier de neuf
 * cents lignes) :
 *  - ./moteur.ts   ce qu'une recherche trouve et dans quel ordre, en fonctions pures ;
 *  - ./panneau.ts  le panneau ouvert par la loupe : index, rendu, hauteur, clavier, mesure ;
 *  - ./arrivee.ts  l'arrivée sur le passage visé, sur la page où mène un résultat.
 */
import { arriver } from './arrivee';
import { init } from './panneau';

const demarrer = (): void => {
  init();
  arriver();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
else demarrer();
window.addEventListener('hashchange', arriver);
