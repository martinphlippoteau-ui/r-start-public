/**
 * data-animate, révélation unique à l'entrée dans le viewport (88 %), interruptible (once).
 * Rythme unique (shared.ts, 11/09/2026) : 0,6 s, 20 px, expo.out ; les grands titres (h2, h3,
 * text-display-*) 0,7 s / 24 px, même courbe. Le mouvement finit avant que l'œil ne lise.
 *  - "fade-up" (défaut) : opacity 0 → 1, y 20 → 0
 *  - "fade"             : opacity 0 → 1
 *  - "scale"            : opacity 0 → 1, scale 0.95 → 1
 *  - "tilt"             : opacity 0 → 1, y 24 → 0, rotationX 6° → 0 (perspective 900 px). Réservé à un
 *                         objet visuel isolé (picto, image), jamais un titre ni une carte entière.
 *  - "clip"             : clip-path inset bas → 0. Réservé aux médias (img, picture, svg, video,
 *                         figure) : la propriété n'est pas composée sur le GPU. Sur tout autre
 *                         élément, rendu en fade-up (avertissement en développement).
 *  - "stagger"          : les enfants directs cascadent (opacity 0 → 1, y 20 → 0, pas de 0,08 s)
 * Options : data-animate-delay="0.1" (s), data-animate-stagger="0.08" (s), data-animate-y="20" (px).
 *
 * Règle de sobriété (11/09/2026) : au plus UN effet d'entrée par bloc de contenu (une carte, une liste,
 * un titre), jamais sur un conteneur ET son contenu ; une cascade de plus de quatre éléments est un seul
 * `stagger` sur le parent.
 *
 * Garde-fous :
 *  - refusé sur le H1, sur un [data-risk] et sur tout élément qui en contient : une révélation
 *    n'enveloppe jamais un risque, on anime l'avantage seul (modèle : 02-Highlights) ;
 *  - "stagger" : seuls les enfants sans risque cascadent, les autres restent visibles d'emblée ;
 *  - un élément déjà dans le viewport à l'initialisation (arrivée par une ancre, moteur chargé après
 *    le premier rendu) reste tel quel : l'éteindre pour le rallumer serait un flash et retarderait
 *    le LCP. Pour une entrée au chargement, utiliser data-intro (CSS).
 */
import { gsap } from 'gsap';
import {
  DISTANCE,
  DISTANCE_TITLE,
  DURATION,
  DURATION_TITLE,
  EASE,
  STAGGER,
  all,
  allowed,
  containsProtected,
  isProtected,
  num,
  onceTrigger,
  onceVars,
  refuse,
} from './shared';

const TITLE = 'h2, h3, [class*="text-display"]';
const MEDIA = 'img, picture, svg, video, figure';

const staggerTargets = (el: HTMLElement): Element[] =>
  Array.from(el.children).filter((child) => {
    if (!isProtected(child) && !containsProtected(child)) return true;
    refuse(
      child,
      'data-animate="stagger" (enfant)',
      'contient un [data-risk] : reste visible, les autres cascadent'
    );
    return false;
  });

export const setupReveals = (): void => {
  const els = all('[data-animate]').filter((el) =>
    allowed(el, 'data-animate', el.dataset.animate !== 'stagger')
  );
  // Lectures groupées avant toute écriture : les éléments déjà à l'écran ne sont pas touchés.
  const vh = window.innerHeight;
  const onScreen = els.map((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh;
  });

  els.forEach((el, i) => {
    if (onScreen[i]) return;
    let type = el.dataset.animate || 'fade-up';
    if (type === 'clip' && !el.matches(MEDIA)) {
      refuse(el, 'data-animate="clip"', 'réservé aux images : rendu en fade-up');
      type = 'fade-up';
    }
    const title = el.matches(TITLE);
    const delay = num(el.dataset.animateDelay, 0);
    const y = num(el.dataset.animateY, title ? DISTANCE_TITLE : DISTANCE);
    const targets: gsap.TweenTarget = type === 'stagger' ? staggerTargets(el) : el;
    const base: gsap.TweenVars = {
      duration: title ? DURATION_TITLE : DURATION,
      ease: EASE,
      delay,
      scrollTrigger: onceTrigger(el),
      clearProps: 'opacity,transform,clipPath,willChange',
      ...onceVars(targets, 'transform, opacity'),
    };
    switch (type) {
      case 'fade':
        gsap.from(el, { ...base, opacity: 0 });
        break;
      case 'scale':
        gsap.from(el, { ...base, opacity: 0, scale: 0.95 });
        break;
      case 'tilt':
        gsap.from(el, {
          ...base,
          opacity: 0,
          y: Math.max(y, DISTANCE_TITLE),
          rotationX: 6,
          transformPerspective: 900,
          duration: DURATION_TITLE,
        });
        break;
      case 'clip':
        gsap.from(el, { ...base, clipPath: 'inset(0 0 100% 0)', duration: DURATION_TITLE });
        break;
      case 'stagger':
        if (!(targets as Element[]).length) return;
        gsap.from(targets, {
          ...base,
          opacity: 0,
          y: num(el.dataset.animateY, DISTANCE),
          stagger: num(el.dataset.animateStagger, STAGGER),
        });
        break;
      case 'fade-up':
      default:
        gsap.from(el, { ...base, opacity: 0, y });
    }
  });
};
