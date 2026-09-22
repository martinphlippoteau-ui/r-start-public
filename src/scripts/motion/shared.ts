/**
 * Outils communs du moteur GSAP (voir src/scripts/motion.ts pour la référence complète).
 * Les helpers DOM sans GSAP vivent dans ./dom (ré-exportés ici pour les modules du moteur).
 */
import { gsap } from 'gsap';

export {
  all,
  allowed,
  containsProtected,
  isProtected,
  num,
  refuse,
  resolveTrigger,
} from './dom';
import { refuse, seuilAtteignable } from './dom';

/**
 * RYTHME UNIQUE des entrées, partagé par reveal.ts, text.ts, draw.ts et scroll.ts, repris à
 * l'identique par lite.ts et la cascade CSS (global.css, --ease-out-expo) : EASE `expo.out` (le
 * mouvement finit avant que l'œil ne lise) ; DURATION 0,6 s (titres 0,7 s), DISTANCE 20 px (titres
 * 24 px), STAGGER 0,08 s ; START `top 88%` pour tous les déclencheurs uniques ; SCRUB 0,6 pour tout
 * effet lié au défilement.
 */
export const EASE = 'expo.out';
export const DURATION = 0.6;
export const DURATION_TITLE = 0.7;
export const DISTANCE = 20;
export const DISTANCE_TITLE = 24;
export const STAGGER = 0.08;
export const START = 'top 88%';
/** Le même seuil, en fraction d'écran, pour le test d'atteignabilité (dom.ts, seuilAtteignable). */
export const START_RATIO = 0.88;
export const SCRUB = 0.6;

/**
 * Propriétés autorisées dans les mini-syntaxes (transform et opacity, jamais de layout). `blur`,
 * traduit en `filter: blur()` par scroll.ts, est la seule non composée : un filtre se repeint à
 * chaque image. Réservé à UN SEUL bloc : le logo du hero et son accroche (un seul bloc depuis le
 * 22/09/2026, demande de Martin), sous le rideau, une fois le premier écran quitté ; nulle part
 * ailleurs, et jamais sur un texte qu'on est en train de lire.
 */
const SCRUB_PROPS = new Set([
  'x',
  'y',
  'xPercent',
  'yPercent',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotation',
  'opacity',
  'blur',
]);

export interface FromTo {
  /* Des nombres, sauf `filter`, posé par scroll.ts à partir de `blur`. */
  from: Record<string, number | string>;
  to: Record<string, number | string>;
}

/**
 * Analyse `prop:from,to|prop:from,to` (ex. `scale:1,1.08|opacity:1,0`). Les propriétés hors liste
 * blanche sont ignorées avec un avertissement en développement.
 */
export const parseFromTo = (spec: string, el: Element, attr = 'data-scrub'): FromTo | null => {
  const from: Record<string, number> = {};
  const to: Record<string, number> = {};
  for (const part of spec.split('|')) {
    const [rawProp, rawValues] = part.split(':');
    const prop = rawProp?.trim();
    const values = rawValues?.split(',').map((v) => Number(v.trim()));
    if (!prop || !values || values.length !== 2 || values.some(Number.isNaN)) {
      refuse(el, attr, `syntaxe invalide « ${part} »`);
      continue;
    }
    if (!SCRUB_PROPS.has(prop)) {
      refuse(el, attr, `propriété « ${prop} » non autorisée (transform, opacity et blur uniquement)`);
      continue;
    }
    from[prop] = values[0] as number;
    to[prop] = values[1] as number;
  }
  return Object.keys(to).length ? { from, to } : null;
};

/** Pose `will-change` le temps d'une animation unique et le retire à la fin avec les propriétés
    animées : aucune couche résiduelle. */
export const onceVars = (targets: gsap.TweenTarget, props: string): gsap.TweenVars => ({
  onStart: () => gsap.set(targets, { willChange: props }),
  onComplete: () => gsap.set(targets, { clearProps: 'willChange' }),
});

/** Pour un effet piloté par le scroll : `will-change` seulement quand le déclencheur est actif. */
export const scrubWillChange = (
  targets: gsap.TweenTarget,
  props: string
): Partial<ScrollTrigger.Vars> => ({
  onToggle: (self) =>
    gsap.set(targets, self.isActive ? { willChange: props } : { clearProps: 'willChange' }),
});

/** Déclencheur standard des révélations uniques : à 88 % du viewport (START), une seule fois. */
export const onceTrigger = (trigger: Element, start = START): ScrollTrigger.Vars => ({
  trigger,
  /* Seuil standard inatteignable (élément dans les derniers 12 % du document) : l'entrée dans l'écran
     suffit, sinon l'élément resterait invisible. Voir dom.ts, seuilAtteignable. */
  start: start === START && !seuilAtteignable(trigger, START_RATIO) ? 'top bottom' : start,
  once: true,
});
