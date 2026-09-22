/**
 * Dépliage des explications « i », partagé par les repères de l'accueil (02-Highlights.astro) et
 * les lignes du comparateur (FeeComparator.astro). Un seul module : deux copies liées aux mêmes
 * boutons ouvriraient puis refermeraient le panneau dans la foulée.
 * AMÉLIORATION PROGRESSIVE : le HTML arrive panneaux OUVERTS et boutons cachés, ce script inverse les
 * deux au chargement. Sans lui, on lit les explications et aucun bouton ne reste sans effet.
 * L'ouverture est faite par la CSS (utilitaire `info-panneau`, global.css) : ici on ne touche qu'à
 * un attribut et à `aria-expanded`, et `prefers-reduced-motion` est traité dans la feuille de
 * style.
 */
const init = (): void => {
  for (const bouton of document.querySelectorAll<HTMLButtonElement>('[data-info-bouton]')) {
    /* Garde-fou d'idempotence : un bouton n'est lié qu'une fois, même si `init` était rappelé (rien
       ne le rappelle : site multipage, un module ne s'exécute qu'une fois par document). */
    if (bouton.dataset.infoLie === '1') continue;
    const id = bouton.getAttribute('aria-controls');
    const panneau = id ? document.getElementById(id) : null;
    if (!panneau) continue;

    /* Replié à l'arrivée, et le bouton n'apparaît qu'ici : il ne sert à rien sans ce script.
       SANS TRANSITION : le panneau est écrit ouvert dans le HTML, il se refermait donc sous les yeux du
       visiteur à chaque chargement. La transition revient deux images plus tard, pour les clics. */
    panneau.setAttribute('data-sans-transition', '');
    panneau.setAttribute('data-ferme', '');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => panneau.removeAttribute('data-sans-transition'))
    );
    bouton.hidden = false;
    bouton.dataset.infoLie = '1';

    const fermer = (): void => {
      bouton.setAttribute('aria-expanded', 'false');
      panneau.setAttribute('data-ferme', '');
    };
    const ouvrir = (): void => {
      bouton.setAttribute('aria-expanded', 'true');
      panneau.removeAttribute('data-ferme');
    };

    bouton.addEventListener('click', () => {
      if (bouton.getAttribute('aria-expanded') === 'true') fermer();
      else ouvrir();
    });
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* `export {}` : sans import ni export, TypeScript traite le fichier comme un script et ses
   déclarations tombent dans l'espace global, où deux `init` entraient en conflit. */
export {};
