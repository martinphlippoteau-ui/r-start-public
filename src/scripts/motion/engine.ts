/**
 * Moteur GSAP 3 + ScrollTrigger, chunk séparé, chargé par src/scripts/motion.ts via `import()` hors
 * `prefers-reduced-motion: reduce` (jamais téléchargé sinon). Vocabulaire et garde-fous : motion.ts.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupCounters } from './counter';
import { setupDraw, setupFill } from './draw';
import { setupReveals } from './reveal';
import { setupScenes } from './scene';
import { setupCurtains, setupParallax, setupPins, setupScrub } from './scroll';
import { setupRevealText } from './text';

let started = false;

export const start = (): void => {
  if (started) return;
  started = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // `html.motion` : la CSS n'active la superposition des scènes (`scene-stack`) que si le moteur tourne.
  document.documentElement.classList.add('motion');

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Les effets qui épinglent sont créés EN PREMIER : ScrollTrigger rafraîchit dans l'ordre de création
    // et doit connaître les pin-spacers avant de calculer les "start" des déclencheurs situés plus bas
    // dans la page. ScrollTrigger.sort() sécurise ensuite l'ordre.
    // Les effets qui ÉPINGLENT (scènes, rideaux, pins) sont réservés aux écrans larges (10/09/2026) :
    // sur mobile ils allongent le défilement (un pin ajoute sa durée à la hauteur de page) là où l'écran
    // est le plus petit, et l'accueil y atteignait 38 écrans. Sans eux, les [data-step] restent visibles
    // et statiques, c'est déjà le repli sans JavaScript, donc rien n'est masqué ni perdu.
    mm.add('(min-width: 64rem)', () => {
      setupScenes();
      setupCurtains();
      setupPins();
    });
    const restoreText = setupRevealText();
    setupReveals();
    const restoreCounters = setupCounters();
    setupDraw();
    setupFill();
    setupParallax();
    setupScrub();
    ScrollTrigger.sort();
    // Les tweens et ScrollTriggers créés ici sont annulés par gsap.matchMedia ; on rend en plus le DOM
    // (textes découpés, largeurs réservées) si la préférence change en cours de visite.
    return () => {
      restoreText();
      restoreCounters();
    };
  });

  // Positions recalculées quand les polices et la page sont chargées (déclencheurs exacts).
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};
