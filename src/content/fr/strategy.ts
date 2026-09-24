import type { StrategyContent } from '@/content/types';

/**
 * Page /strategie, corps de la page (l'en-tête est dans strategyPage.ts). CONTENU FOURNI PAR
 * L'ÉQUIPE le 14/09/2026 et repris mot pour mot, « ni plus ni moins » : les deux moteurs de
 * performance, puis trois volets (`what`, `where`, `how` : Sélective, Diversifiée, Opportuniste).
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ : la page ne dit plus le mot d'ordre et ses contre-poids, la
 * zone du DIC (pays du Conseil de l'Europe et Canada, l'inverse de « partout dans le monde », voir
 * `where`), les types d'actifs du DIC, l'effet de levier ni les notes de sources ; les chiffres
 * restent dans facts.ts. PAS DE MENTION DE RISQUE DANS CE CORPS : celle qui suivait les deux
 * moteurs a quitté l'écran le 16/09/2026 et le code le 22/09/2026 (archivée hors du dépôt,
 * .claude/audits) ; les risques sont portés par le bloc Risques que la page rend ensuite.
 */

export const strategy: StrategyContent = {
  /* Libellés visibles des cartes qui se retournent (src/scripts/carteRetournee.ts). */
  dialogOpen: 'En savoir plus',
  dialogClose: 'Fermer',
  engines: {
    /* Texte de l'équipe (16/09/2026), « R Start : » retiré le 24/09/2026 (Martin : titre sur une
       seule ligne). Chiffre et non lettre, comme « 4 étapes pour souscrire » : un titre se balaie,
       un chiffre s'y repère plus vite. */
    title: '2 moteurs au service de la performance',
    /*
     * Textes descriptifs (`rest`) et bénéfice des plus-values réécrits par Martin le 24/09/2026,
     * mot pour mot. La comparaison « de façon plus systématique que d'autres SCPI » du texte du
     * 16/09/2026, que check-compliance.mjs signalait, n'y figure plus.
     */
    items: [
      /* `benefit` (17/09/2026, texte de l'équipe mot pour mot) : « tous les mois » est exact
         (facts.ts, `frequency`), « potentiels » indispensable, les revenus n'étant pas garantis. */
      /* `sequence` (24/09/2026, Martin : « 01 D'abord les loyers », « 02 Et ensuite ») : l'ordre
         des deux moteurs, à la suite du numéro. `rest` : texte de Martin du 24/09/2026, mot pour mot. */
      {
        sequence: 'D’abord',
        lead: 'Les loyers',
        benefit: 'Pour vous : des revenus potentiels tous les mois',
        rest: 'R Start distribue tous les mois des revenus potentiels (appelés « dividendes »). Ils sont issus des loyers facturés aux entreprises locataires de ses immeubles. C’est la première source de revenus potentiels pour les clients de la SCPI R Start.',
      },
      {
        sequence: 'Et ensuite',
        lead: 'Les plus-values',
        benefit: 'Pour vous : des revenus potentiels à la revente des immeubles',
        /* Textes de Martin du 24/09/2026, mot pour mot (le point final du bénéfice retiré, comme sur
           la carte des loyers). La comparaison « plus systématique que d'autres SCPI » est partie
           avec l'ancien texte. */
        rest: 'R Start met au cœur de sa démarche la recherche de plus-values sur les ventes d’immeubles. Ces plus-values sont redistribuées aux épargnants sous forme de dividendes après frais. C’est la deuxième source de revenus potentiels pour les clients de la SCPI R Start.',
      },
    ],
  },

  /* En-tête des trois volets (16/09/2026, texte de l'équipe). « pour les alimenter » renvoie aux
     deux moteurs : le titre fait la jointure et doit rester juste après eux. */
  tilesTitle: 'Une approche en 3 volets pour les alimenter',

  what: {
    /*
     * Surtitres (16/09/2026) : la correspondance avec la liste fournie (« Opportuniste, Sélective
     * et diversifiée ») est faite par le sens, pas par l'ordre. Choisir les immeubles, c'est être
     * SÉLECTIVE ; investir partout et dans tous les secteurs, DIVERSIFIÉE ; acheter moins cher que
     * la valeur et choisir le moment de vendre, OPPORTUNISTE. À intervertir si l'équipe voulait
     * l'ordre de sa liste.
     */
    eyebrow: 'Sélective',
    title: 'Tout commence par le choix des immeubles',
    /* Phrase de méthode (16/09/2026) : elle ouvre le propos au lieu de fermer les deux moteurs. */
    intro:
      'Les opportunités ne tombent pas du ciel : nous suivons une méthode d’investissement précise pour dénicher les bons immeubles, loués par les bonnes entreprises, et générer du rendement potentiel.',
    lead: 'L’équipe cible des immeubles avec à la fois :',
    items: [
      { lead: 'Un fort potentiel de rendement locatif ;' },
      { lead: 'Et un fort potentiel de plus-value.' },
    ],
    outro:
      'Il s’agit principalement d’immeubles de taille intermédiaire, un secteur où la concurrence est relativement limitée.',
  },

  where: {
    eyebrow: 'Diversifiée',
    /* Contenu fourni par l'équipe le 16/09/2026. */
    title: 'Viser large pour viser juste.',
    intro: 'R Start diversifiera ses acquisitions :',
    /* Pictogrammes sur les deux items (16/09/2026, demande de l'équipe) : une puce dessinée à la
       place du point. « PARTOUT DANS LE MONDE », ET CE QUI RESTE À TRANCHER : le DIC du 20/05/2026
       borne la zone aux pays du Conseil de l'Europe et au Canada (facts.strategy.zoneDetail). Le
       site dit « Monde » depuis le 14/09/2026, décision de l'équipe, sans écrire la zone réelle
       nulle part. */
    items: [
      { lead: 'partout dans le monde', icon: 'exploration' },
      { lead: 'dans tous les secteurs', icon: 'equipe' },
    ],
    outro: 'Un seul mot d’ordre : identifier une opportunité',
  },

  /** Volet « Opportuniste » (zone 5 du document de l'équipe). */
  how: {
    eyebrow: 'Opportuniste',
    title: 'Les bons immeubles, au bon prix',
    intro: 'La base de notre travail ?',
    items: [
      {
        lead: 'Repérer des immeubles moins chers que leur vraie valeur et les acheter aux meilleures conditions ;',
      },
      { lead: 'Travailler à leur donner plus de valeur au fil des années ;' },
      {
        lead: 'Choisir le bon moment pour vendre un immeuble afin d’en tirer la plus-value la plus intéressante possible.',
      },
    ],
    outro:
      'Bien acheter ne suffit pas. Ce qui crée de la valeur, c’est aussi de savoir bien gérer et bien vendre !',
  },
};
