/**
 * Sérialise une valeur pour un `<script type="application/json">`.
 *
 * Ce type n'est pas exécutable : la politique de sécurité du contenu ne le soumet pas à `script-src`,
 * et un bloc de données peut donc voyager sans nonce. C'est ce qui permet au comparateur de frais de
 * recevoir ses réglages sans un seul script en ligne. Il en est, depuis la suppression des simulateurs
 * le 14/09/2026, le SEUL consommateur (FeeComparator.astro).
 *
 * Le `<` est échappé en `<`, séquence que `JSON.parse` relit comme un `<` mais que l'analyseur
 * HTML ne reconnaît pas comme une ouverture de balise : un `</script>` présent dans un texte de
 * contenu ne peut donc pas fermer le bloc. La barre oblique inverse est elle-même échappée dans le
 * littéral, sans quoi on écrirait le caractère `<` et le remplacement ne ferait rien.
 */
export const jsonScript = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
