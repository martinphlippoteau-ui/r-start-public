// Génère la carte de la section Stratégie (src/components/StrategyMap.astro) à partir de vraies
// frontières (GeoJSON Natural Earth simplifié). Contours simplifiés (Douglas-Peucker) pour un SVG léger.
//
// TROIS MODES.
//  - `globe` (défaut depuis le 14/09/2026) : n'écrit PAS de SVG mais les frontières simplifiées en
//    JSON (src/content/fr/globe.json), que StrategyGlobe.astro projette au canvas et fait tourner.
//    C'est la seule carte en service ; les deux modes SVG ci-dessous n'ont plus de consommateur et
//    src/components/StrategyMap.astro, qu'ils écrivaient, a été supprimé. Ils se régénèrent d'un appel,
//    et il faut alors remettre l'import dans 04-Strategy.astro.
//  - `monde` : UNE carte du monde en projection équirectangulaire, toutes
//    les terres émergées en teal. C'est ce que dit la page : « partout dans le monde ». L'Antarctique
//    est écarté, il n'a pas de marché immobilier et il écraserait la projection ;
//  - `univers` : les deux volets d'origine, Canada et États membres du Conseil de l'Europe d'après
//    src/content/fr/facts.ts (investmentUniverse), chacun en projection azimutale équivalente de
//    Lambert centrée sur sa région, les pays voisins en contexte discret. C'est le PÉRIMÈTRE DU DIC
//    du 20/05/2026. À reprendre si la Conformité demande que la carte s'y tienne.
//
// Usage : node scripts/make-map.mjs <chemin/countries.geo.json> [monde|univers]
//   (jeu de données : https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { investmentUniverse } from '../src/content/fr/facts.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'components', 'StrategyMap.astro');
const source = process.argv[2];
if (!source) throw new Error('Chemin du GeoJSON attendu en argument.');
const MODE = process.argv[3] ?? 'globe';
if (!['globe', 'monde', 'univers'].includes(MODE)) throw new Error(`Mode inconnu : ${MODE}`);

const VIEW_W = 1200;
/* La carte du monde est plus plate : 360° de longitude pour 140° de latitude utile. */
const VIEW_H = MODE === 'monde' ? 470 : 520;
const PAD = MODE === 'monde' ? 8 : 26;
/*
 * Simplification plus franche et îlots plus gros écartés en mode monde : à l'échelle du globe, mille
 * archipels ne se voient pas et pèsent chacun leur poids dans le fichier. Le seuil est choisi pour
 * garder les îles qui se lisent (Islande, Irlande, Sri Lanka, Japon, Nouvelle-Zélande) et laisser
 * tomber celles qui ne feraient qu'un pixel.
 */
const TOLERANCE = MODE === 'monde' ? 1.6 : 1.1;
const MIN_RING_AREA = MODE === 'monde' ? 1 : 14;

/*
 * L'Antarctique est écarté : aucun marché immobilier, et sa bande polaire, étirée par la projection
 * équirectangulaire, occuperait à elle seule le quart de la hauteur.
 */
const HORS_CARTE = new Set(['ATA']);

const monde = [
  {
    key: 'monde',
    rect: [0, 0, VIEW_W, VIEW_H],
    /* Toutes les terres sont en avant-plan : la page dit « partout », il n'y a pas d'arrière-plan. */
    highlight: null,
    equirect: true,
  },
];

const univers = [
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

const panels = MODE === 'monde' ? monde : univers;

const rad = (d) => (d * Math.PI) / 180;

/** Équirectangulaire (plate carrée) : x suit la longitude, y la latitude. Rayon unitaire, comme laea. */
const equirect = (lon, lat) => [rad(lon), rad(lat)];

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

/*
 * MODE GLOBE. Le globe tourne : impossible de pré-calculer des tracés, la projection change à chaque
 * image. On écrit donc les FRONTIÈRES ELLES-MÊMES, en degrés, simplifiées une fois pour toutes ici
 * plutôt qu'à chaque chargement de page, et c'est le client qui projette.
 *
 * La simplification est exprimée en DEGRÉS (0,45 ≈ 50 km à l'équateur) : à un globe de 520 px de
 * diamètre, un degré vaut moins de trois pixels, un détail plus fin ne se verrait pas et pèserait.
 * Les anneaux de moins de quatre points après simplification sont écartés : un archipel réduit à un
 * triangle est une tache, pas une île.
 */
if (MODE === 'globe') {
  const TOL_DEG = 0.45;
  const MIN_PTS = 4;
  const OUT_JSON = path.join(ROOT, 'src', 'content', 'fr', 'globe.json');
  const rings = [];
  for (const f of geo.features) {
    if (HORS_CARTE.has(f.id)) continue;
    for (const ring of ringsOf(f.geometry)) {
      const pts = simplify(
        ring.map(([lon, lat]) => [lon, lat]),
        TOL_DEG
      );
      if (pts.length < MIN_PTS) continue;
      /* Deux décimales : 1,1 km à l'équateur, bien en deçà du pixel, et trois fois plus léger. */
      rings.push(
        pts.map(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100])
      );
    }
  }
  const total = rings.reduce((n, r) => n + r.length, 0);
  await fs.writeFile(OUT_JSON, JSON.stringify(rings), 'utf8');
  const ko = Math.round((await fs.stat(OUT_JSON)).size / 1024);
  console.log(
    `Frontières du globe : ${path.relative(ROOT, OUT_JSON)} (${ko} Ko, ${rings.length} anneaux, ${total} points)`
  );
  process.exit(0);
}

const panelSvg = (panel) => {
  const [rx, ry, rw, rh] = panel.rect;
  // 1. Projection brute (rayon unitaire) de toutes les frontières.
  const project = panel.equirect
    ? ([lon, lat]) => equirect(lon, lat)
    : ([lon, lat]) => laea(lon, lat, panel.center);
  const enFocus = (id) =>
    panel.highlight === null ? !HORS_CARTE.has(id) : panel.highlight.has(id);
  const projected = geo.features
    .filter((f) => !HORS_CARTE.has(f.id))
    .map((f) => ({
      id: f.id,
      rings: ringsOf(f.geometry)
        .map((ring) => ring.map(project).filter(Boolean))
        .filter((r) => r.length > 3),
    }));
  // 2. Échelle : ce qui est en avant-plan tient dans le volet, marges comprises.
  const focusPts = projected.filter((f) => enFocus(f.id)).flatMap((f) => f.rings.flat());
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
    const isFocus = enFocus(f.id);
    const rings = [];
    for (const ring of f.rings) {
      const pts = simplify(ring.map(toView), TOLERANCE);
      const [x0, y0, x1, y1] = bbox(pts);
      /* En mode univers, les pays retenus sont toujours tracés, fût-ce Malte ou Chypre : ils SONT le
         propos. En mode monde, personne n'est le propos en particulier, le seuil vaut pour tous. */
      if ((panel.equirect || !isFocus) && (x1 - x0) * (y1 - y0) < MIN_RING_AREA) continue;
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
  const absent = panel.highlight
    ? [...panel.highlight].filter((id) => !geo.features.some((f) => f.id === id))
    : [];
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
  /* Le rectangle du volet ne sert plus ici : c'est la découpe (clipDefs) qui le porte. */
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

const DESCRIPTION =
  MODE === 'monde'
    ? `Le monde entier en projection équirectangulaire, Antarctique écarté : la page dit\n * « partout dans le monde », la carte ne dit rien de moins.`
    : `Deux volets en projection azimutale équivalente de Lambert, Canada et États membres du\n * Conseil de l'Europe d'après facts.investmentUniverse, soit le périmètre du DIC ; les pays voisins\n * apparaissent en contexte discret.`;

const astro = `---
/**
 * Carte de la zone d'investissement (section Stratégie), FICHIER GÉNÉRÉ par
 * \`node scripts/make-map.mjs <countries.geo.json> ${MODE}\`, ne pas éditer à la main.
 * ${DESCRIPTION}
 * Les terres sont en teal (aplat + trame) et leurs contours se tracent au fil du défilement
 * (data-draw + data-draw-scrub).
 * Purement décorative (aria-hidden) : la légende est rendue par la section.
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
