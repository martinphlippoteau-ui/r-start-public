/**
 * Recherche interne de /faq (16/09/2026). Elle FILTRE une liste déjà rendue, elle n'interroge rien :
 * les dix-huit questions sont dans le HTML, la page se lit donc entière sans script, et le champ
 * n'apparaît que si celui-ci s'exécute (il arrive `hidden`, comme les boutons « i »).
 *
 * LA COMPARAISON EST INSENSIBLE AUX ACCENTS ET À LA CASSE : on cherche « frais » et on veut trouver
 * « Frais d'entrée », on tape « interet » et on veut « intérêt ». `normalize('NFD')` décompose les
 * lettres accentuées, la plage U+0300 à U+036F retire les diacritiques.
 *
 * ON CHERCHE DANS LA QUESTION ET DANS LA RÉPONSE. Chercher dans la seule question passerait à côté de
 * « retrait », qui n'est dans aucun intitulé mais dans trois réponses.
 *
 * LE FILTRAGE SE JOUE EN TRANSITION DE VUE (audit du 16/09/2026) : les questions masquées disparaissaient
 * d'un coup et les suivantes sautaient à leur place. Chaque question porte un nom de transition de vue
 * unique ; le navigateur suit alors chacune d'elles d'un état à l'autre, et c'est lui qui fait glisser
 * celles qui restent, s'effacer celles qui partent, paraître celles qui reviennent. La page, elle, ne
 * bouge pas (global.css, `vt-filtre`). Sans l'API, ou en mouvement réduit : filtrage instantané.
 */
const sansAccent = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const init = (): void => {
  const enveloppe = document.querySelector<HTMLElement>('[data-faq-recherche]');
  const liste = document.querySelector<HTMLElement>('[data-faq-liste]');
  if (!enveloppe || !liste) return;
  const champ = enveloppe.querySelector<HTMLInputElement>('input');
  const compte = enveloppe.querySelector<HTMLElement>('[data-faq-compte]');
  if (!champ) return;

  const lignes = [...liste.children].filter((e): e is HTMLElement => e instanceof HTMLElement);
  /* Le texte de chaque question est relevé UNE FOIS : refaire `textContent` à chaque frappe relit
     dix-huit réponses entières à chaque lettre. */
  const index = lignes.map((li) => sansAccent(li.textContent ?? ''));

  const gabarit = compte?.dataset.gabarit ?? '';
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

  const appliquer = (): void => {
    const q = sansAccent(champ.value.trim());
    let trouvees = 0;
    lignes.forEach((li, i) => {
      const garde = q === '' || index[i].includes(q);
      li.hidden = !garde;
      if (garde) trouvees += 1;
    });
    if (!compte) return;
    if (q === '') compte.textContent = '';
    else if (trouvees === 0) compte.textContent = vide;
    else compte.textContent = gabarit.replace('{n}', String(trouvees));
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

/* `export {}` : sans import ni export, TypeScript traite le fichier comme un script et non comme
   un module, et ses déclarations tombent dans l'espace global. Deux fichiers y déclaraient un
   `init`, d'où un conflit de noms que le build refusait. */
export {};
