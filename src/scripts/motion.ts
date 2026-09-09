/**
 * MOTEUR D'ANIMATION DÉCLARATIF (GSAP 3 + ScrollTrigger) — référence pour toutes les sections.
 * Tout se pilote par attributs dans le HTML ; aucune section n'écrit de code GSAP.
 *
 * Ce fichier est le point d'entrée LÉGER (sans GSAP, dans le chunk principal avec consent/analytics) :
 * classes d'état (data-on-load, data-in-view), puis chargement du moteur GSAP (motion/engine.ts) en
 * chunk séparé via `import()` — au premier temps d'inactivité (requestIdleCallback, 1 s maximum),
 * jamais en `prefers-reduced-motion: reduce` (GSAP n'est alors pas téléchargé). GSAP core +
 * ScrollTrigger ≈ 45 Ko gzip, moteur ≈ 4 Ko : hors du chemin critique (pas de modulepreload, requête
 * après le chunk principal), mais le budget « < 40 Ko gzip » n'est pas atteignable avec ScrollTrigger.
 *
 * ┌ VOCABULAIRE ─────────────────────────────────────────────────────────────────────────────────┐
 * │ Chargement (CSS pur, sans GSAP)                                                               │
 * │  data-intro="1|2|3…"          cascade d'entrée (opacity + translateY 18 px, 500 ms, expo.out,  │
 * │                               70 ms par rang, ≤ 6 rangs) jouée au premier rendu : classe       │
 * │                               `intro` rendue côté serveur sur <html> (Base.astro), animation   │
 * │                               CSS `intro-in` (global.css). Déterministe, aucun flash.          │
 * │  data-intro-move              variante par transform seul (translateY 14 px, opacité intacte) │
 * │                               OBLIGATOIRE sur un candidat LCP (grand paragraphe du 1er        │
 * │                               viewport) : un élément à opacité 0 est ignoré par le LCP.        │
 * │  data-on-load="classe"        classe ajoutée à `load` (états CSS, ex. dézoom hero).          │
 * │  data-in-view="classe"        classe posée tant que l'élément est dans le viewport (IO) :     │
 * │                               animations CSS continues jouées seulement à l'écran.            │
 * │ Révélations uniques (once, interruptibles, 88 % du viewport) — motion/reveal.ts              │
 * │  data-animate="fade-up|fade|scale|tilt|clip|stagger"  + data-animate-delay / -stagger / -y   │
 * │                               0,7 s / 24 px / expo.out (titres : 0,9 s) ; `clip` réservé aux  │
 * │                               médias (sinon fade-up) ; un élément déjà à l'écran à l'init     │
 * │                               n'est pas animé (pas de flash).                                  │
 * │  data-reveal-text[="scrub"]   mot à mot — titres courts (≤ 12 mots) uniquement. → text.ts     │
 * │  data-counter="160000"        + -prefix / -suffix / -decimals / -from / -duration (fr-FR)     │
 * │  data-draw[="width"]          tracé SVG (stroke-dashoffset) ou barre (scaleX) ; data-draw-scrub│
 * │  data-fill="0.57"             jauge (scaleX, ou scaleY avec data-fill-axis="y")               │
 * │ Scènes au scroll (scrub ≤ 1, transform/opacity uniquement) — motion/scroll.ts, scene.ts      │
 * │  data-parallax="0.15"         + -trigger / -start / -end                                      │
 * │  data-scrub="scale:1,1.08|opacity:1,0"  + -trigger / -start / -end / -ease                    │
 * │  data-scene + data-scene-end="+=120%"   enfants [data-step] (+ data-step-stay), classe        │
 * │                               `scene-stack` pour superposer les steps ; RiskNote HORS des     │
 * │                               steps (toujours visible).                                        │
 * │  data-curtain                 la section recouvre la précédente (pin) ; recul scale 0.96 /    │
 * │                               opacity 0.6 seulement si la précédente n'a aucun [data-risk].   │
 * │  data-pin + data-pin-end      épinglage simple (compatibilité)                                │
 * │ Navigation — motion/progress.ts                                                               │
 * │  data-progress                barre de lecture (scaleX sur <main>) ; data-compact-at="0.4"    │
 * │ Exclusion                                                                                     │
 * │  data-no-motion               l'élément et ses descendants sont exclus de tout effet          │
 * └───────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * GARDE-FOUS (appliqués par le moteur, contrôlés par scripts/check-compliance.mjs et tests/) :
 *  - Jamais d'effet sur le H1, sur un [data-risk] (ligne risques, contre-poids, avertissements
 *    réglementaires) ni sur les mentions du footer — ni directement, ni PAR UN ANCÊTRE : tout
 *    attribut est refusé sur un élément qui contient un risque (révélation, scrub, parallaxe, intro,
 *    reveal-text, scène) ; les enfants d'un `stagger` qui en contiennent restent visibles ; le recul
 *    du rideau est supprimé si la section précédente en contient un. Une révélation n'enveloppe donc
 *    jamais un risque : on anime l'avantage seul (modèle : 02-Highlights).
 *  - L'image du hero n'est jamais animée avant le LCP : seul un dézoom CSS après `load` est admis.
 *    Jamais de data-intro (opacité) ni de data-animate sur un candidat LCP.
 *  - prefers-reduced-motion: reduce → rien n'est créé (GSAP non chargé, gsap.matchMedia ensuite) :
 *    contenu visible et stable ; cascade CSS et transitions coupées par @media.
 *  - Transform et opacity uniquement (mini-syntaxe filtrée, `clip` limité aux médias) ; `will-change`
 *    posé le temps de l'animation (onToggle pour les scènes) ; pins avec anticipatePin/fastScrollEnd ;
 *    scrub ≤ 1 ; pas de scroll hijacking.
 *  - Jamais d'état initial invisible en CSS : c'est GSAP qui pose l'état de départ (anti-CLS, no-JS) ;
 *    la cascade d'entrée CSS se résout seule (animation-fill-mode: backwards, 850 ms au plus).
 *  - Les valeurs finales (compteurs, jauges, textes) sont dans le HTML : sans JS, tout est exact.
 */
import { all, allowed } from './motion/dom';
import { setupInView } from './motion/inview';
import { setupLoadedClasses } from './motion/loaded';

const IDLE_TIMEOUT = 1000;

const boot = () => {
  setupLoadedClasses();
  setupInView();
  // La cascade d'entrée est en CSS : on contrôle seulement, en développement, qu'elle n'enveloppe
  // aucun H1 ni [data-risk].
  if (import.meta.env.DEV) all('[data-intro]').forEach((el) => allowed(el, 'data-intro', true));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let engine: Promise<void> | undefined;
  const load = () => (engine ??= import('./motion/engine').then((m) => m.start()));
  const schedule = () => {
    const idle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback.bind(window) : undefined;
    if (document.readyState === 'complete') void load();
    else if (idle) idle(() => void load(), { timeout: IDLE_TIMEOUT });
    else window.setTimeout(() => void load(), 50);
  };
  if (!reduced.matches) schedule();
  // Préférence levée en cours de visite : le moteur se charge alors (gsap.matchMedia prend le relais).
  reduced.addEventListener('change', (e) => {
    if (!e.matches) void load();
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

export {};
