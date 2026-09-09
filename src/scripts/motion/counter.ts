/**
 * data-counter="160000" — compteur animé (ease power3.out, 1,6 s), formaté fr-FR.
 * Options : data-counter-prefix, data-counter-suffix, data-counter-decimals, data-counter-from (défaut 0),
 * data-counter-duration (s). Démarre à 85 % du viewport, une seule fois.
 * La valeur finale est toujours dans le HTML (sans JS / reduced-motion, elle reste affichée). Avant
 * le départ, l'élément affiche la valeur de départ ; sa largeur finale est réservée (min-width lu une
 * fois) pour que le comptage ne décale rien autour (CLS).
 */
import { gsap } from 'gsap';
import { all, allowed, num, onceTrigger } from './shared';

const format = (decimals: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const setupCounters = (): (() => void) => {
  const items = all('[data-counter]')
    .filter((el) => allowed(el, 'data-counter'))
    .map((el) => ({ el, target: Number(el.dataset.counter) }))
    .filter(({ target }) => !Number.isNaN(target));
  // Lectures groupées avant toute écriture.
  const widths = items.map(({ el }) => el.getBoundingClientRect().width);
  const original = items.map(({ el }) => el.textContent);

  items.forEach(({ el, target }, i) => {
    const decimals = num(el.dataset.counterDecimals, 0);
    const prefix = el.dataset.counterPrefix || '';
    const suffix = el.dataset.counterSuffix || '';
    const fmt = format(decimals);
    const state = { value: num(el.dataset.counterFrom, 0) };
    const render = () => {
      el.textContent = prefix + fmt.format(state.value) + suffix;
    };
    if (widths[i]) {
      el.style.display = 'inline-block';
      el.style.minWidth = Math.ceil(widths[i] as number) + 'px';
    }
    render();
    gsap.to(state, {
      value: target,
      duration: num(el.dataset.counterDuration, 1.6),
      ease: 'power3.out',
      scrollTrigger: onceTrigger(el, 'top 85%'),
      onUpdate: render,
      onComplete: () => {
        el.textContent = original[i] ?? el.textContent;
      },
    });
  });

  return () => {
    items.forEach(({ el }, i) => {
      el.textContent = original[i] ?? el.textContent;
      el.style.minWidth = '';
      el.style.display = '';
    });
  };
};
