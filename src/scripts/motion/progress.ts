/**
 * Indicateurs de lecture liés à la progression dans <main> (ou dans data-progress-for="sélecteur").
 *  - data-progress : barre dont scaleX suit la progression (origine gauche, scrub 0.4). Masquée en
 *    reduced-motion par la CSS (`[data-progress]`).
 *  - data-compact-at="0.4" : l'élément reçoit l'attribut `data-compact` une fois passé 40 % de la
 *    page (et le perd en remontant) ; la CSS fait le reste (CTA compact de la sous-navigation).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { all, num } from './shared';

const scope = (selector: string | undefined): Element =>
  (selector && document.querySelector(selector)) || document.querySelector('main') || document.body;

export const setupProgress = (): void => {
  all('[data-progress]').forEach((bar) => {
    gsap.fromTo(
      bar,
      { scaleX: 0, transformOrigin: '0% 50%' },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: scope(bar.dataset.progressFor),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
        },
      }
    );
  });

  all('[data-compact-at]').forEach((el) => {
    const threshold = gsap.utils.clamp(0, 1, num(el.dataset.compactAt, 0.4));
    ScrollTrigger.create({
      trigger: scope(el.dataset.progressFor),
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const compact = self.progress >= threshold;
        if (compact !== el.hasAttribute('data-compact'))
          el.toggleAttribute('data-compact', compact);
      },
    });
  });
};
