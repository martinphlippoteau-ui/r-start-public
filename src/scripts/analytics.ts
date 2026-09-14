/**
 * Événements dataLayer (GTM), plan de taggage du 14/09/2026.
 *
 * Fonctionne AVANT le chargement de GTM : la file est rejouée lorsque le conteneur se charge, après
 * consentement. Rien n'est donc perdu entre l'arrivée et l'accord, et rien n'est envoyé nulle part tant
 * que le conteneur n'est pas là.
 *
 * PARAMÈTRES JOINTS À CHAQUE ÉVÉNEMENT, posés une fois plutôt que répétés :
 *  - page_type             accueil · frais · outil · outils · strategie · presse · a-propos ·
 *                          documentation · salle-de-presse · legal · 404 (data-page-type sur <body>)
 *  - souscription_ouverte  oui · non : tant que le tunnel n'est pas ouvert, tous les appels aboutissent
 *                          à une fenêtre d'attente. Sans ce repère, les taux d'avant et d'après
 *                          l'ouverture seraient comparés sans que rien ne signale qu'ils ne mesurent
 *                          pas la même chose ;
 *  - campagne_source,
 *    campagne_nom          campagne d'entrée de la visite (scripts/campagne.ts).
 *
 * ÉVÉNEMENTS :
 *  parcours   cta_souscrire_click · souscription_indisponible · lien_sortant · retour_haut
 *  frais      comparateur_scpi · outil_ouvert · outil_niveau · outil_etape · outil_resultat
 *  lecture    document_download · faq_open · lecture_profondeur
 *  incidents  page_introuvable
 *  Le consentement est envoyé par scripts/consent.ts, qui le connaît de première main.
 *
 * JAMAIS DANS LE DATALAYER : aucun montant saisi dans un simulateur, aucune donnée personnelle. Les
 * hypothèses patrimoniales d'un visiteur n'ont rien à faire dans un outil de mesure d'audience.
 */
import { campagne } from './campagne';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

/** Paramètres joints à chaque envoi. Lus une fois : ils ne changent pas pendant la vie de la page. */
const communs = (): Record<string, unknown> => {
  const c = campagne();
  return {
    page_type: document.body.dataset.pageType || 'inconnu',
    souscription_ouverte: document.body.dataset.souscriptionOuverte || 'non',
    campagne_source: c.utm_source || 'direct',
    campagne_nom: c.utm_campaign || '',
  };
};

let base: Record<string, unknown> = {};

const push = (event: Record<string, unknown>) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ...base, ...event });
};

/** Section porteuse d'un élément : donne le contexte d'un clic sans avoir à l'annoter partout. */
const sectionDe = (el: Element): string =>
  (el.closest<HTMLElement>('[data-section]')?.dataset.section ?? '') || '';

const init = () => {
  base = communs();

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const cta = target.closest<HTMLAnchorElement>('[data-cta="souscrire"]');
    if (cta) {
      push({
        event: 'cta_souscrire_click',
        cta_position: cta.dataset.ctaPosition || 'unknown',
        cta_label: cta.textContent?.trim() || '',
      });
      return;
    }

    const doc = target.closest<HTMLAnchorElement>('[data-doc]');
    if (doc) {
      push({ event: 'document_download', doc: doc.dataset.doc || doc.getAttribute('href') || '' });
      return;
    }

    const haut = target.closest<HTMLElement>('[data-footer-top]');
    if (haut) {
      push({ event: 'retour_haut' });
      return;
    }

    /* Départ vers l'extérieur : corum.fr, Trustpilot, les magasins d'applications. Le tunnel de
       souscription en fait partie, il est traité plus haut et sort avant d'arriver ici. */
    const lien = target.closest<HTMLAnchorElement>('a[href]');
    if (lien) {
      try {
        const url = new URL(lien.href, location.href);
        if (url.origin !== location.origin) {
          push({
            event: 'lien_sortant',
            domaine: url.hostname,
            url: url.href,
            contexte: sectionDe(lien),
          });
        }
      } catch {
        /* adresse inexploitable (mailto:, tel:) : rien à compter */
      }
    }
  });

  /* Questions de la FAQ : seule l'ouverture compte, la fermeture ne dit rien. */
  document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) push({ event: 'faq_open', question: d.dataset.faq || '' });
    });
  });

  /* Comparateur de frais : à quoi le visiteur compare R Start. Le geste le plus parlant de /frais. */
  const comparateur = document.querySelector<HTMLSelectElement>('[data-comparator-select]');
  comparateur?.addEventListener('change', () => {
    push({
      event: 'comparateur_scpi',
      scpi: comparateur.options[comparateur.selectedIndex]?.text.trim() || '',
      rang: comparateur.selectedIndex,
    });
  });

  initOutils();
  initProfondeur();

  if (document.body.dataset.pageType === '404') {
    push({ event: 'page_introuvable', chemin: location.pathname, referent: document.referrer });
  }
};

/**
 * Simulateurs. Quatre mesures : l'ouverture, le niveau d'expertise choisi, la progression étape par
 * étape et l'arrivée au résultat. C'est la progression qui vaut le plus : elle donne le taux d'abandon
 * par question, la seule mesure qui dise où l'outil perd les gens.
 */
const initOutils = () => {
  const groupe = document.querySelector<HTMLElement>('[data-tool]');
  if (!groupe) return;
  const outil = groupe.dataset.tool || '';
  /*
   * Les boutons de niveau portent 1, 2, 3 : commode pour la CSS qui révèle les champs, illisible dans un
   * rapport. On renvoie le nom, pas le rang, pour que « expert » se lise sans table de correspondance.
   */
  const NIVEAUX: Record<string, string> = { '1': 'debutant', '2': 'intermediaire', '3': 'expert' };
  const nommerNiveau = (v: string) => NIVEAUX[v] ?? v;
  const niveauCourant = () =>
    nommerNiveau(
      document.querySelector<HTMLInputElement>('[data-tool-level-input]:checked')?.value || ''
    );

  push({ event: 'outil_ouvert', outil });

  document.querySelectorAll<HTMLInputElement>('[data-tool-level-input]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) push({ event: 'outil_niveau', outil, niveau: nommerNiveau(input.value) });
    });
  });

  /*
   * Le tunnel ne diffuse pas d'événement propre : on observe l'attribut que son script pose sur l'étape
   * affichée. Un observateur plutôt qu'un écouteur sur les boutons, parce que l'étape change aussi au
   * clavier, à la reprise et au retour en arrière, et qu'un seul point d'observation les couvre tous.
   */
  const piste = document.querySelector<HTMLElement>('[data-funnel-track]');
  if (piste) {
    let dernier = -1;
    const etapes = [...piste.querySelectorAll<HTMLElement>('[data-funnel-step]')];
    const visible = () => etapes.findIndex((e) => !e.hidden && e.getClientRects().length > 0);
    const regarder = () => {
      const rang = visible();
      if (rang < 0 || rang === dernier) return;
      const sens = dernier < 0 ? 'reprise' : rang > dernier ? 'avant' : 'arriere';
      dernier = rang;
      push({ event: 'outil_etape', outil, etape: rang + 1, total: etapes.length, sens });
    };
    new MutationObserver(regarder).observe(piste, {
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style', 'aria-hidden'],
    });
    regarder();
  }

  const resultats = document.querySelector<HTMLElement>('[data-funnel-results]');
  if (resultats && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          push({ event: 'outil_resultat', outil, niveau: niveauCourant() });
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(resultats);
  }
};

/**
 * Profondeur de lecture, aux quatre quarts de la page. Remplace l'ancien `section_view`, qui était posé
 * sur les 67 sections du site et tirait des dizaines d'événements par visite : de quoi noyer tout le
 * reste et consommer le quota sans rien apprendre. Quatre paliers au maximum, une fois chacun.
 */
const initProfondeur = () => {
  const paliers = [25, 50, 75, 100];
  let atteint = 0;
  let enAttente = false;

  const mesurer = () => {
    enAttente = false;
    const hauteur = document.documentElement.scrollHeight - window.innerHeight;
    if (hauteur <= 0) return;
    const part = Math.round(((window.scrollY || 0) / hauteur) * 100);
    for (const palier of paliers) {
      if (part >= palier && atteint < palier) {
        atteint = palier;
        push({ event: 'lecture_profondeur', palier });
      }
    }
    if (atteint >= 100) window.removeEventListener('scroll', planifier);
  };
  const planifier = () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(mesurer);
  };

  window.addEventListener('scroll', planifier, { passive: true });
  mesurer();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
