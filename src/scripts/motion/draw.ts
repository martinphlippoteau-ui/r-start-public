/**
 * Dessins et jauges à l'entrée dans le viewport (88 %, START), une seule fois — ou au scrub si demandé
 * (lissage SCRUB 0,6). Courbe unique du moteur (EASE) pour les tracés joués une fois.
 *
 *  - data-draw : tracé progressif des formes SVG (path, line, polyline, polygon, circle, ellipse,
 *    rect) contenues dans l'élément (ou de l'élément lui-même) via stroke-dashoffset, en cascade.
 *  - data-draw="width" : barre qui s'étire (scaleX 0 → 1, origine gauche).
 *    Options communes : data-draw-scrub (présent → piloté par le scroll entre data-draw-start,
 *    défaut `top 80%`, et data-draw-end, défaut `bottom 60%`), data-draw-stagger="0.15" (s).
 *  - data-fill="0.57" : jauge remplie par scaleX 0 → 1 (ou scaleY avec data-fill-axis="y", origine
 *    bas). L'état statique de l'élément (largeur 57 % posée dans le HTML) est la vérité : la valeur
 *    de l'attribut règle la durée (0,9 s + 0,5 s × valeur) pour rester en phase avec un compteur.
 * Sans JS ou en reduced-motion, tout est dessiné/rempli. Refusés sur le H1 et [data-risk].
 */
import { gsap } from 'gsap';
import { EASE, SCRUB, all, allowed, num, onceTrigger, onceVars } from './shared';

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';

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
    const stagger = num(el.dataset.drawStagger, 0.15);
    const scrollTrigger = scrub ? scrubTrigger(el) : onceTrigger(el);

    if (el.dataset.draw === 'width') {
      gsap.fromTo(
        el,
        { scaleX: 0, transformOrigin: '0% 50%' },
        {
          scaleX: 1,
          duration: 1.2,
          ease: scrub ? 'none' : EASE,
          scrollTrigger,
          ...onceVars(el, 'transform'),
        }
      );
      return;
    }

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
      stagger,
      scrollTrigger,
      clearProps: scrub ? '' : 'strokeDasharray,strokeDashoffset',
    });
  });
};

export const setupFill = (): void => {
  all('[data-fill]').forEach((el) => {
    if (!allowed(el, 'data-fill')) return;
    const value = gsap.utils.clamp(0, 1, num(el.dataset.fill, 1));
    const vertical = el.dataset.fillAxis === 'y';
    const from = vertical
      ? { scaleY: 0, transformOrigin: '50% 100%' }
      : { scaleX: 0, transformOrigin: '0% 50%' };
    const to = vertical ? { scaleY: 1 } : { scaleX: 1 };
    gsap.fromTo(el, from, {
      ...to,
      duration: 0.9 + 0.5 * value,
      ease: EASE,
      scrollTrigger: onceTrigger(el),
      clearProps: 'transform,willChange',
      ...onceVars(el, 'transform'),
    });
  });
};
