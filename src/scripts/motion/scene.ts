/**
 * data-scene + data-scene-end="+=120%" — scène épinglée dont les enfants [data-step] s'enchaînent.
 *
 * Le premier step est visible dès l'arrivée de la scène ; chaque step suivant entre (opacity 0 → 1,
 * y 32 → 0) pendant que le précédent sort (opacity 1 → 0, y → −24), sauf s'il porte data-step-stay :
 * il reste alors visible jusqu'à la fin. L'état final montre tous les steps « stay ». Un temps mort
 * de 0,6 clôt la scène.
 *
 * Contre-poids réglementaire : placer la RiskNote HORS des [data-step] et hors du `scene-stack`
 * (directement dans la scène, sous ou à côté de la pile) — elle est alors visible du premier au
 * dernier step, à côté de chaque avantage. Un [data-step] qui contient un [data-risk] n'est jamais
 * animé (ni entrée, ni sortie : visible du début à la fin, avertissement en développement) ; dans un
 * `scene-stack` il se superposerait aux autres steps, d'où la règle de structure ci-dessus.
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
import { all, allowed, containsProtected, refuse, scrubWillChange } from './shared';

export const setupScenes = (): void => {
  all('[data-scene]').forEach((scene) => {
    if (!allowed(scene, 'data-scene')) return;
    const steps = all('[data-step]', scene).filter((s) => allowed(s, 'data-step'));
    if (steps.length < 2) return;
    const animated = steps.filter((step) => {
      if (!containsProtected(step)) return true;
      refuse(step, 'data-step (entrée/sortie)', 'contient un [data-risk] : reste visible du début à la fin — placer la RiskNote hors des [data-step]');
      return false;
    });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: scene,
        start: scene.dataset.sceneStart || 'top top',
        end: scene.dataset.sceneEnd || '+=120%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        scrub: 0.6,
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
        tl.fromTo(step, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.65 }, at);
        visibleAt.push(at + 0.65);
      }
      const last = i === steps.length - 1;
      if (!stay && !last) tl.to(step, { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power2.in' }, i);
    });
    tl.to({}, { duration: 0.6 });

    // Focus clavier dans un step masqué → on amène la scène à la position où ce step est visible.
    scene.addEventListener('focusin', (e) => {
      const step = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-step]');
      const st = tl.scrollTrigger;
      if (!step || !st) return;
      const i = steps.indexOf(step);
      if (i < 0 || Number(gsap.getProperty(step, 'opacity')) > 0.9) return;
      const progress = Math.min(1, (visibleAt[i] ?? 0) / tl.duration());
      window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'auto' });
    });
  });
};
