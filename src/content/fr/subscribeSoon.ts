/**
 * Fenêtre affichée au clic sur un bouton « Souscrire » tant que l'URL du tunnel de souscription
 * n'est pas configurée (PUBLIC_SUBSCRIBE_URL encore sur sa valeur de repli). Message informatif :
 * aucune allégation commerciale, donc aucun contre-poids risque à afficher. La seconde phrase
 * renvoie aux documents réglementaires, le réflexe attendu avant toute décision d'investissement.
 */
export const subscribeSoon = {
  eyebrow: 'Bientôt disponible',
  /** Espace insécable avant le %, et « 100 % » jamais coupé en fin de ligne. */
  title: 'La souscription 100\u00A0% en ligne ouvre bientôt sur cette page.',
  body: [
    'La souscription en ligne à R Start n’est pas encore ouverte depuis cette page.',
    'D’ici là, prenez connaissance des documents réglementaires : ils décrivent le fonctionnement, les frais et les risques de la SCPI.',
  ],
  closeLabel: 'Fermer',
};
