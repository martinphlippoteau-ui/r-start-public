/**
 * data-in-view="classe" — la classe est posée tant que l'élément traverse le viewport (marge 10 %)
 * et retirée dès qu'il en sort (IntersectionObserver). Sert à ne faire tourner une animation CSS
 * continue (ex. dérive du halo du hero, `brand-halo-drift`) que lorsqu'elle est visible : hors écran,
 * `animation-play-state: paused`, aucun coût GPU pendant la lecture du reste de la page.
 * Sans GSAP ; actif aussi en reduced-motion (la classe marque un état, la CSS décide d'animer ou non).
 * Sans IntersectionObserver : la classe est posée d'emblée.
 */
import { all, classList } from './dom';

export const setupInView = (): void => {
  const els = all('[data-in-view]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add(...classList(el.dataset.inView)));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        const classes = classList(el.dataset.inView);
        if (e.isIntersecting) el.classList.add(...classes);
        else el.classList.remove(...classes);
      }
    },
    { rootMargin: '10% 0px 10% 0px' }
  );
  els.forEach((el) => io.observe(el));
};
