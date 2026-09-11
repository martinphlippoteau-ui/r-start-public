/**
 * data-scene + data-scene-end="+=120%" — scène épinglée dont les enfants [data-step] s'enchaînent.
 *
 * Le premier step est visible dès l'arrivée de la scène ; chaque step suivant entre (opacity 0 → 1,
 * y 24 → 0, courbe unique EASE) pendant que le précédent sort (opacity 1 → 0, y → −20, EASE_IN, son
 * miroir), sauf s'il porte data-step-stay : il reste alors visible jusqu'à la fin. L'état final montre
 * tous les steps « stay ». Un temps mort de 0,6 clôt la scène. Lissage SCRUB 0,6.
 * Usage (sobriété du 11/09/2026) : sur l'accueil, une seule scène — les frais (03-Fees).
 *
 * Contre-poids réglementaire : placer la RiskNote HORS des [data-step] et hors du `scene-stack`
 * (directement dans la scène, sous ou à côté de la pile) — elle est alors visible du premier au
 * dernier step, à côté de chaque avantage. Un [data-step] qui contient un [data-risk] n'est jamais
 * animé (ni entrée, ni sortie : visible du début à la fin, avertissement en développement) ; dans un
 * `scene-stack` il se superposerait aux autres steps, d'où la règle de structure ci-dessus.
 *
 * Garde-fou de hauteur (11/09/2026) : une scène n'est épinglée que si elle tient ENTIÈREMENT sous son
 * point de départ (hauteur de la scène + décalage en px de data-scene-start ≤ hauteur de la fenêtre).
 * Sinon son bas — le contre-poids, placé en dernier — resterait hors écran pendant tout l'épinglage
 * (constaté sur « Frais » : 944 px de scène pour 828 px disponibles à 1440×900). La condition est une
 * media query `min-height` posée via gsap.matchMedia, donc réévaluée à chaque changement de hauteur de
 * la fenêtre ; quand elle échoue, les steps restent visibles et statiques (même repli que sans JS) et
 * un avertissement est émis en développement. La hauteur est mesurée au démarrage du moteur (après
 * `load`, polices chargées) et n'est pas remesurée si la largeur change sans franchir 64 rem.
 *
 * Mise en page : les steps se superposent via la classe `scene-stack` (grid, même cellule) — active
 * seulement quand le moteur tourne (`html.motion` + no-preference) ; sans JS ou en reduced-motion
 * ils se suivent normalement, tous visibles.
 * Accessibilité : les steps masqués passent en visibility:hidden (non focusables) ; si le focus
 * clavier entre dans un step masqué, la page défile jusqu'à la position où il est visible.
 * Performance : `will-change` posé sur les steps animés seulement pendant que la scène est active.
 * Options : data-scene-start (défaut `top top`), data-scene-end (défaut `+=120%`).
 */
import { gsap } from 'gsap';
import {
  DISTANCE,
  DISTANCE_TITLE,
  EASE,
  EASE_IN,
  SCRUB,
  all,
  allowed,
  containsProtected,
  refuse,
  scrubWillChange,
} from './shared';

/** Décalage vertical (px) du point de départ : `top 72px` → 72 ; `top top` ou toute autre forme → 0. */
const startOffset = (start: string): number => Number(/(\d+(?:\.\d+)?)px/.exec(start)?.[1] ?? 0);

export const setupScenes = (): void => {
  all('[data-scene]').forEach((scene) => {
    if (!allowed(scene, 'data-scene')) return;
    const steps = all('[data-step]', scene).filter((s) => allowed(s, 'data-step'));
    if (steps.length < 2) return;
    const animated = steps.filter((step) => {
      if (!containsProtected(step)) return true;
      refuse(
        step,
        'data-step (entrée/sortie)',
        'contient un [data-risk] : reste visible du début à la fin — placer la RiskNote hors des [data-step]'
      );
      return false;
    });

    const start = scene.dataset.sceneStart || 'top top';
    const needed = Math.ceil(scene.getBoundingClientRect().height + startOffset(start));
    const fits = `(min-height: ${needed}px)`;
    if (!window.matchMedia(fits).matches) {
      refuse(
        scene,
        'data-scene (épinglage)',
        `scène de ${needed} px (départ compris) plus haute que la fenêtre (${window.innerHeight} px) : non épinglée tant que la fenêtre est trop basse — alléger la scène`
      );
    }

    gsap.matchMedia().add(fits, () => {
      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: {
          trigger: scene,
          start,
          end: scene.dataset.sceneEnd || '+=120%',
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          fastScrollEnd: true,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          ...scrubWillChange(animated, 'transform, opacity'),
        },
      });

      const visibleAt: number[] = [];
      steps.forEach((step, i) => {
        if (!animated.includes(step)) {
          visibleAt.push(0);
          return;
        }
        const stay = step.hasAttribute('data-step-stay');
        if (i === 0) {
          visibleAt.push(0);
        } else {
          const at = i - 1 + 0.35;
          tl.fromTo(
            step,
            { autoAlpha: 0, y: DISTANCE_TITLE },
            { autoAlpha: 1, y: 0, duration: 0.65 },
            at
          );
          visibleAt.push(at + 0.65);
        }
        const last = i === steps.length - 1;
        if (!stay && !last)
          tl.to(step, { autoAlpha: 0, y: -DISTANCE, duration: 0.5, ease: EASE_IN }, i);
      });
      tl.to({}, { duration: 0.6 });

      // Focus clavier dans un step masqué → on amène la scène à la position où ce step est visible.
      const onFocus = (e: FocusEvent) => {
        const step = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-step]');
        const st = tl.scrollTrigger;
        if (!step || !st) return;
        const i = steps.indexOf(step);
        if (i < 0 || Number(gsap.getProperty(step, 'opacity')) > 0.9) return;
        const progress = Math.min(1, (visibleAt[i] ?? 0) / tl.duration());
        window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'auto' });
      };
      scene.addEventListener('focusin', onFocus);
      return () => scene.removeEventListener('focusin', onFocus);
    });
  });
};
