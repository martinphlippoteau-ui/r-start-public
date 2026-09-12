/**
 * data-counter="160000", compteur animé (expo.out, la courbe unique du moteur : le nombre file puis se
 * pose sur ses derniers chiffres ; 1,6 s), formaté fr-FR.
 * Options : data-counter-prefix, data-counter-suffix, data-counter-decimals, data-counter-from (défaut 0),
 * data-counter-duration (s). Démarre à 88 % du viewport (START), une seule fois.
 * Usage (sobriété du 11/09/2026) : uniquement des chiffres NON réglementaires (clients, encours, avis) ;
 * jamais un taux de frais, un indicateur de risque, un prix de part ni un délai, ces valeurs sont
 * toujours exactes à l'écran. Le compteur est alors le seul effet d'entrée de son bloc.
 * La valeur finale est toujours dans le HTML (sans JS / reduced-motion, elle reste affichée). Avant
 * le départ, l'élément affiche la valeur de départ ; sa largeur finale est réservée (min-width lu une
 * fois) pour que le comptage ne décale rien autour (CLS).
 */
import { gsap } from 'gsap';
import { EASE, all, allowed, num, onceTrigger } from './shared';

const format = (decimals: number) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

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
      ease: EASE,
      scrollTrigger: onceTrigger(el),
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
