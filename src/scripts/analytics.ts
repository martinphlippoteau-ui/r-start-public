/**
 * Événements dataLayer (GTM), plan de taggage du 14/09/2026.
 *
 * Fonctionne AVANT le chargement de GTM : la file est rejouée lorsque le conteneur se charge, après
 * consentement. Rien n'est donc perdu entre l'arrivée et l'accord, et rien n'est envoyé nulle part tant
 * que le conteneur n'est pas là.
 *
 * PARAMÈTRES JOINTS À CHAQUE ÉVÉNEMENT, posés une fois plutôt que répétés :
 *  - page_type             accueil · frais · simulateur · strategie · faq · presse · a-propos ·
 *                          documentation · legal · 404 (data-page-type sur <body>, tiré du chemin)
 *  - souscription_ouverte  oui · non : tant que le tunnel n'est pas ouvert, tous les appels aboutissent
 *                          à une fenêtre d'attente. Sans ce repère, les taux d'avant et d'après
 *                          l'ouverture seraient comparés sans que rien ne signale qu'ils ne mesurent
 *                          pas la même chose ;
 *  - campagne_source,
 *    campagne_nom          campagne d'entrée de la visite (scripts/campagne.ts).
 *
 * ÉVÉNEMENTS :
 *  parcours   cta_souscrire_click · souscription_indisponible · lien_sortant · retour_haut
 *  frais      comparateur_scpi
 *  lecture    document_download · faq_open · lecture_profondeur
 *  recherche  recherche (terme, nb_resultats) · recherche_clic (terme, rubrique, rang, resultat,
 *             destination), émis par src/scripts/recherche/panneau.ts depuis le 17/09/2026
 *  incidents  page_introuvable
 *  RETIRÉS le 14/09/2026 avec les simulateurs eux-mêmes, À RETIRER DE GA4 ET DE GTM : les quatre
 *  événements outil_ouvert, outil_niveau, outil_etape et outil_resultat.
 *  Le consentement est envoyé par scripts/consent.ts, qui le connaît de première main.
 *
 * JAMAIS DANS LE DATALAYER : aucun montant saisi dans un simulateur, aucune donnée personnelle. Les
 * hypothèses patrimoniales d'un visiteur n'ont rien à faire dans un outil de mesure d'audience. Les
 * termes de recherche sont écartés par le panneau quand ils ressemblent à une adresse électronique ou
 * portent une suite de chiffres.
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

  /* Recherche du site : les événements arrivent tout formés de src/scripts/recherche/panneau.ts, par un
     événement DOM plutôt qu'un import : le panneau n'a pas à connaître la mesure, ni l'inverse, et un
     émetteur de plus (consentement, fenêtre « bientôt ») ne demande aucun câblage ici. Ce n'est PAS une
     précaution contre une double exécution : un module importé par deux scripts n'est empaqueté et
     exécuté qu'une fois (src/scripts/infoToggle.ts le dit aussi, dist le confirme). */
  document.addEventListener('rstart:mesure', (e) => {
    const detail = (e as CustomEvent<Record<string, unknown>>).detail;
    if (detail && typeof detail.event === 'string') push(detail);
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

  initProfondeur();

  if (document.body.dataset.pageType === '404') {
    /* Le référent SANS sa chaîne de requête ni son ancre : l'adresse de la page qui a envoyé ici peut
       porter une recherche, un identifiant ou un jeton, qui n'ont rien à faire dans la mesure. Ce qui
       sert à retrouver un lien mort, c'est le site et la page. */
    let referent = '';
    try {
      const r = new URL(document.referrer);
      referent = r.origin + r.pathname;
    } catch {
      /* pas de référent, ou inexploitable */
    }
    push({ event: 'page_introuvable', chemin: location.pathname, referent });
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
