import type { LegalNote, SubscribeContent } from '@/content/types';
import { externalLinks, fees, risk, share, subscription } from '@/content/fr/facts';
import { withdrawalExemptions } from '@/content/fr/fees';

/**
 * Section « Souscrire » (id : souscrire).
 * Quatre étapes 100 % en ligne, options (versements programmés, réinvestissement des dividendes),
 * rappel des documents à lire et de la commission de retrait avant 8 ans. Le CTA renvoie vers le tunnel
 * de souscription (URL dans src/config/site.ts). Le minimum des versements programmés (50 € par mois,
 * adhésion PEI 04/2026) est affiché en badge sur l'option PEI, depuis facts.ts.
 * V2 (§3 ter, brochure partenaires 2026, p. 5) : l'intro porte le positionnement complémentaire de
 * R Start (stratégie patrimoniale plus dynamique, en contrepartie d'un risque plus élevé) et la note
 * `souscrire-non-eligible` porte le tableau d'éligibilité complet, modalités proposées comprises.
 * Accueil (chapitre court, 11/09/2026) : `homeTitle`, les quatre étapes et le CTA. `homeIntro` est
 * absente depuis le 14/09/2026 ; `homeNotes` (les notes appelées par les étapes) est vide depuis
 * que les étapes n'en appellent plus (15/09/2026), et n'est importé nulle part. Le guide complet et
 * le bloc MyCORUM restent sur /documentation.
 * Le rendu complet de 06-Subscribe, qui lit `intro`, les options, `beforeYouSubscribe` et
 * `withdrawalReminder`, est EN VEILLE : aucune page ne le rend.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

const documentsList = subscription.documentsRequired.map(lowerFirst).join(', ');
const zeroAfter = fees.withdrawal.zeroAfterYears;

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

/**
 * Rappel de la durée de placement et de la commission de retrait ; aussi réutilisé dans `homeRisk`
 * (accueil) : un seul des deux rappels y était trop court (≈ 58 % du texte cumulé des étapes, seuil
 * 60 %). EN VEILLE : `homeRisk` n'est plus rendu depuis le 11/09/2026, et ce rappel ne l'est que
 * par le rendu complet de 06-Subscribe, qu'aucune page n'affiche.
 */
const withdrawalReminder = `R Start est un placement de long terme : ${risk.recommendedHoldingLabel} recommandés. Si vous retirez vos parts avant ${zeroAfter} ans de détention, une commission est prélevée sur la somme que vous récupérez ; elle diminue chaque année et disparaît après ${zeroAfter} ans. Le détail année par année figure dans la section Frais. ${withdrawalExemptions} Le rachat de vos parts n’est pas garanti : vous ne récupérez votre argent que si un autre épargnant les achète.`;

/*
 * Type DÉCLARÉ et non `satisfies` : `homeIntro` est optionnelle et désormais absente. Avec
 * `satisfies`, le type déduit est celui du littéral, et le composant qui lit `subscribe.homeIntro`
 * ne compilait plus. L'annotation garde le contrôle du littéral et expose le champ optionnel.
 */
export const subscribe: SubscribeContent = {
  /** « R Start » en espace insécable : le nom de marque ne se coupe jamais dans le H2 (mobile 375 px). */
  title: `Souscrire à R Start, ${nb(subscription.onlineLabel)}.`,
  /* Chiffre et non lettre dans le titre (12/09/2026, demande de l'équipe) : un titre se balaie, un
     chiffre s'y repère plus vite. L'introduction, elle, garde « quatre », la lettre étant la règle dans
     une phrase suivie. */
  /** Au mot du document de l'équipe (14/09/2026) : « 4 étapes pour souscrire, 100 % en ligne ». */
  homeTitle: `4 étapes pour souscrire, ${nb(subscription.onlineLabel)}.`,
  /*
   * PAS D'INTRODUCTION SUR L'ACCUEIL depuis le 14/09/2026 (demande de l'équipe) : le titre enchaîne
   * directement sur les quatre étapes, qui se lisent d'elles-mêmes. Le champ reste optionnel dans le
   * type, il suffit de le réécrire ici pour la faire revenir. Le texte retiré était : « Tout se fait en
   * ligne, à partir de 200 € la part : profil investisseur, signature électronique, règlement par
   * virement ou prélèvement, suivi de vos parts sur votre espace privé et l'application MyCORUM. »
   */
  intro: `La souscription se fait entièrement en ligne, en quatre étapes, à partir d’une part de ${nb(share.priceLabel)}. Aucune souscription papier n’est possible. R Start vise une stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé. Avant de vous engager, lisez le DIC et la note d’information. R Start comporte un risque de perte en capital.`,

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

  optionsTitle: 'Deux options facultatives',
  /**
   * Chaque option = avantage (`description`) + contre-poids (`risk`), rendus en RiskPair, même
   * taille. Rendu complet seulement (EN VEILLE), et RiskNote n'y rendrait plus le contre-poids.
   */
  options: [
    {
      title: subscription.options.pei.name,
      badge: `Dès ${nb(subscription.options.pei.minimumMonthlyLabel)}`,
      description:
        'Vous investissez régulièrement, à la fréquence de votre choix : mensuelle, trimestrielle, semestrielle ou annuelle. Chaque versement achète de nouvelles parts.',
      risk: 'Ces nouvelles parts sont exposées aux mêmes risques de perte en capital et de liquidité limitée. Les dividendes potentiels qu’elles produisent ne sont pas garantis.',
    },
    {
      title: subscription.options.rd.name,
      description:
        'Tout ou partie de vos dividendes potentiels est automatiquement réinvesti en parts de R Start.',
      risk: 'Vous ne percevez pas ces revenus et vous augmentez votre exposition à une SCPI dont le capital n’est pas garanti. Les parts ainsi acquises sont soumises aux mêmes risques de perte en capital et de liquidité limitée.',
    },
  ],

  beforeYouSubscribe: `Avant de souscrire, lisez le document d’informations clés (DIC) et la note d’information. Ils décrivent les caractéristiques, les risques et les frais de R Start. Préparez aussi : ${documentsList}.`,

  withdrawalReminder,

  /**
   * Contre-poids des quatre étapes sur l'accueil (RiskNote, jamais animé) : rappel du DIC +
   * `withdrawalReminder`. EN VEILLE : retiré de l'accueil le 11/09/2026, lu par aucun composant.
   */
  homeRisk: `Avant de souscrire, lisez le document d’informations clés (DIC) et la note d’information. ${withdrawalReminder}`,

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

export default subscribe;
