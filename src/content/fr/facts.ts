/**
 * SOURCE DE VÉRITÉ des données produit R Start. Chaque valeur est tracée vers un document officiel
 * (DIC V7 du 20/05/2026, bulletin de souscription 2026.05 et ses CGV, brochure partenaires 2026,
 * corum.fr/mentions-legales) ; aucun chiffre du site ne doit venir d'ailleurs.
 *
 * Points en attente de confirmation par CORUM (voir README) :
 *  - SRI : le site affiche 4/7 (valeur de l'équipe, brochure p.3), le DIC V7 dit 3/7. Écart non
 *    tranché, détail sous `risk`.
 *  - Minimum des versements programmés (PEI) : 50 € (adhésion PEI 04/2026) → affiché.
 *  - Cas d'exonération de la commission de retrait : note d'information ch. III § 6, libellé exact
 *    à confirmer ; affichés nulle part depuis le 14/09/2026.
 *  - Chiffres groupe : corum.fr consulté le 08/09/2026 ; date d'arrêté officielle à fournir par
 *    CORUM.
 */

export const product = {
  name: 'R Start',
  legalName: 'R Start, Société Civile de Placement Immobilier à capital variable',
  type: 'SCPI de rendement à capital variable',
  tagline: 'La SCPI nouvelle génération', // brochure partenaires 2026, p.1, accroche rétablie par la réunion produit du 10/09/2026
  /*
   * L'allégation de rang bornée de la brochure (p. 4 et 6, « la première SCPI du groupe CORUM sans
   * frais d'entrée ni frais sur les achats d'immeubles ») a quitté l'écran le 15/09/2026 et le code
   * le 22/09/2026 (archivée hors du dépôt, .claude/audits). La version marché, sans le groupe
   * CORUM, reste celle de l'accroche du hero, que scripts/check-compliance.mjs signale.
   */
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
     * Fourchette et non liste de paliers (12/09/2026, demande de l'équipe) : « de 0 % à 12 % » se
     * lit, « 0 / 6 / 12 % » se déchiffre. Les trois paliers restent dans `tiers`.
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
     * `until` : durée de détention, en années, JUSQU'À laquelle le palier s'applique (borne
     * exclue) ; « 5e ou 6e année » couvre [4, 6[. Le dernier palier vaut au-delà de
     * `zeroAfterYears`. Sans ces bornes, un calcul devrait déduire la durée d'une phrase et se
     * tromperait à la reformulation.
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
  // R Start étant exonérée de TVA, ses montants HT et TTC sont égaux.
  distributorRemuneration: '0,85 % des encours', // bulletin CGV (rémunération récurrente des intermédiaires)
} as const;

/**
 * Les neuf SCPI du panel de la brochure partenaires 2026 (p. 6, moyennes de marché des SCPI « sans
 * frais de souscription et avec frais d'acquisition »). Les moyennes ont quitté le code le
 * 22/09/2026 (archivées hors du dépôt, .claude/audits) ; le panel reste pour
 * scripts/check-compliance.mjs, qui contrôle ce que /frais nomme.
 */
export const marketComparison = {
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
} as const;

/**
 * REPÈRE DE MARCHÉ DU SIMULATEUR : taux de distribution moyen des SCPI en 2025, toutes catégories,
 * PONDÉRÉ PAR LA CAPITALISATION (communiqué ASPIM-IEIF de février 2026, relu le 19/09/2026). CE
 * N'EST PAS UN CHIFFRE DE R START, qui n'a pas d'historique : point de comparaison, jamais
 * hypothèse par défaut. Le second repère, la moyenne des SCPI CORUM, est CALCULÉ par simulator.ts
 * depuis les taux 2025 de corumRange.ts, pour ne pas diverger de /a-propos. À REMPLACER chaque
 * année.
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
  enjoymentDate: 'Le premier jour du sixième mois qui suit la souscription et son règlement', // bulletin CGV
  enjoymentShort: '1er jour du 6e mois',
  /** Délai de jouissance affiché en clin d'œil (brochure partenaires 2026, p.3 : « 6 mois ») ; règle du bulletin CGV inchangée. */
  enjoymentDelayMonths: 6,
  enjoymentDelayLabel: '6 mois',
  withholdingTax: '12,8 %', // bulletin CGV (prélèvement à la source, acompte d'IR sur produits financiers)
  socialContributions: '18,6 %', // bulletin CGV (hors prélèvements sociaux)
} as const;

export const risk = {
  // VALEUR DE L'ÉQUIPE, 4 sur 7 (14/09/2026, demande explicite de respecter son document à la
  // lettre), qui revient sur l'arbitrage du 10/09/2026, lequel suivait le DIC.
  // ÉCART À CONNAÎTRE, NON RÉSOLU : le DIC V7 fourni par CORUM (20/05/2026, p.2, texte extrait du
  // PDF le 10/09/2026) dit « Nous avons classé ce produit dans la classe de risque 3 sur 7, qui est
  // une classe de risque moyenne » ; la brochure p.3 et CORUM (08/09/2026) disent 4 sur 7, écart
  // que l'AMF avait relevé sur la brochure. Le PDF n'est plus hébergé depuis le 18/09/2026
  // (pendingDocuments.ts). À trancher avec CORUM : soit ce DIC V7 n'est pas la bonne version, soit
  // la valeur affichée doit redescendre à 3. En attendant, AUCUNE phrase du site n'attribue cette
  // valeur au DIC, elle est attribuée à CORUM : le site ne peut pas faire dire au DIC autre chose
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
  // LIBELLÉ D'AFFICHAGE « Monde » (14/09/2026, demande de l'équipe), sans plus aucun lecteur depuis
  // le 22/09/2026 : il garde la trace de la décision. ÉCART À CONNAÎTRE : `zoneDetail` garde la
  // zone du DIC, que plus rien ne lit ni n'affiche ; /strategie écrit « partout dans le monde » en
  // toutes lettres (strategy.ts) sans écrire nulle part la zone réelle du document réglementaire.
  // Un site ne peut pas faire dire au DIC autre chose que ce qu'il contient : `zoneDetail` reste la
  // référence, le libellé est la formulation de l'équipe.
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
   * Chiffres groupe : corum.fr (« Qui sommes-nous »), consulté le 08/09/2026, recoupés avec la
   * brochure 2026. Aucune date d'arrêté officielle n'existe dans les documents cités : `statsDate`
   * est une date de consultation. Dès que CORUM communique la date d'arrêté, l'écrire ici.
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
  /** Date de consultation de corum.fr, pas date d'arrêté des chiffres. */
  statsDate: { label: '8 septembre 2026' },
  /**
   * Ancienneté du groupe dans l'immobilier d'entreprise : brochure partenaires 2026, p.7 (« 15 ans
   * d'expertise »), cohérente avec l'agrément AMF du 14 avril 2011. La formule « objectifs tenus »
   * de la brochure est reprise dans le libellé du chiffre (trust.ts, document de l'équipe du
   * 14/09/2026) : c'est une allégation, signalée par le contrôle.
   */
  experienceLabel: '15 ans',
  scpiSince: 2012,
  scpiCount: 5,
  scpiNames: ['CORUM Origin', 'CORUM XL', 'CORUM Eurion', 'CORUM USA', 'R Start'],
  offices: 7,
  amfSince: '14 avril 2011',
} as const;

/**
 * Année de création de chaque SCPI de la gamme (16/09/2026, demande de l'équipe, page /a-propos).
 * SOURCE À FAIRE CONFIRMER PAR CORUM : seule la date de R Start est adossée à une pièce du dossier
 * (visa SCPI n° 26-06 du 4 mars 2026) ; les quatre autres sont les années d'ouverture publiquement
 * connues, qu'aucun document fourni ne porte. CORUM Origin est née CORUM Convictions (renommée en
 * 2019) : l'année retenue est celle de la création. Cohérent avec `corumGroup.scpiSince` et les
 * « 15 ans d'expertise » de la brochure p. 7. Objet indexé par le nom plutôt que tableau parallèle
 * à `scpiNames` : deux listes alignées par position se désalignent au premier ajout.
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
     * Identifiants des TrustBox officiels, remis par l'équipe depuis le back-office Trustpilot de
     * CORUM ; ils ne se devinent pas. CARROUSEL FILTRÉ SUR 4 ET 5 ÉTOILES depuis le 15/09/2026
     * (code d'intégration fourni par l'équipe) : le site n'affiche plus que des avis favorables,
     * une SÉLECTION faite par le paramétrage du widget et non un flux non trié. Les textes qui
     * disaient « toutes les notes, de une à cinq étoiles, avis négatifs compris » ont été retirés
     * le même jour. L'article L111-7-2 du code de la consommation impose d'informer sur les
     * modalités de publication et de traitement des avis ; dire que le carrousel est filtré est le
     * minimum, et le filtre lui-même est une décision de l'équipe, à faire valider.
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
  },
} as const;

/**
 * Espace presse. Contacts relevés sur corum.fr/conseillers#presse le 08/09/2026, agence corrigée
 * par l'équipe le 14/09/2026 (Rud Pedersen France, et non Bien Commun Advisory) : le nom donné par
 * l'équipe fait foi, pas le relevé.
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
  /**
   * Revue de presse : onze articles, les neuf premiers dans l'ordre de la sélection livrée par
   * CORUM le 10/09/2026, les deux derniers ajoutés par l'équipe le 14/09/2026. Titres et dates
   * reproduits tels que fournis ou relevés : ce sont des citations de tiers, jamais des
   * formulations du site. `url` n'est renseignée QUE POUR LES ADRESSES OUVERTES ET VÉRIFIÉES, titre
   * de page à l'appui ; un article sans adresse n'est pas repris (filtre de press.ts) et revient
   * avec son `url`. Une adresse fausse sur un site financier réglementé coûte plus cher qu'un lien
   * manquant, donc rien n'est écrit ici sur la foi d'un résultat de recherche. Les adresses
   * transmises par l'équipe le 14/09/2026 étaient tronquées ; deux ont pu être vérifiées, deux (Les
   * Echos, Business Immo) répondent 403 anti-robot et attendent une confirmation au navigateur,
   * adresse candidate notée sur place.
   */
  coverage: [
    {
      media: 'Les Echos',
      title:
        'Immobilier : CORUM, le géant des SCPI, joue à son tour la carte du « sans frais d’entrée »',
      date: { label: 'Mai 2026', iso: '2026-05' },
      /* ADRESSE CANDIDATE, NON VÉRIFIÉE (14/09/2026), à ouvrir au navigateur avant de la coller ici :
         https://www.lesechos.fr/patrimoine/immobilier/immobilier-corum-le-geant-des-scpi-joue-a-son-tour-la-carte-du-sans-frais-dentree-2232391
         403 anti-robot, capture d'archive elle-même « Access Denied » : plausible, pas confirmé. */
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
         403 anti-robot, aucune capture d'archive, deux index concordants : plausible, pas sûr. */
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
     * Deux ajouts de l'équipe (14/09/2026), placés EN FIN DE LISTE et non à leur rang
     * chronologique : les neuf premiers gardent l'ordre de la sélection de CORUM, et le composant
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
   * Trois citations livrées par CORUM le 10/09/2026, reproduites mot pour mot : des propos de
   * tiers, que seule la mention du pied de page accompagne (avertissement retiré le 16/09/2026).
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
