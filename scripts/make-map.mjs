// Génère la carte de la section Stratégie (src/components/StrategyMap.astro) à partir de vraies
// frontières (GeoJSON Natural Earth simplifié) et de l'univers d'investissement déclaré dans
// src/content/fr/facts.ts (États membres du Conseil de l'Europe + Canada). Deux volets, chacun en
// projection azimutale équivalente de Lambert centrée sur sa région, contours simplifiés
// (Douglas-Peucker) pour un SVG léger. Les pays hors univers apparaissent en contexte discret.
//
// Usage : node scripts/make-map.mjs <chemin/countries.geo.json>
//   (jeu de données : https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { investmentUniverse } from '../src/content/fr/facts.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'components', 'StrategyMap.astro');
const source = process.argv[2];
if (!source) throw new Error('Chemin du GeoJSON attendu en argument.');

const VIEW_W = 1200;
const VIEW_H = 520;
const PAD = 26;
const TOLERANCE = 1.1; // simplification, en unités du viewBox
const MIN_RING_AREA = 14; // anneaux (îlots) plus petits ignorés

const panels = [
  {
    key: 'canada',
    center: [-96, 62],
    rect: [0, 0, 580, VIEW_H],
    highlight: new Set(investmentUniverse.canada),
  },
  {
    key: 'europe',
    center: [18, 54],
    rect: [620, 0, 580, VIEW_H],
    highlight: new Set(investmentUniverse.councilOfEurope),
  },
];

const rad = (d) => (d * Math.PI) / 180;

/** Projection azimutale équivalente de Lambert (x vers l'est, y vers le nord, rayon unitaire). */
const laea = (lon, lat, [lon0, lat0]) => {
  const l = rad(lon - lon0);
  const p = rad(lat);
  const p1 = rad(lat0);
  const cosc = Math.sin(p1) * Math.sin(p) + Math.cos(p1) * Math.cos(p) * Math.cos(l);
  if (cosc <= -0.98) return null;
  const k = Math.sqrt(2 / (1 + cosc));
  return [
    k * Math.cos(p) * Math.sin(l),
    k * (Math.cos(p1) * Math.sin(p) - Math.sin(p1) * Math.cos(p) * Math.cos(l)),
  ];
};

/** Douglas-Peucker. */
const simplify = (pts, tol) => {
  if (pts.length <= 2) return pts;
  const sq = tol * tol;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let best = -1;
    let bestDist = 0;
    for (let i = a + 1; i < b; i += 1) {
      const [px, py] = pts[i];
      let d;
      if (len === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
        d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }
      if (d > bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best > -1 && bestDist > sq) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const ringsOf = (geometry) => {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
};

const bbox = (pts) => {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
};

const geo = JSON.parse(await fs.readFile(source, 'utf8'));
const fmt = (n) => (Math.round(n * 10) / 10).toString();

const panelSvg = (panel) => {
  const [rx, ry, rw, rh] = panel.rect;
  // 1. Projection brute (rayon unitaire) de toutes les frontières.
  const projected = geo.features.map((f) => ({
    id: f.id,
    rings: ringsOf(f.geometry)
      .map((ring) => ring.map(([lon, lat]) => laea(lon, lat, panel.center)).filter(Boolean))
      .filter((r) => r.length > 3),
  }));
  // 2. Échelle : les pays de l'univers tiennent dans le volet, marges comprises.
  const focusPts = projected
    .filter((f) => panel.highlight.has(f.id))
    .flatMap((f) => f.rings.flat());
  const [bx0, by0, bx1, by1] = bbox(focusPts);
  const scale = Math.min((rw - 2 * PAD) / (bx1 - bx0), (rh - 2 * PAD) / (by1 - by0));
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const mx = (bx0 + bx1) / 2;
  const my = (by0 + by1) / 2;
  const toView = ([x, y]) => [cx + (x - mx) * scale, cy - (y - my) * scale];

  const paths = { context: [], focus: [] };
  let missing = [];
  for (const f of projected) {
    const isFocus = panel.highlight.has(f.id);
    const rings = [];
    for (const ring of f.rings) {
      const pts = simplify(ring.map(toView), TOLERANCE);
      const [x0, y0, x1, y1] = bbox(pts);
      // Les pays de l'univers sont toujours tracés (Malte, Chypre…) ; le contexte ignore les îlots.
      if (!isFocus && (x1 - x0) * (y1 - y0) < MIN_RING_AREA) continue;
      // Anneaux entièrement hors du volet : inutiles (le clip ferait le reste).
      if (x1 < rx - 40 || x0 > rx + rw + 40 || y1 < ry - 40 || y0 > ry + rh + 40) continue;
      rings.push(pts);
    }
    if (!rings.length) {
      if (isFocus) missing.push(f.id);
      continue;
    }
    const d = rings
      .map((pts) => 'M' + pts.map(([x, y]) => fmt(x) + ' ' + fmt(y)).join('L') + 'Z')
      .join('');
    (isFocus ? paths.focus : paths.context).push(d);
  }
  const absent = [...panel.highlight].filter((id) => !geo.features.some((f) => f.id === id));
  return {
    rect: panel.rect,
    key: panel.key,
    focus: paths.focus.join(''),
    context: paths.context.join(''),
    missing,
    absent,
  };
};

const built = panels.map(panelSvg);
for (const p of built) {
  if (p.absent.length)
    console.log(
      `  ${p.key} : absents du jeu de données (micro-États, invisibles à cette échelle) : ${p.absent.join(', ')}`
    );
  if (p.missing.length)
    console.log(
      `  ${p.key} : présents mais trop petits pour être tracés : ${p.missing.join(', ')}`
    );
}

const panelMarkup = (p) => {
  const [x, y, w, h] = p.rect;
  return `
  <g clip-path={\`url(#\${id}-map-${p.key})\`}>
    <g fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.16" stroke-width="0.7" fill-rule="evenodd">
      <path d="${p.context}"></path>
    </g>
    <g data-animate="fade" data-animate-delay="0.35" fill-rule="evenodd">
      <path d="${p.focus}" fill="currentColor" fill-opacity="0.18"></path>
      <path d="${p.focus}" fill={\`url(#\${id}-map-dots)\`}></path>
    </g>
    <path
      d="${p.focus}"
      fill="none"
      fill-rule="evenodd"
      stroke="currentColor"
      stroke-opacity="0.85"
      stroke-width="1.4"
      stroke-linejoin="round"
      data-draw
      data-draw-scrub
      data-draw-start="top 85%"
      data-draw-end="center 45%"
    ></path>
  </g>`;
};

const clipDefs = built
  .map((p) => {
    const [x, y, w, h] = p.rect;
    return `    <clipPath id={\`\${id}-map-${p.key}\`}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24"></rect></clipPath>`;
  })
  .join('\n');

const astro = `---
/**
 * Carte de l'univers d'investissement (section Stratégie), FICHIER GÉNÉRÉ par scripts/make-map.mjs,
 * ne pas éditer à la main. Deux volets en projection azimutale équivalente de Lambert : Canada et
 * États membres du Conseil de l'Europe, d'après src/content/fr/facts.ts (investmentUniverse).
 * Les pays de l'univers sont en teal (aplat + trame) et leurs contours se tracent au fil du
 * défilement (data-draw + data-draw-scrub) ; les pays voisins apparaissent en contexte discret.
 * Purement décorative (aria-hidden) : les libellés et la légende sont rendus par la section.
 */
interface Props {
  /** Préfixe des identifiants SVG (motif, découpes) : unique par page. */
  id: string;
  class?: string;
}
const { id, class: className = '' } = Astro.props;
---

<svg
  aria-hidden="true"
  focusable="false"
  viewBox="0 0 ${VIEW_W} ${VIEW_H}"
  width={${VIEW_W}}
  height={${VIEW_H}}
  class:list={['h-auto w-full text-teal-400', className]}
>
  <defs>
    <pattern id={\`\${id}-map-dots\`} width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.7" fill="currentColor" fill-opacity="0.9"></circle>
    </pattern>
${clipDefs}
  </defs>${built.map(panelMarkup).join('')}
</svg>
`;

await fs.writeFile(OUT, astro, 'utf8');
const kb = Math.round(Buffer.byteLength(astro, 'utf8') / 1024);
console.log(
  `Carte générée : ${path.relative(ROOT, OUT)} (${kb} Ko, ${built.map((p) => p.key).join(' + ')})`
);
