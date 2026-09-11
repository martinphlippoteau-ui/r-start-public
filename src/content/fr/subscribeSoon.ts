/**
 * Fenêtre affichée au clic sur un bouton « Souscrire » tant que l'URL du tunnel de souscription
 * n'est pas configurée (PUBLIC_SUBSCRIBE_URL encore sur sa valeur de repli). Message informatif :
 * aucune allégation commerciale, donc aucun contre-poids risque à afficher. Le renvoi vers les
 * documents réglementaires reprend le réflexe attendu avant toute décision d'investissement.
 */
export const subscribeSoon = {
  ariaLabel: 'Souscription à venir',
  eyebrow: 'Bientôt disponible',
  title: 'La souscription 100 % en ligne ouvre bientôt sur cette page.',
  body: [
    'La souscription en ligne à R Start n’est pas encore ouverte depuis cette page.',
    'D’ici là, prenez connaissance des documents réglementaires : ils décrivent le fonctionnement, les frais et les risques de la SCPI.',
  ],
  documentsLabel: 'Voir la documentation',
  documentsHref: '/documentation',
  closeLabel: 'Fermer',
};
