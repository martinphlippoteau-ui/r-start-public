/**
 * SOURCE DE VÉRITÉ des données produit R Start.
 * Chaque valeur est tracée vers un document officiel. Aucun chiffre du site ne doit venir d'ailleurs.
 * Sources : DIC V7 (20/05/2026), Bulletin de souscription 2026.05 (CGV), Brochure partenaires 2026,
 * corum.fr/mentions-legales.
 *
 * Points en attente de confirmation par CORUM (voir README) :
 *  - SRI : le site affiche 3/7, valeur du DIC V7 hébergé (20/05/2026, texte extrait du PDF le 10/09/2026 :
 *    « classe de risque 3 sur 7, qui est une classe de risque moyenne »). La brochure p.3 et CORUM
 *    (08/09/2026) annoncent 4/7 : une communication commerciale ne peut pas contredire le DIC en vigueur,
 *    CORUM doit soit confirmer le DIC hébergé, soit fournir un DIC à jour (le site suivra ce document).
 *  - Minimum des versements programmés (PEI) : 50 € (adhésion PEI 04/2026) → affiché.
 *  - Cas d'exonération de la commission de retrait : confirmés par la note d'information ch. III § 6 → affichés (libellé exact à confirmer).
 *  - Chiffres groupe : corum.fr consulté le 08/09/2026 ; date de référence officielle à fournir par CORUM.
 */

export const product = {
  name: 'R Start',
  legalName: 'R Start, Société Civile de Placement Immobilier à capital variable',
  type: 'SCPI de rendement à capital variable',
  tagline: 'La SCPI nouvelle génération', // brochure partenaires 2026, p.1, accroche rétablie par la réunion produit du 10/09/2026
  /**
   * Allégation de rang autorisée : périmètre limité à la gamme du groupe CORUM (arbitrage du
   * 10/09/2026). La version marché (« la première SCPI… » sans le groupe CORUM) reste interdite tant
   * que la Conformité ne l'a pas validée. Toujours affichée avec l'appel de note `definitionScope`.
   */
  definition:
    'La première SCPI du groupe CORUM sans frais d’entrée ni frais sur les achats d’immeubles', // brochure partenaires 2026, p.4 et p.6
  definitionScope:
    'Périmètre : la gamme du groupe CORUM, soit cinq SCPI gérées par CORUM Asset Management depuis 2012. R Start est la première à ne prélever ni commission de souscription, ni frais sur les achats d’immeubles. Cette comparaison ne porte pas sur l’ensemble du marché des SCPI. Source : brochure partenaires 2026, p. 4, p. 6 et p. 7.',
  visa: { number: '26-06', date: '4 mars 2026' }, // bulletin, brochure p.8
  creationDate: { label: '19 janvier 2026', iso: '2026-01-19' }, // bulletin CGV
  openingDate: { label: '20 mai 2026' }, // bulletin CGV
  dicDate: { label: '20 mai 2026' }, // DIC p.1
  rcs: 'RCS Paris 100 177 997', // DIC p.4
  address: '1 rue Euler, 75008 Paris',
  phone: '01 53 75 87 48',
  phoneIntl: '+33153758748',
  email: 'corum@corum.fr',
  depositary: 'Société Générale', // DIC p.1
  sfdr: 'Article 8 du Règlement (UE) 2019/2088 (SFDR)', // DIC p.4
} as const;

export const share = {
  price: 200, // €, bulletin CGV
  priceLabel: '200 €',
  nominal: 182, // €, bulletin CGV
  premium: 18, // €, bulletin CGV (prime d'émission, dont 0 € de commission de souscription)
  minimumShares: 1, // bulletin CGV
  minimumLabel: '200 €',
  withdrawalPrice: 200, // €, bulletin CGV
  fractions: 'dixièmes, centièmes, millièmes, dix millièmes', // bulletin CGV
} as const;

export const fees = {
  /** Frais à l'entrée */
  subscription: { rate: 0, label: '0 %', base: 'prélevés sur le montant investi' }, // DIC, bulletin
  /** Frais liés à l'investissement de l'épargne */
  acquisition: { rate: 0, label: '0 %', base: "prélevés sur le prix d'acquisition net vendeur" }, // brochure p.4
  broker: { rate: 0, label: '0 %', base: "prélevés sur le prix d'acquisition net vendeur" }, // brochure p.4
  works: { rate: 0, label: '0 %', base: 'prélevés sur le montant HT des travaux réalisés' }, // brochure p.4
  /** Frais de gestion */
  management: { rate: 15, label: '15 %', base: 'prélevés sur les loyers HT encaissés' }, // brochure p.4, DIC
  /** Commission sur les cessions d'immeubles, par paliers de plus-value */
  disposal: {
    /**
     * Fourchette et non liste de paliers (12/09/2026, demande de l'équipe) : « de 0 % à 12 % » se lit,
     * « 0 / 6 / 12 % » se déchiffre. Les trois paliers restent dans `tiers`, affichés sous la valeur
     * partout où la place le permet.
     */
    label: 'de 0 % à 12 %',
    base: 'prélevés sur le montant HT de la vente',
    /** `from` : plus-value à partir de laquelle le palier s'applique, en % du prix de vente (DIC, brochure p.4). */
    tiers: [
      { condition: 'si la plus-value est inférieure à 7 %', rate: '0 %', from: 0 },
      { condition: 'si la plus-value est comprise entre 7 % et 13 %', rate: '6 %', from: 7 },
      { condition: 'si la plus-value est supérieure à 13 %', rate: '12 %', from: 13 },
    ],
    basisNote: 'Plus-value exprimée en pourcentage du prix de vente.', // brochure p.6
  }, // brochure p.4
  /** Commission de retrait anticipé, dégressive, calculée sur le prix de retrait */
  withdrawal: {
    base: 'prélevés sur la valeur de retrait',
    /**
     * `until` : durée de détention, en années, JUSQU'À laquelle le palier s'applique (borne exclue).
     * « au cours de la 5e ou de la 6e année » couvre donc [4 ans, 6 ans[. Le dernier palier n'a pas de
     * borne : il vaut au-delà de `zeroAfterYears`. Sans ces bornes, un calcul devrait déduire la durée
     * d'une phrase, et se tromperait à la première reformulation.
     */
    steps: [
      { period: 'Retrait avant 4 ans de détention', short: '< 4 ans', rate: '10 %', until: 4 },
      {
        period: 'Retrait au cours de la 5e ou de la 6e année',
        short: '5e-6e année',
        rate: '7 %',
        until: 6,
      },
      { period: 'Retrait au cours de la 7e année', short: '7e année', rate: '5 %', until: 7 },
      { period: 'Retrait au cours de la 8e année', short: '8e année', rate: '3 %', until: 8 },
      { period: 'Retrait après 8 ans de détention', short: '> 8 ans', rate: '0 %', until: null },
    ],
    zeroAfterYears: 8,
    /** Cas d'exonération prévus par la note d'information (ch. III § 6, extraction du PDF hébergé) ; libellé exact à confirmer par CORUM. */
    exemptions: [
      'invalidité',
      'décès de l’époux ou du partenaire de Pacs',
      'fin des droits au chômage',
      'surendettement',
      'liquidation judiciaire',
    ],
    exemptionsSource: 'Note d’information de R Start, chapitre III, paragraphe 6',
  }, // bulletin CGV, brochure p.4
  /** DIC : incidence annuelle des coûts, scénario intermédiaire, 10 000 € investis */
  dicCostImpact: {
    after1Year: '13,22 %',
    after5Years: '4,09 %',
    after10Years: '2,84 %',
  }, // DIC p.3
  // Correction demandée par l'AMF sur la brochure (09/2026) : les frais sur cessions immobilières sont
  // exprimés TTC. La commission de retrait anticipé l'est également (bulletin de souscription, CGV).
  vatNote:
    "Les frais mentionnés sont exprimés hors taxes (HT), à l'exception des frais sur cessions immobilières et de la commission de retrait anticipé, exprimés toutes taxes comprises (TTC). R Start étant exonérée de TVA, le montant hors taxes est égal au montant toutes taxes comprises.",
  distributorRemuneration: '0,85 % des encours', // bulletin CGV (rémunération récurrente des intermédiaires)
} as const;

/**
 * Comparatif pédagogique des frais, brochure partenaires 2026, page 6.
 * Moyennes de marché des SCPI « sans frais de souscription et avec frais d'acquisition », en regard du
 * modèle de R Start. Les valeurs de R Start ne sont PAS recopiées ici : elles viennent de `fees`
 * ci-dessus, seule source de vérité. La page 6 de la brochure abrège d'ailleurs les paliers de cession
 * de R Start (6 % puis 12 %) : le site affiche le barème complet de la page 4 et de la note
 * d'information (0 / 6 / 12 %).
 *
 * Publicité comparative encadrée (arbitrage du 10/09/2026) : aucune SCPI tierce n'est nommée dans la
 * partie visible du site ; le panel et la source vivent dans la note affichée sous la bascule.
 * L'intitulé de la colonne de marché reste celui de la brochure, « SCPI avec frais d'acquisition » :
 * ces SCPI ne prélèvent pas de commission de souscription, les appeler « SCPI avec frais d'entrée »
 * contredirait le 0 % affiché sur leur propre ligne de souscription.
 */
export const marketComparison = {
  columnLabel: 'SCPI avec frais d’acquisition',
  /** Les neuf SCPI du panel, citées uniquement dans la note de périmètre, jamais dans la partie visible. */
  panel: [
    'Novaxia NEO',
    'Iroko ZEN',
    'Iroko Atlas',
    'Remake Live',
    'Upêka',
    'Mistral Sélection',
    'Elevation Tertium',
    'Eden',
    'Epsicap Explore',
  ],
  perimeterLead:
    'Périmètre de l’analyse : les données relatives aux SCPI sans frais de souscription et avec frais d’acquisition correspondent à des moyennes de marché calculées sur la base des notes d’information et des documents de souscription publics des SCPI suivantes',
  perimeterTail:
    'et de la note d’information de R Start, gérée par CORUM Asset Management. Ces moyennes ne décrivent aucune SCPI en particulier et ne portent pas sur l’ensemble du marché.',
  /** Note de bas de tableau de la brochure p.6 (astérisque des frais d'agent immobilier). */
  brokerFootnote:
    'Frais d’agent immobilier (brokerage) appliqués par deux des neuf SCPI du panel, Iroko et Elevation Tertium.',
  source:
    'Brochure partenaires R Start 2026, page 6 ; moyennes arrêtées à la date de cette brochure.',
  /**
   * Moyennes de marché, dans l'ordre du parcours de l'épargnant. `timing` reprend le moment du
   * prélèvement indiqué par la brochure ; aucune valeur de R Start dans cet objet.
   */
  averages: {
    subscription: {
      label: '0 %',
      base: 'prélevés sur le montant investi',
      timing: 'Frais unique à l’entrée',
    },
    acquisition: {
      label: '4 %',
      base: 'prélevés sur le prix d’achat',
      timing: 'Frais récurrent à chaque acquisition',
    },
    // Brochure p.6 : « 0 - 5 % », borne basse et borne haute du panel.
    broker: {
      label: '0 à 5 %',
      base: 'prélevés sur le prix d’acquisition de l’immeuble en cas d’achat sans intermédiaire',
      timing: 'Frais récurrent',
    },
    management: {
      label: '14 %',
      base: 'prélevés sur les loyers encaissés',
      timing: 'Frais récurrent',
    },
    works: {
      label: '4 %',
      base: 'prélevés sur le montant total des travaux',
      timing: 'Frais ponctuels',
    },
    disposal: {
      label: '2,5 %',
      base: 'prélevés sur le prix de vente de l’immeuble',
      timing: 'Frais ponctuels',
    },
    withdrawal: {
      label: '5 %',
      base: 'prélevés sur la valeur de retrait, en cas de sortie avant 3 ou 5 ans selon la SCPI',
      timing: 'Frais unique à la sortie',
    },
  },
} as const;

/**
 * REPÈRE DE MARCHÉ DU SIMULATEUR (19/09/2026, /simulateur). Le taux de distribution moyen des SCPI en
 * 2025, toutes catégories confondues, PONDÉRÉ PAR LA CAPITALISATION : 4,91 %, en hausse de 0,19 point
 * sur 2024. Source : communiqué ASPIM-IEIF de février 2026, « Collecte et performance des fonds
 * immobiliers grand public en 2025 », relu le 19/09/2026.
 * CE N'EST PAS UN CHIFFRE DE R START, qui n'a pas d'historique : le simulateur le propose comme point
 * de comparaison, jamais comme hypothèse par défaut. Le second repère, la moyenne des SCPI CORUM,
 * n'est pas saisi ici : src/content/fr/simulator.ts le CALCULE depuis les taux 2025 de corumRange.ts,
 * pour qu'il ne puisse pas diverger de ceux que /a-propos affiche.
 * À REMPLACER chaque année, à la publication des chiffres de l'exercice suivant.
 */
export const marketBenchmarks = {
  aspim: {
    year: 2025,
    /** En pourcentage. */
    distributionRate: 4.91,
    source: 'ASPIM-IEIF, février 2026',
    sourceUrl:
      'https://www.aspim.fr/actualites/collecte-et-performance-des-fonds-immobiliers-grand-public-en-2025-des-signaux-damelioration-dans-des-marches-encore-sous-contraintes/',
  },
} as const;

export const income = {
  frequency: 'Mensuelle', // bulletin CGV, DIC
  frequencyLabel: 'Distribution mensuelle des dividendes potentiels',
  enjoymentDate: 'Le premier jour du sixième mois qui suit la souscription et son règlement', // bulletin CGV
  enjoymentShort: '1er jour du 6e mois',
  /** Délai de jouissance affiché en clin d'œil (brochure partenaires 2026, p.3 : « 6 mois ») ; règle du bulletin CGV inchangée. */
  enjoymentDelayMonths: 6,
  enjoymentDelayLabel: '6 mois',
  withholdingTax: '12,8 %', // bulletin CGV (prélèvement à la source, acompte d'IR sur produits financiers)
  socialContributions: '18,6 %', // bulletin CGV (hors prélèvements sociaux)
} as const;

export const risk = {
  // VALEUR DE L'ÉQUIPE, 4 sur 7 (14/09/2026, demande explicite de respecter son document à la lettre).
  // Elle revient sur l'arbitrage du 10/09/2026, qui suivait le DIC.
  //
  // ÉCART À CONNAÎTRE, il n'est pas résolu : le DIC V7 fourni par CORUM (20/05/2026, p.2 ; le PDF
  // n'est PLUS hébergé ici depuis le 18/09/2026, il répondait à son adresse directe alors qu'il était
  // « en attente », voir pendingDocuments.ts) dit « Nous avons classé ce produit dans la
  // classe de risque 3 sur 7, qui est une classe de risque moyenne » (texte extrait du PDF le
  // 10/09/2026). La brochure p.3 et CORUM (08/09/2026) disent 4 sur 7. L'AMF avait relevé cet écart
  // sur la brochure. Tant que le PDF était servi, un visiteur y lisait 3 là où la page affiche 4.
  // À trancher avec CORUM : soit le DIC hébergé n'est pas la bonne version, soit la valeur affichée
  // doit redescendre à 3. En attendant, AUCUNE phrase du site n'attribue plus cette valeur au DIC,
  // elle est attribuée à CORUM : le site ne peut pas faire dire au document qu'il héberge autre chose
  // que ce qu'il contient.
  sri: 4,
  sriMax: 7,
  sriLabel: '4 sur 7',
  sriClass: 'classe de risque moyenne', // libellé de l'échelle réglementaire pour ce rang
  recommendedHoldingYears: 10, // DIC, bulletin
  recommendedHoldingLabel: '10 ans',
  maxLeverage: '40 %', // DIC p.1 (de la valeur d'expertise des actifs immobiliers)
} as const;

export const strategy = {
  // LIBELLÉ D'AFFICHAGE, « Monde » (14/09/2026, demande de l'équipe). Il sert de titre à la section
  // Zone de /strategie et de ligne « Zone d'investissement » dans le kit média.
  // ÉCART À CONNAÎTRE : `zoneDetail` juste en dessous garde la zone du DIC, et c'est lui que citent les
  // notes légales. Le site affiche donc « Monde » et écrit, en note, la zone réelle du document
  // réglementaire. Un site ne peut pas faire dire au DIC qu'il héberge autre chose que ce qu'il
  // contient : la note reste la référence, le libellé est la formulation de l'équipe.
  zoneLabel: 'Monde',
  zoneDetail: "Pays du Conseil de l'Europe (en zone euro et hors zone euro) et Canada", // DIC p.1
  approach:
    "Stratégie d'investissement privilégiant la valorisation du patrimoine au regard du positionnement du pays étudié dans son cycle immobilier et économique", // DIC p.1
  levers: ['Les loyers distribués', 'Les plus-values réalisées'], // brochure p.3
  motto: 'Acheter décoté, valoriser, revendre', // brochure p.3 et p.7
  assetTypes: [
    'bureaux',
    'murs de commerce',
    "locaux d'activité",
    'entrepôts',
    'hôtels',
    'parkings',
    'santé',
    'résidences étudiantes',
    'plateformes logistiques',
    'loisirs',
  ], // DIC p.1
  targetAssetSize: 'immeubles de taille intermédiaire', // brochure p.3
  acquisitionModes:
    'immeubles acquis construits ou en état futur d’achèvement, détenus directement ou indirectement', // DIC p.1
} as const;

export const subscription = {
  onlineLabel: '100 % en ligne', // brochure p.7
  paymentMethods: ['Virement', 'Prélèvement SEPA'], // bulletin p.3
  options: {
    pei: {
      name: 'Plan Épargne Immobilier',
      description:
        'Versements programmés (fréquence mensuelle, trimestrielle, semestrielle ou annuelle)',
      minimum: 50, // €, adhésion PEI 04/2026 (tous frais inclus), prélèvement le 25 du mois
      minimumLabel: '50 €',
      minimumMonthlyLabel: '50 € par mois',
      requirement: 'Détenir au préalable au moins une part entière de R Start en pleine propriété', // adhésion PEI CGV
    },
    rd: {
      name: 'Réinvestissement des dividendes',
      description: 'Réinvestissement automatique de tout ou partie des dividendes',
    },
  }, // brochure p.5, bulletin p.1
  notEligible: ['démembrement', 'souscription papier', 'CORUM Life'], // brochure p.5
  documentsRequired: [
    "Pièce d'identité en cours de validité",
    'Justificatif de domicile de moins de 3 mois',
    "Relevé d'identité bancaire",
    "Justificatif d'origine des fonds",
  ], // bulletin p.1
  coolingOff:
    'En cas de démarchage bancaire ou financier, délai de réflexion de 48 heures (art. L. 341-16 IV du Code monétaire et financier)', // bulletin CGV
} as const;

export const corumGroup = {
  /**
   * Chiffres groupe : corum.fr (« Qui sommes-nous »), consulté le 08/09/2026 ; recoupés avec la brochure 2026.
   * Aucune date d'arrêté officielle (« données au … ») n'existe dans le dépôt ni dans les documents cités :
   * `statsSource` le dit explicitement et `statsDate` reste une date de consultation, pas d'arrêté.
   * Dès que CORUM communique la date d'arrêté, l'écrire ici (« données au … ») et passer STATS_DATED à true
   * dans corum.ts.
   */
  stats: [
    {
      value: '9,6 Md€',
      prefix: '',
      label: "d'épargne gérée par le groupe",
    },
    // « + » devant le nombre d'épargnants : brochure partenaires 2026, p. 7 ; la valeur vient de corum.fr.
    { value: '160 000', prefix: '+ ', label: 'épargnants' },
    { value: '2 500', prefix: '', label: 'partenaires professionnels' },
    { value: '250', prefix: '', label: 'collaborateurs dans 7 pays' },
  ],
  statsSource:
    'Source : CORUM L’Épargne, corum.fr, chiffres relevés le 8 septembre 2026 ; date d’arrêté des données non communiquée par CORUM. Chiffres du groupe CORUM, sans lien avec les résultats futurs de R Start.',
  /** Date de consultation de corum.fr, pas date d'arrêté des chiffres. */
  statsDate: { label: '8 septembre 2026' },
  /**
   * Ancienneté du groupe CORUM dans l'immobilier d'entreprise : brochure partenaires 2026, p.7
   * (« 15 ans d'expertise »), cohérente avec l'agrément AMF du 14 avril 2011. Décrit une durée
   * d'activité. La formule « objectifs tenus » de la brochure est reprise dans le libellé du chiffre
   * (trust.ts, document de l'équipe du 14/09/2026) : c'est une allégation, signalée par le contrôle.
   */
  experienceLabel: '15 ans',
  scpiSince: 2012,
  scpiCount: 5,
  scpiNames: ['CORUM Origin', 'CORUM XL', 'CORUM Eurion', 'CORUM USA', 'R Start'],
  offices: 7,
  amfSince: '14 avril 2011',
  disposalsDisclaimer:
    'Les cessions réalisées par les SCPI CORUM ne préjugent pas de leurs performances futures.', // brochure p.7
} as const;

/**
 * ANNÉE DE CRÉATION DE CHAQUE SCPI de la gamme (16/09/2026, demande de l'équipe : « la date de
 * création de chaque SCPI sous les SCPI », page /a-propos).
 *
 * SOURCE À FAIRE CONFIRMER PAR CORUM. Une seule de ces cinq dates est adossée à une pièce du dossier :
 * celle de R Start, dont la note d'information porte le visa SCPI n° 26-06 du 4 mars 2026. Les quatre
 * autres sont les années d'ouverture publiquement connues de chaque SCPI ; aucun document fourni pour
 * ce site ne les porte. À vérifier auprès de la société de gestion avant la mise en ligne publique,
 * comme la date d'arrêté des chiffres du groupe.
 *
 * CORUM Origin a été créée sous le nom CORUM Convictions et renommée en 2019 : l'année retenue est
 * celle de la CRÉATION, que la demande vise, et non celle du changement de nom.
 *
 * Cohérent avec `corumGroup.scpiSince` (2012) et avec les « 15 ans d'expertise » de la brochure p. 7.
 *
 * Objet indexé par le nom plutôt que tableau parallèle à `scpiNames` : deux listes alignées par
 * position se désalignent au premier ajout, et la gamme en attend d'autres.
 */
export const scpiCreated: Record<string, string> = {
  'CORUM Origin': '2012',
  'CORUM XL': '2017',
  'CORUM Eurion': '2020',
  'CORUM USA': '2023',
  'R Start': '2026',
};

export const documents = [
  {
    key: 'dic',
    title: "Document d'informations clés (DIC)",
    description:
      'Objectifs, risques, coûts et scénarios de performance réglementaires. Lecture obligatoire avant toute souscription.',
    file: '/documents/r-start-dic.pdf',
    version: 'Version du 20 mai 2026',
  },
  {
    key: 'note',
    title: "Note d'information",
    description:
      'Document visé par l’AMF (visa SCPI n° 26-06 du 4 mars 2026) : fonctionnement, frais, modalités de souscription et de retrait.',
    file: '/documents/r-start-note-information.pdf',
    version: 'Visa AMF n° 26-06 du 4 mars 2026',
  },
  {
    key: 'statuts',
    title: 'Statuts',
    description: 'Statuts à jour de la société R Start.',
    file: '/documents/r-start-statuts.pdf',
    version: 'Version 3',
  },
  {
    key: 'bulletin',
    title: 'Bulletin de souscription',
    description: 'Conditions générales de vente, avertissement et modalités de règlement.',
    file: '/documents/r-start-bulletin-souscription.pdf',
    version: 'Mai 2026',
  },
] as const;

export const externalLinks = {
  corum: 'https://www.corum.fr',
  corumLegal: 'https://www.corum.fr/mentions-legales',
  amfMediator: 'https://www.amf-france.org',
  /** Application MyCORUM (CORUM L'Épargne) : suivi de l'épargne après souscription. */
  myCorumAppStore: 'https://apps.apple.com/fr/app/mycorum/id6692633584',
  myCorumGooglePlay: 'https://play.google.com/store/apps/details?id=com.client.corum&hl=fr',
} as const;

/** Blocs de confiance (périmètre v2). Aucun logo AMF, aucune formulation de caution. */
export const trust = {
  amf: {
    visaSentence:
      'La note d’information de R Start a obtenu le visa SCPI n° 26-06 de l’Autorité des marchés financiers (AMF) le 4 mars 2026.', // bulletin CGV
    managementCompanyApproval:
      // « agréée et réglementée » : formulation demandée par l'AMF dans ses retours sur la brochure (09/2026).
      'CORUM Asset Management, société de gestion de portefeuille, est agréée et réglementée par l’AMF depuis le 14 avril 2011 sous le numéro GP-11000012, et relève de la directive AIFM depuis le 10 juillet 2014.', // bulletin CGV
    disclaimer:
      'Le visa de l’AMF n’implique ni approbation de l’opportunité de l’opération ni authentification des éléments comptables et financiers présentés.', // formulation standard AMF, à valider par la Conformité
    depositary: 'Société Générale', // DIC p.1
    depositarySentence:
      'Les actifs de R Start sont conservés par un dépositaire indépendant, Société Générale.', // DIC p.1-2
    sfdrLabel: 'Article 8 du règlement SFDR', // DIC p.4
    supervisorNote:
      'L’AMF est chargée du contrôle de CORUM Asset Management en ce qui concerne le document d’informations clés.', // DIC p.1
  },
  trustpilot: {
    company: "CORUM L'Épargne",
    url: 'https://fr.trustpilot.com/review/www.corum.fr', // profil visé par les codes d'intégration Trustpilot
    /**
     * Identifiants des TrustBox officiels, remis par l'équipe depuis le back-office Trustpilot de CORUM.
     * Ils ne se devinent pas : toute modification vient de ce back-office.
     *
     * CARROUSEL FILTRÉ SUR 4 ET 5 ÉTOILES depuis le 15/09/2026, avec un nouveau token, code
     * d'intégration fourni par l'équipe. Il diffusait jusque-là TOUTES les notes, de une à cinq.
     *
     * CE QUE CE RÉGLAGE CHANGE, ET QUI DOIT ÊTRE SU. Le site n'affiche plus que des avis favorables :
     * c'est une SÉLECTION, faite par le paramétrage du widget, et non plus un flux non trié. Les textes
     * qui l'accompagnaient ont donc été réécrits le même jour (trust.ts, `scope` et la note
     * `confiance-trustpilot`) : ils affirmaient « toutes les notes, de une à cinq étoiles, avis négatifs
     * compris », ce qui serait devenu faux. L'article L111-7-2 du code de la consommation impose
     * d'informer sur les modalités de publication et de traitement des avis ; dire que le carrousel est
     * filtré est le minimum, et l'opportunité du filtre lui-même est une décision de l'équipe, à faire
     * valider par la Conformité.
     */
    widgets: {
      locale: 'fr-FR',
      businessUnitId: '5fbeb56b2bf7fb00015d6b3f',
      templates: {
        horizontal: {
          templateId: '5406e65db0d04a09e042d5fc',
          token: '82ca7f96-d8e5-4085-9c1a-2f0b448390c4',
          height: '28px',
          stars: undefined,
          reviewLanguages: undefined,
        },
        carousel: {
          templateId: '53aa8912dec7e10d38f59f36',
          token: 'c7d01bac-c778-4cec-9929-cd93e1283460',
          height: '140px',
          stars: '4,5',
          reviewLanguages: 'fr',
        },
      },
    },
    scope:
      'Avis publiés sur Trustpilot à propos de CORUM L’Épargne, distributeur de R Start. Ils ne portent ni sur R Start ni sur ses résultats futurs.',
  },
} as const;

/**
 * Espace presse (périmètre v2). Contacts relevés sur corum.fr/conseillers#presse le 08/09/2026 ;
 * e-mails à confirmer.
 * AGENCE CORRIGÉE le 14/09/2026 par l'équipe : Hugues de Tournemire est chez Rud Pedersen France, et
 * non chez Bien Commun Advisory comme l'indiquait la page consultée le 08/09/2026. C'est le nom donné
 * par l'équipe qui fait foi, pas le relevé.
 */
export const press = {
  contacts: [
    {
      organisation: "CORUM L'Épargne",
      name: 'Quentin Hacquard',
      role: 'Press & Corporate Communication Manager',
      phone: '+33 6 99 60 10 25',
      email: 'quentin.hacquard@corumlepargne.fr', // fournie par l'équipe le 16/09/2026
    },
    {
      organisation: "Rud Pedersen France, pour CORUM L'Épargne",
      name: 'Hugues de Tournemire',
      role: 'Relations presse',
      phone: '+33 6 67 07 22 33',
      email: 'h.detournemire@rudpedersen.com', // fournie par l'équipe le 16/09/2026
    },
  ],
  contactsSource: 'corum.fr, rubrique Contacts presse, consultée le 8 septembre 2026',
  /**
   * Revue de presse « La presse en parle » : onze articles. Les neuf premiers sont la sélection livrée
   * par CORUM le 10/09/2026, dans l'ordre de la sélection ; les deux derniers ont été ajoutés par
   * l'équipe le 14/09/2026. Titres et dates reproduits tels que fournis ou relevés sur la page ; ce sont
   * des citations de tiers, couvertes par `coverageDisclaimer`, jamais des formulations du site.
   * `url` n'est renseignée QUE POUR LES ADRESSES OUVERTES ET VÉRIFIÉES, titre de page à l'appui : un
   * article sans adresse s'affiche avec son média et sa date, sans lien (arbitrage du 10/09/2026).
   * Une adresse fausse sur un site financier réglementé coûte plus cher qu'un lien manquant, donc rien
   * n'est écrit ici sur la foi d'un résultat de recherche.
   * Apport du 14/09/2026 : l'équipe a transmis une liste d'adresses, toutes TRONQUÉES au collage. Les
   * quatre qui ont pu être reconstituées ont été rouvertes une à une ; deux répondent en 200 avec le
   * bon titre et sont écrites ci-dessous, deux renvoient un 403 anti-robot (Les Echos, Business Immo)
   * et attendent une confirmation au navigateur, leur adresse candidate étant notée sur place.
   */
  coverage: [
    {
      media: 'Les Echos',
      title:
        'Immobilier : CORUM, le géant des SCPI, joue à son tour la carte du « sans frais d’entrée »',
      date: { label: 'Mai 2026', iso: '2026-05' },
      /* ADRESSE CANDIDATE, NON VÉRIFIÉE (14/09/2026), à ouvrir au navigateur avant de la coller ici :
         https://www.lesechos.fr/patrimoine/immobilier/immobilier-corum-le-geant-des-scpi-joue-a-son-tour-la-carte-du-sans-frais-dentree-2232391
         lesechos.fr renvoie un 403 anti-robot, la capture d'archive du 21/05/2026 est elle-même une page
         « Access Denied » : le chemin est cohérent, le contenu n'est pas confirmé. */
      url: '',
    },
    {
      media: 'Investir / Les Echos',
      title: 'Immobilier : les critères pour bien choisir ses SCPI',
      date: { label: 'Mai 2026', iso: '2026-05' },
      url: '',
    },
    {
      media: 'Le Particulier / Le Figaro',
      title:
        'Avec R Start, sa SCPI sans frais de souscription ni d’acquisition, CORUM AM confirme son statut d’électron libre de la pierre papier',
      date: { label: '20 mai 2026', iso: '2026-05-20' },
      url: '',
    },
    {
      media: 'Business Immo',
      title: 'Quand Corum innove sur le marché des SCPI',
      date: { label: '21 mai 2026', iso: '2026-05-21' },
      /* ADRESSE CANDIDATE, NON VÉRIFIÉE (14/09/2026), à ouvrir au navigateur avant de la coller ici :
         https://www.businessimmo.com/actualites/article/1776557328/quand-corum-innove-sur-le-marche-des-scpi
         403 anti-robot, aucune capture d'archive. Deux index concordants seulement (businessimmo.com et
         son miroir CoStar, même identifiant d'article, même titre) : plausible, pas prouvé. */
      url: '',
    },
    {
      media: 'Tout sur mes finances',
      title: 'R Start : la nouvelle SCPI de Corum qui supprime aussi les frais d’acquisition',
      date: { label: '21 mai 2026', iso: '2026-05-21' },
      url: 'https://www.toutsurmesfinances.com/actualites/a/r-start-la-nouvelle-scpi-de-corum-qui-supprime-aussi-les-frais-d-acquisition',
    },
    {
      media: 'MeilleureSCPI.com',
      title:
        'R Start (Corum) : la première SCPI sans frais de souscription de Corum lancée en 2026',
      date: { label: 'Mise à jour juillet 2026', iso: '2026-07' },
      url: 'https://www.meilleurescpi.com/actualites/r-start-corum-lance-officiellement-sa-premiere-scpi-sans-frais-de-souscription/',
    },
    {
      media: 'Profession CGP',
      title: 'Corum lance la SCPI R Start',
      date: { label: 'Mai 2026', iso: '2026-05' },
      // Ouverte le 14/09/2026 : 200, <title> « Corum lance la SCPI R Start - Profession CGP ».
      url: 'https://www.professioncgp.com/article/produits-services/pierre-papier/corum-lance-la-scpi-r-start.html',
    },
    {
      media: 'Investissements Conseils',
      title: 'Une SCPI qui veut bousculer les codes…',
      date: { label: 'Mai 2026', iso: '2026-05' },
      url: '',
    },
    {
      media: 'CFNews Immo',
      title: 'La nouvelle proposition de valeur que formule R Start aux épargnants',
      date: { label: 'Mai 2026', iso: '2026-05' },
      /* Ouverte le 14/09/2026 : 200, titre exact. Mur payant (« 93 % reste à lire ») : le lecteur voit
         le titre et le chapô, ce qui reste préférable à un article sans lien du tout. */
      url: 'https://www.cfnewsimmo.net/L-actualite/Levee-de-fonds/Vehicule/La-nouvelle-proposition-de-valeur-que-formule-R-Start-aux-epargnants-500106',
    },
    /*
     * DEUX AJOUTS DE L'ÉQUIPE le 14/09/2026, hors de la sélection livrée par CORUM le 10/09/2026 et
     * arbitrés ce jour-là. Placés EN FIN DE LISTE, pas à leur rang chronologique : les neuf premiers
     * gardent l'ordre exact de la sélection, qui est une décision éditoriale de CORUM, et le composant
     * n'applique aucun tri. Adresses et dates relevées sur les pages elles-mêmes.
     */
    {
      media: 'CFNews Immo',
      title: 'SCPI : Corum Start relance le débat sur les commissions',
      // Publié le 24/04/2026, mis à jour le 04/05/2026 (dates lues sur la page).
      date: { label: '24 avril 2026', iso: '2026-04-24' },
      url: 'https://www.cfnewsimmo.net/L-actualite/Tete-d-affiche/SCPI-Corum-Start-relance-le-debat-sur-les-commissions-498556',
    },
    {
      /* Dépêche d'agence : la page ouverte est celle de Combourse, la source qu'elle affiche est
         Agefi.fr. Le média est nommé tel quel, on ne crédite pas un média dont on n'ouvre pas la page. */
      media: 'Combourse, dépêche Agefi.fr',
      title: 'Corum lance R Start, une SCPI sans frais de souscription',
      date: { label: '19 mai 2026', iso: '2026-05-19' },
      url: 'https://www.combourse.com/News/Corum_lance_R_Start_une_SCPI_sans_frais_de_souscription__3143146.html',
    },
  ],
  /**
   * Articles identifiés le 08/09/2026 mais hors de la sélection livrée le 10/09/2026 : adresses
   * conservées pour ne pas les reperdre, jamais affichées (MeilleureSCPI.com et Idéal Investisseur
   * publient par ailleurs des avis de plateforme de distribution, pas des articles d'information).
   */
  coverageArchive: [
    {
      media: 'Pierre Papier',
      title: 'Corum propose un nouveau modèle de frais avec la SCPI R Start',
      url: 'https://www.pierrepapier.fr/scpi/corum-propose-un-nouveau-modele-de-frais-avec-la-scpi-r-start/',
    },
    {
      media: 'Idéal Investisseur',
      title: 'SCPI R Start : analyse complète',
      url: 'https://www.ideal-investisseur.fr/scpi-avis/corum-r-start-10164.html',
    },
    {
      media: 'Rock-n-Data',
      title: 'SCPI R Start : Corum lance son offre sans frais',
      url: 'https://www.rock-n-data.io/fr/scpi-r-start-corum-lance-son-offre-sans-frais/',
    },
  ],
  /**
   * Trois citations mises en avant, livrées par CORUM le 10/09/2026 avec leur média et leur date.
   * Reproduites mot pour mot : ce sont des propos de tiers, couverts par `coverageDisclaimer`.
   */
  quotes: [
    {
      text: 'CORUM AM confirme son statut d’électron libre de la pierre papier.',
      media: 'Le Particulier / Le Figaro',
      date: { label: '20 mai 2026', iso: '2026-05-20' },
    },
    {
      text: 'Un troisième modèle de SCPI qui prend place sur le marché : un modèle de rupture.',
      media: 'MeilleureSCPI.com',
      date: { label: 'Juillet 2026', iso: '2026-07' },
    },
    {
      text: 'Corum veut bousculer les codes de la pierre-papier. Un modèle pensé pour renforcer la transparence du marché',
      media: 'Investissements Conseils',
      date: { label: 'Mai 2026', iso: '2026-05' },
    },
  ],
  /** Avertissement de fin de page, livré par CORUM le 10/09/2026 ; reproduit à l'identique. */
  coverageDisclaimer:
    'Les articles référencés sur cette page sont des publications indépendantes. Ils n’engagent pas CORUM Asset Management et ne constituent pas un conseil en investissement. Les informations publiées par la presse reflètent le contexte du lancement de R Start en mai 2026. Investir dans une SCPI comporte des risques, notamment de perte en capital. Les performances passées ne préjugent pas des performances futures.',
} as const;

/** Documents complémentaires (périmètre v2), en plus de `documents`. Fichiers vérifiés (intègres) le 08/09/2026. */
export const documentsExtra = [
  {
    key: 'simulation',
    group: 'frais',
    title: 'Simulation des frais ex-ante',
    description:
      'Illustration réglementaire de l’ensemble des coûts supportés par l’épargnant, avant souscription.',
    file: '/documents/r-start-simulation-frais-ex-ante.pdf',
    version: 'Version 2, mars 2026',
  },
  {
    key: 'pei',
    group: 'formulaire',
    title: 'Adhésion au Plan Épargne Immobilier',
    description:
      'Mise en place de versements programmés (à partir de 50 €), mandat de prélèvement SEPA et conditions générales.',
    file: '/documents/r-start-adhesion-plan-epargne-immobilier.pdf',
    version: 'Version 2.5, avril 2026',
  },
  {
    key: 'rd',
    group: 'formulaire',
    title: 'Adhésion au réinvestissement des dividendes',
    description:
      'Réinvestissement automatique de tout ou partie des dividendes potentiels en nouvelles parts.',
    file: '/documents/r-start-adhesion-reinvestissement-dividendes.pdf',
    version: 'Version 2.5',
  },
  {
    key: 'mandat',
    group: 'formulaire',
    title: 'Mandat de prélèvement SEPA',
    description: 'Autorisation de prélèvement pour le règlement d’une souscription.',
    file: '/documents/r-start-mandat-prelevement.pdf',
    version: 'Version 2.1, avril 2026',
  },
  {
    key: 'retrait',
    group: 'formulaire',
    title: 'Formulaire de retrait de parts',
    description: 'Demande de retrait, totale ou partielle, adressée à la société de gestion.',
    file: '/documents/corum-am-formulaire-retrait-parts.pdf',
    version: 'Version 2.2, 2026',
  },
  {
    key: 'rib-change',
    group: 'formulaire',
    title: 'Changement de coordonnées bancaires',
    description: 'Mise à jour du compte bancaire de perception des dividendes.',
    file: '/documents/corum-am-formulaire-changement-coordonnees-bancaires.pdf',
    version: 'Version 2.1, avril 2026',
  },
] as const;
