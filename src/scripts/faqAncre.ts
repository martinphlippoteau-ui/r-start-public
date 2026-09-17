/**
 * QUESTION VISÉE PAR L'ANCRE (17/09/2026). Une adresse /faq#question-… ouvre la question qu'elle vise :
 * c'est là que mènent les résultats « Questions » de la recherche du site, et un lien partagé vers une
 * question arrive ainsi sur sa réponse, pas sur un intitulé fermé.
 *
 * À l'arrivée et à chaque changement d'ancre dans la page (un résultat de la recherche qui vise une
 * question de la page où l'on se trouve déjà). Les accordéons sont exclusifs (`name="faq"`) : ouvrir
 * celle-ci ferme celle qui l'était.
 *
 * L'ouverture se joue INSTANTANÉMENT : l'animation de hauteur de `::details-content` ferait grandir la
 * réponse sous les yeux du visiteur pendant que la page défile vers elle, et le défilement viserait une
 * position qui change encore. `data-sans-transition` la suspend le temps d'une image.
 */
const ouvrir = (): void => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const cible = document.getElementById(id);
  if (!(cible instanceof HTMLDetailsElement) || !cible.matches('[data-faq]') || cible.open) return;
  cible.setAttribute('data-sans-transition', '');
  cible.open = true;
  requestAnimationFrame(() => {
    cible.scrollIntoView({ block: 'start' });
    requestAnimationFrame(() => cible.removeAttribute('data-sans-transition'));
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ouvrir);
else ouvrir();
window.addEventListener('hashchange', ouvrir);

export {};
