/**
 * data-reveal-text, révélation mot à mot d'un TITRE COURT (≤ 12 mots, texte simple sans balises),
 * réservé aux H2 de chapitre. Le texte original est conservé pour les technologies d'assistance
 * (span visually-hidden) ; les mots animés sont dans un span aria-hidden non sélectionnable
 * (`.reveal-words`) pour que la copie ne renvoie pas le texte deux fois ; sur un paragraphe, la
 * duplication gênerait la recherche dans la page. Sans JS ou en reduced-motion, le texte est
 * intact. À l'entrée (88 %), mots en cascade (opacity 0 → 1, y 0.4em → 0, 0,6 s expo.out, 0,04 s
 * par mot). Refusé sur le H1, [data-no-motion], tout élément contenant des balises ou plus de 12
 * mots.
 */
import { gsap } from 'gsap';
import { DURATION, EASE, all, allowed, onceTrigger, refuse } from './shared';

const MAX_WORDS = 12;
/** Pas de la cascade entre deux mots (s). */
const WORD_STAGGER = 0.04;

export const setupRevealText = (): (() => void) => {
  const restore: Array<() => void> = [];
  /* UN TITRE DÉJÀ À L'ÉCRAN RESTE TEL QUEL, même garde que reveal.ts et lite.ts : ce moteur arrive
     tard (inactivité, puis 47 Ko), et un titre visible, découpé puis rendu à opacité 0, s'éteignait
     sous les yeux du visiteur (arrivée par une ancre de la recherche, défilement dans la première
     seconde). Lectures groupées AVANT toute écriture. */
  const titres = all('[data-reveal-text]');
  const hauteur = window.innerHeight;
  const dejaVisible = titres.map((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < hauteur;
  });
  titres.forEach((el, rang) => {
    if (dejaVisible[rang]) return;
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

    gsap.from(spans, {
      opacity: 0,
      y: '0.4em',
      duration: DURATION,
      ease: EASE,
      stagger: WORD_STAGGER,
      scrollTrigger: onceTrigger(el),
      clearProps: 'opacity,transform',
    });
  });
  return () => restore.forEach((fn) => fn());
};
