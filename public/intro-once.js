/*
 * Ouverture de l'accueil jouée UNE SEULE FOIS par session (11/09/2026, demande de l'équipe) : au retour
 * depuis une autre page du site, le hero et la barre sont en place, sans rejouer la séquence.
 *
 * Script CLASSIQUE et EXTERNE, chargé dans le <head> de l'accueil seulement :
 *  - externe parce que la politique de sécurité du site n'autorise que les scripts de même origine
 *    (`script-src 'self'`) : un script en ligne serait bloqué ;
 *  - classique, ni `module` ni `defer`, pour s'exécuter AVANT le rendu du corps. Retirer la classe plus
 *    tard ne servirait à rien : les animations auraient déjà commencé, on verrait un sursaut.
 * Chargé uniquement par l'accueil : sur une sous-page il marquerait la session comme vue et l'accueil
 * n'animerait jamais.
 *
 * `sessionStorage` et non `localStorage` : la séquence revient à la prochaine visite, elle n'est pas
 * perdue pour toujours après un seul affichage. Une ligne à changer si l'équipe veut l'inverse.
 * Tout est enveloppé : le stockage lève une exception en navigation privée sur certains navigateurs, et
 * dans ce cas la séquence se joue, ce qui est le comportement le moins surprenant.
 */
(function () {
  try {
    var cle = 'rstart_intro_vue';
    if (sessionStorage.getItem(cle)) document.documentElement.classList.remove('intro');
    else sessionStorage.setItem(cle, '1');
  } catch (e) {
    /* stockage indisponible : on laisse la séquence se jouer */
  }
})();
