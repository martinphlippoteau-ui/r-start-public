/**
 * data-on-load="classe", pose la classe indiquée à `load` (ex. dézoom CSS de l'image du hero :
 * l'image n'est jamais transformée par JS, la CSS gère la transition, neutralisée en reduced-motion).
 * Sans GSAP ; actif aussi en reduced-motion : la classe marque un état, la CSS décide de l'animer ou non.
 */
import { all, classList } from './dom';

export const setupLoadedClasses = (): void => {
  const els = all('[data-on-load]');
  if (!els.length) return;
  const apply = () => els.forEach((el) => el.classList.add(...classList(el.dataset.onLoad)));
  if (document.readyState === 'complete') apply();
  else window.addEventListener('load', apply, { once: true });
};
