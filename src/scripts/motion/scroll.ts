/**
 * Effets pilotés par la position de défilement (lissage unique SCRUB 0,6, transform/opacity uniquement).
 *  - data-parallax="0.15" : translateY de 0 à −0,15 × hauteur du viewport pendant la traversée du
 *    déclencheur (valeur négative : l'élément « traîne »). Option : data-parallax-trigger.
 *  - data-scrub="scale:1,1.08|opacity:1,0" : interpolation from,to par propriété (x, y, xPercent,
 *    yPercent, scale, scaleX, scaleY, rotate, opacity) sur la traversée du viewport. Options :
 *    data-scrub-trigger, data-scrub-start (`top bottom`), data-scrub-end (`bottom top`),
 *    data-scrub-ease.
 *  - data-curtain : la section recouvre la précédente, épinglée sans espace réservé quand son bas
 *    touche le bas du viewport (z-index, coins et ombre par la CSS `[data-curtain]`). Seulement
 *    quand la précédente ne contient AUCUN épinglage et que le contraste le justifie (clair → ink).
 *    Le recul (scale 0.96 + opacity 0.6) n'est appliqué QUE si la précédente ne contient aucun
 *    élément protégé (le H1 du hero). Après le passage, la précédente reste décalée derrière le
 *    rideau : la section rideau doit mesurer au moins la hauteur du viewport.
 * Refusés sur le H1 et [data-no-motion] ; parallaxe et scrub refusés aussi sur un conteneur qui en
 * contient (ces effets ne rendent jamais l'état final : le contenu y resterait altéré).
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
          start: 'top bottom',
          end: 'bottom top',
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
    /* `blur:a,b` devient `filter: blur(apx)` → `blur(bpx)` : GSAP interpole le nombre dans la chaîne.
       Voir shared.ts, SCRUB_PROPS, pour la réserve qui accompagne cette propriété. */
    const flou = 'blur' in spec.to;
    if (flou) {
      spec.from.filter = `blur(${spec.from.blur ?? 0}px)`;
      spec.to.filter = `blur(${spec.to.blur}px)`;
      delete spec.from.blur;
      delete spec.to.blur;
    }
    const props =
      'opacity' in spec.to && Object.keys(spec.to).length === 1
        ? 'opacity'
        : flou
          ? 'transform, filter'
          : 'transform, opacity';
    gsap.fromTo(el, spec.from, {
      ...spec.to,
      ease: el.dataset.scrubEase || 'none',
      scrollTrigger: {
        trigger: resolveTrigger(el, el.dataset.scrubTrigger),
        start: el.dataset.scrubStart || 'top bottom',
        end: el.dataset.scrubEnd || 'bottom top',
        scrub: SCRUB,
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
    /* Point de déclenchement RÉGLABLE par la valeur de `data-curtain` : par défaut `bottom bottom`,
       ce qui suppose la section précédente lue en entier, vrai seulement si elle tient dans un
       écran ; `bottom center` repousse l'épinglage d'une section plus haute, sinon figée à peine
       entrée. */
    const start = section.getAttribute('data-curtain')?.trim() || 'bottom bottom';
    ScrollTrigger.create({
      trigger: prev,
      start,
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
        'contient un élément protégé : pin + recouvrement seuls, aucune atténuation'
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
