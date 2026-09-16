/**
 * Outils DOM du moteur d'animation, SANS GSAP : partagés par le point d'entrée léger (motion.ts, chargé
 * avec la page) et par le moteur GSAP (motion/engine.ts, chunk séparé chargé ensuite). Ne rien importer
 * de `gsap` ici : ce fichier doit rester dans le chunk principal sans y entraîner la bibliothèque.
 * Référence complète du vocabulaire : src/scripts/motion.ts.
 */

/** Éléments qui ne s'animent jamais, ni eux-mêmes ni par un ancêtre animé. */
export const PROTECTED = 'h1, [data-risk], [data-no-motion]';

/** Vrai si l'élément est lui-même protégé ou se trouve dans un élément protégé. */
export const isProtected = (el: Element): boolean => el.closest(PROTECTED) !== null;

/** Vrai si l'élément contient un élément protégé (interdit pour tout effet qui l'envelopperait). */
export const containsProtected = (el: Element): boolean => el.querySelector(PROTECTED) !== null;

/** Avertit en développement et renvoie false : l'attribut est ignoré. */
export const refuse = (el: Element, attr: string, why: string): false => {
  if (import.meta.env.DEV) console.warn(`[motion] ${attr} ignoré (${why})`, el);
  return false;
};

/**
 * Filtre standard : l'élément lui-même n'est pas protégé et, si `deep`, n'en contient pas. Tous les
 * effets qui altèrent l'apparence d'un conteneur (révélation, scrub, parallaxe, scène, rideau, intro)
 * passent par `deep = true` : un avantage s'anime seul, jamais avec le risque qui l'accompagne.
 */
export const allowed = (el: Element, attr: string, deep = false): boolean => {
  if (isProtected(el)) return refuse(el, attr, 'H1, [data-risk] ou [data-no-motion]');
  if (deep && containsProtected(el)) {
    return refuse(
      el,
      attr,
      'contient un H1 ou un [data-risk] : animer l’avantage seul, jamais son enveloppe'
    );
  }
  return true;
};

/** Nombre lu dans un attribut, avec valeur par défaut. */
export const num = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return value === undefined || value === '' || Number.isNaN(n) ? fallback : n;
};

/** Liste typée d'éléments pour un sélecteur. */
export const all = (selector: string, root: ParentNode = document): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(selector));

/** Classes (séparées par des espaces) lues dans un attribut. */
export const classList = (value: string | undefined): string[] =>
  (value || '').split(/\s+/).filter(Boolean);

/**
 * UN SEUIL INATTEIGNABLE NE DOIT PAS LAISSER UN ÉLÉMENT INVISIBLE (audit du 16/09/2026). Les révélations
 * partent quand le haut de l'élément passe 88 % de l'écran ; un élément logé dans les derniers 12 % du
 * document n'y arrive jamais, la page ne défile pas assez loin, et il reste à opacité zéro. Constaté
 * sur téléphone : les colonnes du pied de page de l'accueil. Pour ceux-là, l'entrée dans l'écran suffit.
 * `ratio` : la part de l'écran que le haut de l'élément doit franchir (0,88 pour « top 88% »).
 */
export const seuilAtteignable = (el: Element, ratio: number): boolean => {
  const haut = el.getBoundingClientRect().top + window.scrollY;
  const defilementMax = document.documentElement.scrollHeight - window.innerHeight;
  return haut <= defilementMax + window.innerHeight * ratio;
};

/**
 * Élément déclencheur d'un effet au scroll : `data-*-trigger` accepte un sélecteur CSS (cherché
 * d'abord parmi les ancêtres, puis dans le document) ou le mot-clé `parent`. Sans valeur : l'élément.
 */
export const resolveTrigger = (el: HTMLElement, selector: string | undefined): Element => {
  if (!selector) return el;
  if (selector === 'parent') return el.parentElement ?? el;
  return el.closest(selector) ?? document.querySelector(selector) ?? el;
};
