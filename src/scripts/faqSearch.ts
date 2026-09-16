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

  const filtrer = (): void => {
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
