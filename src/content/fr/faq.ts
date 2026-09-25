import type { FaqContent } from '@/content/types';
import { pages } from '@/config/pages';
import { fees, risk, share } from '@/content/fr/facts';
import { nb } from '@/lib/texte';

/**
 * Section « FAQ » des pages courtes et page /faq. Les questions servent aussi de base au JSON-LD
 * FAQPage, limité aux questions visibles (src/lib/seo.ts).
 *
 * Vingt-cinq questions en six rubriques, contenu fourni par l'équipe le 16/09/2026 et repris mot
 * pour mot (la question sur les moins-values, texte de Martin, ajoutée le 23/09/2026) : les chiffres y sont écrits en toutes lettres, et le garde-fou en bas de fichier arrête
 * le build s'ils ne correspondent plus à facts.ts. Trois tableaux à deux colonnes (barème des
 * frais, commission sur les plus-values, commission de retrait) pour que les chiffres se lisent en
 * colonnes et tiennent sur un téléphone. Le contenu porte ses propres réserves dans le corps des
 * réponses (« ne peut pas être garantie », « le capital et les revenus ne sont pas garantis »).
 *
 * Règles : aucune donnée de performance ; aucun « 0 % » sans les frais réellement appliqués dans le
 * même bloc ; fiscalité limitée à la nature des revenus (note d'information, chapitre IV) et au
 * prélèvement à la source du bulletin, sans conseil personnalisé. À l'affichage, on écrit « frais
 * sur les achats d'immeubles » ; le terme réglementaire « frais d'acquisition » reste dans
 * facts.ts.
 */

/** Questions et réponses avant application de la typographie française (voir `nb`). */
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
    /* Réécrite le 22/09/2026 (demande de Martin) : « revenus (dividendes) potentiels », et plus de
       second paragraphe sur les deux moteurs. */
    answer: [
      'R Start a vocation à verser chaque mois des revenus (dividendes) potentiels issus des loyers, comme les autres SCPI CORUM. En revanche, elle n’a pas d’objectif de rendement fixé.',
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
      /* Second paragraphe (25/09/2026, texte de Martin, mot pour mot, point final ajouté) : le
         contre-poids du modèle, avant le tableau. */
      'R Start n’est pas une SCPI sans frais. Ce modèle n’existe pas. R Start n’est pas non plus moins chère qu’une SCPI traditionnelle. Son modèle de frais est différent : si les reventes d’immeubles génèrent de fortes plus-values, les commissions peuvent dépasser ce qu’aurait coûté une commission de souscription classique.',
    ],
    /* « TTC » dans l'en-tête et renvoi vers le comparateur (25/09/2026, Martin). */
    table: {
      head: ['Type de frais', 'Montant (TTC)'],
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
    link: { label: 'Voir le comparateur de frais', href: pages.fees.path },
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
    /* Après la commission sur les plus-values, dont elle est le revers (23/09/2026, texte de Martin) ;
       le comparateur porte le même mécanisme dans son bandeau (comparator.lossNote). */
    category: RUB.frais,
    question: 'CORUM perçoit-elle une commission en cas de moins-value ?',
    answer: [
      'Si la revente d’un immeuble se solde par une perte (une « moins-value »), celle-ci est mise de côté dans une réserve dédiée. Tant que cette réserve n’a pas été entièrement compensée par de futures plus-values, CORUM ne perçoit aucune commission sur les ventes. Autrement dit, CORUM ne se rémunère sur les reventes que lorsque le bilan global de l’ensemble des ventes est positif. Le détail de ce mécanisme figure au chapitre III, section 4 de la note d’information de R Start.',
    ],
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
      'La performance de R Start s’appuie sur deux moteurs : d’une part, les loyers versés par les locataires des immeubles ; d’autre part, les plus-values réalisées lorsque CORUM revend des immeubles plus cher qu’ils n’ont été achetés. Les loyers ont vocation à être distribués chaque mois ; les plus-values, elles, à arriver ponctuellement, lors des reventes.',
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
      'Les revenus issus des loyers ont vocation à être versés chaque mois. Les plus-values, elles, à être versées ponctuellement, au moment de la revente d’immeubles.',
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
 * Les quatre questions des pages courtes, dans l'ordre du document. Le garde-fou fait échouer le
 * build si un libellé change dans la liste ci-dessus, plutôt que de réduire la FAQ en silence.
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

/*
 * LA FAQ NE PEUT PAS CONTREDIRE facts.ts EN SILENCE : ses chiffres sont écrits en toutes lettres,
 * et le SRI est précisément la valeur en arbitrage ouvert avec CORUM. S'il changeait dans facts.ts,
 * la carte de l'accueil suivrait et la FAQ (quatre pages, données structurées, index de recherche)
 * garderait l'ancien. Le texte de l'équipe n'est pas réécrit : le BUILD S'ARRÊTE si l'une de ces
 * valeurs ne se retrouve plus dans la réponse qui la porte.
 */
{
  const texteDe = (question: string): string => {
    const item = rawItems.find((i) => i.question.startsWith(question));
    if (!item) throw new Error(`faq.ts : question introuvable pour le garde-fou, « ${question} »`);
    return [
      ...item.answer,
      ...(item.bullets ?? []),
      ...(item.table ? item.table.rows.flat() : []),
      ...(item.tableAfter ?? []),
    ]
      .join(' ')
      .replace(/\s/g, ' ');
  };
  const attendus: [string, string[]][] = [
    ['Quel est le niveau de risque', [risk.sriLabel]],
    ['Quel est le prix d’une part', [share.priceLabel]],
    ['Combien de temps faut-il conserver', [`${risk.recommendedHoldingYears} ans`]],
    [
      'Quels sont les frais de R Start',
      [fees.management.label, ...fees.disposal.tiers.map((t) => t.rate)],
    ],
    ['Comment fonctionne la commission', fees.disposal.tiers.map((t) => t.rate)],
    ['Que sont les frais de retrait', fees.withdrawal.steps.map((e) => e.rate)],
  ];
  for (const [question, valeurs] of attendus) {
    const texte = texteDe(question);
    for (const valeur of valeurs) {
      if (!texte.includes(valeur.replace(/\s/g, ' ')))
        throw new Error(
          `faq.ts : « ${question}… » ne contient plus « ${valeur} », la valeur de facts.ts. La FAQ et facts.ts doivent dire la même chose.`
        );
    }
  }
}

/*
 * TEMPS DES VERSEMENTS (25/09/2026, Martin) : aucun versement n'a encore eu lieu, le présent n'est
 * pas justifiable. Les réponses qui parlaient de versements ou de distributions au présent disent
 * « a vocation à verser », « ont vocation à être distribués / versés ». À repasser au présent le
 * jour où R Start aura versé.
 */
export const faq = {
  title: 'Vos questions sur la SCPI R Start.',
  /* Pas d'introduction depuis le 16/09/2026 (demande de l'équipe), ni ici ni sur /faq. */
  items: homeItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  /** Toutes les questions, pour la page /faq : les autres pages n'en rendent qu'une sélection. */
  allItems: rawItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  listLabel: 'Questions fréquentes sur R Start',
  /** Renvoi vers la FAQ complète, qui a sa propre page. */
  moreLink: { label: 'Voir toutes les questions', href: pages.faq.path },
  /** Champ de recherche de /faq : il filtre la liste rendue, il n'interroge rien. */
  searchLabel: 'Rechercher dans les questions',
  searchPlaceholder: 'frais, revenus, retrait, risque…',
  /* Sous le champ, `{n}` remplacé par le nombre trouvé. Deux gabarits : « question(s) trouvée(s) »
     était lu tel quel, parenthèses comprises, par les synthèses vocales. */
  searchCount: '{n} questions trouvées',
  searchCountOne: '1 question trouvée',
  searchEmpty: 'Aucune question ne correspond. Essayez un autre mot.',
  /** En-tête de la page /faq, distinct de celui de la section courte. */
  /* Sans point final (24/09/2026, Martin : aucun point final dans les en-têtes). */
  pageTitle: 'Toutes vos questions sur la SCPI R Start',
  /* Meta description de /faq, même forme que les autres pages : les sujets, puis le rappel de
     risque. Obligatoire : une chaîne vide passerait le `??` de la mise en page. */
  pageDescription:
    'Toutes les réponses sur R Start, SCPI de CORUM : frais, revenus, risques, fiscalité et souscription. Risque de perte en capital, revenus non garantis.',
  cta: { label: 'Souscrire en ligne', position: 'faq' },
} satisfies FaqContent;
