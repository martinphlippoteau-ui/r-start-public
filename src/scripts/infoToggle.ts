/**
 * Dépliage des explications « i », partagé par les repères de l'accueil (sections/02-Highlights.astro)
 * et par les lignes du comparateur de frais (pages/frais/FeeComparator.astro).
 *
 * EXTRAIT LE 16/09/2026, quand le second s'en est servi à son tour. Les deux composants coexistent sur
 * l'accueil : deux copies du script s'y seraient liées aux mêmes boutons, et un clic aurait ouvert puis
 * refermé le panneau dans la foulée. Un module importé n'est mis dans le paquet qu'une fois.
 *
 * AMÉLIORATION PROGRESSIVE : le HTML arrive panneaux OUVERTS et boutons cachés, ce script inverse les
 * deux au chargement. Sans lui, on lit les explications et aucun bouton ne reste sans effet.
 *
 * L'ouverture est faite par la CSS (`grid-template-rows` de 0fr à 1fr, utilitaire `info-panneau` dans
 * global.css) : ici on ne touche qu'à un attribut et à `aria-expanded`. Rien n'est mesuré, rien n'est
 * animé en JavaScript, et `prefers-reduced-motion` est traité dans la feuille de style.
 *
 * LA BULLE (17/09/2026, définition « SCPI » du premier bloc de l'accueil) : un panneau marqué
 * `data-info-bulle` n'est pas un panneau sous le texte mais une bulle posée sous la phrase
 * (utilitaire `info-bulle`), qui s'ouvre au ressort et se referme aussi d'un clic ailleurs ou à Échap.
 * Ce script lui pose `data-bulle-liee` (sans quoi la CSS la laisse en paragraphe ordinaire, l'état sans
 * script) et, à chaque ouverture, la position de sa pointe : le milieu du bouton, rapporté au bord
 * gauche de la bulle. C'est la seule mesure du fichier, faite une fois par ouverture.
 */
const init = (): void => {
  for (const bouton of document.querySelectorAll<HTMLButtonElement>('[data-info-bouton]')) {
    /* Garde-fou : le script peut être exécuté deux fois sur une même page (navigation par vues). */
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
    const bulle = panneau.hasAttribute('data-info-bulle');
    if (bulle) panneau.setAttribute('data-bulle-liee', '');

    const fermer = (): void => {
      bouton.setAttribute('aria-expanded', 'false');
      panneau.setAttribute('data-ferme', '');
      if (bulle) {
        document.removeEventListener('click', surClicAilleurs, true);
        document.removeEventListener('keydown', surTouche);
      }
    };
    const surClicAilleurs = (e: MouseEvent): void => {
      const cible = e.target as Node | null;
      if (cible && (bouton.contains(cible) || panneau.contains(cible))) return;
      fermer();
    };
    const surTouche = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        fermer();
        bouton.focus();
      }
    };
    const ouvrir = (): void => {
      if (bulle) {
        /* La pointe sous le bouton : milieu du bouton, rapporté au bord gauche de la bulle, bornée pour
           rester dans les coins arrondis. Mesurée à l'ouverture, quand la mise en page est stable. */
        const rb = bouton.getBoundingClientRect();
        const rp = panneau.getBoundingClientRect();
        const largeur = rp.width || panneau.offsetWidth;
        const x = rb.left + rb.width / 2 - rp.left;
        panneau.style.setProperty('--pointe', `${Math.round(Math.min(Math.max(x, 22), largeur - 22))}px`);
        document.addEventListener('click', surClicAilleurs, true);
        document.addEventListener('keydown', surTouche);
      }
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

/* `export {}` : sans import ni export, TypeScript traite le fichier comme un script et non comme
   un module, et ses déclarations tombent dans l'espace global. Deux fichiers y déclaraient un
   `init`, d'où un conflit de noms que le build refusait. */
export {};
