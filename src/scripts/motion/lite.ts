/**
 * MOTEUR LÉGER — révélations `data-animate` sans GSAP (IntersectionObserver + transitions CSS).
 *
 * Pourquoi : les sous-pages (/frais, /documentation, /presse, /salle-de-presse, pages légales) ne
 * déclarent que des `data-animate`. Leur faire télécharger GSAP + ScrollTrigger (≈ 45 Ko gzip) pour
 * quelques fondus est disproportionné. `src/scripts/motion.ts` ne charge le moteur GSAP que si la page
 * déclare un effet qui en a besoin (scène, rideau, pin, scrub, tracé, jauge, compteur, texte mot à mot,
 * barre de progression, vol de la marque) ; sinon il charge ce module.
 *
 * Un seul des deux modules tourne par page : sur une page à moteur, `reveal.ts` garde la main et
 * `lite.ts` n'est jamais importé. Aucune double animation possible.
 *
 * Équivalences avec `reveal.ts` (mêmes types, mêmes durées, mêmes distances) :
 *   fade-up (défaut) · fade · scale · tilt · clip (médias seulement) · stagger
 *   data-animate-delay (s) · data-animate-stagger (s) · data-animate-y (px)
 * Les courbes reprennent les équivalents CSS des easings GSAP employés côté moteur
 * (expo.out et power3.out pour les titres).
 *
 * GARDE-FOUS, identiques à ceux du moteur (src/scripts/motion.ts) :
 *  - refusé sur un H1, sur un [data-risk] et sur tout élément qui en contient : une révélation
 *    n'enveloppe jamais un risque ni un avertissement réglementaire ;
 *  - `stagger` : seuls les enfants sans risque cascadent, les autres restent visibles d'emblée ;
 *  - un élément déjà à l'écran à l'initialisation n'est pas touché (pas de flash, pas de LCP retardé) ;
 *  - `prefers-reduced-motion: reduce` : rien n'est créé, ce module n'est même pas importé ;
 *  - transform et opacity uniquement ; `will-change` posé le temps de l'animation puis retiré ;
 *  - aucun état initial en CSS : l'état de départ est posé en JavaScript, donc sans JavaScript tout
 *    reste visible et stable (anti-CLS).
 */
import { all, allowed, containsProtected, isProtected, num, refuse } from './dom';

/** Mêmes seuils que reveal.ts : déclenchement quand le haut de l'élément passe 88 % du viewport. */
const START_RATIO = 0.88;
const TITLE = 'h2, h3, [class*="text-display"]';
const MEDIA = 'img, picture, svg, video, figure';
/** Équivalents CSS des easings GSAP du moteur. */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_TITLE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

interface Depart {
  transform: string;
  opacity: string;
  clipPath?: string;
  duree: number;
  ease: string;
}

/** État de départ d'un élément selon son type d'animation. */
const depart = (el: HTMLElement, type: string, y: number, titre: boolean): Depart => {
  const base = { opacity: '0', duree: titre ? 0.9 : 0.7, ease: titre ? EASE_TITLE : EASE };
  switch (type) {
    case 'fade':
      return { ...base, transform: 'none' };
    case 'scale':
      return { ...base, transform: 'scale(0.95)', duree: 0.8 };
    case 'tilt':
      return {
        ...base,
        transform: `perspective(900px) translateY(${Math.max(y, 32)}px) rotateX(6deg)`,
        duree: 0.85,
      };
    case 'clip':
      return { ...base, opacity: '1', transform: 'none', clipPath: 'inset(0 0 100% 0)', duree: 1 };
    default:
      return { ...base, transform: `translateY(${y}px)` };
  }
};

/** Enfants d'un `stagger` autorisés à cascader : ceux qui ne portent ni ne contiennent de risque. */
const enfantsStagger = (el: HTMLElement): HTMLElement[] =>
  Array.from(el.children).filter((child): child is HTMLElement => {
    if (!isProtected(child) && !containsProtected(child)) return child instanceof HTMLElement;
    refuse(
      child,
      'data-animate="stagger" (enfant)',
      'contient un [data-risk] : reste visible, les autres cascadent'
    );
    return false;
  });

/** Pose l'état de départ, puis rend l'élément à son état final quand il entre dans le viewport. */
const preparer = (el: HTMLElement, type: string, delai: number, y: number): void => {
  const d = depart(el, type, y, el.matches(TITLE));
  el.style.willChange = type === 'clip' ? 'clip-path' : 'transform, opacity';
  el.style.opacity = d.opacity;
  el.style.transform = d.transform;
  if (d.clipPath) el.style.clipPath = d.clipPath;

  const jouer = (): void => {
    el.style.transition =
      `opacity ${d.duree}s ${d.ease} ${delai}s, transform ${d.duree}s ${d.ease} ${delai}s` +
      (d.clipPath ? `, clip-path ${d.duree}s ${d.ease} ${delai}s` : '');
    el.style.opacity = '1';
    el.style.transform = 'none';
    if (d.clipPath) el.style.clipPath = 'inset(0 0 0 0)';
    // Nettoyage complet une fois l'animation finie : plus aucun style en ligne ne subsiste.
    window.setTimeout(
      () => {
        el.style.removeProperty('transition');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('clip-path');
        el.style.removeProperty('will-change');
      },
      (d.duree + delai) * 1000 + 120
    );
  };
  aObserver.set(el, jouer);
};

/** Élément → action à jouer à l'entrée dans le viewport. */
const aObserver = new Map<HTMLElement, () => void>();

export const setupLite = (): void => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const els = all('[data-animate]').filter((el) =>
    allowed(el, 'data-animate', el.dataset.animate !== 'stagger')
  );
  // Lectures groupées avant toute écriture : les éléments déjà à l'écran ne sont pas touchés.
  const vh = window.innerHeight;
  const dejaVisible = els.map((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh;
  });

  els.forEach((el, i) => {
    if (dejaVisible[i]) return;
    let type = el.dataset.animate || 'fade-up';
    if (type === 'clip' && !el.matches(MEDIA)) {
      refuse(el, 'data-animate="clip"', 'réservé aux images : rendu en fade-up');
      type = 'fade-up';
    }
    const delai = num(el.dataset.animateDelay, 0);

    if (type === 'stagger') {
      const enfants = enfantsStagger(el);
      if (!enfants.length) return;
      const pas = num(el.dataset.animateStagger, 0.07);
      const y = num(el.dataset.animateY, 20);
      // La cascade est déclenchée par le conteneur : les enfants s'échelonnent sur son entrée.
      enfants.forEach((enfant, rang) => preparer(enfant, 'fade-up', delai + rang * pas, y));
      observerConteneur(el, enfants);
      return;
    }

    const y = num(el.dataset.animateY, el.matches(TITLE) ? 28 : 24);
    preparer(el, type, delai, y);
    observerConteneur(el, [el]);
  });
};

/** Un observateur unique par conteneur : à son entrée, tous ses éléments préparés sont joués. */
const observerConteneur = (conteneur: HTMLElement, cibles: HTMLElement[]): void => {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.disconnect();
        for (const cible of cibles) aObserver.get(cible)?.();
      }
    },
    // `top 88%` côté ScrollTrigger : l'élément se révèle quand son haut a franchi 88 % du viewport,
    // soit une marge basse négative de 12 % de la hauteur d'écran.
    { rootMargin: `0px 0px -${Math.round((1 - START_RATIO) * 100)}% 0px`, threshold: 0 }
  );
  io.observe(conteneur);
};
