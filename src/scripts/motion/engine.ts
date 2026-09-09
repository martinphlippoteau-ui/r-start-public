/**
 * Moteur GSAP 3 + ScrollTrigger — chunk séparé, chargé par src/scripts/motion.ts via `import()` hors
 * `prefers-reduced-motion: reduce` (jamais téléchargé sinon). Vocabulaire et garde-fous : motion.ts.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupBrandFlight } from './brandflight';
import { setupCounters } from './counter';
import { setupDraw, setupFill } from './draw';
import { setupProgress } from './progress';
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
    // Les effets qui épinglent (scènes, rideaux, pins) sont créés EN PREMIER : ScrollTrigger rafraîchit
    // dans l'ordre de création et doit connaître les pin-spacers avant de calculer les "start" des
    // déclencheurs situés plus bas dans la page. ScrollTrigger.sort() sécurise ensuite l'ordre.
    setupScenes();
    setupCurtains();
    setupPins();
    const restoreText = setupRevealText();
    setupReveals();
    const restoreCounters = setupCounters();
    setupDraw();
    setupFill();
    setupParallax();
    setupScrub();
    setupProgress();
    const restoreBrand = setupBrandFlight();
    ScrollTrigger.sort();
    // Les tweens et ScrollTriggers créés ici sont annulés par gsap.matchMedia ; on rend en plus le DOM
    // (textes découpés, largeurs réservées) si la préférence change en cours de visite.
    return () => {
      restoreText();
      restoreCounters();
      restoreBrand();
    };
  });

  // Positions recalculées quand les polices et la page sont chargées (déclencheurs exacts).
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};
