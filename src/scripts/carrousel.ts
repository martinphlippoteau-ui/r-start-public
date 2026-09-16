/**
 * Rail défilant à flèches (16/09/2026, carrousel de la gamme SCPI sur /a-propos).
 *
 * AMÉLIORATION PROGRESSIVE. Le rail est un simple conteneur à débordement horizontal avec accrochage :
 * sans JavaScript, il se fait déjà défiler au doigt, au pavé tactile et à la molette, et la tabulation
 * amène les cartes une à une. Les flèches arrivent `hidden` et ne sont révélées que par ce script ;
 * elles ne font donc jamais une promesse que la page ne tient pas.
 *
 * ON DÉFILE, ON NE TÉLÉPORTE PAS : `scrollBy` d'une carte à la fois, mesurée sur place plutôt
 * qu'écrite en dur, pour que la largeur puisse changer avec l'écran sans toucher au script.
 */
const PAS_DEFAUT = 320;

const init = (): void => {
  for (const rail of document.querySelectorAll<HTMLElement>('[data-rail]')) {
    if (rail.dataset.railLie === '1') continue;
    const zone = rail.closest<HTMLElement>('[data-rail-zone]');
    const precedent = zone?.querySelector<HTMLButtonElement>('[data-rail-precedent]');
    const suivant = zone?.querySelector<HTMLButtonElement>('[data-rail-suivant]');
    if (!precedent || !suivant) continue;
    rail.dataset.railLie = '1';

    /** Largeur d'une carte, gouttière comprise : c'est le pas de défilement. */
    const pas = (): number => {
      const premiere = rail.firstElementChild as HTMLElement | null;
      const seconde = premiere?.nextElementSibling as HTMLElement | null;
      if (!premiere) return PAS_DEFAUT;
      if (seconde) return seconde.getBoundingClientRect().left - premiere.getBoundingClientRect().left;
      return premiere.getBoundingClientRect().width;
    };

    /*
     * Une flèche qui ne mène nulle part est désactivée plutôt que masquée : masquée, elle déplacerait
     * l'autre à chaque bout de course. La marge d'un pixel absorbe les arrondis des navigateurs.
     */
    const rafraichir = (): void => {
      const max = rail.scrollWidth - rail.clientWidth;
      precedent.disabled = rail.scrollLeft <= 1;
      suivant.disabled = rail.scrollLeft >= max - 1;
    };

    precedent.hidden = false;
    suivant.hidden = false;
    precedent.addEventListener('click', () => rail.scrollBy({ left: -pas(), behavior: 'smooth' }));
    suivant.addEventListener('click', () => rail.scrollBy({ left: pas(), behavior: 'smooth' }));
    rail.addEventListener('scroll', rafraichir, { passive: true });
    window.addEventListener('resize', rafraichir);
    rafraichir();
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
