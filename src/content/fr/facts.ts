/**
 * SOURCE DE VÉRITÉ des données produit R Start.
 * Chaque valeur est tracée vers un document officiel. Aucun chiffre du site ne doit venir d'ailleurs.
 * Sources : DIC V7 (20/05/2026), Bulletin de souscription 2026.05 (CGV), Brochure partenaires 2026,
 * corum.fr/mentions-legales.
 *
 * Points en attente de confirmation par CORUM (voir README) :
 *  - SRI : 4/7 confirmé par CORUM le 08/09/2026 (brochure p.3). Le DIC V7 hébergé (20/05/2026) indique 3/7 :
 *    CORUM doit fournir le DIC à jour (public/documents/r-start-dic.pdf) avant mise en ligne.
 *  - Minimum des versements programmés (PEI) : 50 € (adhésion PEI 04/2026) → affiché.
 *  - Cas d'exonération de la commission de retrait : confirmés par la note d'information ch. III § 6 → affichés (libellé exact à confirmer).
 *  - Chiffres groupe : corum.fr consulté le 08/09/2026 ; date de référence officielle à fournir par CORUM.
 */

export const product = {
  name: 'R Start',
  legalName: 'R Start, Société Civile de Placement Immobilier à capital variable',
  type: 'SCPI de rendement à capital variable',
  tagline: 'L’immobilier nouvelle génération', // formulation retenue par CORUM le 09/09/2026 (brochure p.1 : « La SCPI nouvelle génération »)
  visa: { number: '26-06', date: '4 mars 2026', dateIso: '2026-03-04' }, // bulletin, brochure p.8
  creationDate: { label: '19 janvier 2026', iso: '2026-01-19' }, // bulletin CGV
  openingDate: { label: '20 mai 2026', iso: '2026-05-20' }, // bulletin CGV
  dicDate: { label: '20 mai 2026', iso: '2026-05-20' }, // DIC p.1
  rcs: 'RCS Paris 100 177 997', // DIC p.4
  address: '1 rue Euler, 75008 Paris',
  phone: '01 53 75 87 48',
  phoneIntl: '+33153758748',
  email: 'corum@corum.fr',
  depositary: 'Société Générale', // DIC p.1
  sfdr: 'Article 8 du Règlement (UE) 2019/2088 (SFDR)', // DIC p.4
} as const;

export const share = {
  price: 200, // € — bulletin CGV
  priceLabel: '200 €',
  nominal: 182, // € — bulletin CGV
  premium: 18, // € — bulletin CGV (prime d'émission, dont 0 € de commission de souscription)
  minimumShares: 1, // bulletin CGV
  minimumLabel: '200 €',
  withdrawalPrice: 200, // € — bulletin CGV
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
    label: '0 / 6 / 12 %',
    base: 'prélevés sur le montant HT de la vente',
    tiers: [
      { condition: 'si la plus-value est inférieure à 7 %', rate: '0 %' },
      { condition: 'si la plus-value est comprise entre 7 % et 13 %', rate: '6 %' },
      { condition: 'si la plus-value est supérieure à 13 %', rate: '12 %' },
    ],
    basisNote: 'Plus-value exprimée en pourcentage du prix de vente.', // brochure p.6
  }, // brochure p.4
  /** Commission de retrait anticipé, dégressive, calculée sur le prix de retrait */
  withdrawal: {
    base: 'prélevés sur la valeur de retrait',
    steps: [
      { period: 'Retrait avant 4 ans de détention', short: '< 4 ans', rate: '10 %' },
      { period: 'Retrait au cours de la 5e ou de la 6e année', short: '5e-6e année', rate: '7 %' },
      { period: 'Retrait au cours de la 7e année', short: '7e année', rate: '5 %' },
      { period: 'Retrait au cours de la 8e année', short: '8e année', rate: '3 %' },
      { period: 'Retrait après 8 ans de détention', short: '> 8 ans', rate: '0 %' },
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
  vatNote:
    "Les frais mentionnés sont exprimés hors taxes (HT). R Start étant exonérée de TVA, le montant hors taxes est égal au montant toutes taxes comprises (TTC).", // brochure p.4
  distributorRemuneration: '0,85 % des encours', // bulletin CGV (rémunération récurrente des intermédiaires)
} as const;

export const income = {
  frequency: 'Mensuelle', // bulletin CGV, DIC
  frequencyLabel: 'Distribution mensuelle des dividendes potentiels',
  enjoymentDate: 'Le premier jour du sixième mois qui suit la souscription et son règlement', // bulletin CGV
  enjoymentShort: '1er jour du 6e mois',
  withholdingTax: '12,8 %', // bulletin CGV (prélèvement à la source, acompte d'IR sur produits financiers)
  socialContributions: '18,6 %', // bulletin CGV (hors prélèvements sociaux)
} as const;

export const risk = {
  sri: 4, // Confirmé par CORUM le 08/09/2026 (brochure p.3) ; DIC hébergé V7 (3/7) à remplacer par la version à jour
  sriMax: 7,
  sriLabel: '4 sur 7',
  sriClass: 'classe de risque moyenne', // DIC p.2
  recommendedHoldingYears: 10, // DIC, bulletin
  recommendedHoldingLabel: '10 ans',
  maxLeverage: '40 %', // DIC p.1 (de la valeur d'expertise des actifs immobiliers)
} as const;

export const strategy = {
  zoneLabel: "Pays du Conseil de l'Europe et Canada",
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
  acquisitionModes: 'immeubles acquis construits ou en état futur d’achèvement, détenus directement ou indirectement', // DIC p.1
} as const;

export const subscription = {
  online: true,
  onlineLabel: '100 % en ligne', // brochure p.7
  paymentMethods: ['Virement', 'Prélèvement SEPA'], // bulletin p.3
  options: {
    pei: {
      name: 'Plan Épargne Immobilier',
      description: 'Versements programmés (fréquence mensuelle, trimestrielle, semestrielle ou annuelle)',
      minimum: 50, // € — adhésion PEI 04/2026 (tous frais inclus), prélèvement le 25 du mois
      minimumLabel: '50 €',
      minimumMonthlyLabel: '50 € par mois',
      requirement: 'Détenir au préalable au moins une part entière de R Start en pleine propriété', // adhésion PEI CGV
      form: '/documents/r-start-adhesion-plan-epargne-immobilier.pdf',
    },
    rd: {
      name: 'Réinvestissement des dividendes',
      description: 'Réinvestissement automatique de tout ou partie des dividendes',
      form: '/documents/r-start-adhesion-reinvestissement-dividendes.pdf',
    },
  }, // brochure p.5, bulletin p.1
  notEligible: ['démembrement', 'souscription papier', 'CORUM Life'], // brochure p.5
  documentsRequired: [
    "Pièce d'identité en cours de validité",
    'Justificatif de domicile de moins de 3 mois',
    "Relevé d'identité bancaire",
    "Justificatif d'origine des fonds",
  ], // bulletin p.1
  coolingOff: "En cas de démarchage bancaire ou financier, délai de réflexion de 48 heures (art. L. 341-16 IV du Code monétaire et financier)", // bulletin CGV
} as const;

export const corumGroup = {
  /** Chiffres groupe : corum.fr (« Qui sommes-nous »), consulté le 08/09/2026 ; recoupés avec la brochure 2026. Date officielle à fournir. */
  stats: [
    { value: '9,6 Md€', numeric: 9.6, suffix: ' Md€', label: "d'épargne gérée par le groupe" },
    { value: '160 000', numeric: 160000, suffix: '', label: 'épargnants' },
    { value: '2 500', numeric: 2500, suffix: '', label: 'partenaires professionnels' },
    { value: '250', numeric: 250, suffix: '', label: 'collaborateurs dans 7 pays' },
  ],
  statsSource: 'Source : CORUM L’Épargne, corum.fr, consulté le 8 septembre 2026. Chiffres du groupe CORUM, sans lien avec les résultats futurs de R Start.',
  statsDate: { label: '8 septembre 2026', iso: '2026-09-08' },
  employees: 250, // corum.fr
  countries: 7, // corum.fr
  nationalities: 25, // corum.fr
  partners: 2500, // corum.fr
  independent: true, // brochure p.7 (« 100 % indépendant »)
  scpiSince: 2012,
  scpiCount: 5,
  scpiNames: ['CORUM Origin', 'CORUM XL', 'CORUM Eurion', 'CORUM USA', 'R Start'],
  offices: 7,
  amfSince: '14 avril 2011',
  disposalsDisclaimer:
    'Les cessions réalisées par les SCPI CORUM ne préjugent pas de leurs performances futures.', // brochure p.7
} as const;

export const documents = [
  {
    key: 'dic',
    title: "Document d'informations clés (DIC)",
    description: 'Objectifs, risques, coûts et scénarios de performance réglementaires. Lecture obligatoire avant toute souscription.',
    file: '/documents/r-start-dic.pdf',
    version: 'Version du 20 mai 2026',
  },
  {
    key: 'note',
    title: "Note d'information",
    description: 'Document visé par l’AMF (visa SCPI n° 26-06 du 4 mars 2026) : fonctionnement, frais, modalités de souscription et de retrait.',
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
  corumLegal: 'https://www.corumbutler.com/mentions-legales',
  amfMediator: 'https://www.amf-france.org',
} as const;

/** Blocs de confiance (périmètre v2). Aucun logo AMF, aucune formulation de caution. */
export const trust = {
  amf: {
    visaSentence:
      'La note d’information de R Start a obtenu le visa SCPI n° 26-06 de l’Autorité des marchés financiers (AMF) le 4 mars 2026.', // bulletin CGV
    managementCompanyApproval:
      'CORUM Asset Management, société de gestion de portefeuille, est agréée par l’AMF depuis le 14 avril 2011 sous le numéro GP-11000012, et relève de la directive AIFM depuis le 10 juillet 2014.', // bulletin CGV
    disclaimer:
      'Le visa de l’AMF n’implique ni approbation de l’opportunité de l’opération ni authentification des éléments comptables et financiers présentés.', // formulation standard AMF — à valider par la Conformité
    depositary: 'Société Générale', // DIC p.1
    depositarySentence: 'Les actifs de R Start sont conservés par un dépositaire indépendant, Société Générale.', // DIC p.1-2
    sfdrLabel: 'Article 8 du règlement SFDR', // DIC p.4
    supervisorNote: 'L’AMF est chargée du contrôle de CORUM Asset Management en ce qui concerne le document d’informations clés.', // DIC p.1
  },
  trustpilot: {
    company: "CORUM L'Épargne",
    score: 4.5,
    scoreLabel: '4,5/5',
    reviews: 248,
    reviewsLabel: '248 avis',
    claimed: true,
    url: 'https://fr.trustpilot.com/review/corum.fr',
    snapshotDate: { label: '8 septembre 2026', iso: '2026-09-08' }, // relevé fr.trustpilot.com/review/corum.fr
    scope:
      'Avis publiés sur Trustpilot à propos de CORUM L’Épargne, distributeur de R Start. Ils ne portent ni sur R Start ni sur ses résultats futurs.',
  },
} as const;

/** Espace presse (périmètre v2). Contacts relevés sur corum.fr/conseillers#presse le 08/09/2026 ; e-mails à confirmer. */
export const press = {
  contacts: [
    {
      organisation: "CORUM L'Épargne",
      name: 'Quentin Hacquard',
      role: 'Press & Corporate Communication Manager',
      phone: '+33 6 99 60 10 25',
      email: '', // à confirmer par CORUM
    },
    {
      organisation: "Bien Commun Advisory, pour CORUM L'Épargne",
      name: 'Hugues de Tournemire',
      role: 'Relations presse',
      phone: '+33 6 67 07 22 33',
      email: '', // à confirmer par CORUM
    },
  ],
  contactsSource: 'corum.fr, rubrique Contacts presse, consultée le 8 septembre 2026',
  /** Communiqués officiels : fichiers à fournir par CORUM (aucun PDF disponible dans les assets). */
  releases: [
    { title: 'CORUM L’Épargne lance R Start, sa cinquième SCPI', date: { label: '20 mai 2026', iso: '2026-05-20' }, file: '', available: false },
    { title: 'R Start obtient le visa de l’AMF', date: { label: '4 mars 2026', iso: '2026-03-04' }, file: '', available: false },
  ],
  /** Revue de presse : articles tiers identifiés le 08/09/2026 (médias, hors sites de distribution). Dates à relever sur chaque article. */
  coverage: [
    { media: 'Pierre Papier', title: 'Corum propose un nouveau modèle de frais avec la SCPI R Start', url: 'https://www.pierrepapier.fr/scpi/corum-propose-un-nouveau-modele-de-frais-avec-la-scpi-r-start/' },
    { media: 'Tout sur mes finances', title: 'R Start : la nouvelle SCPI de Corum qui supprime aussi les frais d’acquisition', url: 'https://www.toutsurmesfinances.com/actualites/a/r-start-la-nouvelle-scpi-de-corum-qui-supprime-aussi-les-frais-d-acquisition' },
    { media: 'MeilleureSCPI.com', title: 'R Start : Corum lance officiellement sa première SCPI sans frais de souscription', url: 'https://www.meilleurescpi.com/actualites/r-start-corum-lance-officiellement-sa-premiere-scpi-sans-frais-de-souscription/' },
    { media: 'Idéal Investisseur', title: 'SCPI R Start : analyse complète', url: 'https://www.ideal-investisseur.fr/scpi-avis/corum-r-start-10164.html' },
    { media: 'Rock-n-Data', title: 'SCPI R Start : Corum lance son offre sans frais', url: 'https://www.rock-n-data.io/fr/scpi-r-start-corum-lance-son-offre-sans-frais/' },
  ],
  coverageDisclaimer:
    'Les articles de presse sont publiés sous la responsabilité de leurs auteurs. Leur contenu n’a pas été validé par CORUM L’Épargne et peut contenir des informations qui ne figurent pas dans les documents réglementaires de R Start.',
  mediaKit: {
    logos: [
      { label: 'Logo R Start (couleur, SVG)', file: '/presse/r-start-logo-couleur.svg' },
      { label: 'Logo R Start (blanc, SVG)', file: '/presse/r-start-logo-blanc.svg' },
      { label: 'Logo R Start (couleur, PNG)', file: '/presse/r-start-logo-couleur.png' },
    ],
    boilerplate:
      'CORUM L’Épargne est la marque de distribution du groupe CORUM, groupe indépendant créé en 2011 qui conçoit et gère des solutions d’épargne (SCPI, assurance vie, fonds obligataires). R Start est sa cinquième SCPI, gérée par CORUM Asset Management, société de gestion agréée par l’AMF.', // à valider par CORUM
  },
} as const;

/** Documents complémentaires (périmètre v2), en plus de `documents`. Fichiers vérifiés (intègres) le 08/09/2026. */
export const documentsExtra = [
  {
    key: 'simulation',
    group: 'frais',
    title: 'Simulation des frais ex-ante',
    description: 'Illustration réglementaire de l’ensemble des coûts supportés par l’épargnant, avant souscription.',
    file: '/documents/r-start-simulation-frais-ex-ante.pdf',
    version: 'Version 2, mars 2026',
  },
  {
    key: 'pei',
    group: 'formulaire',
    title: 'Adhésion au Plan Épargne Immobilier',
    description: 'Mise en place de versements programmés (à partir de 50 €), mandat de prélèvement SEPA et conditions générales.',
    file: '/documents/r-start-adhesion-plan-epargne-immobilier.pdf',
    version: 'Version 2.5, avril 2026',
  },
  {
    key: 'rd',
    group: 'formulaire',
    title: 'Adhésion au réinvestissement des dividendes',
    description: 'Réinvestissement automatique de tout ou partie des dividendes potentiels en nouvelles parts.',
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
