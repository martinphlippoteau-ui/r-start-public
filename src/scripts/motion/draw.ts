/**
 * Dessins à l'entrée dans le viewport (88 %, START), une seule fois, ou au scrub si demandé
 * (lissage SCRUB 0,6). Courbe unique du moteur (EASE) pour les tracés joués une fois.
 *
 *  - data-draw : tracé progressif des formes SVG (path, line, polyline, polygon, circle, ellipse,
 *    rect) contenues dans l'élément (ou de l'élément lui-même) via stroke-dashoffset, en cascade.
 *    Option : data-draw-scrub (présent → piloté par le scroll entre data-draw-start, défaut `top 80%`,
 *    et data-draw-end, défaut `bottom 60%`). Cascade de 0,15 s entre les formes.
 * Sans JS ou en reduced-motion, tout est dessiné. Refusés sur le H1 et [data-no-motion].
 */
import { gsap } from 'gsap';
import { EASE, SCRUB, all, allowed, onceTrigger } from './shared';

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';
/** Cascade entre deux formes (s). */
const STAGGER_FORMES = 0.15;

const shapesOf = (el: HTMLElement): SVGGeometryElement[] => {
  const list = el.matches(SHAPES)
    ? [el as unknown as SVGGeometryElement]
    : Array.from(el.querySelectorAll<SVGGeometryElement>(SHAPES));
  return list.filter((s) => typeof s.getTotalLength === 'function');
};

const scrubTrigger = (el: HTMLElement): ScrollTrigger.Vars => ({
  trigger: el,
  start: el.dataset.drawStart || 'top 80%',
  end: el.dataset.drawEnd || 'bottom 60%',
  scrub: SCRUB,
});

export const setupDraw = (): void => {
  all('[data-draw]').forEach((el) => {
    if (!allowed(el, 'data-draw')) return;
    const scrub = el.hasAttribute('data-draw-scrub');
    const scrollTrigger = scrub ? scrubTrigger(el) : onceTrigger(el);

    const shapes = shapesOf(el);
    if (!shapes.length) return;
    // Longueurs lues en une passe (lecture), puis écritures : pas d'alternance lecture/écriture.
    const lengths = shapes.map((s) => Math.ceil(s.getTotalLength()) + 1);
    shapes.forEach((s, i) =>
      gsap.set(s, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] })
    );
    gsap.to(shapes, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: scrub ? 'none' : EASE,
      stagger: STAGGER_FORMES,
      scrollTrigger,
      clearProps: scrub ? '' : 'strokeDasharray,strokeDashoffset',
    });
  });
};
