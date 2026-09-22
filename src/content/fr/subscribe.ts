import type { SubscribeContent } from '@/content/types';
import { externalLinks, subscription } from '@/content/fr/facts';

/**
 * Section « Souscrire » (id : souscrire), chapitre court de l'accueil (11/09/2026) : le titre, les
 * quatre étapes 100 % en ligne et le CTA, qui renvoie vers le tunnel de souscription (URL dans
 * src/config/site.ts). `app` alimente les liens des deux magasins sous le visuel, et le bloc MyCORUM
 * de /documentation.
 * LE RENDU COMPLET de 06-Subscribe, qu'aucune page n'affichait plus, a quitté le code le 22/09/2026 :
 * son titre, son introduction, les deux options facultatives, les rappels « lisez le DIC » et
 * commission de retrait, et l'ancien contre-poids de l'accueil (`homeRisk`) sont archivés hors du
 * dépôt (.claude/audits).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');

export const subscribe: SubscribeContent = {
  /*
   * Chiffre et non lettre dans le titre (12/09/2026, demande de l'équipe) : un titre se balaie, un
   * chiffre s'y repère plus vite. Au mot du document de l'équipe (14/09/2026) : « 4 étapes pour
   * souscrire, 100 % en ligne ». Pas d'introduction depuis le 14/09/2026 : le titre enchaîne
   * directement sur les quatre étapes, qui se lisent d'elles-mêmes.
   */
  title: `4 étapes pour souscrire, ${nb(subscription.onlineLabel)}.`,

  /**
   * Quatre intitulés, sans description (11/09/2026, trame de l'équipe) : le parcours se lit d'un coup
   * d'œil. Ce que portaient les descriptions n'est pas perdu : le délai de jouissance est un des six
   * repères de la zone 3, et le suivi de l'épargne a sa place sur /documentation, avec MyCORUM.
   */
  /*
   * QUATRE ÉTAPES RÉÉCRITES LE 15/09/2026, intitulés fournis par l'équipe. C'étaient : renseigner sa
   * situation et ses objectifs ; choisir le nombre de parts ; signer le bulletin par signature
   * électronique ; effectuer le versement par virement ou prélèvement.
   *
   * LA DEUXIÈME ÉTAPE CHANGE DE NATURE, et c'est le vrai écart : elle disait ce que FAIT le
   * souscripteur (choisir ses parts), elle dit maintenant ce que fait CORUM (vérifier l'adéquation).
   * C'est le test du caractère approprié, une obligation de la société de gestion. Les notes des
   * anciennes étapes (délai de rétractation, moyens de règlement, éligibilité) ont quitté le code le
   * 22/09/2026 avec toutes les notes du site (archivées hors du dépôt, .claude/audits).
   */
  steps: [
    { title: 'Définissez votre profil et vos objectifs' },
    { title: 'CORUM vérifie que R Start est bien fait pour vous' },
    { title: 'Signez électroniquement votre souscription' },
    /*
     * QUATRIÈME ÉTAPE AJOUTÉE le 15/09/2026, après le passage à trois le même jour. Elle ne décrit pas
     * la souscription mais ce qui vient APRÈS elle : le parcours ne s'arrête plus à la signature.
     * C'est aussi le seul endroit de l'accueil qui nomme MyCORUM, dont le bloc complet vit sur
     * /documentation, avec les liens vers les deux magasins d'applications.
     */
    { title: 'Suivez votre investissement sur l’application MyCORUM' },
  ],

  stepsLabel: 'Les quatre étapes de la souscription',
  stepPrefix: 'Étape',

  /**
   * Après la souscription : l'application MyCORUM (CORUM L'Épargne), à la place de l'ancienne photo
   * d'illustration. Description factuelle des fonctions, aucune promesse de résultat.
   */
  app: {
    title: 'Suivez votre épargne dans MyCORUM',
    description:
      'L’application de CORUM L’Épargne, sur iPhone et Android, permet de consulter vos parts, vos versements et vos documents, de programmer des versements et de gérer le réinvestissement de vos revenus.',
    storesLabel: 'Télécharger l’application MyCORUM',
    stores: [
      { label: 'Télécharger sur l’App Store', href: externalLinks.myCorumAppStore },
      { label: 'Disponible sur Google Play', href: externalLinks.myCorumGooglePlay },
    ],
    newTabHint: 'nouvelle fenêtre',
  },
  cta: { label: 'Souscrire en ligne', position: 'souscrire' },
};
