/**
 * Vol de la marque : le grand logo R Start du hero se détache au défilement, monte d'abord avec la
 * page, puis s'infléchit vers le coin supérieur gauche en rétrécissant jusqu'à la position exacte du
 * logo de la navigation collée en haut, et lui passe le relais en fondu croisé (élément partagé façon
 * page produit Apple). Recréé le 11/09/2026 après le retrait de la photo de fond du hero.
 *
 * Vocabulaire :
 *  - `data-brand-flight` : le bloc logo du hero (.hero-logo-stack, image décorative aria-hidden, dans
 *    le H1 dont le texte reste en visually-hidden). Le H1 n'est jamais transformé : il réserve la place
 *    du logo en CSS (.hero-logo-wrap), aucun décalage de mise en page quand le bloc passe dans son
 *    calque fixe (.brand-flyer, global.css).
 *  - `data-brand-target` : le logo de la barre (src/components/SiteNav.astro). Masqué dès le rendu
 *    serveur sur les pages qui portent le vol (global.css : ≥ 40 rem, no-preference, scripting
 *    activé), révélé par le fondu croisé ; son opacité est ensuite pilotée ici, en ligne.
 *
 * Trajectoire, u = défilement / distance de vol (0 → 1) :
 *  - vertical : Hermite cubique dont la vitesse initiale est celle de la page (−1 px par px défilé) et
 *    la vitesse finale nulle : à u = 0 le logo monte exactement avec le hero (il en fait encore partie),
 *    puis il décolle et freine en arrivant sur la ligne du logo de la barre. Aucun dépassement tant que
 *    la distance de vol reste < 3 × la hauteur à parcourir (FLIGHT_FACTOR = 2 le garantit) ;
 *  - horizontal : power3.out — il glisse tôt vers la gauche, l'arc reste à gauche des entrées du menu ;
 *  - échelle : power2.out, de 1 au rapport largeur cible / largeur d'origine (origine 0 0).
 *  Distance de vol bornée à 60 % de la hauteur du viewport : le relais est terminé bien avant que le
 *  hero ait quitté l'écran.
 * Relais : fondu croisé calque → logo de la barre sur les 12 derniers % du vol, quand les deux occupent
 * la même place à quelques pixels près. Le calque est AU-DESSUS de la barre (z 45) : il se pose net sur
 * le verre au lieu d'être flouté sous lui ; le panneau du menu (z 50) le recouvre s'il s'ouvre.
 *
 * Garde-fous : transform et opacity uniquement, appliqués en direct (aucun lissage : à 0 le logo doit
 * rester collé à sa place) ; rien sans le moteur (donc rien en prefers-reduced-motion) ; rien sous
 * 40 rem ni si la cible est masquée ; tout est réversible (fonction de nettoyage rendue à
 * gsap.matchMedia, qui l'appelle si la fenêtre passe sous 40 rem ou si la préférence change).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Le vol a lieu à TOUTES les largeurs depuis le 11/09/2026 : sur téléphone aussi, le logo rejoint le coin
 *  supérieur gauche et le CTA le coin supérieur droit de la barre. Seule condition restante : la cible doit
 *  être réellement affichée (sinon il n'y a nulle part où atterrir). */
/** Distance de vol = FLIGHT_FACTOR × hauteur à parcourir, bornée en pixels et en fraction du viewport. */
const FLIGHT_FACTOR = 2;
const FLIGHT_MIN = 160;
const FLIGHT_MAX_VH = 0.6;
/** Début du fondu croisé, en fraction du vol. */
const HANDOVER_START = 0.88;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeX = gsap.parseEase('power3.out');
const easeScale = gsap.parseEase('power2.out');

/**
 * Hermite cubique en u ∈ [0, 1] : part de `from` à la vitesse de la page (−distance par unité de u,
 * soit −1 px par px défilé), arrive en `to` à vitesse nulle.
 */
const hermiteY = (u: number, from: number, to: number, distance: number): number => {
  const u2 = u * u;
  const u3 = u2 * u;
  return from + (to - from) * (3 * u2 - 2 * u3) - distance * (u3 - 2 * u2 + u);
};

interface Geometry {
  /** Place du logo dans le hero : haut en coordonnées de page, gauche et largeur (viewport). */
  homeTop: number;
  homeLeft: number;
  homeWidth: number;
  /** Logo de la barre dans le viewport (la barre est collée en haut). */
  restTop: number;
  restLeft: number;
  restWidth: number;
  /** Défilement au terme duquel le logo est posé sur sa cible et le relais achevé. */
  distance: number;
}

/**
 * Un vol : un élément du hero rejoint sa place dans la barre, puis passe le relais en fondu croisé.
 * `clone: true` fait voler une COPIE décorative (le CTA reste en place dans le hero : il doit rester
 * cliquable, porter son suivi analytique et servir de repère au test « les CTA du hero sont visibles
 * sans scroller ») ; sinon l'élément lui-même est déplacé dans le calque (cas du logo).
 */
const makeFlight = (
  sourceSelector: string,
  targetSelector: string,
  { clone = false }: { clone?: boolean } = {}
): (() => void) => {
  const source = document.querySelector<HTMLElement>(sourceSelector);
  const target = document.querySelector<HTMLElement>(targetSelector);
  const home = source?.parentElement ?? null;
  if (!source || !target || !home) return () => {};
  const brand = clone ? (source.cloneNode(true) as HTMLElement) : source;
  if (clone) {
    brand.removeAttribute('id');
    brand.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    // La copie ne doit ni déclencher l'analytique, ni être atteinte au clavier, ni être lue : un élément
    // focalisable sous aria-hidden est une violation (axe « aria-hidden-focus »), d'où le tabindex -1 sur
    // TOUS les focalisables, pas seulement ceux qui portent data-cta.
    brand.querySelectorAll('[data-cta]').forEach((el) => {
      el.removeAttribute('data-cta');
      el.removeAttribute('data-cta-position');
    });
    brand
      .querySelectorAll('a, button, input, select, textarea, [tabindex], [contenteditable]')
      .forEach((el) => el.setAttribute('tabindex', '-1'));
    brand.setAttribute('aria-hidden', 'true');
  }
  // Petit écran ou cible masquée : la marque reste dans le hero et la barre garde son logo, sans vol.
  if (target.offsetParent === null) return () => {};

  const flyer = document.createElement('div');
  flyer.className = 'brand-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.appendChild(brand);
  document.body.appendChild(flyer);
  target.style.opacity = '0';

  let geo: Geometry | null = null;
  /** Dernier avancement appliqué du relais (0 : le calque porte la marque, 1 : la barre). */
  let landed = -1;

  const measure = (): Geometry | null => {
    gsap.set(flyer, { clearProps: 'transform,width' });
    // Point de départ : la COPIE laisse l'original en place (on mesure l'original) ; le déplacement, lui,
    // vide son parent, qui réserve la place (`.hero-logo-wrap`) — c'est donc lui qu'il faut mesurer.
    const homeRect = (clone ? source : home).getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!homeRect.width || !targetRect.width) return null;
    const homeTop = homeRect.top + window.scrollY;
    const climb = Math.max(1, homeTop - targetRect.top);
    const distance = Math.max(
      FLIGHT_MIN,
      Math.min(climb * FLIGHT_FACTOR, window.innerHeight * FLIGHT_MAX_VH)
    );
    return {
      homeTop,
      homeLeft: homeRect.left,
      homeWidth: homeRect.width,
      restTop: targetRect.top,
      restLeft: targetRect.left,
      restWidth: targetRect.width,
      distance,
    };
  };

  /** Mesure (à chaque refresh de ScrollTrigger) et rend la distance de vol pour la borne `end`. */
  const remeasure = (): number => {
    geo = measure();
    landed = -1;
    if (geo) gsap.set(flyer, { width: geo.homeWidth });
    return geo?.distance ?? 1;
  };

  const handover = (u: number) => {
    const hand = clamp01((u - HANDOVER_START) / (1 - HANDOVER_START));
    if (hand === landed) return;
    landed = hand;
    // Copie en vol : l'original reste en place dans le hero mais s'efface, sinon on le verrait en double.
    if (clone) source.style.opacity = String(1 - clamp01(u * 6));
    flyer.style.opacity = String(1 - hand);
    // Relais achevé : le calque, invisible, ne conserve plus de couche de composition.
    flyer.style.visibility = hand >= 1 ? 'hidden' : '';
    target.style.opacity = String(hand);
  };

  const apply = (scroll: number) => {
    if (!geo) return;
    const u = clamp01(scroll / geo.distance);
    gsap.set(flyer, {
      x: lerp(geo.homeLeft, geo.restLeft, easeX(u)),
      // Rebond élastique (défilement négatif) : le logo suit simplement la page.
      y: scroll < 0 ? geo.homeTop - scroll : hermiteY(u, geo.homeTop, geo.restTop, geo.distance),
      scale: lerp(1, geo.restWidth / geo.homeWidth, easeScale(u)),
    });
    handover(u);
  };

  remeasure();
  const st = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: () => '+=' + remeasure(),
    onRefresh: () => apply(window.scrollY),
    onUpdate: (self) => apply(self.scroll()),
    onLeave: () => apply(window.scrollY),
    onEnterBack: () => apply(window.scrollY),
  });
  apply(window.scrollY);

  return () => {
    st.kill();
    gsap.set(flyer, { clearProps: 'all' });
    if (!clone) home.appendChild(brand);
    flyer.remove();
    source.style.removeProperty('opacity');
    target.style.removeProperty('opacity');
  };
};

/**
 * Les deux vols de l'ouverture : le logo vers le coin supérieur gauche, le CTA vers le coin supérieur
 * droit. Ils partagent la même mécanique et la même distance : ils atterrissent ensemble.
 */
export const setupBrandFlight = (): (() => void) => {
  const stops = [
    makeFlight('[data-brand-flight]', '[data-brand-target]'),
    makeFlight('[data-hero-cta]', '[data-cta-target]', { clone: true }),
  ];
  return () => stops.forEach((stop) => stop());
};
