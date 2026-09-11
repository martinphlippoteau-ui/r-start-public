/**
 * Outils communs du moteur GSAP (voir src/scripts/motion.ts pour la référence complète).
 * Les helpers DOM sans GSAP vivent dans ./dom (ré-exportés ici pour les modules du moteur).
 */
import { gsap } from 'gsap';

export {
  PROTECTED,
  all,
  allowed,
  classList,
  containsProtected,
  isProtected,
  num,
  refuse,
  resolveTrigger,
} from './dom';
import { refuse } from './dom';

/**
 * RYTHME UNIQUE des entrées (11/09/2026, passe de sobriété) : une seule courbe, une seule gamme de durées
 * et de distances, partagées par reveal.ts, text.ts, counter.ts, draw.ts, scene.ts — et reprises à
 * l'identique par le moteur léger (lite.ts) et la cascade CSS d'ouverture (global.css, --ease-out-expo).
 *  - EASE `expo.out` : le mouvement finit avant que l'œil ne lise ; EASE_IN est son miroir, réservé aux
 *    sorties pilotées par le défilement (scène) ;
 *  - DURATION 0,6 s (titres 0,7 s), DISTANCE 20 px (titres 24 px), STAGGER 0,08 s entre éléments ;
 *  - START `top 88%` : tous les déclencheurs uniques partent au même seuil ;
 *  - SCRUB 0,6 : lissage identique de tout effet lié au défilement (parallaxe, scrub, scène, tracé).
 */
export const EASE = 'expo.out';
export const EASE_IN = 'expo.in';
export const DURATION = 0.6;
export const DURATION_TITLE = 0.7;
export const DISTANCE = 20;
export const DISTANCE_TITLE = 24;
export const STAGGER = 0.08;
export const START = 'top 88%';
export const SCRUB = 0.6;

/** Propriétés autorisées dans les mini-syntaxes (transform et opacity uniquement, jamais de layout). */
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
]);

export interface FromTo {
  from: Record<string, number>;
  to: Record<string, number>;
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
      refuse(el, attr, `propriété « ${prop} » non autorisée (transform/opacity uniquement)`);
      continue;
    }
    from[prop] = values[0] as number;
    to[prop] = values[1] as number;
  }
  return Object.keys(to).length ? { from, to } : null;
};

/**
 * Pose `will-change` le temps d'une animation unique (révélation, compteur, dessin) et le retire à la
 * fin avec les propriétés animées, pour rendre la main au navigateur (aucune couche résiduelle).
 */
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
  start,
  once: true,
});
