/**
 * SIMULATEUR : LA PAGE. Mène le parcours de Simulator.astro, puis relie ses réglages au moteur
 * (./moteur.ts) et au graphique (./graphique.ts).
 *
 * LA FENÊTRE D'ACCÈS D'ABORD : le simulateur arrive `inert`, et ne l'est plus qu'une fois « J'ai
 * compris » pressé. Ni Échap ni le voile ne la referment.
 *
 * DEUX MODES, portés par `data-mode` sur la racine (arbitrage de Martin du 20/09/2026) :
 *  - `parcours` : quatre questions, une à l'écran, dans la carte de gauche. « Continuer » valide la
 *    question en cours avant d'avancer ; la dernière, le taux, ne se franchit pas sans qu'un taux ait
 *    été CHOISI. À droite, « Vos hypothèses » se remplit ligne à ligne, et un clic sur une ligne
 *    ramène à sa question ;
 *  - `resultat` : les chiffres et le graphique à gauche, et à droite les mêmes réglages repliés sur
 *    leur valeur, « Commencer ma souscription » dessous. Un seul réglage s'ouvre à la fois, aucun
 *    d'emblée : le bloc reste court, et le bouton à l'écran.
 * Les champs ne sont pas dupliqués : le CORPS de chaque réglage (sa question, ses commandes) est un
 * seul élément, que ce script range dans la carte pendant le parcours, puis sous sa ligne.
 *
 * LE MOUVEMENT (demande de Martin du 20/09/2026). Les entrées sont en CSS (global.css, « Le mouvement
 * du simulateur ») et se déclenchent seules quand un élément quitte `hidden`. Ce script ajoute ce que
 * la CSS ne sait pas faire : les chiffres qui défilent jusqu'à leur valeur, le graphique qui se déforme
 * d'un état à l'autre, la valeur d'une ligne qui tressaute quand elle change. Rien de tout cela en
 * mouvement réduit.
 *
 * AUCUN TAUX N'EST CHOISI À L'ARRIVÉE, et c'est la règle qui porte la page : R Start n'a pas
 * d'historique, le site ne lui suppose donc aucun taux. `tauxChoisi` ne devient vrai que si le visiteur
 * déplace le curseur ou applique un repère. « Recommencer » le remet à faux.
 *
 * CE SCRIPT N'ÉCRIT AUCUN TEXTE À LUI. Les libellés sont dans le HTML, rendus depuis
 * src/content/fr/simulator.ts ; les phrases qui portent un nombre y sont des gabarits (`data-gabarit`,
 * avec des marques `{nom}`), qu'il remplit. Il ne pose aucune classe : il bascule `hidden`,
 * `aria-pressed`, `aria-expanded`, `data-invalide`, `data-etat`, et écrit des attributs SVG.
 *
 * Une fois sur l'écran de résultat, chaque modification recalcule tout : cinquante ans de projection,
 * c'est six cents tours de boucle, rien qui mérite d'être différé. LES MONTANTS SE SAISISSENT
 * LIBREMENT : pas de reformatage pendant la frappe (le curseur du champ sauterait), la mise en forme
 * « 20 000 » arrive à la sortie du champ.
 */
import {
  CADRE_ETROIT,
  GRILLE,
  anneeSous,
  bande,
  cadrePour,
  courbe,
  echelle,
  graduations,
  type Cadre,
  type Echelle,
} from './graphique';
import { simuler, type Annee, type PalierRetrait, type Simulation } from './moteur';
import { adresseDeSouscription, type NomsParametres } from './souscription';
import { deverrouiller, verrouiller } from '@/scripts/verrou';

interface Reglages {
  rules: {
    minInitial: number;
    maxInitial: number;
    minMonthly: number;
    maxMonthly: number;
    enjoymentDelayMonths: number;
    exitFee: PalierRetrait[];
    years: { min: number; max: number; def: number };
    rate: { min: number; max: number; step: number };
    reinvest: { min: number; max: number };
    defaults: { initial: number; monthly: number };
  };
  next: { params: NomsParametres; origin: string };
  texts: {
    monthlyNone: string;
    monthlyUnit: string;
    incomePaid: string;
    incomeReinvested: string;
    yearsUnit: string;
  };
}

type Vue = 'revenus' | 'capital';
type CleCouche = 'initial' | 'programmes' | 'reinvestis' | 'cumGross';
type Reglage = 'initial' | 'monthly' | 'income' | 'rate' | 'years';
type Defaut = { champ: 'initial' | 'monthly'; message: string } | null;

interface Etat {
  mode: 'parcours' | 'resultat';
  /** Question en cours, à partir de 1. */
  etape: number;
  /** Réglage ouvert sur l'écran de résultat. */
  ouvert: Reglage | null;
  initial: number;
  monthly: number;
  reinvestir: boolean;
  /** De 0 à 1. */
  part: number;
  years: number;
  /** En fraction : 0,0491. */
  taux: number;
  tauxChoisi: boolean;
  vue: Vue;
}

/** Largeur de la poignée des curseurs, en pixels : `--simu-poignee` (global.css), POIGNEE (Simulator.astro). */
const POIGNEE = 22;
const COUCHES_CAPITAL: CleCouche[] = ['initial', 'programmes', 'reinvestis'];

const init = (): void => {
  const racine = document.querySelector<HTMLElement>('[data-simulateur]');
  const bloc = document.querySelector('[data-reglages="simulateur"]');
  if (!racine || !bloc?.textContent) return;
  const { rules, next, texts } = JSON.parse(bloc.textContent) as Reglages;

  const un = <T extends Element>(selecteur: string, dans: ParentNode = document): T | null =>
    dans.querySelector<T>(selecteur);
  const tous = <T extends Element>(selecteur: string, dans: ParentNode = document): T[] =>
    Array.from(dans.querySelectorAll<T>(selecteur));

  const champInitial = un<HTMLInputElement>('[data-simu-initial]', racine);
  const champMensuel = un<HTMLInputElement>('[data-simu-mensuel]', racine);
  const curseurPart = un<HTMLInputElement>('[data-simu-part]', racine);
  const curseurTaux = un<HTMLInputElement>('[data-simu-taux]', racine);
  const curseurDuree = un<HTMLInputElement>('[data-simu-duree]', racine);
  const graphique = un<HTMLElement>('[data-simu-graphique]', racine);
  const svg = graphique ? un<SVGSVGElement>('svg', graphique) : null;
  const bulle = un<HTMLElement>('[data-simu-bulle]', racine);
  const zoneResultats = un<HTMLElement>('[data-simu-resultats]', racine);
  const carte = un<HTMLElement>('[data-simu-carte]', racine);
  const questions = un<HTMLElement>('[data-simu-questions]', racine);
  if (
    !champInitial ||
    !champMensuel ||
    !curseurPart ||
    !curseurTaux ||
    !curseurDuree ||
    !graphique ||
    !svg ||
    !bulle ||
    !zoneResultats ||
    !carte ||
    !questions
  )
    return;

  /* ── Formats ──────────────────────────────────────────────────────────────────────────────── */
  const nfEuros = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
  const nfEntier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const nfCompact = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  /* `Intl` sépare les milliers français par une espace FINE insécable (U+202F), que la police du site
     dessine sans largeur : « 207116 € ». L'espace insécable ordinaire, celle de tout le contenu du
     site, la remplace. */
  const lisible = (s: string): string => s.replace(/\u202f/g, '\u00a0');
  const euros = (n: number): string => lisible(nfEuros.format(Number.isFinite(n) ? n : 0));
  const eurosCourt = (n: number): string =>
    n < 10_000 ? euros(n) : `${lisible(nfCompact.format(n))}\u00a0€`;
  const pourcent = (fraction: number, decimales = 2): string =>
    `${(fraction * 100).toFixed(decimales).replace('.', ',')}\u00a0%`;
  const signe = (n: number): string => (n >= 0 ? '+' : '') + euros(n);
  const chiffres = (saisie: string): number => parseInt(saisie.replace(/[^0-9]/g, ''), 10) || 0;

  /** Remplit un gabarit « … {nom} … ». Fonction et non chaîne : `replace` interprète « $& » dans une chaîne de remplacement. */
  const remplir = (gabarit: string, valeurs: Record<string, string>): string =>
    gabarit.replace(/\{(\w+)\}/g, (marque, nom: string) => valeurs[nom] ?? marque);
  const ecrire = (nom: string, valeurs: Record<string, string>, attribut = 'gabarit'): void => {
    const el = un<HTMLElement>(`[data-t="${nom}"]`, racine);
    if (el) el.textContent = remplir(el.dataset[attribut] ?? '', valeurs);
  };

  /* ── Mouvement ────────────────────────────────────────────────────────────────────────────── */
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sortie = (t: number): number => 1 - (1 - t) ** 3;
  /**
   * Joue `image(avance)` de 0 à 1 sur `duree` ms, et rend de quoi l'interrompre. En mouvement réduit :
   * d'un coup.
   * LA DERNIÈRE IMAGE EST GARANTIE par une minuterie, pas seulement par `requestAnimationFrame` : le
   * navigateur cesse de dessiner un onglet passé à l'arrière-plan, ou une page sous forte charge, et
   * un montant restait alors figé à mi-course (« 155 € » au lieu de « 164 € », vu en test le
   * 20/09/2026). Un chiffre affiché doit toujours finir exact.
   */
  const jouer = (duree: number, image: (avance: number) => void): (() => void) => {
    if (sobre.matches) {
      image(1);
      return () => undefined;
    }
    let tour = 0;
    let fini = false;
    const arreter = (): void => {
      fini = true;
      cancelAnimationFrame(tour);
      window.clearTimeout(secours);
    };
    const finir = (): void => {
      if (fini) return;
      arreter();
      image(1);
    };
    const secours = window.setTimeout(finir, duree + 120);
    const depart = performance.now();
    const pas = (maintenant: number): void => {
      if (fini) return;
      const t = (maintenant - depart) / duree;
      if (t >= 1) return finir();
      image(sortie(Math.max(0, t)));
      tour = requestAnimationFrame(pas);
    };
    tour = requestAnimationFrame(pas);
    return arreter;
  };

  /** Un grand chiffre défile de la valeur affichée à la nouvelle. Interrompu, il repart d'où il en est. */
  const affiches = new Map<string, { valeur: number; arreter: () => void }>();
  const nombre = (nom: string, cible: number, format: (n: number) => string): void => {
    const el = un<HTMLElement>(`[data-n="${nom}"]`, racine);
    if (!el) return;
    const precedent = affiches.get(nom);
    precedent?.arreter();
    const depart = precedent?.valeur ?? 0;
    const etatNombre = { valeur: depart, arreter: () => undefined as void };
    affiches.set(nom, etatNombre);
    etatNombre.arreter = jouer(520, (avance) => {
      etatNombre.valeur = depart + (cible - depart) * avance;
      el.textContent = format(avance === 1 ? cible : etatNombre.valeur);
    });
  };

  /** La valeur d'une ligne de « Vos hypothèses » tressaute quand elle change. */
  const tressauter = (el: HTMLElement): void => {
    if (sobre.matches || typeof el.animate !== 'function') return;
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }],
      { duration: 340, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)' }
    );
  };

  /* ── État ─────────────────────────────────────────────────────────────────────────────────── */
  const neuf = (): Etat => ({
    mode: 'parcours',
    etape: 1,
    ouvert: null,
    initial: rules.defaults.initial,
    monthly: rules.defaults.monthly,
    reinvestir: false,
    part: 1,
    years: rules.years.def,
    taux: 0,
    tauxChoisi: false,
    vue: 'revenus',
  });
  let etat = neuf();
  let geometrie: { e: Echelle; rows: Annee[]; sommets: number[]; index: number } | null = null;
  let derniere: { sim: Simulation | null; erreur: Defaut } = { sim: null, erreur: null };
  let resultatsVisibles = false;
  let piedVisible = false;
  let tauxReclame = false;
  let minuterieAnnonce = 0;

  /** Les questions du parcours, dans l'ordre que Simulator.astro leur donne (`data-etape`). */
  const ETAPES = tous<HTMLElement>('[data-simu-corps][data-etape]', racine)
    .sort((a, b) => Number(a.dataset.etape) - Number(b.dataset.etape))
    .map((el) => el.dataset.simuCorps as Reglage);

  const accumule = (): boolean => etat.monthly > 0 || etat.reinvestir;

  /** Le premier défaut de saisie, et le champ qui le porte. */
  const defaut = (): Defaut => {
    const gabarit = (champ: string): string =>
      un<HTMLElement>(`[data-simu-erreur="${champ}"]`, racine)?.dataset.gabarit ?? '';
    if (etat.initial < rules.minInitial)
      return {
        champ: 'initial',
        message: remplir(gabarit('initial'), { min: euros(rules.minInitial) }),
      };
    if (etat.monthly > 0 && etat.monthly < rules.minMonthly)
      return {
        champ: 'monthly',
        message: remplir(gabarit('monthly'), { min: euros(rules.minMonthly) }),
      };
    return null;
  };

  /* ── Graphique ────────────────────────────────────────────────────────────────────────────── */
  const masquerCurseur = (): void => {
    un('[data-curseur]', svg)?.setAttribute('visibility', 'hidden');
    bulle.hidden = true;
  };

  /** Ce que le graphique montre : des empilements, une courbe des sommes versées, une échelle. */
  interface Serie {
    n: number;
    sommet: number;
    couches: Record<CleCouche, number[]>;
    verse: number[];
  }
  const CLES: CleCouche[] = ['initial', 'programmes', 'reinvestis', 'cumGross'];

  /* LE CADRE SUIT LA LARGEUR AFFICHÉE (./graphique.ts dit pourquoi). Tout ce qui, dans le squelette de
     Simulator.astro, dépend du cadre est replacé ici : `viewBox`, bords de la grille, place des
     montants et des années, hauteur du trait du curseur. */
  let cadre: Cadre = cadrePour(graphique.clientWidth);
  const poserCadre = (): void => {
    const { largeur, hauteur, marge } = cadre;
    svg.setAttribute('viewBox', `0 0 ${largeur} ${hauteur}`);
    tous<SVGLineElement>('[data-grille]', svg).forEach((ligne) => {
      ligne.setAttribute('x1', String(marge.gauche));
      ligne.setAttribute('x2', String(largeur - marge.droite));
    });
    tous<SVGTextElement>('[data-axe-y]', svg).forEach((t) =>
      t.setAttribute('x', String(marge.gauche - 8))
    );
    tous<SVGTextElement>('[data-axe-x]', svg).forEach((t) =>
      t.setAttribute('y', String(hauteur - marge.bas + 17))
    );
    const titre = un<SVGTextElement>('[data-axe-titre]', svg);
    titre?.setAttribute('x', String((marge.gauche + largeur - marge.droite) / 2));
    titre?.setAttribute('y', String(hauteur - 4));
    const trait = un('[data-curseur-trait]', svg);
    trait?.setAttribute('y1', String(marge.haut));
    trait?.setAttribute('y2', String(hauteur - marge.bas));
  };
  poserCadre();

  const dessiner = (serie: Serie): number[] => {
    const e = echelle(serie.n, serie.sommet, cadre);
    GRILLE.forEach((fraction, i) => {
      const yy = e.y(e.sommet * fraction).toFixed(1);
      const ligne = un<SVGLineElement>(`[data-grille="${i}"]`, svg);
      const texte = un<SVGTextElement>(`[data-axe-y="${i}"]`, svg);
      ligne?.setAttribute('y1', yy);
      ligne?.setAttribute('y2', yy);
      if (texte) {
        texte.setAttribute('y', (Number(yy) + 4).toFixed(1));
        texte.textContent = eurosCourt(e.sommet * fraction);
      }
    });
    /* Les couches s'empilent : le bas de chacune est le haut de la précédente. */
    let base = serie.verse.map(() => e.y(0));
    tous<SVGPathElement>('[data-couche]', svg).forEach((chemin) => {
      const valeurs = serie.couches[chemin.dataset.couche as CleCouche];
      if (!valeurs.some((v) => v > 0)) {
        chemin.setAttribute('d', '');
        return;
      }
      const haut = base.map((b, i) => b - (e.y(0) - e.y(valeurs[i] ?? 0)));
      chemin.setAttribute('d', bande(haut, base, e));
      base = haut;
    });
    un('[data-ligne]', svg)?.setAttribute('d', courbe(base, e));
    un('[data-ligne-verse]', svg)?.setAttribute(
      'd',
      serie.verse.some((v) => v > 0)
        ? courbe(
            serie.verse.map((v) => e.y(v)),
            e
          )
        : ''
    );
    return base;
  };

  /** Une suite de valeurs ramenée à `n + 1` points, pour passer d'une durée à une autre. */
  const etirer = (valeurs: number[], n: number): number[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const position = n ? (i / n) * (valeurs.length - 1) : 0;
      const avant = Math.floor(position);
      const a = valeurs[avant] ?? 0;
      return a + ((valeurs[Math.min(valeurs.length - 1, avant + 1)] ?? a) - a) * (position - avant);
    });
  const entre = (a: Serie, b: Serie, avance: number): Serie => {
    const mele = (x: number[], y: number[]): number[] =>
      etirer(x, b.n).map((v, i) => v + ((y[i] ?? 0) - v) * avance);
    return {
      n: b.n,
      sommet: a.sommet + (b.sommet - a.sommet) * avance,
      couches: Object.fromEntries(
        CLES.map((cle) => [cle, mele(a.couches[cle], b.couches[cle])])
      ) as Record<CleCouche, number[]>,
      verse: mele(a.verse, b.verse),
    };
  };

  let serieAffichee: Serie | null = null;
  let arreterTrace: () => void = () => undefined;

  const tracer = (sim: Simulation): void => {
    /* Le cadre se choisit ici aussi : à l'arrivée le graphique est masqué, sa largeur vaut zéro. */
    const voulu = cadrePour(graphique.clientWidth);
    if (voulu !== cadre) {
      cadre = voulu;
      poserCadre();
    }
    const rows = sim.rows;
    const n = rows.length - 1;
    const capital = etat.vue === 'capital';
    const dernier = rows[n];
    if (!dernier) return;
    const cles: CleCouche[] = capital
      ? COUCHES_CAPITAL.filter((cle) => cle === 'initial' || dernier[cle] > 0)
      : ['cumGross'];
    const montreVerse = capital && etat.monthly > 0;
    const totaux = rows.map((r) => cles.reduce((somme, cle) => somme + r[cle], 0));
    const cible: Serie = {
      n,
      sommet: Math.max(1, ...totaux, ...(montreVerse ? rows.map((r) => r.invested) : [0])),
      couches: Object.fromEntries(
        CLES.map((cle) => [cle, rows.map((r) => (cles.includes(cle) ? r[cle] : 0))])
      ) as Record<CleCouche, number[]>,
      verse: rows.map((r) => (montreVerse ? r.invested : 0)),
    };

    const annees = graduations(n, cadre === CADRE_ETROIT ? 5 : 7);
    const e = echelle(n, cible.sommet, cadre);
    tous<SVGTextElement>('[data-axe-x]', svg).forEach((texte, i) => {
      const annee = annees[i];
      texte.textContent = annee === undefined ? '' : String(annee);
      if (annee !== undefined) texte.setAttribute('x', e.x(annee).toFixed(1));
    });
    tous<HTMLElement>('[data-legende]', racine).forEach((item) => {
      const cle = item.dataset.legende ?? '';
      item.hidden = cle === 'invested' ? !montreVerse : !cles.includes(cle as CleCouche);
    });

    /* Le curseur et sa bulle lisent l'état FINAL : ils sont justes dès la première image. */
    const sommets = rows.map((_, i) => e.y(totaux[i] ?? 0));
    geometrie = { e, rows, sommets, index: n };
    masquerCurseur();

    /* D'où l'on part : ce qui est à l'écran, ou un graphique à plat la première fois. */
    arreterTrace();
    const depart: Serie = serieAffichee ?? entre(cible, cible, 0);
    if (!serieAffichee) {
      CLES.forEach((cle) => depart.couches[cle].fill(0));
      depart.verse.fill(0);
    }
    arreterTrace = jouer(serieAffichee ? 420 : 900, (avance) => {
      serieAffichee = avance === 1 ? cible : entre(depart, cible, avance);
      dessiner(serieAffichee);
    });
  };

  const montrerCurseur = (demande: number): void => {
    if (!geometrie) return;
    const { e, rows, sommets } = geometrie;
    const i = Math.max(0, Math.min(e.n, demande));
    const annee = rows[i];
    if (!annee) return;
    geometrie.index = i;
    const px = e.x(i);
    un('[data-curseur]', svg)?.setAttribute('visibility', 'visible');
    const trait = un('[data-curseur-trait]', svg);
    trait?.setAttribute('x1', px.toFixed(1));
    trait?.setAttribute('x2', px.toFixed(1));
    const pointe = un('[data-curseur-point]', svg);
    pointe?.setAttribute('cx', px.toFixed(1));
    pointe?.setAttribute('cy', (sommets[i] ?? 0).toFixed(1));

    const titre = un<HTMLElement>('[data-bulle-titre]', bulle);
    if (titre)
      titre.textContent =
        i === 0
          ? (titre.dataset.depart ?? '')
          : remplir(titre.dataset.annee ?? '', { n: String(annee.year) });
    const capital = etat.vue === 'capital';
    tous<HTMLElement>('[data-bulle-ligne]', bulle).forEach((ligne) => {
      const cle = ligne.dataset.bulleLigne ?? '';
      const couche = COUCHES_CAPITAL.includes(cle as CleCouche);
      const montre = capital
        ? cle === 'capital' || (couche && (cle === 'initial' || annee[cle as CleCouche] > 0))
        : cle === 'cumGross' || cle === 'monthlyIncome';
      ligne.hidden = !montre;
      if (!montre) return;
      const montant = euros(annee[cle as keyof Annee]);
      const valeur = un<HTMLElement>('[data-bulle-valeur]', ligne);
      if (valeur) valeur.textContent = montant;
      else ligne.textContent = remplir(ligne.dataset.gabarit ?? '', { v: montant });
    });
    bulle.hidden = false;
    /* À droite du curseur, puis à gauche passé les six dixièmes : la bulle ne sort jamais du cadre. */
    const fraction = px / e.cadre.largeur;
    bulle.style.left = `${(fraction * 100).toFixed(2)}%`;
    bulle.style.transform = fraction > 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)';
  };

  if (typeof ResizeObserver === 'function')
    new ResizeObserver(() => {
      const voulu = cadrePour(graphique.clientWidth);
      if (voulu === cadre) return;
      cadre = voulu;
      poserCadre();
      if (derniere.sim) tracer(derniere.sim);
    }).observe(graphique);

  const sousLePointeur = (ev: PointerEvent): number => {
    if (!geometrie) return 0;
    const boite = graphique.getBoundingClientRect();
    return anneeSous(((ev.clientX - boite.left) / boite.width) * cadre.largeur, geometrie.e);
  };
  graphique.addEventListener('pointermove', (ev) => montrerCurseur(sousLePointeur(ev)));
  graphique.addEventListener('pointerdown', (ev) => montrerCurseur(sousLePointeur(ev)));
  graphique.addEventListener('pointerleave', masquerCurseur);
  graphique.addEventListener('blur', masquerCurseur);
  graphique.addEventListener('focus', () => montrerCurseur(geometrie?.e.n ?? 0));
  graphique.addEventListener('keydown', (ev) => {
    if (!geometrie) return;
    const pas = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
    if (pas) montrerCurseur(geometrie.index + pas);
    else if (ev.key === 'Home') montrerCurseur(0);
    else if (ev.key === 'End') montrerCurseur(geometrie.e.n);
    else return;
    ev.preventDefault();
  });

  const tabuler = (sim: Simulation): void => {
    const colonnes: Record<Vue, (keyof Annee)[]> = {
      revenus: ['year', 'cumGross', 'monthlyIncome'],
      capital: ['year', 'capital', 'invested', 'reinvestis'],
    };
    tous<HTMLTableElement>('[data-simu-table]', racine).forEach((table) => {
      const vue = table.dataset.simuTable as Vue;
      table.hidden = vue !== etat.vue;
      if (table.hidden) return;
      const lignes = sim.rows.map((r) => {
        const tr = document.createElement('tr');
        colonnes[vue].forEach((cle) => {
          const td = document.createElement('td');
          td.textContent = cle === 'year' ? String(r.year) : euros(r[cle]);
          tr.append(td);
        });
        return tr;
      });
      table.tBodies[0]?.replaceChildren(...lignes);
    });
  };

  /* ── Barre de synthèse (petits écrans, écran de résultat) ─────────────────────────────────── */
  const barre = un<HTMLElement>('[data-simu-barre]');
  let actionBarre: () => void = () => undefined;
  un<HTMLButtonElement>('[data-barre-action]')?.addEventListener('click', () => actionBarre());

  const reglerBarre = (): void => {
    if (!barre) return;
    const { sim, erreur } = derniere;
    const libelle = un<HTMLElement>('[data-barre-libelle]', barre);
    const valeur = un<HTMLElement>('[data-barre-valeur]', barre);
    const bouton = un<HTMLButtonElement>('[data-barre-action]', barre);
    if (etat.mode !== 'resultat' || !libelle || !valeur || !bouton || (!sim && !erreur)) {
      barre.hidden = true;
      return;
    }
    if (erreur) {
      libelle.textContent = barre.dataset.erreur ?? '';
      valeur.textContent = '';
      bouton.textContent = bouton.dataset.corriger ?? '';
      actionBarre = () => (erreur.champ === 'initial' ? champInitial : champMensuel).focus();
    } else if (sim) {
      libelle.textContent = accumule()
        ? remplir(barre.dataset.croissance ?? '', { years: String(etat.years) })
        : (barre.dataset.revenus ?? '');
      valeur.textContent = euros(accumule() ? sim.capitalFinal : sim.monthlyNow);
      bouton.textContent = bouton.dataset.detail ?? '';
      actionBarre = () => zoneResultats.scrollIntoView({ block: 'start' });
    }
    /* Inutile quand ce qu'elle résume est à l'écran, et jamais par-dessus le pied de page. */
    barre.hidden = piedVisible || (resultatsVisibles && !erreur);
  };

  /* L'adresse d'origine du bouton, rendue par le site : les paramètres s'y ajoutent à chaque résultat. */
  const boutonSuite = un<HTMLAnchorElement>('[data-simu-suite] a[data-cta="souscrire"]', racine);
  const adresseSuite = boutonSuite?.href ?? '';

  /* ── Résultats ────────────────────────────────────────────────────────────────────────────── */
  const montrerEtat = (nom: 'erreur' | 'sorties'): void => {
    tous<HTMLElement>('[data-simu-etat]', racine).forEach((el) => {
      el.hidden = el.dataset.simuEtat !== nom;
    });
  };

  const rendre = (): void => {
    window.clearTimeout(minuterieAnnonce);
    if (etat.mode !== 'resultat') {
      /* On repart de zéro à la prochaine arrivée : chiffres et graphique referont leur entrée. */
      geometrie = null;
      serieAffichee = null;
      arreterTrace();
      affiches.forEach((a) => a.arreter());
      affiches.clear();
      derniere = { sim: null, erreur: null };
      reglerBarre();
      return;
    }
    const erreur = defaut();
    if (!accumule()) etat.vue = 'revenus';
    if (erreur) {
      const texte = un<HTMLElement>('[data-simu-erreur-texte]', racine);
      if (texte) texte.textContent = erreur.message;
      montrerEtat('erreur');
      geometrie = null;
      derniere = { sim: null, erreur };
      reglerBarre();
      return;
    }

    const sim = simuler(
      {
        initial: etat.initial,
        monthly: etat.monthly,
        reinvestShare: etat.reinvestir ? etat.part : 0,
        years: etat.years,
        rate: etat.taux,
      },
      { enjoymentDelayMonths: rules.enjoymentDelayMonths, exitFee: rules.exitFee }
    );
    const years = String(etat.years);
    const gain = sim.capitalFinal + sim.cumPaid - sim.invested;
    const pct = pourcent(sim.invested ? gain / sim.invested : 0, 1);
    const croissance = accumule();

    tous<HTMLElement>('[data-simu-kpi]', racine).forEach((carte) => {
      carte.hidden = (carte.dataset.simuKpi === 'growth') !== croissance;
    });
    nombre('monthlyNow', sim.monthlyNow, euros);
    nombre('cumPaid', sim.cumPaid, euros);
    nombre('capitalFinal', sim.capitalFinal, euros);
    nombre('gain', gain, signe);
    ecrire('incomeRule', { annual: euros(sim.annualNow) });
    ecrire('incomeLabel', { years });
    ecrire('incomeSub', { pct, years });
    ecrire('incomeCapital', { invested: euros(sim.invested) });
    ecrire('growthLabel', { years });
    ecrire('growthSub', { invested: euros(sim.invested) });
    ecrire('growthRule', { monthly: euros(sim.monthlyAtTerm) });
    ecrire('gainSub', { pct, years });
    ecrire(
      'gainRule',
      { paid: euros(sim.cumPaid) },
      sim.cumPaid > 0 ? 'gabaritPercu' : 'gabaritAucun'
    );

    const noteRetrait = un<HTMLElement>('[data-simu-note-retrait]', racine);
    if (noteRetrait) noteRetrait.hidden = !(sim.exitFee > 0);
    ecrire('exitFee', { fee: euros(sim.exitFee) });

    const titre = un<HTMLElement>('[data-simu-titre-graphique]', racine);
    if (titre) titre.textContent = titre.dataset[etat.vue] ?? '';
    const basculeVue = un<HTMLElement>('[data-simu-bascule]', racine);
    if (basculeVue) basculeVue.hidden = !croissance;
    tous<HTMLButtonElement>('[data-simu-vue]', racine).forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.simuVue === etat.vue))
    );

    /* « Commencer ma souscription » emporte les choix du visiteur, si le tunnel est ouvert : sinon
       le bouton ouvre la fenêtre « bientôt » et son adresse, interne, n'a rien à emporter. */
    if (boutonSuite && adresseSuite && document.body.dataset.souscriptionOuverte === 'oui')
      boutonSuite.href = adresseDeSouscription(
        adresseSuite,
        {
          initial: etat.initial,
          monthly: etat.monthly,
          reinvestShare: etat.reinvestir ? etat.part : 0,
        },
        next.params,
        next.origin
      );

    montrerEtat('sorties');
    tracer(sim);
    tabuler(sim);
    derniere = { sim, erreur: null };
    reglerBarre();

    /* Annoncé une fois la frappe ou le glissé posés : sept cents millisecondes sans changement. */
    const annonce = un<HTMLElement>('[data-simu-annonce]');
    if (annonce)
      minuterieAnnonce = window.setTimeout(() => {
        annonce.textContent = croissance
          ? remplir(annonce.dataset.croissance ?? '', {
              years,
              capital: euros(sim.capitalFinal),
              invested: euros(sim.invested),
            })
          : remplir(annonce.dataset.revenus ?? '', {
              years,
              monthly: euros(sim.monthlyNow),
              cumulative: euros(sim.cumPaid),
            });
      }, 700);
  };

  /* ── Présentation : quelle question, quels réglages ───────────────────────────────────────── */
  const enClair = (cle: Reglage): string => {
    if (cle === 'initial') return euros(etat.initial);
    if (cle === 'monthly')
      return etat.monthly > 0
        ? `${lisible(nfEntier.format(etat.monthly))}\u00a0${texts.monthlyUnit}`
        : texts.monthlyNone;
    if (cle === 'income')
      return etat.reinvestir
        ? remplir(texts.incomeReinvested, { n: String(Math.round(etat.part * 100)) })
        : texts.incomePaid;
    if (cle === 'rate') return pourcent(etat.taux);
    return `${etat.years}\u00a0${texts.yearsUnit}`;
  };

  const presenter = (): void => {
    const parcours = etat.mode === 'parcours';
    const enCours = ETAPES[etat.etape - 1];
    racine.dataset.mode = etat.mode;
    /* « Vos hypothèses » n'a rien à montrer à la première question : il arrive avec la deuxième, et
       ne porte que les réponses DÉJÀ données (demande de Martin du 20/09/2026). */
    const panneauMontre = !parcours || etat.etape > 1;
    racine.dataset.panneau = panneauMontre ? 'oui' : 'non';
    const montrer = (selecteur: string, visible: boolean): void => {
      const el = un<HTMLElement>(selecteur, racine);
      if (el) el.hidden = !visible;
    };
    montrer('[data-simu-panneau]', panneauMontre);
    montrer('[data-simu-suite]', !parcours && !defaut());
    montrer('[data-simu-recommencer]', !parcours);
    montrer('[data-simu-alerte-taux]', parcours && tauxReclame && !etat.tauxChoisi);
    carte.hidden = !parcours;
    zoneResultats.hidden = parcours;
    const aidePanneau = un<HTMLElement>('[data-simu-panneau-aide]', racine);
    if (aidePanneau) aidePanneau.textContent = aidePanneau.dataset[etat.mode] ?? '';

    /* Le corps de chaque réglage : dans la carte pendant le parcours, sous sa ligne ensuite. */
    tous<HTMLElement>('[data-simu-corps]', racine).forEach((corps) => {
      const cle = corps.dataset.simuCorps as Reglage;
      const hote = parcours
        ? questions
        : un<HTMLElement>(`[data-simu-champ="${cle}"] [data-simu-hote]`, racine);
      if (hote && corps.parentElement !== hote) hote.append(corps);
      corps.hidden = parcours ? cle !== enCours : etat.ouvert !== cle;
      tous<HTMLElement>('[data-simu-question], [data-simu-question-aide]', corps).forEach((el) => {
        el.hidden = !parcours;
      });
    });

    tous<HTMLElement>('[data-simu-champ]', racine).forEach((ligne) => {
      const cle = ligne.dataset.simuChamp as Reglage;
      const rang = ETAPES.indexOf(cle) + 1;
      ligne.hidden = parcours && !(rang > 0 && rang < etat.etape);
      const resume = un<HTMLButtonElement>('[data-simu-resume]', ligne);
      if (!resume) return;
      /* Pendant le parcours la ligne ramène à sa question ; ensuite elle déplie son réglage. */
      if (parcours) resume.removeAttribute('aria-expanded');
      else resume.setAttribute('aria-expanded', String(etat.ouvert === cle));
      const valeur = un<HTMLElement>('[data-simu-resume-valeur]', resume);
      const texte = enClair(cle);
      if (valeur && valeur.textContent !== texte) {
        const premiere = valeur.textContent === '';
        valeur.textContent = texte;
        if (!premiere && !ligne.hidden) tressauter(valeur);
      }
      const action = un<HTMLElement>('[data-simu-resume-action]', resume);
      if (action)
        action.textContent =
          (!parcours && etat.ouvert === cle ? action.dataset.fermer : action.dataset.ouvrir) ?? '';
    });

    const libelle = un<HTMLElement>('[data-simu-etape-libelle]', racine);
    if (libelle)
      libelle.textContent = remplir(libelle.dataset.gabarit ?? '', {
        n: String(etat.etape),
        total: String(ETAPES.length),
      });
    tous<HTMLElement>('[data-simu-pas]', racine).forEach((pas) => {
      const rang = Number(pas.dataset.simuPas);
      pas.dataset.etat = rang < etat.etape ? 'fait' : rang === etat.etape ? 'actif' : 'a-venir';
    });
    montrer('[data-simu-retour]', etat.etape > 1);
    const suivant = un<HTMLButtonElement>('[data-simu-suivant]', racine);
    if (suivant)
      suivant.textContent =
        (etat.etape === ETAPES.length ? suivant.dataset.fin : suivant.dataset.suite) ?? '';
  };

  /* ── Contrôles ────────────────────────────────────────────────────────────────────────────── */
  /** Remplissage de la piste jusqu'au CENTRE de la poignée, qui ne va pas d'un bord à l'autre. */
  const remplirPiste = (curseur: HTMLInputElement, p: number): void => {
    const borne = Math.max(0, Math.min(1, p));
    curseur.style.setProperty(
      '--p',
      `calc(${(borne * 100).toFixed(3)}% + ${((0.5 - borne) * POIGNEE).toFixed(2)}px)`
    );
  };

  const accorder = (source?: HTMLInputElement): void => {
    if (source !== champInitial)
      champInitial.value = etat.initial ? lisible(nfEntier.format(etat.initial)) : '';
    if (source !== champMensuel) champMensuel.value = lisible(nfEntier.format(etat.monthly));
    if (source !== curseurTaux) curseurTaux.value = String(etat.taux * 100);
    curseurDuree.value = String(etat.years);
    curseurPart.value = String(Math.round(etat.part * 100));

    const { rate, years, reinvest } = rules;
    remplirPiste(curseurTaux, (etat.taux * 100 - rate.min) / (rate.max - rate.min));
    remplirPiste(curseurDuree, (etat.years - years.min) / (years.max - years.min));
    remplirPiste(curseurPart, (etat.part * 100 - reinvest.min) / (reinvest.max - reinvest.min));

    const valeurTaux = un<HTMLElement>('[data-simu-taux-valeur]', racine);
    if (valeurTaux)
      valeurTaux.textContent = etat.tauxChoisi
        ? pourcent(etat.taux)
        : (valeurTaux.dataset.vide ?? '');
    curseurTaux.setAttribute(
      'aria-valuetext',
      etat.tauxChoisi ? pourcent(etat.taux) : (curseurTaux.dataset.videLu ?? '')
    );
    curseurDuree.setAttribute('aria-valuetext', enClair('years'));
    const partEnClair = String(Math.round(etat.part * 100));
    const valeurPart = un<HTMLElement>('[data-simu-part-valeur]', racine);
    if (valeurPart) valeurPart.textContent = `${partEnClair}\u00a0%`;
    curseurPart.setAttribute(
      'aria-valuetext',
      remplir(curseurPart.dataset.gabaritValeur ?? '', { n: partEnClair })
    );
    const panneauPart = un<HTMLElement>('[data-simu-panneau-part]', racine);
    if (panneauPart) panneauPart.hidden = !etat.reinvestir;

    const erreur = defaut();
    (['initial', 'monthly'] as const).forEach((champ) => {
      const message = un<HTMLElement>(`[data-simu-erreur="${champ}"]`, racine);
      const boite = un<HTMLElement>(`[data-simu-boite="${champ}"]`, racine);
      const fautif = erreur?.champ === champ;
      if (message) {
        message.textContent = fautif ? erreur.message : '';
        message.hidden = !fautif;
      }
      boite?.toggleAttribute('data-invalide', fautif);
    });

    tous<HTMLButtonElement>('[data-simu-puce]', racine).forEach((puce) => {
      const cle = puce.dataset.simuPuce as 'initial' | 'monthly' | 'years';
      puce.setAttribute('aria-pressed', String(Number(puce.dataset.v) === etat[cle]));
    });
    tous<HTMLButtonElement>('[data-simu-reinvestir]', racine).forEach((b) =>
      b.setAttribute('aria-pressed', String((b.dataset.simuReinvestir === '1') === etat.reinvestir))
    );
    tous<HTMLButtonElement>('[data-simu-repere]', racine).forEach((b) =>
      b.setAttribute(
        'aria-pressed',
        String(etat.tauxChoisi && Math.abs(Number(b.dataset.taux) / 100 - etat.taux) < 0.00005)
      )
    );
  };

  const actualiser = (source?: HTMLInputElement): void => {
    accorder(source);
    presenter();
    rendre();
  };

  /* ── Parcours ─────────────────────────────────────────────────────────────────────────────── */
  /**
   * CHANGER D'ÉCRAN. Là où le navigateur sait faire une transition de vue du même document, la carte
   * glisse de sa place à la suivante (seule et centrée à la première question, à gauche ensuite) et
   * le panneau se pose à côté : le navigateur interpole les deux, global.css (`vt-simu`) donne la
   * courbe, ET LES NOMS : carte et panneau n'en portent que sous `vt-simu`, sans quoi la transition
   * d'une page à l'autre les peignait par-dessus la fenêtre d'accès. La classe est donc posée AVANT
   * `startViewTransition`, pour que la capture de départ les porte déjà. Ailleurs, et en mouvement
   * réduit, l'écran change d'un coup ; les entrées CSS jouent quand même. Le focus va au titre de ce
   * qui vient d'apparaître : un lecteur d'écran l'annonce.
   */
  const changer = (
    sens: 'avant' | 'arriere',
    maj: () => void,
    viser: () => HTMLElement | null
  ): void => {
    const appliquer = (): void => {
      racine.dataset.sens = sens;
      maj();
      actualiser();
      const cible = viser();
      /* La page ne bouge que s'il le faut : sur grand écran la carte est déjà sous les yeux, et un
         recalage à chaque question la faisait sauter pour rien. Sur téléphone, en revanche, on vient de
         presser un bouton en bas d'écran : le titre suivant est au-dessus, hors de vue. */
      const bloc =
        cible?.closest<HTMLElement>('[data-simu-carte], [data-simu-resultats]') ?? racine;
      const haut = (cible ?? bloc).getBoundingClientRect().top;
      if (haut < 96 || haut > window.innerHeight * 0.55) bloc.scrollIntoView({ block: 'start' });
      cible?.focus({ preventScroll: true });
    };
    const doc = document as Document & {
      startViewTransition?: (rappel: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };
    if (sobre.matches || typeof doc.startViewTransition !== 'function') return appliquer();
    const html = document.documentElement;
    html.classList.add('vt-simu');
    const transition = doc.startViewTransition(appliquer);
    /* Le navigateur ABANDONNE une transition quand la fenêtre change de taille en cours de route (la
       barre d'adresse d'un téléphone qui se replie, une rotation) : l'écran a changé quand même, seule
       l'animation saute. Ses deux promesses sont alors rejetées ; sans ces `catch`, c'était une
       exception non rattrapée à chaque question sur téléphone. */
    transition.ready.catch(() => undefined);
    void transition.finished.catch(() => undefined).then(() => html.classList.remove('vt-simu'));
  };
  const question = (): HTMLElement | null =>
    un<HTMLElement>(`[data-simu-corps="${ETAPES[etat.etape - 1]}"] [data-simu-question]`, racine);

  const allerA = (etape: number): void => {
    const sens = etape < etat.etape ? 'arriere' : 'avant';
    changer(
      sens,
      () => {
        etat.etape = etape;
      },
      question
    );
  };

  const avancer = (): void => {
    const erreur = defaut();
    const cle = ETAPES[etat.etape - 1];
    if (erreur && erreur.champ === cle) {
      (cle === 'initial' ? champInitial : champMensuel).focus();
      return;
    }
    if (cle === 'rate' && !etat.tauxChoisi) {
      tauxReclame = true;
      actualiser();
      curseurTaux.focus();
      return;
    }
    if (etat.etape < ETAPES.length) return allerA(etat.etape + 1);
    changer(
      'avant',
      () => {
        etat.mode = 'resultat';
        etat.ouvert = null;
      },
      () => un<HTMLElement>('h3', zoneResultats)
    );
  };

  const lierMontant = (champ: HTMLInputElement, cle: 'initial' | 'monthly', max: number): void => {
    champ.addEventListener('input', () => {
      etat[cle] = Math.min(max, chiffres(champ.value));
      actualiser(champ);
    });
    champ.addEventListener('blur', () => accorder());
    /* Entrée vaut « Continuer » pendant le parcours : il n'y a pas de <form> à soumettre. */
    champ.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' || ev.isComposing || etat.mode !== 'parcours') return;
      ev.preventDefault();
      avancer();
    });
  };
  lierMontant(champInitial, 'initial', rules.maxInitial);
  lierMontant(champMensuel, 'monthly', rules.maxMonthly);

  curseurTaux.addEventListener('input', () => {
    etat.taux = Number(curseurTaux.value) / 100;
    etat.tauxChoisi = true;
    actualiser(curseurTaux);
  });
  curseurDuree.addEventListener('input', () => {
    etat.years = Number(curseurDuree.value);
    actualiser();
  });
  curseurPart.addEventListener('input', () => {
    etat.part = Number(curseurPart.value) / 100;
    actualiser();
  });

  racine.addEventListener('click', (ev) => {
    const cible = (ev.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    if (!cible) return;
    const donnees = cible.dataset;
    if (donnees.simuSuivant !== undefined) return avancer();
    if (donnees.simuRetour !== undefined) return allerA(Math.max(1, etat.etape - 1));
    if (donnees.simuRecommencer !== undefined)
      return changer(
        'arriere',
        () => {
          etat = neuf();
          tauxReclame = false;
        },
        question
      );
    if (donnees.simuResume !== undefined) {
      const cle = cible.closest<HTMLElement>('[data-simu-champ]')?.dataset.simuChamp as Reglage;
      /* Pendant le parcours, une ligne de « Vos hypothèses » ramène à sa question. */
      if (etat.mode === 'parcours') return allerA(ETAPES.indexOf(cle) + 1);
      etat.ouvert = etat.ouvert === cle ? null : cle;
    } else if (donnees.simuPuce) {
      etat[donnees.simuPuce as 'initial' | 'monthly' | 'years'] = Number(donnees.v);
    } else if (donnees.simuReinvestir) {
      etat.reinvestir = donnees.simuReinvestir === '1';
    } else if (donnees.simuRepere !== undefined) {
      etat.taux = Number(donnees.taux) / 100;
      etat.tauxChoisi = true;
    } else if (donnees.simuVue) {
      etat.vue = donnees.simuVue as Vue;
    } else return;
    actualiser();
  });

  /* La barre de synthèse s'efface quand les résultats, ou le pied de page, sont à l'écran. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entrees) => {
        resultatsVisibles = entrees.some((entree) => entree.isIntersecting);
        reglerBarre();
      },
      { threshold: 0.15 }
    ).observe(zoneResultats);
    /* Le pied de page ne chasse la barre qu'une fois monté à mi-écran (`rootMargin`). Sur téléphone il
       suit de près « Vos hypothèses » : au premier pixel, la barre disparaissait pendant qu'on réglait
       la durée, dernier réglage du panneau, c'est-à-dire au moment où elle sert. */
    const pied = document.querySelector('footer');
    if (pied)
      new IntersectionObserver(
        (entrees) => {
          piedVisible = entrees.some((entree) => entree.isIntersecting);
          reglerBarre();
        },
        { rootMargin: '0px 0px -50% 0px' }
      ).observe(pied);
  }

  actualiser();

  /* ── Fenêtre d'accès ──────────────────────────────────────────────────────────────────────── */
  /*
   * ELLE EST DÉJÀ À L'ÉCRAN quand ce script s'exécute : le serveur la rend, elle ne dépend de rien
   * (SimulatorGate.astro dit pourquoi). Il ne reste ici qu'à fermer la page derrière elle, puis à la
   * retirer quand on a répondu.
   * Le verrou est celui du site (src/scripts/verrou.ts), partagé avec le tiroir du menu et la
   * recherche : il rend inertes les enfants de <body> qui ne portent pas la fenêtre — la tabulation ne
   * peut donc pas en sortir — et neutralise les gestes de défilement, sans jamais empêcher le zoom.
   */
  const voile = document.querySelector<HTMLElement>('[data-simu-acces-voile]');
  const acces = voile?.querySelector<HTMLElement>('[data-simu-acces]');
  const liberer = (): void => {
    racine.inert = false;
  };
  /* Pas de fenêtre dans la page : on n'enferme pas le simulateur derrière rien. */
  if (!voile || !acces) return liberer();

  verrouiller(acces);
  /* Le focus sur le titre, pas sur « J'ai compris » : Entrée ne doit pas valider ce qu'on n'a pas lu. */
  acces.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  /* Échap ne referme pas : il n'y a que deux issues, accepter ou repartir par le lien vers l'accueil. */
  voile.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') ev.preventDefault();
  });
  acces.querySelector('[data-simu-accepter]')?.addEventListener('click', () => {
    deverrouiller(acces);
    liberer();
    /* Sortie en fondu, puis retrait : `hidden` seul coupe net, et le verrou est déjà levé. */
    if (sobre.matches) voile.hidden = true;
    else {
      voile.dataset.sortie = '';
      window.setTimeout(() => {
        voile.hidden = true;
      }, 240);
    }
    question()?.focus({ preventScroll: true });
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
