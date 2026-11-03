// =============================================================================
// Criterio publicado de «diagnóstico» para los product codes de la FDA.
//
// La FDA clasifica cada tipo de dispositivo en una sección del 21 CFR
// (partes 862–892, subcapítulo H). Dentro de cada parte las secciones se
// agrupan en subpartes con título propio. Solo se toman como diagnóstico:
//
//   1. Las partes 862, 864 y 866 enteras: son los productos de diagnóstico in
//      vitro de 21 CFR 809.3(a) («reagents, instruments, and systems intended
//      for use in the diagnosis of disease or other conditions…»), salvo las
//      subpartes J y K de la 864 (productos para establecimientos que fabrican
//      sangre o HCT/P), que quedan aparte (`ivd-blood-establishment`).
//   2. En las demás partes, las subpartes cuyo título publicado dice
//      «Diagnostic Devices» o «Monitoring Devices».
//
// Los rangos de secciones son los de la tabla de contenidos publicada
// (eCFR / Cornell LII, consultados el 2026-10-24); `url` es la página citada.
// Una sección fuera de todo rango conocido NO se asigna por cercanía: queda
// con `subpart: null` y `diagnostic: null` para revisión (por ejemplo,
// secciones nuevas que la tabla todavía no lista).
// =============================================================================

const ECFR = (part, subpart) =>
  `https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-${part}${subpart ? `/subpart-${subpart}` : ''}`;
const LII = (part, subpart) =>
  `https://www.law.cornell.edu/cfr/text/21/part-${part}${subpart ? `/subpart-${subpart}` : ''}`;

/** Partes IVD completas (21 CFR 809.3(a)). */
export const IVD_PARTS = Object.freeze({
  862: 'Clinical Chemistry and Clinical Toxicology Devices',
  864: 'Hematology and Pathology Devices',
  866: 'Immunology and Microbiology Devices',
});

export const IVD_DEFINITION_URL =
  'https://www.law.cornell.edu/cfr/text/21/809.3';

/**
 * Subpartes verificadas. `kind`: `diagnostic` | `monitoring` | `ivd` |
 * `ivd-blood-establishment`. `from`/`to` son números de sección (la parte
 * decimal de `862.1020` → 1020).
 */
export const CFR_SUBPARTS = Object.freeze([
  {
    part: 862,
    subpart: 'B',
    title: 'Clinical Chemistry Test Systems',
    from: 1020,
    to: 1840,
    kind: 'ivd',
    url: ECFR(862, 'B'),
  },
  {
    part: 862,
    subpart: 'C',
    title: 'Clinical Laboratory Instruments',
    from: 2050,
    to: 2920,
    kind: 'ivd',
    url: ECFR(862, 'C'),
  },
  {
    part: 862,
    subpart: 'D',
    title: 'Clinical Toxicology Test Systems',
    from: 3030,
    to: 3970,
    kind: 'ivd',
    url: ECFR(862, 'D'),
  },
  {
    part: 864,
    subpart: 'B',
    title: 'Biological Stains',
    from: 1850,
    to: 1880,
    kind: 'ivd',
    url: LII(864, 'B'),
  },
  {
    part: 864,
    subpart: 'J',
    title:
      'Products Used In Establishments That Manufacture Blood and Blood Products',
    from: 9050,
    to: 9875,
    kind: 'ivd-blood-establishment',
    url: LII(864),
  },
  {
    part: 864,
    subpart: 'K',
    title:
      'Products Used In Establishments That Manufacture Human Cells, Tissues, and Cellular and Tissue-Based Products (HCT/Ps)',
    from: 9900,
    to: 9900,
    kind: 'ivd-blood-establishment',
    url: LII(864),
  },
  {
    part: 866,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1620,
    to: 1700,
    kind: 'ivd',
    url: ECFR(866),
  },
  {
    part: 866,
    subpart: 'C',
    title: 'Microbiology Devices',
    from: 2050,
    to: 2952,
    kind: 'ivd',
    url: ECFR(866),
  },
  {
    part: 866,
    subpart: 'D',
    title: 'Serological Reagents',
    from: 3010,
    to: 4001,
    kind: 'ivd',
    url: ECFR(866, 'D'),
  },
  {
    part: 866,
    subpart: 'E',
    title: 'Immunology Laboratory Equipment and Reagents',
    from: 4070,
    to: 4900,
    kind: 'ivd',
    url: ECFR(866),
  },
  {
    part: 866,
    subpart: 'F',
    title: 'Immunological Test Systems',
    from: 5040,
    to: 5980,
    kind: 'ivd',
    url: ECFR(866),
  },
  {
    part: 866,
    subpart: 'G',
    title: 'Tumor Associated Antigen Immunological Test Systems',
    from: 6000,
    to: 6110,
    kind: 'ivd',
    url: ECFR(866),
  },
  {
    part: 868,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1030,
    to: 1980,
    kind: 'diagnostic',
    url: LII(868, 'B'),
  },
  {
    part: 868,
    subpart: 'C',
    title: 'Monitoring Devices',
    from: 2025,
    to: 2900,
    kind: 'monitoring',
    url: LII(868, 'C'),
  },
  {
    part: 870,
    subpart: 'B',
    title: 'Cardiovascular Diagnostic Devices',
    from: 1025,
    to: 1915,
    kind: 'diagnostic',
    url: LII(870),
  },
  {
    part: 870,
    subpart: 'C',
    title: 'Cardiovascular Monitoring Devices',
    from: 2050,
    to: 2920,
    kind: 'monitoring',
    url: LII(870, 'C'),
  },
  {
    part: 872,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1500,
    to: 2060,
    kind: 'diagnostic',
    url: LII(872, 'B'),
  },
  {
    part: 874,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1050,
    to: 1925,
    kind: 'diagnostic',
    url: LII(874, 'B'),
  },
  {
    part: 876,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1050,
    to: 1800,
    kind: 'diagnostic',
    url: LII(876, 'B'),
  },
  {
    part: 876,
    subpart: 'C',
    title: 'Monitoring Devices',
    from: 2040,
    to: 2100,
    kind: 'monitoring',
    url: LII(876, 'C'),
  },
  {
    part: 878,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1800,
    to: 1820,
    kind: 'diagnostic',
    url: LII(878, 'B'),
  },
  {
    part: 880,
    subpart: 'C',
    title: 'General Hospital and Personal Use Monitoring Devices',
    from: 2200,
    to: 2930,
    kind: 'monitoring',
    url: LII(880, 'C'),
  },
  {
    part: 882,
    subpart: 'B',
    title: 'Neurological Diagnostic Devices',
    from: 1020,
    to: 1950,
    kind: 'diagnostic',
    url: LII(882, 'B'),
  },
  {
    part: 884,
    subpart: 'B',
    title: 'Obstetrical and Gynecological Diagnostic Devices',
    from: 1040,
    to: 1730,
    kind: 'diagnostic',
    url: LII(884, 'B'),
  },
  {
    part: 884,
    subpart: 'C',
    title: 'Obstetrical and Gynecological Monitoring Devices',
    from: 2050,
    to: 2990,
    kind: 'monitoring',
    url: LII(884, 'C'),
  },
  {
    part: 886,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1040,
    to: 1945,
    kind: 'diagnostic',
    url: ECFR(886, 'B'),
  },
  {
    part: 888,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1100,
    to: 1600,
    kind: 'diagnostic',
    url: LII(888, 'B'),
  },
  {
    part: 890,
    subpart: 'B',
    title: 'Physical Medicine Diagnostic Devices',
    from: 1175,
    to: 1925,
    kind: 'diagnostic',
    url: LII(890, 'B'),
  },
  {
    part: 892,
    subpart: 'B',
    title: 'Diagnostic Devices',
    from: 1000,
    to: 2100,
    kind: 'diagnostic',
    url: ECFR(892, 'B'),
  },
]);

/** Partes de dispositivos (subcapítulo H) de las que se conocen subpartes. */
const DEVICE_PARTS = new Set(CFR_SUBPARTS.map((s) => s.part));

/**
 * Clasifica un número de regulación (`'892.1750'`).
 *
 * Devuelve `{ regulation, part, section, subpart, subpartTitle, kind,
 * diagnostic, basis, url }`:
 *  - `diagnostic: true`  → subparte diagnóstica/de monitoreo o parte IVD.
 *  - `diagnostic: false` → parte de dispositivos conocida, sección en una
 *    subparte no diagnóstica (o en una parte de fuera de 862–892).
 *  - `diagnostic: null`  → no se puede decidir con lo publicado (sin
 *    regulación, sección fuera de los rangos verificados).
 */
export function classifyRegulation(regulation) {
  const reg = (regulation ?? '').trim();
  const base = {
    regulation: reg || null,
    part: null,
    section: null,
    subpart: null,
    subpartTitle: null,
    kind: null,
    diagnostic: null,
    basis: null,
    url: null,
  };
  const m = /^(\d{3})\.(\d{1,4})$/.exec(reg);
  if (!m)
    return { ...base, basis: reg ? 'regulation-unparsable' : 'no-regulation' };
  const part = Number(m[1]);
  const section = Number(m[2]);
  const found = CFR_SUBPARTS.find(
    (s) => s.part === part && section >= s.from && section <= s.to,
  );
  if (found) {
    const diagnostic = found.kind !== 'ivd-blood-establishment';
    return {
      ...base,
      part,
      section,
      subpart: found.subpart,
      subpartTitle: found.title,
      kind: found.kind,
      diagnostic,
      basis:
        found.kind === 'ivd'
          ? 'cfr-ivd-part'
          : found.kind === 'ivd-blood-establishment'
            ? 'cfr-blood-establishment'
            : 'cfr-subpart-title',
      url: found.url,
    };
  }
  if (IVD_PARTS[part]) {
    // Sección de una parte IVD fuera de los rangos listados: la parte entera es
    // IVD (809.3), así que es diagnóstico; la subparte queda sin asignar.
    return {
      ...base,
      part,
      section,
      kind: 'ivd',
      diagnostic: true,
      basis: 'cfr-ivd-part',
      url: IVD_DEFINITION_URL,
    };
  }
  if (DEVICE_PARTS.has(part)) {
    // La parte tiene subpartes diagnósticas verificadas. ¿La sección cae por
    // debajo de la última subparte diagnóstica conocida o es otra subparte?
    const known = CFR_SUBPARTS.filter((s) => s.part === part);
    const maxDx = Math.max(...known.map((s) => s.to));
    if (section > maxDx && section >= 3000) {
      // Desde x.3000 empiezan las subpartes de prótesis, cirugía, terapéuticos
      // y misceláneos (verificado en 870, 872, 874, 878, 880, 884, 886, 890 y
      // 892; 876, 882 y 888 por la lista de subpartes del capítulo): ninguna
      // tiene título diagnóstico.
      return {
        ...base,
        part,
        section,
        diagnostic: false,
        basis: 'cfr-non-diagnostic-subpart',
        url: ECFR(part),
      };
    }
    return {
      ...base,
      part,
      section,
      diagnostic: null,
      basis: 'cfr-section-outside-verified-ranges',
      url: ECFR(part),
    };
  }
  return {
    ...base,
    part,
    section,
    diagnostic: false,
    basis: 'cfr-non-device-part',
    url: ECFR(part),
  };
}
