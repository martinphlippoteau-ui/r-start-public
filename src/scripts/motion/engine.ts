/**
 * Moteur GSAP 3 + ScrollTrigger, chunk séparé, chargé par src/scripts/motion.ts via `import()` hors
 * `prefers-reduced-motion: reduce` (jamais téléchargé sinon). Vocabulaire et garde-fous : motion.ts.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupDraw } from './draw';
import { setupReveals } from './reveal';
import { setupCurtains, setupParallax, setupScrub } from './scroll';
import { setupRevealText } from './text';

let started = false;

export const start = (): void => {
  if (started) return;
  started = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Les rideaux, qui ÉPINGLENT, sont créés EN PREMIER : ScrollTrigger rafraîchit dans l'ordre de
    // création et doit connaître les pin-spacers avant de calculer les "start" des déclencheurs situés
    // plus bas dans la page. ScrollTrigger.sort() sécurise ensuite l'ordre.
    // Ils sont réservés aux écrans larges : sur mobile, un épinglage allonge le défilement (il
    // ajoute sa durée à la hauteur de page) là où l'écran est le plus petit.
    mm.add('(min-width: 64rem)', () => {
      setupCurtains();
    });
    const restoreText = setupRevealText();
    setupReveals();
    setupDraw();
    setupParallax();
    setupScrub();
    ScrollTrigger.sort();
    // Les tweens et ScrollTriggers créés ici sont annulés par gsap.matchMedia ; on rend en plus le DOM
    // (textes découpés) si la préférence change en cours de visite.
    return () => {
      restoreText();
    };
  });

  // Positions recalculées quand les polices et la page sont chargées (déclencheurs exacts).
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};
