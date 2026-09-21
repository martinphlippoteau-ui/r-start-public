import type { Cta } from '@/content/types';
import type { PageHero, PageSeo } from '@/content/types-v2';
import { corumRange } from '@/content/fr/corumRange';
import {
  fees,
  income,
  marketBenchmarks,
  product,
  risk,
  share,
  subscription,
} from '@/content/fr/facts';
import { bulletinWarning } from '@/content/fr/legal';

/**
 * Page /simulateur (19/09/2026, demande de Martin, d'après un prototype qu'il a fourni) : tous les
 * textes de la page, et les règles de calcul que src/scripts/simulateur/moteur.ts reçoit en paramètre.
 *
 * UN PARCOURS GUIDÉ, PAS UN TABLEAU DE BORD (arbitrage de Martin du 20/09/2026, après avoir vu la
 * première version, fidèle au prototype : cinq réglages posés d'un coup, « ça ne surcharge pas la
 * charge cognitive, là ? »). Quatre questions, une par écran (`steps`), puis le résultat, où les mêmes
 * réglages restent modifiables un par un (`summary`). La durée n'est pas une question : elle arrive
 * à 25 ans et se règle sur l'écran de résultat, c'est le paramètre avec lequel on joue.
 *
 * AUCUNE VALEUR MÉTIER N'EST SAISIE ICI. Le prototype portait les siennes dans un bloc CONFIG, avec la
 * mention « à valider, viennent de sites de distributeurs ». Elles sont toutes DÉRIVÉES de facts.ts :
 * prix de part et minimum de souscription, délai de jouissance, durée de placement recommandée,
 * barème de la commission de retrait, minimum du versement programmé. Si facts.ts change, le
 * simulateur suit, et les garde-fous ci-dessous arrêtent le build plutôt que de calculer de travers.
 *
 * LE POINT SENSIBLE : LE TAUX. R Start n'a pas d'historique, et le contrôle de conformité du build
 * interdit « taux de distribution » partout ailleurs que sur /a-propos. Cette page en est exemptée
 * (scripts/check-compliance.mjs dit à quelles conditions) parce qu'elle ne publie AUCUN taux pour
 * R Start : c'est le visiteur qui fixe l'hypothèse, rien n'est présélectionné, et l'avertissement
 * reste affiché tant que des résultats le sont. Les deux repères sont des chiffres de marché, sourcés
 * et datés, jamais un objectif.
 *
 * Ne pas écrire ici : « diversifié », un pourcentage suivi de « par an », « rendement attendu ».
 * scripts/check-compliance.mjs les relève, à raison.
 */
const nb = (s: string): string => s.replace(/ ([%€:;?!»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');

/** « 4,91 % » : virgule décimale, deux décimales, espace insécable avant le signe. */
const pourcent = (valeur: number, decimales = 2): string =>
  nb(`${valeur.toFixed(decimales).replace('.', ',')} %`);

/* ── Règles de calcul, tirées de facts.ts ─────────────────────────────────────────────────────── */

const minInitial = share.price * share.minimumShares;
const minMonthly = subscription.options.pei.minimum;
const recommendedYears = risk.recommendedHoldingYears;

/** Barème de la commission de retrait : « 10 % » avant 4 ans devient { before: 4, rate: 0.1 }. */
const exitFee = fees.withdrawal.steps
  .filter((palier) => palier.until !== null)
  .map((palier) => ({
    before: Number(palier.until),
    rate: parseFloat(palier.rate.replace(',', '.')) / 100,
  }));
exitFee.forEach((palier, i) => {
  const precedent = exitFee[i - 1];
  if (!(palier.rate > 0 && palier.rate < 1) || !(palier.before > (precedent?.before ?? 0)))
    throw new Error(
      'simulator.ts : barème de retrait de facts.ts illisible (taux ou ancienneté hors ordre)'
    );
});
if (exitFee.length !== fees.withdrawal.steps.length - 1)
  throw new Error(
    'simulator.ts : le barème de retrait doit finir par un seul palier sans commission'
  );
const dernierPalier = exitFee.at(-1);
if (!dernierPalier) throw new Error('simulator.ts : barème de retrait vide dans facts.ts');

/* ── Repères de marché ────────────────────────────────────────────────────────────────────────── */

/**
 * MOYENNE DES SCPI CORUM, CALCULÉE et non saisie (arbitrage de Martin du 19/09/2026) : moyenne SIMPLE
 * des taux de distribution que corumRange.ts publie sur /a-propos, soit 6,31 % pour 2025. Le prototype
 * portait 6,30 %, « chiffre non vérifié ». Elle ne peut pas diverger de /a-propos, et le build
 * s'arrête si une SCPI de la gamme n'a plus de taux ou si les millésimes ne concordent plus.
 */
const tauxCorum = corumRange.items.map((scpi) => {
  const mesure = scpi.autres.find((m) => m.unit === '%' && /^Rendement \d{4}$/.test(m.label));
  if (!mesure)
    throw new Error(
      `simulator.ts : pas de taux de distribution pour ${scpi.name} dans corumRange.ts`
    );
  return {
    name: scpi.name,
    year: Number(mesure.label.slice(-4)),
    rate: parseFloat(mesure.value.replace(',', '.')),
  };
});
const aspim = marketBenchmarks.aspim;
if (!tauxCorum.length || tauxCorum.some((t) => t.year !== aspim.year || !(t.rate > 0)))
  throw new Error(
    `simulator.ts : les repères doivent porter sur la même année (${aspim.year}), relire corumRange.ts et facts.ts`
  );
const moyenneCorum =
  Math.round((tauxCorum.reduce((somme, t) => somme + t.rate, 0) / tauxCorum.length) * 100) / 100;

const rate = { min: 0, max: 8, step: 0.05 };
const markers = [
  {
    id: 'aspim',
    label: 'Moyenne du marché',
    short: 'Marché',
    rate: aspim.distributionRate,
    rateLabel: pourcent(aspim.distributionRate),
    source: nb(
      `Taux de distribution moyen des SCPI en ${aspim.year}, pondéré par la capitalisation. Source : ${aspim.source}.`
    ),
  },
  {
    id: 'corum',
    label: 'Moyenne des SCPI CORUM',
    short: 'CORUM',
    rate: moyenneCorum,
    rateLabel: pourcent(moyenneCorum),
    source: nb(
      `Moyenne simple des taux de distribution ${aspim.year} de ${tauxCorum.map((t) => t.name).join(', ')}, publiés sur la page À propos.`
    ),
  },
];
markers.forEach((repere) => {
  if (repere.rate <= rate.min || repere.rate >= rate.max)
    throw new Error(`simulator.ts : le repère « ${repere.label} » sort du curseur`);
});

/* ── Textes ───────────────────────────────────────────────────────────────────────────────────── */

const paliersEnClair = exitFee
  .map((palier) => `${pourcent(palier.rate * 100, 0)} avant ${palier.before} ans`)
  .join(', ');

export const simulator = {
  seo: {
    /** ≤ 60 caractères, contient « R Start » et « CORUM ». */
    title: 'Simulateur R Start, SCPI CORUM : testez vos hypothèses',
    /** 140-155 caractères, avec rappel de risque. */
    description:
      'Simulez un investissement dans R Start, SCPI CORUM, selon vos hypothèses. Simulation non contractuelle : risque de perte en capital, revenus non garantis.',
  } satisfies PageSeo,

  hero: {
    eyebrow: `Simulateur · SCPI ${product.name}`,
    title: 'Projetez votre investissement',
    /* PAS D'INTRODUCTION (20/09/2026, demande de Martin) : l'en-tête tient en son titre, le parcours
       commence juste dessous. Ce qu'elle disait, aucun taux proposé par défaut faute d'historique, est
       dit à la question du taux, là où on en a besoin. */
  } satisfies PageHero,

  cta: { label: 'Souscrire en ligne', position: 'simulateur' } satisfies Cta,

  /** Ce que le script reçoit : les règles du moteur et les bornes du formulaire. */
  rules: {
    minInitial,
    maxInitial: 5_000_000,
    minMonthly,
    maxMonthly: 50_000,
    enjoymentDelayMonths: income.enjoymentDelayMonths,
    exitFee,
    /* La projection commence à la durée de placement recommandée : montrer moins reviendrait à
       illustrer un placement que le produit déconseille. */
    years: {
      min: recommendedYears,
      max: 50,
      def: 25,
      presets: [recommendedYears, 15, 20, 25],
    },
    rate,
    reinvest: { min: 5, max: 100, step: 5 },
    defaults: { initial: 20_000, monthly: 0 },
    initialChips: [5_000, 20_000, 50_000, 100_000],
    monthlyChips: [0, 100, 250, 500],
  },

  markers,

  /**
   * LA FENÊTRE D'ACCÈS (20/09/2026, demande de Martin) : elle s'ouvre à l'arrivée, et le simulateur
   * reste inerte tant qu'on n'a pas répondu « J'ai compris ». Les simulateurs des autres SCPI du groupe
   * en ont une, faite de trois paragraphes pleins ; celle-ci dit la même chose en TROIS POINTS qui se
   * lisent d'un regard, et garde le texte complet à un clic (`full`).
   * CE QUE LE TEXTE COMPLET REPREND : `bulletinWarning`, l'avertissement du bulletin de souscription de
   * R Start, mot pour mot (legal.ts) ; le paragraphe sur l'illustration graphique, qui ne nomme aucun
   * produit, tel qu'il figure sur les autres simulateurs ; et un troisième paragraphe RÉÉCRIT pour
   * R Start, parce que celui des autres SCPI décrit des frais de souscription et une fiscalité déduite
   * que cette simulation n'a pas : elle est brute, et R Start ne prélève pas de frais de souscription.
   */
  gate: {
    eyebrow: 'Avant de commencer',
    title: 'Trois choses à savoir avant de simuler',
    points: [
      {
        icon: 'calendrier',
        title: 'Un placement de long terme, avec des risques',
        text: nb(
          `Le capital et les revenus ne sont pas garantis, le rachat de vos parts non plus. Durée de placement recommandée : ${recommendedYears} ans.`
        ),
      },
      {
        icon: 'analyse',
        title: 'Une illustration, pas une prévision',
        text: nb(
          `C’est vous qui choisissez le taux testé : ${product.name} n’a pas encore d’historique. Le résultat réel pourra s’écarter de la simulation, à la hausse comme à la baisse.`
        ),
      },
      {
        icon: 'argent',
        title: 'Des montants bruts, avant impôts',
        text: nb(
          `Le délai de jouissance de ${income.enjoymentDelayLabel}, pendant lequel vous ne percevez aucun revenu, est pris en compte. La commission de retrait anticipé ne l’est pas.`
        ),
      },
    ],
    fullLabel: 'Lire l’avertissement complet',
    full: [
      bulletinWarning,
      'Le résultat présenté sur l’illustration graphique ne constitue pas un indicateur fiable quant aux performances futures de vos investissements. Il a seulement pour but d’illustrer les mécanismes de votre investissement sur la durée de placement. L’évolution de la valeur de votre investissement pourra s’écarter de ce qui est affiché, à la hausse comme à la baisse.',
      nb(
        `Le résultat de cette simulation est brut : il ne tient compte ni de la fiscalité étrangère prélevée avant le versement des revenus, ni de votre imposition personnelle. ${product.name} ne prélève pas de frais de souscription : la totalité de votre versement est prise en compte. Le taux que vous testez est un taux de distribution, qui s’entend après frais de gestion. La simulation applique le délai de jouissance de ${income.enjoymentDelayLabel} (période pendant laquelle vous ne percevez aucun revenu). Elle ne déduit pas la commission de retrait anticipé, due si vous demandez le retrait de vos parts avant ${dernierPalier.before} ans : ${paliersEnClair}.`
      ),
    ],
    accept: 'J’ai compris',
    leave: 'Revenir à l’accueil',
  },

  /** Le parcours : une question par écran, dans cet ordre. */
  steps: {
    progress: nb('Étape {n} sur {total}'),
    back: 'Retour',
    next: 'Continuer',
    finish: 'Voir ma simulation',
    needRate: nb(
      'Choisissez d’abord un taux : déplacez le curseur, ou appliquez l’un des deux repères.'
    ),
    questions: {
      initial: {
        title: nb('Combien souhaitez-vous investir au départ ?'),
        help: nb(`À partir de ${share.minimumLabel}, soit une part de ${product.name}.`),
      },
      monthly: {
        title: nb('Souhaitez-vous aussi verser chaque mois ?'),
        help: nb(
          `C’est facultatif. ${subscription.options.pei.minimumMonthlyLabel} au minimum, à condition de détenir déjà une part entière.`
        ),
      },
      income: {
        title: nb('Que ferez-vous de vos revenus potentiels ?'),
        help: nb(
          `Ils sont versés chaque mois, à partir du ${income.enjoymentDelayMonths}e mois qui suit un versement. Ils ne sont pas garantis.`
        ),
      },
      rate: {
        title: nb('Quelle hypothèse de taux voulez-vous tester ?'),
        help: nb(
          `${product.name} n’a pas encore d’historique : le site ne lui suppose aucun taux. C’est vous qui fixez l’hypothèse, et vous pourrez la changer ensuite.`
        ),
      },
    },
  },

  /** L'écran de résultat : les mêmes réglages, repliés, modifiables un par un. */
  summary: {
    title: 'Vos hypothèses',
    /** Pendant le parcours, puis sur l'écran de résultat. */
    building: 'Elles se remplissent au fil de vos réponses.',
    subtitle: 'Modifiez-les une à une : le résultat suit.',
    edit: 'Modifier',
    close: 'Fermer',
    restart: 'Recommencer',
    monthlyNone: 'Aucun',
    incomePaid: 'Chaque mois',
    incomeReinvested: nb('{n} % réinvestis'),
  },

  form: {
    /** Titre de la section, lu par les lecteurs d'écran et repris par la recherche du site. */
    title: 'Simulez votre projet',
    initial: {
      label: 'Investissement initial',
      unit: '€',
      chipsLabel: 'Montants suggérés',
      errorMin: nb(`Le minimum est de {min}, soit une part de ${product.name}.`),
    },
    monthly: {
      label: 'Versement programmé',
      other: 'Un autre montant',
      unit: '€ / mois',
      chipsLabel: 'Versements suggérés',
      none: 'Aucun',
      errorMin: nb(
        `Le versement programmé minimum est de {min} par mois (${subscription.options.pei.name}). Indiquez 0 pour vous en passer.`
      ),
    },
    income: {
      label: 'Que faites-vous de vos revenus potentiels ?',
      /** Libellé du réglage sur l'écran de résultat. */
      shortLabel: 'Vos revenus potentiels',
      paid: { title: 'Je les perçois', detail: 'Revenus potentiels versés chaque mois' },
      reinvested: { title: 'Je les réinvestis', detail: 'Ils achètent de nouvelles parts' },
      shareLabel: 'Part réinvestie',
      shareValue: nb('{n} % réinvestis'),
    },
    rate: {
      label: 'Taux de distribution testé',
      unset: 'à choisir',
      unsetSpoken: 'Aucun taux choisi',
      help: nb(
        `Déplacez le curseur, ou appliquez l’un des repères ${aspim.year} ci-dessous. Aucun n’est présélectionné.`
      ),
      markersLabel: `Repères de marché ${aspim.year}`,
      pastPerformance: nb(
        `Les performances passées ne préjugent pas des performances futures. ${product.name} ne dispose pas encore d’historique : ces repères ne constituent ni un objectif ni une prévision.`
      ),
    },
    years: {
      label: 'Durée de projection',
      unit: 'ans',
      chipsLabel: 'Durées suggérées',
      help: nb(`Durée de placement recommandée : ${recommendedYears} ans minimum.`),
    },
  },

  results: {
    title: 'Votre simulation',
    invalid: { title: 'Montant à corriger', action: 'Corriger' },
    /** Sans versement programmé ni réinvestissement : le visiteur perçoit ses revenus. */
    income: {
      first: {
        label: 'Revenus potentiels bruts',
        unit: 'par mois',
        sub: nb(
          `Après le délai de jouissance : premiers revenus au ${income.enjoymentDelayMonths}e mois.`
        ),
        rule: '{annual} par an, avant fiscalité',
      },
      second: {
        label: 'Revenus potentiels cumulés sur {years} ans',
        sub: nb('Soit {pct} du montant investi, cumulés sur {years} ans (non annualisé).'),
        rule: 'Capital de {invested} supposé inchangé',
      },
    },
    /** Avec versement programmé ou réinvestissement : le capital grandit. */
    growth: {
      first: {
        label: 'Capital projeté à {years} ans',
        sub: 'Pour {invested} versés au total, à valeur de part inchangée.',
        rule: 'Revenu potentiel au terme : {monthly} par mois, brut',
      },
      second: {
        label: 'Gain potentiel cumulé',
        sub: nb('Soit {pct} des sommes versées, cumulés sur {years} ans (non annualisé).'),
        rulePaid: nb('Dont revenus perçus : {paid}'),
        ruleNone: 'Capital projeté moins les sommes versées',
      },
    },
    warning: nb(
      `Cette hypothèse est choisie par vous, à des fins d’illustration. Elle ne constitue ni un objectif, ni une prévision, ni une promesse de ${product.name}. Le résultat réel pourra être inférieur ou supérieur au montant affiché, et l’investissement peut entraîner une perte financière.`
    ),
    exitFee: nb(
      `En cas de retrait total au terme, une commission de retrait anticipé estimée à {fee} s’appliquerait aux parts détenues depuis moins de ${dernierPalier.before} ans (versements et réinvestissements récents). Elle n’est pas déduite des montants ci-dessus.`
    ),
  },

  /**
   * LA SUITE (20/09/2026, demande de Martin) : « Commencer ma souscription », sous les résultats. Le
   * bouton mène au tunnel avec les choix du visiteur en paramètres, pour préremplir sa première étape
   * (src/scripts/simulateur/souscription.ts dit ce qui part et ce qui ne part pas).
   * `params` EST UN CONTRAT AVEC LE TUNNEL : ce sont les noms qu'il doit lire. Tant que la
   * souscription n'est pas ouverte (PUBLIC_SUBSCRIBE_OPEN), le bouton ouvre la fenêtre « la
   * souscription ouvre bientôt », comme tous les autres, et rien n'est transmis.
   */
  next: {
    title: 'Ce projet vous ressemble ?',
    text: 'Vos montants seront repris à la première étape de la souscription en ligne. Vous pourrez les modifier.',
    label: 'Commencer ma souscription',
    position: 'simulateur-resultat',
    params: {
      initial: 'montant',
      monthly: 'versement_mensuel',
      reinvest: 'reinvestissement',
      origin: 'origine',
    },
    origin: 'simulateur',
  },

  chart: {
    titleIncome: 'Revenus potentiels cumulés',
    titleCapital: 'Composition du capital projeté',
    toggleLabel: 'Type de graphique',
    toggleIncome: 'Revenus',
    toggleCapital: 'Capital',
    description:
      'Graphique. Utilisez les flèches gauche et droite pour lire les valeurs année par année. Les mêmes données figurent dans le tableau ci-dessous.',
    axisYears: 'Années',
    start: 'Départ',
    year: 'Année {n}',
    layers: {
      initial: 'Investissement initial',
      programmes: 'Versements programmés',
      reinvestis: 'Revenus réinvestis',
      cumGross: 'Revenus potentiels cumulés',
      invested: 'Total versé',
    },
    tipCapital: nb('Capital projeté : {v}'),
    tipCumulative: nb('Revenus cumulés : {v}'),
    tipMonthly: nb('Revenu mensuel : {v}'),
    table: {
      summary: 'Voir les données année par année',
      year: 'Année',
      capital: 'Capital projeté',
      invested: 'Total investi',
      reinvested: 'Revenus réinvestis',
      cumulative: 'Revenus cumulés',
      monthly: 'Revenu mensuel',
    },
  },

  hypotheses: {
    title: 'Hypothèses de calcul',
    items: [
      'Valeur de la part supposée inchangée sur toute la durée. Elle peut en réalité monter ou baisser.',
      nb(
        `Délai de jouissance : chaque versement produit des revenus à partir du ${income.enjoymentDelayMonths}e mois qui suit.`
      ),
      'Taux de distribution constant, revenus versés chaque mois, montants bruts avant fiscalité.',
      'Les revenus réinvestis achètent des fractions de parts, sans minimum.',
      nb(
        `Commission de retrait anticipé non déduite des résultats : ${paliersEnClair}, puis aucune. Elle s’apprécie versement par versement.`
      ),
      nb(
        `Versement programmé : ${subscription.options.pei.minimumMonthlyLabel} au minimum, à condition de détenir déjà une part entière.`
      ),
    ],
  },

  mobileBar: {
    growth: 'Capital projeté à {years} ans',
    income: 'Revenus potentiels bruts par mois',
    detail: 'Voir le détail',
  },

  live: {
    growth: nb('Capital projeté à {years} ans : {capital}, pour {invested} versés.'),
    income: nb(
      'Revenus potentiels bruts : {monthly} par mois. Cumul sur {years} ans : {cumulative}.'
    ),
  },

  noScript:
    'Le simulateur a besoin de JavaScript pour calculer. Activez-le dans votre navigateur pour l’utiliser.',

  footerNote: nb(
    `Simulation dédiée exclusivement à la SCPI ${product.name}. Simulation non contractuelle, fournie à titre d’illustration. Les revenus potentiels présentés sont des montants bruts, avant fiscalité. Les performances passées ne préjugent pas des performances futures. L’investissement en SCPI comporte un risque de perte en capital et un risque de liquidité. Durée de placement recommandée : ${recommendedYears} ans minimum.`
  ),
} as const;

export type SimulatorContent = typeof simulator;
