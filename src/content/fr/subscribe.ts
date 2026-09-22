import type { LegalNote, SubscribeContent } from '@/content/types';
import { externalLinks, subscription } from '@/content/fr/facts';

/**
 * Section « Souscrire » (id : souscrire), chapitre court de l'accueil (11/09/2026) : le titre, les
 * quatre étapes 100 % en ligne et le CTA, qui renvoie vers le tunnel de souscription (URL dans
 * src/config/site.ts). `app` alimente les liens des deux magasins sous le visuel, et le bloc MyCORUM
 * de /documentation.
 * La note `souscrire-non-eligible` porte le tableau d'éligibilité complet (brochure partenaires 2026,
 * p. 5). `homeNotes` (les notes appelées par les étapes) est vide depuis que les étapes n'en appellent
 * plus (15/09/2026), et n'est importé nulle part.
 * LE RENDU COMPLET de 06-Subscribe, qu'aucune page n'affichait plus, a quitté le code le 22/09/2026 :
 * son titre, son introduction, les deux options facultatives, les rappels « lisez le DIC » et
 * commission de retrait, et l'ancien contre-poids de l'accueil (`homeRisk`) sont archivés hors du
 * dépôt (.claude/audits).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export const notes: LegalNote[] = [
  {
    id: 'souscrire-reflexion',
    text: `${subscription.coolingOff}. Source : conditions générales de vente du bulletin de souscription, mai 2026.`,
  },
  {
    id: 'souscrire-reglement',
    text: `Moyens de règlement acceptés : ${subscription.paymentMethods.map(lowerFirst).join(' ou ')}. Source : bulletin de souscription, mai 2026.`,
  },
  {
    id: 'souscrire-non-eligible',
    text: nb(
      `Éligibilité de R Start : souscription ${subscription.onlineLabel}, ${subscription.options.rd.name} et ${subscription.options.pei.name} proposés. Modalités non proposées : ${subscription.notEligible.join(', ')}. Positionnement : R Start complète la gamme du groupe CORUM. Les premières SCPI du groupe visent des revenus potentiels réguliers ; R Start vise une stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé. Source : brochure partenaires 2026, p. 5.`
    ),
  },
];

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
   * d'œil. Ce que portaient les descriptions n'est pas perdu, le délai de jouissance est un des six
   * repères de la zone 3, les moyens de règlement et le délai de rétractation sont dans les notes
   * `souscrire-reglement` et `souscrire-reflexion` (plus appelées depuis le 15/09/2026, voir
   * ci-dessous), et le suivi de l'épargne a sa place sur /documentation, avec MyCORUM.
   */
  /*
   * QUATRE ÉTAPES RÉÉCRITES LE 15/09/2026, intitulés fournis par l'équipe. C'étaient : renseigner sa
   * situation et ses objectifs ; choisir le nombre de parts ; signer le bulletin par signature
   * électronique ; effectuer le versement par virement ou prélèvement.
   *
   * LA DEUXIÈME ÉTAPE CHANGE DE NATURE, et c'est le vrai écart : elle disait ce que FAIT le
   * souscripteur (choisir ses parts), elle dit maintenant ce que fait CORUM (vérifier l'adéquation).
   * C'est le test du caractère approprié, une obligation de la société de gestion.
   *
   * DEUX APPELS DE NOTE DISPARAISSENT AVEC LES ANCIENNES ÉTAPES : `souscrire-reflexion`, qui portait le
   * délai de rétractation, et `souscrire-reglement`, les moyens de règlement. Les deux notes restent
   * dans ce fichier et ne sont plus appelées ici ; le registre `notes` plus bas les garde. À rattacher
   * si la Conformité veut les revoir à l'écran.
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

/**
 * Notes appelées par les étapes : liste vide depuis le 15/09/2026, aucune étape ne portant plus de
 * `noteId`. EN VEILLE, comme `notes` : ni l'une ni l'autre n'est importée (le registre de
 * l'accueil, notes.ts, est vide).
 */
const idsAppeles = subscribe.steps.map((step) => step.noteId).filter(Boolean);
export const homeNotes: LegalNote[] = notes.filter((n) => idsAppeles.includes(n.id));
