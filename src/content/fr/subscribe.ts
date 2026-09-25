import type { SubscribeContent } from '@/content/types';
import { externalLinks, subscription } from '@/content/fr/facts';
import { nb } from '@/lib/texte';

/**
 * Section « Souscrire » (id : souscrire), chapitre court de l'accueil : le titre, les quatre étapes
 * 100 % en ligne et le CTA vers le tunnel de souscription (URL dans src/config/site.ts). `app`
 * alimente les liens des deux magasins et le bloc MyCORUM de /documentation. L'ancien rendu complet
 * (introduction, options, rappels, contre-poids `homeRisk`) a quitté le code le 22/09/2026 (archivé
 * hors du dépôt, .claude/audits).
 */

export const subscribe: SubscribeContent = {
  /* Titre au mot du document de l'équipe (14/09/2026), chiffre et non lettre : un titre se balaie,
     un chiffre s'y repère plus vite. Pas d'introduction : les étapes se lisent d'elles-mêmes. */
  title: `4 étapes pour souscrire, ${nb(subscription.onlineLabel)}.`,

  /*
   * Quatre intitulés sans description (15/09/2026, texte de l'équipe). La deuxième étape dit ce que
   * fait CORUM (vérifier l'adéquation), le test du caractère approprié, une obligation de la
   * société de gestion, et non ce que fait le souscripteur. Les notes des anciennes étapes (délai
   * de rétractation, moyens de règlement, éligibilité) ont quitté le code le 22/09/2026.
   */
  steps: [
    /* Deux intitulés réécrits le 22/09/2026 (texte de Martin) : ex-« Définissez votre profil et vos
       objectifs » et « CORUM vérifie que R Start est bien fait pour vous ». */
    { title: 'Dites-nous qui vous êtes et quels sont vos projets d’investissement' },
    { title: 'CORUM L’Épargne vérifie que R Start est bien fait pour vous' },
    { title: 'Signez électroniquement votre souscription' },
    /* La quatrième étape décrit ce qui vient APRÈS la souscription ; seul endroit de l'accueil qui
       nomme MyCORUM, dont le bloc complet vit sur /documentation. */
    { title: 'Suivez votre investissement sur l’application MyCORUM' },
  ],

  stepsLabel: 'Les quatre étapes de la souscription',
  stepPrefix: 'Étape',

  /** Après la souscription : l'application MyCORUM (CORUM L'Épargne). Description factuelle des
      fonctions, aucune promesse de résultat. */
  app: {
    title: 'Suivez votre épargne dans MyCORUM',
    description:
      'L’application de CORUM L’Épargne, sur iPhone et Android, permet de consulter vos parts, vos versements et vos documents, de programmer des versements et de gérer le réinvestissement de vos revenus potentiels.',
    storesLabel: 'Télécharger l’application MyCORUM',
    stores: [
      { label: 'Télécharger sur l’App Store', href: externalLinks.myCorumAppStore },
      { label: 'Disponible sur Google Play', href: externalLinks.myCorumGooglePlay },
    ],
    newTabHint: 'nouvelle fenêtre',
  },
  cta: { label: 'Souscrire en ligne', position: 'souscrire' },
};
