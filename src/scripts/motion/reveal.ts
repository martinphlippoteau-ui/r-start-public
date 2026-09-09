/**
 * data-animate — révélation unique à l'entrée dans le viewport (88 %), interruptible (once).
 * Rythme court façon page produit : 0,7 s, 24 px, expo.out — le mouvement finit avant que l'œil ne
 * lise. Les grands titres (h2, h3, text-display-*) gardent 0,9 s / 28 px / power3.out.
 *  - "fade-up" (défaut) : opacity 0 → 1, y 24 → 0
 *  - "fade"             : opacity 0 → 1
 *  - "scale"            : opacity 0 → 1, scale 0.95 → 1
 *  - "tilt"             : opacity 0 → 1, y 32 → 0, rotationX 6° → 0 (cartes, perspective 900 px)
 *  - "clip"             : clip-path inset bas → 0. Réservé aux médias (img, picture, svg, video,
 *                         figure) : la propriété n'est pas composée sur le GPU. Sur tout autre
 *                         élément, rendu en fade-up (avertissement en développement).
 *  - "stagger"          : les enfants directs cascadent (opacity 0 → 1, y 20 → 0, pas de 0,07 s)
 * Options : data-animate-delay="0.1" (s), data-animate-stagger="0.07" (s), data-animate-y="24" (px).
 *
 * Garde-fous :
 *  - refusé sur le H1, sur un [data-risk] et sur tout élément qui en contient : une révélation
 *    n'enveloppe jamais un risque — on anime l'avantage seul (modèle : 02-Highlights) ;
 *  - "stagger" : seuls les enfants sans risque cascadent, les autres restent visibles d'emblée ;
 *  - un élément déjà dans le viewport à l'initialisation (arrivée par une ancre, moteur chargé après
 *    le premier rendu) reste tel quel : l'éteindre pour le rallumer serait un flash et retarderait
 *    le LCP. Pour une entrée au chargement, utiliser data-intro (CSS).
 */
import { gsap } from 'gsap';
import { all, allowed, containsProtected, isProtected, num, onceTrigger, onceVars, refuse } from './shared';

const TITLE = 'h2, h3, [class*="text-display"]';
const MEDIA = 'img, picture, svg, video, figure';

const staggerTargets = (el: HTMLElement): Element[] =>
  Array.from(el.children).filter((child) => {
    if (!isProtected(child) && !containsProtected(child)) return true;
    refuse(child, 'data-animate="stagger" (enfant)', 'contient un [data-risk] : reste visible, les autres cascadent');
    return false;
  });

export const setupReveals = (): void => {
  const els = all('[data-animate]').filter((el) => allowed(el, 'data-animate', el.dataset.animate !== 'stagger'));
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
    const y = num(el.dataset.animateY, title ? 28 : 24);
    const targets: gsap.TweenTarget = type === 'stagger' ? staggerTargets(el) : el;
    const base: gsap.TweenVars = {
      duration: title ? 0.9 : 0.7,
      ease: title ? 'power3.out' : 'expo.out',
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
        gsap.from(el, { ...base, opacity: 0, scale: 0.95, duration: 0.8 });
        break;
      case 'tilt':
        gsap.from(el, { ...base, opacity: 0, y: Math.max(y, 32), rotationX: 6, transformPerspective: 900, duration: 0.85 });
        break;
      case 'clip':
        gsap.from(el, { ...base, clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.out' });
        break;
      case 'stagger':
        if (!(targets as Element[]).length) return;
        gsap.from(targets, {
          ...base,
          opacity: 0,
          y: num(el.dataset.animateY, 20),
          stagger: num(el.dataset.animateStagger, 0.07),
        });
        break;
      case 'fade-up':
      default:
        gsap.from(el, { ...base, opacity: 0, y });
    }
  });
};
