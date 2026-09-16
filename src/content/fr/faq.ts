import type { FaqContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import {
  corumGroup,
  income,
  product,
  risk,
  strategy as strategyFacts,
  subscription,
} from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';

/**
 * Section « FAQ ».
 * Ordre de lecture : les 10 questions de la stratégie SEO (src/content/fr/seo.ts, `faqQuestions`), avec
 * leur libellé exact, complétées par les 6 questions de pédagogie de la V2 (réunion produit du
 * 10/09/2026), insérées au plus près de la question SEO qu'elles éclairent :
 *  - « Comment R Start compte-t-elle créer de la performance ? » (réponse fournie par l'équipe) ;
 *  - « Les frais d'entrée, c'est quoi ? » et « Les frais sur les achats d'immeubles, c'est quoi ? » ;
 *  - « Pourquoi R Start n'affiche-t-elle pas d'objectif de rendement ? » ;
 *  - « Délai de jouissance et dividendes : comment ça marche ? » ;
 *  - « R Start remplace-t-elle les autres SCPI du groupe CORUM ? » (gamme complémentaire, brochure p.5).
 * La réponse fournie par l'équipe pour « Une SCPI, c'est quoi ? » est portée par la question SEO
 * équivalente, « Qu'est-ce qu'une SCPI ? » : même contenu, libellé SEO conservé, pas de doublon dans le
 * JSON-LD FAQPage. Sert aussi de base à ce JSON-LD.
 *
 * Vocabulaire (V2, §3) : à l'affichage, on écrit « frais sur les achats d'immeubles ». Le terme
 * réglementaire « frais d'acquisition » ne subsiste que dans les notes, dans le barème détaillé
 * (fees.ts, feesPage.ts) et dans facts.ts.
 *
 * Règles appliquées : aucune donnée de performance ; chaque avantage cité est contrebalancé par son
 * risque dans la même réponse, et la longueur cumulée des contre-poids (RiskNote) d'une réponse atteint
 * au moins 80 % de celle de ses paragraphes « avantage » (deux RiskNote si nécessaire) ; aucun « 0 % »
 * sans les frais réellement appliqués dans le même bloc ; fiscalité limitée à la nature des revenus
 * (note d'information, chapitre IV) et au prélèvement à la source du bulletin, sans conseil
 * personnalisé ; tous les chiffres et libellés réglementaires (paliers de la commission de retrait,
 * date de jouissance, chiffres du groupe) viennent de facts.ts ; l'encadré « Une innovation, pas une
 * révolution » est importé de legal.ts à l'identique.
 */

/** Espace insécable avant % € : ; ? !, appliquée à toutes les questions, réponses et notes. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** « a, b ou c ». */

/** « a, b et c ». */
const joinAnd = (items: readonly string[]): string =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
    : items.join('');

/** « CORUM Origin, CORUM XL, CORUM Eurion, CORUM USA et R Start » (note de source uniquement). */
const scpiList = joinAnd(corumGroup.scpiNames);

/**
 * Barème complet de la commission de retrait, libellés des périodes dérivés de facts.fees.withdrawal.steps :
 * « 10 % pour un retrait avant 4 ans de détention, 7 % pour un retrait au cours de la 5e ou de la 6e année, … ».
 */
/** « 0, 6 ou 12 % » : paliers de la commission sur les cessions d'immeubles. */
/** « 0 % si la plus-value est inférieure à 7 %, 6 % si …, 12 % si … ». */
/** Date du bulletin de souscription dont sont issus les taux de prélèvement (voir note faq-fiscalite). */
const bulletinDate = 'mai 2026';
/** « démembrement, souscription papier et CORUM Life » : modalités non proposées (brochure p.5). */
const notEligibleList = joinAnd(subscription.notEligible);
/** « ni démembrement, ni souscription papier, ni CORUM Life » : énumération négative des mêmes modalités. */

const rawNotes: LegalNote[] = [
  {
    id: 'faq-leviers',
    text: `Les deux leviers de performance visés par R Start, ${joinAnd(strategyFacts.levers.map(lowerFirst))}, et la formule « ${lowerFirst(strategyFacts.motto)} » : brochure partenaires 2026, p. 3. Il s’agit d’un objectif d’investissement, sans garantie de résultat.`,
  },
  {
    id: 'faq-frais-achats',
    text: `Terme réglementaire : « frais d’acquisition », tel qu’il figure au document d’informations clés du ${product.dicDate.label} et dans le barème détaillé de la section Frais. Il désigne la commission de la société de gestion sur le prix d’acquisition net vendeur des immeubles. Source : brochure partenaires 2026, p. 4.`,
  },
  {
    id: 'faq-objectif',
    text: `R Start n’affiche aucun objectif de rendement, à la différence des premières SCPI du groupe CORUM, dont les frais sont par ailleurs forfaitaires. Source : brochure partenaires 2026, p. 5, tableau « Une gamme complémentaire ».`,
  },
  {
    id: 'faq-jouissance',
    text: `Délai de jouissance de R Start : ${income.enjoymentDelayLabel} (brochure partenaires 2026, p. 3). Date de jouissance : date à partir de laquelle les parts donnent droit aux dividendes potentiels. Pour R Start : ${lowerFirst(income.enjoymentDate)}. Source : bulletin de souscription R Start, conditions générales de vente.`,
  },
  {
    id: 'faq-sri',
    text: `Indicateur synthétique de risque (SRI) : échelle de 1 (risque le plus faible) à ${risk.sriMax} (risque le plus élevé), établie en supposant que vous conservez le produit ${risk.recommendedHoldingLabel}. R Start y est classée ${risk.sriLabel}, valeur communiquée par CORUM. Source : CORUM, brochure partenaires 2026, p. 3. Le document d’informations clés du ${product.dicDate.label} reste le seul document qui fait foi : lisez-le avant toute décision.`,
  },
  {
    id: 'faq-fiscalite',
    text: `Prélèvement à la source obligatoire de ${income.withholdingTax} (hors prélèvements sociaux de ${income.socialContributions}) opéré par la société de gestion sur les produits financiers, pour tout associé personne physique résidant fiscalement en France. Il constitue un acompte d’impôt sur le revenu, imputable sur l’impôt dû et restituable s’il l’excède. Une dispense peut être demandée sous conditions de revenus (article 242 quater du Code général des impôts). Source : bulletin de souscription R Start, ${bulletinDate}. Taux en vigueur à cette date, susceptibles d’évoluer.`,
  },
  {
    id: 'faq-corum-source',
    text: `${corumGroup.statsSource} Nombre de SCPI gérées : brochure partenaires 2026 (${scpiList}). Agrément de la société de gestion : mentions légales de ${managementCompany.name}.`,
  },
  {
    id: 'faq-gamme',
    text: `Éligibilité de R Start : souscription ${subscription.onlineLabel} ; ${subscription.options.rd.name} et ${subscription.options.pei.name} proposés ; ${notEligibleList} non proposés. Positionnement : stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé, quand les premières SCPI du groupe visent des revenus potentiels réguliers. Source : brochure partenaires 2026, p. 5.`,
  },
];

export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

/**
 * Questions et réponses avant application de la typographie française (voir `nb`).
 * `riskFrom` : index du premier paragraphe de contre-poids risque de chaque réponse (rendu en RiskNote,
 * même taille que l'avantage qui précède) ; `noteId` : appel de note porté par la question.
 */
/*
 * VINGT-DEUX QUESTIONS EN SIX RUBRIQUES, contenu fourni par l'équipe le 16/09/2026 et repris mot pour
 * mot. Il remplace les seize questions précédentes.
 *
 * TROIS TABLEAUX y sont rendus tels quels (barème des frais, commission sur les plus-values,
 * commission de retrait) : les chiffres s'y lisent en colonnes, les couler en phrases les rendrait
 * illisibles. Deux colonnes et pas davantage, pour qu'ils tiennent sur un téléphone.
 *
 * CE QUI A ÉTÉ SIGNALÉ À L'ÉQUIPE et qui n'est pas arbitré : « Nous recommandons de garder vos parts
 * au moins 10 ans » est la durée du DIC et vaut pour tout le site, mais la carte « Horizon
 * d'investissement » de l'accueil dit « 8 ans minimum », choix de l'équipe du même jour. Les deux
 * coexistent donc sur des pages différentes.
 *
 * `riskFrom` n'est plus posé : le contenu fourni porte ses propres réserves dans le corps des réponses
 * (« ne peut pas être garantie », « le capital et les revenus ne sont pas garantis »), et RiskNote ne
 * rend plus rien depuis le 14/09/2026. Le découpage avantage / contre-poids serait donc invisible tout
 * en continuant de couper les réponses en deux.
 */
const RUB = {
  comprendre: 'Comprendre R Start',
  frais: 'Les frais',
  investir: 'Où et comment R Start investit',
  performance: 'Performance et risques',
  souscrire: 'Souscrire et accéder à R Start',
  pratique: 'Questions pratiques',
} as const;

const rawItems: FaqContent['items'] = [
  {
    category: RUB.comprendre,
    question: 'Qu’est-ce que R Start ?',
    answer: [
      'R Start est la 5ᵉ SCPI (société civile de placement immobilier) du groupe CORUM. Sa grande particularité : vous ne payez aucun frais quand vous investissez.',
      'Concrètement, vous placez votre argent dans l’immobilier professionnel (bureaux, commerces, etc.). La performance de R Start repose sur deux moteurs complémentaires : d’une part les loyers payés par les locataires des immeubles, versés régulièrement ; d’autre part les plus-values réalisées lorsque CORUM revend un immeuble plus cher qu’il ne l’a acheté. CORUM ne se rémunère que lorsque R Start rapporte de l’argent : sur ces loyers et sur ces plus-values.',
    ],
  },
  {
    category: RUB.comprendre,
    question: 'R Start verse-t-elle des revenus réguliers ?',
    answer: [
      'R Start verse chaque mois des revenus issus des loyers, comme les autres SCPI CORUM. En revanche, elle n’a pas d’objectif de rendement fixé.',
      'Sa performance repose sur deux moteurs complémentaires : les loyers encaissés, distribués régulièrement, et les plus-values réalisées lors de la revente d’immeubles.',
    ],
  },
  {
    category: RUB.comprendre,
    question: 'Combien de temps faut-il conserver ses parts ?',
    answer: [
      'Nous recommandons de garder vos parts au moins 10 ans. R Start est un placement immobilier de long terme, dont la stratégie a besoin de temps pour porter ses fruits.',
    ],
  },
  {
    category: RUB.frais,
    question: 'Quels sont les frais de R Start ?',
    answer: [
      'R Start ne prélève aucun frais quand vous investissez : chaque euro placé est réellement investi. CORUM se rémunère uniquement sur les loyers encaissés et sur les plus-values réalisées lors de la revente d’immeubles.',
    ],
    table: {
      head: ['Type de frais', 'Montant'],
      rows: [
        ['Frais de souscription (à l’entrée)', '0 %'],
        ['Frais d’acquisition des immeubles', '0 %'],
        ['Frais de travaux', '0 %'],
        ['Frais de gestion (prélevés sur les loyers)', '15 %'],
        [
          'Frais sur les plus-values (à la revente)',
          '0 % / 6 % / 12 % selon la plus-value réalisée (voir ci-dessous)',
        ],
        ['Frais de retrait anticipé (avant 8 ans)', 'dégressifs (voir plus bas)'],
      ],
    },
  },
  {
    category: RUB.frais,
    question: 'Comment fonctionne la commission sur les plus-values ?',
    answer: [
      'Quand CORUM revend un immeuble, elle ne prend une commission que si une plus-value est réalisée. Et plus la plus-value est importante, plus la commission l’est aussi :',
    ],
    table: {
      head: ['Plus-value réalisée', 'Commission (TTC)'],
      rows: [
        ['Moins de 7 % du prix de vente', '0 %'],
        ['Entre 7 % et 13 %', '6 %'],
        ['Plus de 13 %', '12 %'],
      ],
    },
    tableAfter: ['Ainsi, CORUM gagne davantage seulement quand vous gagnez davantage.'],
  },
  {
    category: RUB.frais,
    question: 'Que sont les frais de retrait anticipé ?',
    answer: [
      'Si vous revendez vos parts avant 8 ans, des frais de retrait s’appliquent. Ils sont dégressifs : plus vous conservez vos parts longtemps, plus ils baissent.',
    ],
    table: {
      head: ['Retrait des parts', 'Frais de retrait'],
      rows: [
        ['Avant 4 ans', '10 %'],
        ['Avant 6 ans', '7 %'],
        ['Avant 7 ans', '5 %'],
        ['Avant 8 ans', '3 %'],
        ['Après 8 ans', '0 %'],
      ],
    },
    tableAfter: [
      'Ils protègent votre épargne et celle des autres associés, en évitant les retraits précipités qui fragiliseraient la SCPI. R Start est un placement à conserver dans la durée.',
    ],
  },
  {
    category: RUB.frais,
    question:
      'R Start donne-t-elle droit aux offres promotionnelles CORUM (Coup de Pouce, parrainage) ?',
    answer: [
      'Non, R Start n’est pas éligible aux offres promotionnelles de CORUM (comme le Coup de Pouce ou le parrainage).',
    ],
  },
  {
    category: RUB.investir,
    question: 'Quelle est la stratégie d’investissement ?',
    answer: [
      'R Start cherche à acheter des immeubles au bon prix, à les louer pour percevoir des loyers réguliers, à les valoriser si besoin, puis à les revendre avec une plus-value quand le marché s’y prête. Ses deux moteurs de performance sont ainsi activés : les loyers pendant la détention et la plus-value à la revente. Elle vise plutôt des immeubles de taille moyenne (entre 5 et 10 millions d’euros), souvent moins convoités et donc plus faciles à négocier à l’achat.',
    ],
  },
  {
    category: RUB.investir,
    question: 'Dans quels pays R Start investit-elle ?',
    answer: [
      'R Start peut investir dans la zone euro comme en dehors. Cela permet de saisir des opportunités sur un maximum de marchés. Investir hors zone euro implique parfois d’autres monnaies (livre sterling, couronne norvégienne, dollar canadien…). Les opportunités aux États-Unis, elles, restent réservées à CORUM USA.',
    ],
  },
  {
    category: RUB.investir,
    question: 'Dans quels types d’immeubles R Start investit-elle ?',
    answer: [
      'Dans tous les secteurs de l’immobilier professionnel : bureaux, commerces, logistique, hôtels, santé. Aucun secteur n’est écarté à l’avance : c’est l’opportunité qui guide le choix.',
    ],
  },
  {
    category: RUB.performance,
    question: 'Quel est l’objectif de performance de R Start ?',
    answer: [
      'R Start n’affiche aucun objectif de rendement chiffré. C’est une différence importante avec les autres SCPI CORUM. Sa performance repose sur deux moteurs : les loyers encaissés et les plus-values réalisées à la revente des immeubles. Elle dépendra de la capacité de CORUM à percevoir des loyers réguliers et à revendre les immeubles avec une plus-value ; elle est par nature incertaine et ne peut pas être garantie.',
    ],
  },
  {
    category: RUB.performance,
    question: 'Sur quoi repose la performance de R Start ?',
    answer: [
      'La performance de R Start s’appuie sur deux moteurs : d’une part, les loyers versés par les locataires des immeubles ; d’autre part, les plus-values réalisées lorsque CORUM revend des immeubles plus cher qu’ils n’ont été achetés. Les loyers sont distribués chaque mois ; les plus-values, elles, arrivent ponctuellement, lors des reventes.',
    ],
  },
  {
    category: RUB.performance,
    question: 'Quel est le niveau de risque de R Start ?',
    answer: [
      'R Start affiche un niveau de risque de 4 sur 7 (contre 3 pour CORUM Origin ou Eurion, par exemple). Pourquoi un peu plus élevé ?',
    ],
    bullets: [
      'une partie de ses revenus provient de plus-values, moins prévisibles que les loyers ;',
      'elle peut investir hors zone euro, ce qui expose à l’évolution des monnaies étrangères ;',
      'sa gestion est active, avec des achats et reventes plus fréquents, donc plus sensible aux mouvements du marché immobilier.',
    ],
    tableAfter: [
      'Comme pour tout placement immobilier, le capital et les revenus ne sont pas garantis.',
    ],
  },
  {
    category: RUB.performance,
    question: 'R Start est-elle concernée par le risque de change ?',
    answer: [
      'Oui. Comme R Start peut investir hors zone euro, la valeur de vos placements dépend aussi de l’évolution des monnaies étrangères. Cela peut jouer dans les deux sens : améliorer la performance si ces monnaies montent face à l’euro, ou la réduire si elles baissent.',
    ],
  },
  {
    category: RUB.souscrire,
    question: 'Peut-on financer R Start à crédit ?',
    answer: [
      'Le financement à crédit n’est pas proposé à ce jour par CORUM pour R Start. En revanche, rien n’empêche un épargnant de financer son investissement par ses propres moyens, par exemple via un crédit obtenu auprès de sa banque.',
    ],
  },
  {
    category: RUB.souscrire,
    question: 'R Start est-elle éligible au démembrement ?',
    answer: ['La souscription en démembrement n’est pas possible sur R Start.'],
  },
  {
    category: RUB.souscrire,
    question: 'R Start est-elle disponible dans CORUM Life ou une autre assurance-vie ?',
    answer: [
      'Non, pas à ce stade. R Start n’est pour l’instant pas proposée dans un contrat d’assurance-vie.',
    ],
  },
  {
    category: RUB.pratique,
    question: 'Quel est le prix d’une part ?',
    answer: [
      'Une part de R Start coûte 200 €. Comme il n’y a pas de frais d’entrée, la valeur de retrait est aussi de 200 € (des frais s’appliquent seulement en cas de retrait avant 8 ans).',
    ],
  },
  {
    category: RUB.pratique,
    question: 'À partir de quand touche-t-on les premiers revenus (délai de jouissance) ?',
    answer: [
      'Vos parts commencent à produire des revenus le 1ᵉʳ jour du 6ᵉ mois suivant votre souscription. Ce délai est le même que pour les autres SCPI CORUM.',
    ],
  },
  {
    category: RUB.pratique,
    question: 'À quelle fréquence les revenus sont-ils versés ?',
    answer: [
      'Les revenus issus des loyers sont versés chaque mois. Les plus-values, elles, sont versées ponctuellement, au moment de la revente d’immeubles.',
    ],
  },
  {
    category: RUB.pratique,
    question: 'Comment sont imposés les revenus de R Start ?',
    answer: [
      'Les loyers versés sont imposés comme des revenus fonciers, comme pour toute SCPI. Les plus-values versées lors des reventes d’immeubles relèvent du régime des plus-values immobilières des particuliers.',
    ],
  },
  {
    category: RUB.pratique,
    question: 'Peut-on mettre en place des options sur R Start ?',
    answer: [
      'Oui. Vous pouvez choisir le réinvestissement automatique de vos revenus et les versements programmés.',
    ],
  },
];

/*
 * LES QUATRE QUESTIONS DES PAGES COURTES. Prises dans l'ordre du document : ce qu'est R Start, si elle
 * verse des revenus, ses frais, et le prix d'une part. Le garde-fou ci-dessous fait échouer le build si
 * un libellé change dans la liste ci-dessus, plutôt que de réduire la FAQ en silence.
 */
const HOME_FAQ = [
  'Qu’est-ce que R Start ?',
  'R Start verse-t-elle des revenus réguliers ?',
  'Quels sont les frais de R Start ?',
  'Quel est le prix d’une part ?',
];
const homeItems = rawItems.filter((item) => HOME_FAQ.includes(item.question));
if (homeItems.length !== HOME_FAQ.length) {
  const manquantes = HOME_FAQ.filter((q) => !rawItems.some((item) => item.question === q));
  throw new Error(`faq.ts : questions de l’accueil introuvables, ${manquantes.join(' ; ')}`);
}

/** Notes appelées par les six questions de l'accueil ; `notes` reste complet pour /documentation. */
const idsAppeles = homeItems.map((item) => item.noteId).filter(Boolean);
export const homeNotes: LegalNote[] = notes.filter((n) => idsAppeles.includes(n.id));

export const faq = {
  eyebrow: 'FAQ',
  title: 'Vos questions sur la SCPI R Start.',
  /* Supprimée le 16/09/2026 à la demande de l'équipe, sur toutes les pages : la phrase annonçait ce
     que les questions montrent d'elles-mêmes, et le renvoi au DIC et à la note d'information est déjà
     porté par la section Documents et par le pied de page. Vide et non retirée : `FaqContent.intro`
     reste exigé par le type, et la section n'affiche plus son paragraphe quand il est vide. */
  intro: '',
  items: homeItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  /** Les seize questions, pour /documentation (FAQ complète) : l'accueil n'en rend que six. */
  allItems: rawItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  listLabel: 'Questions fréquentes sur R Start',
  /*
   * Renvoi vers la FAQ complète. Il pointait sur /documentation#faq, qui portait les seize questions ;
   * elles ont leur propre page depuis le 16/09/2026, avec un champ de recherche.
   */
  moreLink: { label: 'Voir toutes les questions', href: pages.faq.path },
  /** Champ de recherche de /faq : il filtre la liste rendue, il n'interroge rien. */
  searchLabel: 'Rechercher dans les questions',
  searchPlaceholder: 'frais, revenus, retrait, risque…',
  /** Ce qui s'affiche sous le champ, `{n}` étant remplacé par le nombre de questions trouvées. */
  searchCount: '{n} question(s) trouvée(s)',
  searchEmpty: 'Aucune question ne correspond. Essayez un autre mot.',
  /** En-tête de la page /faq, distinct de celui de la section courte. */
  pageTitle: 'Toutes vos questions sur la SCPI R Start.',
  /* Introduction retirée le 16/09/2026, demande de l'équipe. Elle disait : « Les réponses sont courtes
     et factuelles, issues des documents officiels de R Start. Elles ne remplacent pas la lecture du DIC
     et de la note d'information. » Le renvoi vers les documents reste dans le pied de page. */
  pageIntro: '',
  cta: { label: 'Souscrire en ligne', position: 'faq' },
  notes,
} satisfies FaqContent;
