/**
 * data-reveal-text — révélation mot à mot d'un TITRE COURT (≤ 12 mots, texte simple sans balises).
 * Le texte original est conservé pour les technologies d'assistance (span visually-hidden) ; les mots
 * animés sont dans un span aria-hidden non sélectionnable (`.reveal-words`, user-select: none) pour
 * que la copie ne renvoie pas le texte deux fois. Réservé aux titres : sur un paragraphe, la
 * duplication gênerait la recherche dans la page (Ctrl+F) — refusé au-delà de 12 mots.
 * Sans JS ou en reduced-motion, le texte est intact.
 * Usage (sobriété du 11/09/2026) : réservé aux H2 de chapitre ; les valeurs, libellés et sous-titres
 * entrent par un simple fade-up ou restent statiques.
 *  - data-reveal-text (vide ou "once") : à l'entrée (88 %, START), mots en cascade (opacity 0 → 1,
 *    y 0.4em → 0, 0,6 s expo.out, 0,04 s par mot : le pas est celui d'un mot, plus serré que la cascade
 *    d'éléments de 0,08 s).
 *  - data-reveal-text="scrub" : les mots passent de 0.2 à 1 d'opacité au fil du défilement
 *    (data-reveal-start, défaut `top 80%` ; data-reveal-end, défaut `bottom 55%`, lissage SCRUB).
 * Refusé sur le H1, [data-risk], tout élément contenant des balises ou plus de 12 mots.
 */
import { gsap } from 'gsap';
import { DURATION, EASE, SCRUB, all, allowed, onceTrigger, refuse } from './shared';

const MAX_WORDS = 12;
/** Pas de la cascade entre deux mots (s). */
const WORD_STAGGER = 0.04;

export const setupRevealText = (): (() => void) => {
  const restore: Array<() => void> = [];
  all('[data-reveal-text]').forEach((el) => {
    if (!allowed(el, 'data-reveal-text', true)) return;
    if (el.children.length) {
      refuse(el, 'data-reveal-text', 'contient des balises');
      return;
    }
    const text = el.textContent ?? '';
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) return;
    if (words.length > MAX_WORDS) {
      refuse(
        el,
        'data-reveal-text',
        `réservé aux titres courts (≤ ${MAX_WORDS} mots), pas aux paragraphes`
      );
      return;
    }
    const original = Array.from(el.childNodes);

    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = text;
    const visual = document.createElement('span');
    visual.className = 'reveal-words';
    visual.setAttribute('aria-hidden', 'true');
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'reveal-word';
      s.textContent = w;
      visual.append(s);
      if (i < words.length - 1) visual.append(' ');
      return s;
    });
    el.replaceChildren(sr, visual);
    restore.push(() => el.replaceChildren(...original));

    if (el.dataset.revealText === 'scrub') {
      gsap.fromTo(
        spans,
        { opacity: 0.2 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.5,
          scrollTrigger: {
            trigger: el,
            start: el.dataset.revealStart || 'top 80%',
            end: el.dataset.revealEnd || 'bottom 55%',
            scrub: SCRUB,
          },
        }
      );
    } else {
      gsap.from(spans, {
        opacity: 0,
        y: '0.4em',
        duration: DURATION,
        ease: EASE,
        stagger: WORD_STAGGER,
        scrollTrigger: onceTrigger(el),
        clearProps: 'opacity,transform',
      });
    }
  });
  return () => restore.forEach((fn) => fn());
};
