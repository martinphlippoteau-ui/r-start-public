/**
 * Effets pilotés par la position de défilement (lissage unique SCRUB 0,6, transform/opacity uniquement).
 *
 *  - data-parallax="0.15" : translateY de 0 à −0,15 × hauteur du viewport pendant la traversée du
 *    déclencheur (valeur négative : l'élément « traîne », effet d'arrière-plan).
 *    Options : data-parallax-trigger (sélecteur ou `parent`), data-parallax-start, data-parallax-end.
 *  - data-scrub="scale:1,1.08|opacity:1,0" : interpolation from,to par propriété (x, y, xPercent,
 *    yPercent, scale, scaleX, scaleY, rotate, opacity) sur la traversée du viewport.
 *    Options : data-scrub-trigger, data-scrub-start (défaut `top bottom`), data-scrub-end (`bottom top`),
 *    data-scrub-ease (défaut `none`).
 *  - data-curtain : la section recouvre la précédente. Règle d'emploi (11/09/2026) : seulement quand la
 *    section précédente ne contient AUCUN épinglage (jamais après une scène, ex. 03-Fees) et quand le
 *    contraste le justifie (fond clair → ink) ; sur l'accueil, un seul rideau : 08-Risques sur 08b-Presse.
 *    La section précédente est épinglée (sans
 *    espace réservé) quand son bas touche le bas du viewport pendant que la section rideau monte
 *    par-dessus (z-index, coins arrondis et ombre posés par la CSS `[data-curtain]`). Le recul
 *    (scale 0.96 + opacity 0.6) n'est appliqué QUE si la section précédente ne contient aucun
 *    [data-risk] : un contre-poids réglementaire n'est jamais atténué. Sinon, pin + recouvrement
 *    seuls (avertissement en développement) — en pratique le recul est réservé aux sections purement
 *    visuelles. Après le passage, la précédente reste décalée derrière le rideau (comportement
 *    ScrollTrigger sans espace réservé) : la section rideau doit donc mesurer au moins la hauteur du
 *    viewport.
 *  - data-pin + data-pin-end="+=800" : épingle l'élément dans son parent (compatibilité).
 *
 * Refusés sur le H1 et [data-risk] ; parallaxe et scrub refusés aussi sur un conteneur qui en contient
 * (ces effets ne rendent jamais l'état final : le contenu réglementaire y resterait altéré).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  SCRUB,
  all,
  allowed,
  containsProtected,
  num,
  parseFromTo,
  refuse,
  resolveTrigger,
  scrubWillChange,
} from './shared';

export const setupParallax = (): void => {
  all('[data-parallax]').forEach((el) => {
    if (!allowed(el, 'data-parallax', true)) return;
    const factor = num(el.dataset.parallax, 0.15);
    gsap.fromTo(
      el,
      { y: 0 },
      {
        y: () => -factor * window.innerHeight,
        ease: 'none',
        scrollTrigger: {
          trigger: resolveTrigger(el, el.dataset.parallaxTrigger),
          start: el.dataset.parallaxStart || 'top bottom',
          end: el.dataset.parallaxEnd || 'bottom top',
          scrub: SCRUB,
          invalidateOnRefresh: true,
          ...scrubWillChange(el, 'transform'),
        },
      }
    );
  });
};

export const setupScrub = (): void => {
  all('[data-scrub]').forEach((el) => {
    if (!allowed(el, 'data-scrub', true)) return;
    const spec = parseFromTo(el.dataset.scrub || '', el);
    if (!spec) return;
    const props =
      'opacity' in spec.to && Object.keys(spec.to).length === 1 ? 'opacity' : 'transform, opacity';
    gsap.fromTo(el, spec.from, {
      ...spec.to,
      ease: el.dataset.scrubEase || 'none',
      scrollTrigger: {
        trigger: resolveTrigger(el, el.dataset.scrubTrigger),
        start: el.dataset.scrubStart || 'top bottom',
        end: el.dataset.scrubEnd || 'bottom top',
        scrub: num(el.dataset.scrubSmooth, SCRUB),
        invalidateOnRefresh: true,
        ...scrubWillChange(el, props),
      },
    });
  });
};

export const setupCurtains = (): void => {
  all('[data-curtain]').forEach((section) => {
    const prev = section.previousElementSibling as HTMLElement | null;
    if (!prev || prev.matches('nav, header')) return;
    if (!allowed(prev, 'data-curtain (section précédente)')) return;
    ScrollTrigger.create({
      trigger: prev,
      start: 'bottom bottom',
      endTrigger: section,
      end: 'top top',
      pin: prev,
      pinSpacing: false,
      anticipatePin: 1,
      fastScrollEnd: true,
    });
    if (containsProtected(prev)) {
      refuse(
        prev,
        'data-curtain (recul de la section précédente)',
        'contient un [data-risk] : pin + recouvrement seuls, aucune atténuation'
      );
      return;
    }
    gsap.fromTo(
      prev,
      { scale: 1, opacity: 1, transformOrigin: '50% 100%' },
      {
        scale: 0.96,
        opacity: 0.6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: SCRUB,
          ...scrubWillChange(prev, 'transform, opacity'),
        },
      }
    );
  });
};

export const setupPins = (): void => {
  all('[data-pin]').forEach((el) => {
    if (!allowed(el, 'data-pin')) return;
    ScrollTrigger.create({
      trigger: el.parentElement || el,
      start: 'top top',
      end: el.dataset.pinEnd || 'bottom bottom',
      pin: el,
      pinSpacing: false,
      anticipatePin: 1,
      fastScrollEnd: true,
    });
  });
};
