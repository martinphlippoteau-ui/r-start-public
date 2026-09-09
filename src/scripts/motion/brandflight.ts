/**
 * Vol de la marque : le grand logo R Start du hero se détache, glisse vers le coin supérieur gauche,
 * y reste pendant la traversée du hero, puis passe le relais au logo de la sous-navigation quand
 * celle-ci se colle en haut (effet « élément partagé » façon page produit Apple).
 *
 * Vocabulaire :
 *  - `data-brand-flight` : le bloc logo du hero (images décoratives, aria-hidden, dans le H1 dont le
 *    texte reste présent en visually-hidden). Le H1 n'est jamais transformé et réserve la place du
 *    logo en CSS : aucun décalage de mise en page quand le bloc passe dans son calque fixe.
 *  - `data-brand-target` : le logo de la sous-navigation. Masqué pendant le vol, révélé à l'arrivée.
 *  - `data-brand-rest` : le logo du header, masqué tant que le vol est actif (le calque en tient lieu).
 *
 * Trajectoire : le calque est fixe, donc toujours à l'écran. L'accélération `power2.out` fait qu'au
 * tout début il monte presque à la vitesse de la page (détachement naturel), puis il ralentit en
 * arrivant dans le coin. Le calque passe SOUS la barre (z-index) : quand celle-ci monte, un fondu
 * croisé sur la hauteur du logo échange le logo blanc du calque contre le logo couleur de la barre,
 * tous deux exactement au même endroit.
 *
 * Garde-fous : transform et opacity uniquement ; rien sans le moteur (donc rien en
 * `prefers-reduced-motion: reduce`) ; rien si la cible est masquée (sous « sm », la barre n'a pas la
 * place d'afficher la marque : le logo du hero défile alors normalement) ; tout est réversible.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Distance de vol : le logo a rejoint le coin quand le titre aurait fini de quitter l'écran. */
const FLIGHT_FACTOR = 1.35;
const FLIGHT_MIN = 240;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const ease = gsap.parseEase('power2.out');

interface Geometry {
  homeTop: number;
  homeLeft: number;
  homeWidth: number;
  /** Position du logo de la barre une fois celle-ci collée (repère viewport) et sa taille. */
  restTop: number;
  restLeft: number;
  restWidth: number;
  restHeight: number;
  /** Défilement auquel la barre se colle : fin de la mission du calque. */
  navScroll: number;
  /** Défilement auquel le logo a fini de rejoindre le coin. */
  flightEnd: number;
}

export const setupBrandFlight = (): (() => void) => {
  const brand = document.querySelector<HTMLElement>('[data-brand-flight]');
  const target = document.querySelector<HTMLElement>('[data-brand-target]');
  const rest = document.querySelector<HTMLElement>('[data-brand-rest]');
  const nav = document.querySelector<HTMLElement>('[data-subnav]');
  const home = brand?.parentElement ?? null;
  if (!brand || !target || !nav || !home) return () => {};
  // Cible masquée (petits écrans) : la marque reste dans le hero, sans vol.
  if (target.offsetParent === null) return () => {};

  const flyer = document.createElement('div');
  flyer.className = 'brand-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flyer);
  flyer.appendChild(brand);
  document.documentElement.classList.add('brand-flight');
  target.style.opacity = '0';
  // Le logo du header ferait double emploi avec le calque : masqué (et retiré du parcours clavier).
  if (rest) rest.style.visibility = 'hidden';

  let geo: Geometry | null = null;
  /** Avancement du passage de relais vers la barre (0 : le calque porte la marque, 1 : la barre). */
  let landed = -1;

  const measure = (): Geometry | null => {
    gsap.set(flyer, { clearProps: 'transform,width' });
    const homeRect = home.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!homeRect.width || !targetRect.width) return null;
    const scroll = window.scrollY;
    const homeTop = homeRect.top + scroll;
    const navScroll = Math.max(1, navRect.top + scroll);
    return {
      homeTop,
      homeLeft: homeRect.left,
      homeWidth: homeRect.width,
      restTop: targetRect.top - navRect.top,
      restLeft: targetRect.left,
      restWidth: targetRect.width,
      restHeight: targetRect.height,
      navScroll,
      flightEnd: Math.min(navScroll, Math.max(FLIGHT_MIN, (homeTop + homeRect.height) * FLIGHT_FACTOR)),
    };
  };

  /**
   * Passage de relais : les deux logos occupent exactement la même place, le fondu se joue pendant
   * que la barre monte de la hauteur du logo. Le calque passe sous la barre (z-index), il n'est donc
   * jamais coupé en deux par le bord du bandeau.
   */
  const handover = (barTop: number) => {
    const hand = clamp01((geo!.restTop + geo!.restHeight - barTop) / Math.max(1, geo!.restHeight));
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
    // Position du haut de la barre dans le viewport : elle monte, atteint le logo, puis se colle.
    handover(geo.navScroll - scroll);
  };

  const refresh = () => {
    geo = measure();
    apply(window.scrollY);
  };

  refresh();

  const st = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: () => '+=' + (geo?.navScroll ?? 1),
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
    if (rest) rest.style.removeProperty('visibility');
  };
};
