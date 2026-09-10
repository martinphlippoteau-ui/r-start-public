/**
 * Vol de la marque : le grand logo R Start du hero se détache, glisse vers le coin supérieur gauche
 * et passe le relais au logo de la navigation unique, collée en haut de page depuis le premier écran
 * (effet « élément partagé » façon page produit Apple).
 *
 * Vocabulaire :
 *  - `data-brand-flight` : le bloc logo du hero (images décoratives, aria-hidden, dans le H1 dont le
 *    texte reste présent en visually-hidden). Le H1 n'est jamais transformé et réserve la place du
 *    logo en CSS : aucun décalage de mise en page quand le bloc passe dans son calque fixe.
 *  - `data-brand-target` : le logo de la barre (src/components/SiteNav.astro). Masqué dès le rendu
 *    serveur sur les pages qui portent le vol (global.css), révélé à l'arrivée du calque.
 *
 * Trajectoire : le calque est fixe, donc toujours à l'écran. L'accélération `power2.out` fait qu'au
 * tout début il monte presque à la vitesse de la page (détachement naturel), puis il ralentit en
 * arrivant dans le coin. La barre ne bouge plus (elle est collée dès le chargement) : le passage de
 * relais se joue donc sur la fin de la trajectoire, en fondu croisé entre le calque et le logo de la
 * barre, tous deux exactement au même endroit. Le calque passe SOUS la barre (z-index) : il n'est
 * jamais coupé en deux par le bord du bandeau.
 *
 * Garde-fous : transform et opacity uniquement ; rien sans le moteur (donc rien en
 * `prefers-reduced-motion: reduce`) ; rien sous 40 rem ni si la cible est masquée ; tout est
 * réversible.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Distance de vol : le logo a rejoint le coin quand le titre aurait fini de quitter l'écran. */
const FLIGHT_FACTOR = 1.35;
const FLIGHT_MIN = 240;
/** Le vol n'a lieu qu'à partir de « sm » : sous cette largeur, la barre porte déjà la marque et le
 *  relais serait illisible (même seuil que la règle de masquage de global.css). */
const FLIGHT_MEDIA = '(min-width: 40rem)';
/** Fondu croisé : de 90 % à 110 % de la distance de vol, le calque étant alors posé sur sa cible. */
const HANDOVER_START = 0.9;
const HANDOVER_END = 1.1;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const ease = gsap.parseEase('power2.out');

interface Geometry {
  homeTop: number;
  homeLeft: number;
  homeWidth: number;
  /** Position du logo de la barre dans le viewport (elle est collée en haut) et sa largeur. */
  restTop: number;
  restLeft: number;
  restWidth: number;
  /** Défilement auquel le logo a fini de rejoindre le coin. */
  flightEnd: number;
  /** Défilement auquel le fondu croisé commence et se termine : fin de la mission du calque. */
  handStart: number;
  handEnd: number;
}

export const setupBrandFlight = (): (() => void) => {
  const brand = document.querySelector<HTMLElement>('[data-brand-flight]');
  const target = document.querySelector<HTMLElement>('[data-brand-target]');
  const home = brand?.parentElement ?? null;
  if (!brand || !target || !home) return () => {};
  // Petit écran ou cible masquée : la marque reste dans le hero et la barre garde son logo, sans vol.
  if (!window.matchMedia(FLIGHT_MEDIA).matches || target.offsetParent === null) return () => {};

  const flyer = document.createElement('div');
  flyer.className = 'brand-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flyer);
  flyer.appendChild(brand);
  document.documentElement.classList.add('brand-flight');
  target.style.opacity = '0';

  let geo: Geometry | null = null;
  /** Avancement du passage de relais vers la barre (0 : le calque porte la marque, 1 : la barre). */
  let landed = -1;

  const measure = (): Geometry | null => {
    gsap.set(flyer, { clearProps: 'transform,width' });
    const homeRect = home.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!homeRect.width || !targetRect.width) return null;
    const homeTop = homeRect.top + window.scrollY;
    const flightEnd = Math.max(FLIGHT_MIN, (homeTop + homeRect.height) * FLIGHT_FACTOR);
    return {
      homeTop,
      homeLeft: homeRect.left,
      homeWidth: homeRect.width,
      restTop: targetRect.top,
      restLeft: targetRect.left,
      restWidth: targetRect.width,
      flightEnd,
      handStart: flightEnd * HANDOVER_START,
      handEnd: flightEnd * HANDOVER_END,
    };
  };

  /**
   * Passage de relais : les deux logos occupent exactement la même place, le fondu se joue sur la fin
   * de la trajectoire, quand le calque est déjà posé sur le logo de la barre.
   */
  const handover = (scroll: number) => {
    const hand = clamp01((scroll - geo!.handStart) / Math.max(1, geo!.handEnd - geo!.handStart));
    if (hand === landed) return;
    landed = hand;
    flyer.style.opacity = String(1 - hand);
    target.style.opacity = String(hand);
  };

  const apply = (scroll: number) => {
    if (!geo) return;
    const t = ease(clamp01(scroll / geo.flightEnd));
    gsap.set(flyer, {
      width: geo.homeWidth,
      x: lerp(geo.homeLeft, geo.restLeft, t),
      y: lerp(geo.homeTop, geo.restTop, t),
      scale: lerp(1, geo.restWidth / geo.homeWidth, t),
    });
    handover(scroll);
  };

  const refresh = () => {
    geo = measure();
    apply(window.scrollY);
  };

  refresh();

  const st = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: () => '+=' + (geo?.handEnd ?? 1),
    invalidateOnRefresh: true,
    onRefresh: refresh,
    onUpdate: (self) => apply(self.scroll()),
    onLeave: () => apply(window.scrollY),
    onEnterBack: () => apply(window.scrollY),
  });

  return () => {
    st.kill();
    gsap.set(flyer, { clearProps: 'all' });
    home.appendChild(brand);
    flyer.remove();
    document.documentElement.classList.remove('brand-flight');
    target.style.removeProperty('opacity');
  };
};
