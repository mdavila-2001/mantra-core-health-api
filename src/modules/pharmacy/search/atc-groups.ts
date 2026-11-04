/**
 * Therapeutic groups by the first letter of the ATC code (WHO, level 1).
 *
 * The showcase filters use them so the chips read «Antiinfecciosos» instead
 * of an alphabetical list of substances. Moved here from the marketplace
 * service so the search module and the service share one source.
 */
const GROUPS_ATC: Readonly<Record<string, string>> = {
  A: 'Aparato digestivo y metabolismo',
  B: 'Sangre y órganos hematopoyéticos',
  C: 'Aparato cardiovascular',
  D: 'Dermatológicos',
  G: 'Aparato genitourinario',
  H: 'Terapia hormonal',
  J: 'Antiinfecciosos',
  L: 'Antineoplásicos',
  M: 'Aparato locomotor',
  N: 'Sistema nervioso',
  P: 'Antiparasitarios',
  R: 'Aparato respiratorio',
  S: 'Órganos de los sentidos',
  V: 'Varios',
};

/** The therapeutic group of an ATC code, or «Varios» if the letter is unknown. */
export function groupOf(atcCode: string): string {
  return GROUPS_ATC[atcCode.charAt(0).toUpperCase()] ?? 'Varios';
}
