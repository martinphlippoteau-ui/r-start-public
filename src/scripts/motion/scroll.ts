/**
 * Effets pilotés par la position de défilement (lissage unique SCRUB 0,6, transform/opacity uniquement).
 *
 *  - data-parallax="0.15" : translateY de 0 à −0,15 × hauteur du viewport pendant la traversée du
 *    déclencheur (valeur négative : l'élément « traîne », effet d'arrière-plan).
 *    Option : data-parallax-trigger (sélecteur ou `parent`) ; traversée de `top bottom` à `bottom top`.
 *  - data-scrub="scale:1,1.08|opacity:1,0" : interpolation from,to par propriété (x, y, xPercent,
 *    yPercent, scale, scaleX, scaleY, rotate, opacity) sur la traversée du viewport.
 *    Options : data-scrub-trigger, data-scrub-start (défaut `top bottom`), data-scrub-end (`bottom top`),
 *    data-scrub-ease (défaut `none`).
 *  - data-curtain : la section recouvre la précédente. Règle d'emploi (11/09/2026) : seulement quand la
 *    section précédente ne contient AUCUN épinglage et quand le contraste le justifie (fond clair → ink).
 *    Trois rideaux au 14/09/2026 : sur l'accueil 01b-Différence sur le hero et 08-Risques sur Souscrire,
 *    sur /strategie le même bloc Risques sur « Comment ». Plus aucune scène épinglée nulle part.
 *    La section précédente est épinglée (sans
 *    espace réservé) quand son bas touche le bas du viewport pendant que la section rideau monte
 *    par-dessus (z-index, coins arrondis et ombre posés par la CSS `[data-curtain]`). Le recul
 *    (scale 0.96 + opacity 0.6) n'est appliqué QUE si la section précédente ne contient aucun
 *    élément protégé (le H1 du hero, en pratique). Sinon, pin + recouvrement seuls (avertissement en
 *    développement). Après le passage, la précédente reste décalée derrière le rideau (comportement
 *    ScrollTrigger sans espace réservé) : la section rideau doit donc mesurer au moins la hauteur du
 *    viewport.
 *
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
    /*
     * Point de déclenchement RÉGLABLE par la valeur de `data-curtain` (14/09/2026), pour les cas où la
     * section précédente dépasse la hauteur du viewport. Par défaut `bottom bottom` : l'épinglage part
     * dès que son bas touche le bas de l'écran, ce qui suppose qu'on l'a lue en entier à ce moment-là,
     * vrai seulement si elle tient dans un écran. Une section plus haute se fige alors qu'on vient d'y
     * entrer, et le rideau la recouvre aussitôt. `data-curtain="bottom center"` repousse l'épinglage
     * jusqu'à ce que son bas atteigne le milieu de l'écran : elle défile normalement d'abord, et le
     * recouvrement ne dure plus qu'un demi-écran.
     */
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
