/**
 * data-reveal-text, révélation mot à mot d'un TITRE COURT (≤ 12 mots, texte simple sans balises).
 * Le texte original est conservé pour les technologies d'assistance (span visually-hidden) ; les mots
 * animés sont dans un span aria-hidden non sélectionnable (`.reveal-words`, user-select: none) pour
 * que la copie ne renvoie pas le texte deux fois. Réservé aux titres : sur un paragraphe, la
 * duplication gênerait la recherche dans la page (Ctrl+F), refusé au-delà de 12 mots.
 * Sans JS ou en reduced-motion, le texte est intact.
 * Usage (sobriété du 11/09/2026) : réservé aux H2 de chapitre ; les valeurs, libellés et sous-titres
 * entrent par un simple fade-up ou restent statiques.
 * À l'entrée (88 %, START), mots en cascade (opacity 0 → 1, y 0.4em → 0, 0,6 s expo.out, 0,04 s par
 * mot : le pas est celui d'un mot, plus serré que la cascade d'éléments de 0,08 s). La variante
 * « scrub » (mots éclairés au fil du défilement), jamais employée, a été retirée le 22/09/2026.
 * Refusé sur le H1, [data-risk], tout élément contenant des balises ou plus de 12 mots.
 */
import { gsap } from 'gsap';
import { DURATION, EASE, all, allowed, onceTrigger, refuse } from './shared';

const MAX_WORDS = 12;
/** Pas de la cascade entre deux mots (s). */
const WORD_STAGGER = 0.04;

export const setupRevealText = (): (() => void) => {
  const restore: Array<() => void> = [];
  /*
   * UN TITRE DÉJÀ À L'ÉCRAN RESTE TEL QUEL (audit du 18/09/2026), même garde que reveal.ts et lite.ts.
   * Ce moteur arrive tard : après le temps d'inactivité, puis 47 Ko à télécharger. Un titre visible à
   * ce moment-là était découpé en mots, rendu à opacité 0, puis rejoué : il s'éteignait sous les yeux
   * du visiteur. Deux cas sûrs : l'arrivée par une ancre depuis la recherche du site, qui vise des
   * sections dont le H2 porte cet attribut et l'éclaire au même instant ; et un défilement dans la
   * première seconde, avant que ce moteur soit arrivé.
   * Lectures groupées AVANT toute écriture, pour ne pas alterner mesure et découpage.
   */
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
