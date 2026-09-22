/**
 * Outils DOM du moteur d'animation, SANS GSAP : partagés par le point d'entrée léger (motion.ts) et
 * le moteur GSAP (motion/engine.ts). Ne rien importer de `gsap` ici : ce fichier doit rester dans
 * le chunk principal sans y entraîner la bibliothèque. Vocabulaire : src/scripts/motion.ts.
 */

/** Éléments qui ne s'animent jamais, ni eux-mêmes ni par un ancêtre animé. */
export const PROTECTED = 'h1, [data-no-motion]';

/** Vrai si l'élément est lui-même protégé ou se trouve dans un élément protégé. */
export const isProtected = (el: Element): boolean => el.closest(PROTECTED) !== null;

/** Vrai si l'élément contient un élément protégé (interdit pour tout effet qui l'envelopperait). */
export const containsProtected = (el: Element): boolean => el.querySelector(PROTECTED) !== null;

/** Avertit en développement et renvoie false : l'attribut est ignoré. */
export const refuse = (el: Element, attr: string, why: string): false => {
  if (import.meta.env.DEV) console.warn(`[motion] ${attr} ignoré (${why})`, el);
  return false;
};

/** Filtre standard : l'élément n'est pas protégé et, si `deep`, n'en contient pas. Tout effet qui
    altère l'apparence d'un conteneur passe par `deep = true`. */
export const allowed = (el: Element, attr: string, deep = false): boolean => {
  if (isProtected(el)) return refuse(el, attr, 'H1 ou [data-no-motion]');
  if (deep && containsProtected(el)) {
    return refuse(
      el,
      attr,
      'contient un H1 ou un [data-no-motion] : animer le reste seul, jamais son enveloppe'
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

/** UN SEUIL INATTEIGNABLE NE DOIT PAS LAISSER UN ÉLÉMENT INVISIBLE : un élément logé dans les
    derniers 12 % du document ne passe jamais 88 % de l'écran et restait à opacité zéro (le pied de
    page, sur téléphone). Pour ceux-là, l'entrée dans l'écran suffit. `ratio` : la part à
    franchir (0,88). */
export const seuilAtteignable = (el: Element, ratio: number): boolean => {
  const haut = el.getBoundingClientRect().top + window.scrollY;
  const defilementMax = document.documentElement.scrollHeight - window.innerHeight;
  return haut <= defilementMax + window.innerHeight * ratio;
};

/** Déclencheur d'un effet au scroll : `data-*-trigger` accepte un sélecteur CSS (ancêtres d'abord,
    puis document) ou `parent`. Sans valeur : l'élément. */
export const resolveTrigger = (el: HTMLElement, selector: string | undefined): Element => {
  if (!selector) return el;
  if (selector === 'parent') return el.parentElement ?? el;
  return el.closest(selector) ?? document.querySelector(selector) ?? el;
};
