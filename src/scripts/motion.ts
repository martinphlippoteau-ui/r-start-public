/**
 * MOTEUR D'ANIMATION DÉCLARATIF (GSAP 3 + ScrollTrigger), référence pour toutes les sections.
 * Tout se pilote par attributs dans le HTML ; aucune section n'écrit de code GSAP.
 *
 * Ce fichier est le point d'entrée LÉGER (sans GSAP, dans le chunk principal avec consent/analytics) :
 * classe d'état (data-in-view), puis chargement d'un moteur en chunk séparé via
 * `import()`, au premier temps d'inactivité (requestIdleCallback, 1 s maximum), jamais en
 * `prefers-reduced-motion: reduce` (rien n'est alors téléchargé).
 * DEUX MOTEURS, un seul par page, choisi d'après ce que la page déclare :
 *  - motion/engine.ts (GSAP + ScrollTrigger, ≈ 45 Ko gzip + 4 Ko) dès qu'un effet de la liste
 *    BESOIN_GSAP est présent : rideau, défilement lié, tracé, texte mot à mot.
 *    Aujourd'hui : l'accueil et /strategie ;
 *  - motion/lite.ts (≈ 1 Ko, IntersectionObserver + transitions CSS) sinon : il rend les révélations
 *    `data-animate` avec les mêmes types, les mêmes durées et LES MÊMES GARDE-FOUS. Les sous-pages ne
 *    déclarent que cela : elles ne téléchargent plus GSAP.
 * Les deux ne cohabitent jamais : aucune double animation possible.
 *
 * RETIRÉS LE 22/09/2026, après trois jours en sommeil sans qu'aucune page ne les porte : `data-on-load`
 * (loaded.ts), `data-counter` (counter.ts, et le compteur de ui/Stat.astro), `data-fill` (draw.ts),
 * `data-scene` (scene.ts) et `data-pin` (scroll.ts). L'historique git les garde.
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
 * │  data-in-view="classe"        classe posée tant que l'élément est dans le viewport (IO) :     │
 * │                               animations CSS continues jouées seulement à l'écran.            │
 * │ Révélations uniques (once, interruptibles, 88 % du viewport), motion/reveal.ts              │
 * │  data-animate="fade-up|clip|stagger"  + data-animate-delay / -stagger / -y                   │
 * │                               rythme unique (shared.ts) : 0,6 s / 20 px / expo.out, titres    │
 * │                               0,7 s / 24 px, cascade 0,08 s ; `clip` réservé aux médias       │
 * │                               (sinon fade-up) ; data-animate-child="tilt" : enfants d'un       │
 * │                               `stagger` en bascule (GSAP) ; un élément déjà à l'écran à       │
 * │                               l'init n'est pas animé (pas de flash).                          │
 * │  data-reveal-text             mot à mot, H2 de chapitre (≤ 12 mots) uniquement. → text.ts    │
 * │  data-draw                    tracé SVG (stroke-dashoffset) ; + data-draw-scrub / -start / -end│
 * │ Effets au scroll (lissage SCRUB 0,6 partout, transform/opacity), motion/scroll.ts           │
 * │  data-parallax="0.15"         + -trigger                                                      │
 * │  data-scrub="scale:1,1.08|opacity:1,0"  + -trigger / -start / -end / -ease ; `blur:0,10` (px)  │
 * │                               admis pour un objet décoratif isolé, jamais du texte (shared.ts)  │
 * │  data-curtain                 la section recouvre la précédente (pin) ; recul scale 0.96 /    │
 * │                               opacity 0.6 seulement si la précédente n'a aucun H1 ;           │
 * │                               jamais après un épinglage, seulement clair → ink.                │
 * │ Exclusion                                                                                     │
 * │  data-no-motion               l'élément et ses descendants sont exclus de tout effet          │
 * └───────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * SOBRIÉTÉ (passe du 11/09/2026, niveau page produit) : au plus UN effet d'entrée par bloc de contenu
 * (carte, liste, titre), jamais sur un conteneur ET son contenu ; surtitres statiques ; H2 de chapitre mot à
 * mot, introduction en fade-up ; dans une carte, seul le titre (ou le picto) entre, la description est
 * en place ; AUCUNE scène épinglée sur le site depuis le 14/09/2026 (celle du mot d'ordre de la
 * stratégie est partie avec son texte), et deux rideaux sur l'accueil : 01b-Différence sur le hero,
 * 08-Risques sur Souscrire. /strategie porte le troisième, le même bloc Risques sur ses volets.
 *
 * GARDE-FOUS (appliqués par le moteur, contrôlés par scripts/check-compliance.mjs et tests/) :
 *  - Jamais d'effet sur le H1 ni sur un [data-no-motion], ni directement, ni PAR UN ANCÊTRE : tout
 *    attribut est refusé sur un élément qui en contient un (révélation, scrub, parallaxe, intro,
 *    reveal-text) ; les enfants d'un `stagger` qui en contiennent restent visibles ; le recul du
 *    rideau est supprimé si la section précédente en contient un. Les mentions du footer ne portent
 *    aucun attribut d'animation. Les contre-poids risque, protégés de la même façon par
 *    `[data-risk]`, ont quitté le site le 14/09/2026 et le moteur le 22/09/2026.
 *  - Jamais de data-intro (opacité) ni de data-animate sur un candidat LCP : un élément à opacité 0
 *    est ignoré par le LCP.
 *  - prefers-reduced-motion: reduce → rien n'est créé (GSAP non chargé, gsap.matchMedia ensuite) :
 *    contenu visible et stable ; cascade CSS et transitions coupées par @media.
 *  - Transform et opacity uniquement (mini-syntaxe filtrée, `clip` limité aux médias) ; `will-change`
 *    posé le temps de l'animation ; rideaux avec anticipatePin/fastScrollEnd ;
 *    scrub ≤ 1 ; pas de scroll hijacking, SANS EXCEPTION : celle du hero de l'accueil, franchi d'un
 *    seul geste du 17 au 19/09/2026, a été retirée à la demande de Martin. Le défilement est partout
 *    celui du navigateur.
 *  - Jamais d'état initial invisible en CSS : c'est GSAP qui pose l'état de départ (anti-CLS, no-JS) ;
 *    la cascade d'entrée CSS se résout seule (animation-fill-mode: backwards, 850 ms au plus).
 *  - Les valeurs finales (textes, tracés) sont dans le HTML : sans JS, tout est exact.
 */
import { all, allowed } from './motion/dom';
import { setupInView } from './motion/inview';

const IDLE_TIMEOUT = 1000;

/**
 * Effets qui exigent GSAP + ScrollTrigger : rideau, défilement lié, tracé, découpe de texte. Une page qui n'en déclare aucun n'a besoin que des révélations `data-animate`, rendues par
 * le moteur léger (motion/lite.ts) : elle ne télécharge pas les 45 Ko gzip de la bibliothèque.
 * La navigation (src/components/SiteNav.astro) ne dépend d'aucun moteur : ni barre de progression, ni
 * vol de la marque (retiré le 12/09/2026, la barre est identique sur tout le site), et le CTA compact
 * est géré par son script en ligne.
 */
const BESOIN_GSAP = [
  '[data-curtain]',
  '[data-parallax]',
  '[data-scrub]',
  '[data-draw]',
  '[data-reveal-text]',
].join(',');

const boot = () => {
  setupInView();
  // La cascade d'entrée est en CSS : on contrôle seulement, en développement, qu'elle n'enveloppe
  // aucun élément protégé.
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
