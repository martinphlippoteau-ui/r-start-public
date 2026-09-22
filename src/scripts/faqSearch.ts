/**
 * Recherche interne de /faq. Elle FILTRE une liste déjà rendue, elle n'interroge rien : toutes les
 * questions sont dans le HTML, la page se lit entière sans script, et le champ n'apparaît que si
 * celui-ci s'exécute (il arrive `hidden`, comme les boutons « i »).
 * LA COMPARAISON EST INSENSIBLE AUX ACCENTS ET À LA CASSE, par le pliage de tout le site
 * (src/lib/texte.ts). ON CHERCHE DANS LA QUESTION ET DANS LA RÉPONSE : « retrait » n'est dans aucun
 * intitulé mais dans trois réponses. LE FILTRAGE SE JOUE EN TRANSITION DE VUE : chaque question
 * porte un nom unique, le navigateur fait glisser celles qui restent au lieu d'un saut ; la page,
 * elle, ne bouge pas (global.css, `vt-filtre`). Sans l'API, ou en mouvement réduit : filtrage
 * instantané.
 */
import { plier } from '@/lib/texte';

const init = (): void => {
  const enveloppe = document.querySelector<HTMLElement>('[data-faq-recherche]');
  const liste = document.querySelector<HTMLElement>('[data-faq-liste]');
  if (!enveloppe || !liste) return;
  const champ = enveloppe.querySelector<HTMLInputElement>('input');
  const compte = enveloppe.querySelector<HTMLElement>('[data-faq-compte]');
  if (!champ) return;

  const lignes = [...liste.children].filter((e): e is HTMLElement => e instanceof HTMLElement);
  /* Le texte de chaque question est relevé UNE FOIS : refaire `textContent` à chaque frappe relit
     toutes les réponses, en entier, à chaque lettre. */
  /* La QUESTION ET SA RÉPONSE seulement, pas le libellé de rubrique que chaque <li> porte désormais :
     « frais » retiendrait sinon toute la rubrique « Les frais », questions sans rapport comprises. */
  const index = lignes.map((li) => plier((li.querySelector('details') ?? li).textContent ?? ''));

  const gabarit = compte?.dataset.gabarit ?? '';
  const gabaritUn = compte?.dataset.gabaritUn ?? gabarit;
  const vide = compte?.dataset.vide ?? '';

  /* Un nom par question, posé par le CSSOM (aucun attribut `style` inséré, la CSP n'a rien à dire). */
  lignes.forEach((li, i) => {
    li.style.setProperty('view-transition-name', `faq-question-${i}`);
  });
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)');
  const doc = document as Document & {
    startViewTransition?: (mise: () => void) => { finished: Promise<void> };
  };
  /* Plusieurs frappes rapides enchaînent plusieurs transitions : la classe ne tombe qu'avec la dernière. */
  let enCours = 0;
  let annonce = 0;

  const appliquer = (): void => {
    const q = plier(champ.value.trim());
    let trouvees = 0;
    /* Le libellé de rubrique s'affiche sur la première question VISIBLE de chaque rubrique : le filtre
       masque des <li> entiers, et le libellé d'une rubrique partait avec sa première question. */
    let rubriqueVisible: string | undefined;
    lignes.forEach((li, i) => {
      const garde = q === '' || (index[i] ?? '').includes(q);
      li.hidden = !garde;
      if (!garde) return;
      trouvees += 1;
      const libelle = li.querySelector<HTMLElement>('[data-faq-rubrique]');
      const rubrique = li.dataset.rubrique;
      if (libelle) libelle.hidden = !rubrique || rubrique === rubriqueVisible;
      if (rubrique) rubriqueVisible = rubrique;
    });
    if (!compte) return;
    /* LE DÉCOMPTE EST ÉCRIT À LA FIN DE LA FRAPPE, pas à chaque lettre : c'est une zone
       `aria-live`, et taper « retrait » déclenchait sept annonces qui se chevauchaient avec l'écho
       des touches. Même délai que la recherche du site. Un champ vidé efface tout de suite. */
    window.clearTimeout(annonce);
    if (q === '') {
      compte.textContent = '';
      return;
    }
    const texte =
      trouvees === 0
        ? vide
        : (trouvees === 1 ? gabaritUn : gabarit).replace('{n}', String(trouvees));
    annonce = window.setTimeout(() => {
      compte.textContent = texte;
    }, 450);
  };

  const filtrer = (): void => {
    if (sobre.matches || typeof doc.startViewTransition !== 'function') {
      appliquer();
      return;
    }
    enCours += 1;
    document.documentElement.classList.add('vt-filtre');
    const transition = doc.startViewTransition(appliquer);
    void transition.finished
      .catch(() => undefined)
      .finally(() => {
        enCours -= 1;
        if (enCours === 0) document.documentElement.classList.remove('vt-filtre');
      });
  };

  enveloppe.hidden = false;
  champ.addEventListener('input', filtrer);
  filtrer();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* `export {}` : sans import ni export, TypeScript traite le fichier comme un script et ses
   déclarations tombent dans l'espace global, où deux `init` entraient en conflit. */
export {};
