// =============================================================================
// Criterio de alcance «diagnóstico» para dispositivos registrados ante FDA.
//
// La unidad de decisión es el product code FDA. Se decide, en este orden:
//   1. Excepción explícita por product code (PRODUCT_CODE_OVERRIDES).
//   2. Excepción explícita por regulación 21 CFR (REGULATION_OVERRIDES).
//   3. Parte y subparte de 21 CFR del número de regulación (SUBPARTS): FDA
//      agrupa cada parte (panel) en subpartes «Diagnostic devices»,
//      «Monitoring devices», «Prosthetic», «Surgical», «Therapeutic»…; el
//      título oficial de la subparte es el motivo.
//   4. Sin número de regulación (sin clasificar, PMA o códigos nuevos): entra
//      sólo si el panel es de diagnóstico in vitro o de genética médica.
//
// Títulos y rangos de subparte verificados contra eCFR / Cornell LII
// (2026-10-24, ver `docs/seed-research/diagnostic-devices-us.md`). Nada de
// esto es parecido difuso de nombres: cada excepción cita su motivo.
// =============================================================================

/** Paneles de revisión FDA (código de 2 letras de `medical_specialty`/`review_panel`). */
export const PANELS = Object.freeze({
  AN: 'Anesthesiology',
  CV: 'Cardiovascular',
  CH: 'Clinical Chemistry',
  DE: 'Dental',
  EN: 'Ear, Nose, Throat',
  GU: 'Gastroenterology, Urology',
  HO: 'General Hospital',
  HE: 'Hematology',
  IM: 'Immunology',
  MI: 'Microbiology',
  NE: 'Neurology',
  OB: 'Obstetrics/Gynecology',
  OP: 'Ophthalmic',
  OR: 'Orthopedic',
  PA: 'Pathology',
  PM: 'Physical Medicine',
  RA: 'Radiology',
  SU: 'General, Plastic Surgery',
  TX: 'Clinical Toxicology',
  MG: 'Medical Genetics',
});

const PANEL_BY_NAME = Object.fromEntries(Object.entries(PANELS).map(([k, v]) => [v.toUpperCase(), k]));

/** Panel de 2 letras a partir del código o del nombre que publique la fuente. */
export function panelCode(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return null;
  if (PANELS[s]) return s;
  return PANEL_BY_NAME[s] ?? null;
}

/** Paneles in vitro: todo product code sin regulación de estos paneles es diagnóstico. */
export const IVD_PANELS = Object.freeze(['CH', 'HE', 'IM', 'MI', 'PA', 'TX', 'MG']);

/** Parte 21 CFR → panel (Subchapter H, Medical Devices). */
export const CFR_PARTS = Object.freeze({
  862: 'CH/TX',
  864: 'HE/PA',
  866: 'IM/MI',
  868: 'AN',
  870: 'CV',
  872: 'DE',
  874: 'EN',
  876: 'GU',
  878: 'SU',
  880: 'HO',
  882: 'NE',
  884: 'OB',
  886: 'OP',
  888: 'OR',
  890: 'PM',
  892: 'RA',
});

/**
 * Subpartes por parte: primer dígito de la sección (862.1xxx → '1').
 * `include: true` = subparte diagnóstica o de monitoreo del paciente.
 */
export const SUBPARTS = Object.freeze({
  862: {
    1: { title: 'Subpart B — Clinical Chemistry Test Systems', include: true },
    2: { title: 'Subpart C — Clinical Laboratory Instruments', include: true },
    3: { title: 'Subpart D — Clinical Toxicology Test Systems', include: true },
  },
  864: {
    1: { title: 'Subpart B — Biological Stains', include: true },
    2: { title: 'Subpart C — Cell and Tissue Culture Products', include: true },
    3: { title: 'Subpart D — Pathology Instrumentation and Accessories', include: true },
    4: { title: 'Subpart E — Specimen Preparation Reagents', include: true },
    5: { title: 'Subpart F — Automated and Semi-Automated Hematology Devices', include: true },
    6: { title: 'Subpart G — Manual Hematology Devices', include: true },
    7: { title: 'Subpart H — Hematology Kits and Packages', include: true },
    8: { title: 'Subpart I — Hematology Reagents', include: true },
    9: { title: 'Subpart J — Products Used in Establishments That Manufacture Blood and Blood Products', include: false },
  },
  866: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    2: { title: 'Subpart C — Microbiology Devices', include: true },
    3: { title: 'Subpart D — Serological Reagents', include: true },
    4: { title: 'Subpart E — Immunology Laboratory Equipment and Reagents', include: true },
    5: { title: 'Subpart F — Immunological Test Systems', include: true },
    6: { title: 'Subpart G — Tumor Associated Antigen Immunological Test Systems', include: true },
  },
  868: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    2: { title: 'Subpart C — Monitoring Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
    6: { title: 'Subpart G — Miscellaneous', include: false },
  },
  870: {
    1: { title: 'Subpart B — Cardiovascular Diagnostic Devices', include: true },
    2: { title: 'Subpart C — Cardiovascular Monitoring Devices', include: true },
    3: { title: 'Subpart D — Cardiovascular Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Cardiovascular Surgical Devices', include: false },
    5: { title: 'Subpart F — Cardiovascular Therapeutic Devices', include: false },
  },
  872: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    2: { title: 'Subpart B — Diagnostic Devices (872.2050 dental sonography, 872.2060 jaw tracking)', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
    6: { title: 'Subpart G — Miscellaneous Devices', include: false },
  },
  874: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
  },
  876: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    2: { title: 'Subpart C — Monitoring Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
  },
  878: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
  },
  880: {
    2: { title: 'Subpart C — General Hospital and Personal Use Monitoring Devices', include: true },
    5: { title: 'Subpart F — General Hospital and Personal Use Therapeutic Devices', include: false },
    6: { title: 'Subpart G — General Hospital and Personal Use Miscellaneous Devices', include: false },
  },
  882: {
    1: { title: 'Subpart B — Neurological Diagnostic Devices', include: true },
    4: { title: 'Subpart E — Neurological Surgical Devices', include: false },
    5: { title: 'Subpart F — Neurological Therapeutic Devices', include: false },
  },
  884: {
    1: { title: 'Subpart B — Obstetrical and Gynecological Diagnostic Devices', include: true },
    2: { title: 'Subpart C — Obstetrical and Gynecological Monitoring Devices', include: true },
    3: { title: 'Subpart D — Obstetrical and Gynecological Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Obstetrical and Gynecological Surgical Devices', include: false },
    5: { title: 'Subpart F — Obstetrical and Gynecological Therapeutic Devices', include: false },
    6: { title: 'Subpart G — Assisted Reproduction Devices', include: false },
  },
  886: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
  },
  888: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    3: { title: 'Subpart D — Prosthetic Devices', include: false },
    4: { title: 'Subpart E — Surgical Devices', include: false },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
  },
  890: {
    1: { title: 'Subpart B — Physical Medicine Diagnostic Devices', include: true },
    3: { title: 'Subpart D — Physical Medicine Prosthetic Devices', include: false },
    5: { title: 'Subpart F — Physical Medicine Therapeutic Devices', include: false },
  },
  892: {
    1: { title: 'Subpart B — Diagnostic Devices', include: true },
    2: { title: 'Subpart B — Diagnostic Devices (892.2000–892.2100: imagen, PACS, CADe/CADx)', include: true },
    5: { title: 'Subpart F — Therapeutic Devices', include: false },
    6: { title: 'Subpart G — Miscellaneous Devices (protección radiológica)', include: false },
  },
});

/**
 * Regulaciones con decisión propia (dentro de una subparte que diría lo
 * contrario). Motivo en castellano, visible en el reporte de cobertura.
 */
export const REGULATION_OVERRIDES = Object.freeze({
  // Endoscopía diagnóstica de ORL, clasificada por FDA como «Surgical devices».
  '874.4680': { include: true, reason: 'Broncoscopio: endoscopía diagnóstica (FDA lo ubica en Subpart E — Surgical)' },
  '874.4710': { include: true, reason: 'Esofagoscopio: endoscopía diagnóstica (Subpart E)' },
  '874.4720': { include: true, reason: 'Mediastinoscopio: endoscopía diagnóstica (Subpart E)' },
  '874.4750': { include: true, reason: 'Laringoestroboscopio: diagnóstico de la voz (Subpart E)' },
  '874.4760': { include: true, reason: 'Nasofaringoscopio: endoscopía diagnóstica (Subpart E)' },
  '874.4770': { include: true, reason: 'Otoscopio (Subpart E)' },
  // Subpart J de hematología: sólo los reactivos y equipos de inmunohematología.
  '864.9160': { include: true, reason: 'Sustancias de grupo sanguíneo para tipificación in vitro' },
  '864.9175': { include: true, reason: 'Sistema automatizado de grupo sanguíneo y anticuerpos' },
  '864.9185': { include: true, reason: 'Visor para tipificación de grupo sanguíneo' },
  '864.9275': { include: true, reason: 'Centrífuga de banco de sangre para diagnóstico in vitro' },
  '864.9285': { include: true, reason: 'Centrífuga lavadora de células para inmunohematología' },
  '864.9300': { include: true, reason: 'Sistema automatizado de prueba de Coombs' },
  '864.9320': { include: true, reason: 'Solución de sulfato de cobre: tamizaje de hemoglobina del donante' },
  '864.9400': { include: true, reason: 'Solución enzimática estabilizada (reactivo inmunohematológico)' },
  '864.9550': { include: true, reason: 'Lectinas y protectinas (reactivos de tipificación)' },
  '864.9600': { include: true, reason: 'Medios potenciadores para diagnóstico in vitro' },
  '864.9650': { include: true, reason: 'Control de calidad de reactivos de banco de sangre' },
  // Subpart C de hospital general: lo que no mide al paciente.
  '880.2420': { include: false, reason: 'Monitor de infusión por gravedad: mide la infusión, no al paciente' },
  '880.2800': { include: false, reason: 'Indicador de esterilización: controla el proceso, no al paciente' },
  '880.2805': { include: false, reason: 'Indicador biológico de esterilización' },
  '880.2806': { include: false, reason: 'Indicador biológico de esterilización' },
  '880.2930': { include: false, reason: 'Cronómetro de Apgar: no mide al paciente' },
});

/**
 * Product codes con decisión propia. Cada inclusión cita los registros FDA
 * que la justifican (no se infiere por el nombre).
 */
export const PRODUCT_CODE_OVERRIDES = Object.freeze({
  PSN: {
    include: true,
    reason: 'Dermatoscopios autorizados bajo este código (510(k) K192829, K213957, K230448); 878.4580 es Subpart E',
  },
  NAY: { include: false, reason: 'Sistema quirúrgico asistido por computadora (robot): 876.1500 lo agrupa con endoscopios, pero es quirúrgico' },
});

/** Divide `870.1130` → { part: '870', subpart: '1', section: '870.1130' }. */
export function parseRegulation(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(8\d\d)\.(\d)(\d{0,3})/);
  if (!m) return null;
  return { part: m[1], subpart: m[2], section: s.match(/^\d{3}\.\d+/)[0] };
}

/**
 * Decide si un product code entra. Devuelve `{ include, rule, reason }`;
 * `rule` es estable (sirve para agrupar en el reporte de cobertura).
 */
export function classifyScope({ productCode, regulationNumber, panel }) {
  const pc = String(productCode ?? '').trim().toUpperCase();
  const ov = PRODUCT_CODE_OVERRIDES[pc];
  if (ov) return { include: ov.include, rule: `product_code:${pc}`, reason: ov.reason };

  const reg = parseRegulation(regulationNumber);
  if (reg) {
    const rov = REGULATION_OVERRIDES[reg.section];
    if (rov) return { include: rov.include, rule: `regulation:${reg.section}`, reason: rov.reason };
    const sp = SUBPARTS[reg.part]?.[reg.subpart];
    if (sp) return { include: sp.include, rule: `subpart:${reg.part}.${reg.subpart}`, reason: `21 CFR ${reg.part} ${sp.title}` };
    if (CFR_PARTS[reg.part]) {
      return { include: false, rule: `subpart:${reg.part}.${reg.subpart}:unverified`, reason: `21 CFR ${reg.section}: subparte no verificada en eCFR; queda fuera hasta verificarla` };
    }
    return { include: false, rule: 'regulation:outside_subchapter_h', reason: `21 CFR ${reg.section} fuera de las partes 862–892` };
  }

  const p = panelCode(panel);
  if (p && IVD_PANELS.includes(p)) {
    return { include: true, rule: `panel:${p}:unclassified`, reason: `Sin regulación; panel in vitro ${PANELS[p]}` };
  }
  return { include: false, rule: `panel:${p ?? 'unknown'}:unclassified`, reason: 'Sin regulación y panel no in vitro: no se puede ubicar en una subparte diagnóstica' };
}
