import type { EssentialsContent } from '@/content/types';
import { nb } from '@/lib/texte';

/**
 * Bloc « Points essentiels à connaître » (id « points-essentiels »), sur l'accueil entre « Qui a
 * envie de payer avant de gagner ? » et « R Start en un clin d'œil » (22/09/2026, demande de
 * Martin : « je veux juste ce contenu, ni plus ni moins », « un bandeau simple »). Mention de
 * CORUM L'Épargne reprise MOT POUR MOT, deux-points du titre compris ; le gabarit la met en
 * capitales. Aucun chiffre, rien à dériver de facts.ts.
 */
export const essentials = {
  title: nb('Points essentiels à connaître :'),
  text: nb(
    'Les produits commercialisés par CORUM L’Épargne sont des investissements long terme qui n’offrent aucune garantie de rendement ou de performance et présentent un risque de perte en capital et de liquidité. Les revenus ne sont pas garantis et dépendront des marchés immobilier et financier et du cours des devises.'
  ),
} satisfies EssentialsContent;
