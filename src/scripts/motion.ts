/**
 * MOTEUR D'ANIMATION DÉCLARATIF (GSAP 3 + ScrollTrigger), référence pour toutes les sections.
 * Tout se pilote par attributs dans le HTML ; aucune section n'écrit de code GSAP.
 *
 * Ce fichier est le point d'entrée LÉGER (sans GSAP, dans le chunk principal avec consent/analytics) :
 * classes d'état (data-on-load, data-in-view), puis chargement d'un moteur en chunk séparé via
 * `import()`, au premier temps d'inactivité (requestIdleCallback, 1 s maximum), jamais en
 * `prefers-reduced-motion: reduce` (rien n'est alors téléchargé).
 * DEUX MOTEURS, un seul par page, choisi d'après ce que la page déclare :
 *  - motion/engine.ts (GSAP + ScrollTrigger, ≈ 45 Ko gzip + 4 Ko) dès qu'un effet de la liste
 *    BESOIN_GSAP est présent, épinglage, défilement lié, tracé, compteur, texte mot à mot.
 *    Aujourd'hui : l'accueil et /strategie ;
 *  - motion/lite.ts (≈ 1 Ko, IntersectionObserver + transitions CSS) sinon : il rend les révélations
 *    `data-animate` avec les mêmes types, les mêmes durées et LES MÊMES GARDE-FOUS. Les sous-pages ne
 *    déclarent que cela : elles ne téléchargent plus GSAP.
 * Les deux ne cohabitent jamais : aucune double animation possible.
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
 * │ Révélations uniques (once, interruptibles, 88 % du viewport), motion/reveal.ts              │
 * │  data-animate="fade-up|fade|scale|tilt|clip|stagger"  + data-animate-delay / -stagger / -y   │
 * │                               rythme unique (shared.ts) : 0,6 s / 20 px / expo.out, titres    │
 * │                               0,7 s / 24 px, cascade 0,08 s ; `tilt` réservé à un objet visuel │
 * │                               isolé (picto), `clip` aux médias (sinon fade-up) ; un élément    │
 * │                               déjà à l'écran à l'init n'est pas animé (pas de flash).         │
 * │  data-reveal-text[="scrub"]   mot à mot, H2 de chapitre (≤ 12 mots) uniquement. → text.ts    │
 * │  data-counter="160000"        + -prefix / -suffix / -decimals / -from / -duration (fr-FR) ;   │
 * │                               chiffres non réglementaires seulement (jamais un frais, un SRI) │
 * │  data-draw[="width"]          tracé SVG (stroke-dashoffset) ou barre (scaleX) ; data-draw-scrub│
 * │  data-fill="0.57"             jauge (scaleX, ou scaleY avec data-fill-axis="y")               │
 * │ Scènes au scroll (lissage SCRUB 0,6 partout, transform/opacity), motion/scroll.ts, scene.ts │
 * │  data-parallax="0.15"         + -trigger / -start / -end                                      │
 * │  data-scrub="scale:1,1.08|opacity:1,0"  + -trigger / -start / -end / -ease                    │
 * │  data-scene + data-scene-end="+=120%"   enfants [data-step] (+ data-step-stay), classe        │
 * │                               `scene-stack` pour superposer les steps ; RiskNote HORS des     │
 * │                               steps (toujours visible).                                        │
 * │  data-curtain                 la section recouvre la précédente (pin) ; recul scale 0.96 /    │
 * │                               opacity 0.6 seulement si la précédente n'a aucun [data-risk] ;  │
 * │                               jamais après un épinglage, seulement clair → ink.                │
 * │  data-pin + data-pin-end      épinglage simple (compatibilité)                                │
 * │ Exclusion                                                                                     │
 * │  data-no-motion               l'élément et ses descendants sont exclus de tout effet          │
 * └───────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * SOBRIÉTÉ (passe du 11/09/2026, niveau page produit) : au plus UN effet d'entrée par bloc de contenu
 * (carte, liste, titre), jamais sur un conteneur ET son contenu ; surtitres statiques ; H2 de chapitre mot à
 * mot, introduction en fade-up ; dans une carte, seul le titre (ou le picto) entre, description et risque
 * sont en place ; une seule scène (frais) et un seul rideau (Risques) sur l'accueil.
 *
 * GARDE-FOUS (appliqués par le moteur, contrôlés par scripts/check-compliance.mjs et tests/) :
 *  - Jamais d'effet sur le H1, sur un [data-risk] (ligne risques, contre-poids, avertissements
 *    réglementaires) ni sur les mentions du footer, ni directement, ni PAR UN ANCÊTRE : tout
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

/**
 * Effets qui exigent GSAP + ScrollTrigger : épinglage, défilement lié, tracé, compteur, découpe de
 * texte. Une page qui n'en déclare aucun n'a besoin que des révélations `data-animate`, rendues par
 * le moteur léger (motion/lite.ts) : elle ne télécharge pas les 45 Ko gzip de la bibliothèque.
 * La navigation (src/components/SiteNav.astro) ne dépend d'aucun moteur (plus de barre de progression,
 * CTA compact géré par son script inline) ; seul l'accueil, dont le hero porte `[data-brand-flight]`,
 * charge GSAP pour le vol de la marque vers la barre (motion/brandflight.ts, recréé le 11/09/2026).
 */
const BESOIN_GSAP = [
  '[data-scene]',
  '[data-curtain]',
  '[data-pin]',
  '[data-parallax]',
  '[data-scrub]',
  '[data-draw]',
  '[data-fill]',
  '[data-counter]',
  '[data-reveal-text]',
  '[data-brand-flight]',
].join(',');

const boot = () => {
  setupLoadedClasses();
  setupInView();
  // La cascade d'entrée est en CSS : on contrôle seulement, en développement, qu'elle n'enveloppe
  // aucun H1 ni [data-risk].
  if (import.meta.env.DEV) all('[data-intro]').forEach((el) => allowed(el, 'data-intro', true));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const besoinGsap = document.querySelector(BESOIN_GSAP) !== null;
  let engine: Promise<void> | undefined;
  // Deux fonctions distinctes, et non un ternaire à l'intérieur d'un seul `import()` : sinon le
  // bundler réunit les dépendances des deux branches et précharge GSAP même quand la page prend le
  // moteur léger. Vérifié par tests/performance.spec.ts (aucune requête vers engine.*.js).
  const chargerMoteur = (): Promise<void> => import('./motion/engine').then((m) => m.start());
  const chargerLeger = (): Promise<void> => import('./motion/lite').then((m) => m.setupLite());
  const load = () => (engine ??= besoinGsap ? chargerMoteur() : chargerLeger());
  const schedule = () => {
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback.bind(window)
        : undefined;
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
