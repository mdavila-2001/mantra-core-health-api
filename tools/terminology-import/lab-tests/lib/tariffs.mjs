// =============================================================================
// Nomencladores y aranceles nacionales → registros del catálogo de análisis.
//
// Cuatro fuentes oficiales de prestaciones (Chile, Brasil x2, Argentina), cada
// una con sus códigos propios. Ninguna se fusiona con otra ni con LOINC: no hay
// mapeo publicado entre ellas y no se inventa uno.
//
// Qué entra: SÓLO los prefijos de código cuyo contenido se revisó ítem por ítem
// en la pasada que los incorporó y resultó homogéneo (todo análisis, todo
// imagen…). Un prefijo que mezcla diagnóstico con tratamiento (p. ej. FONASA
// 17-01: ECG junto a angioplastía) queda FUERA y se reporta con su tamaño: la
// clasificación ítem por ítem es curaduría humana, no un ETL.
//
// Nombre de la categoría: el oficial si la fuente lo publica (SIGTAP trae los
// nombres de grupo, subgrupo y forma de organización); si no, sólo el prefijo.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { displayCase } from '../../lib/glossary-es/inlasa.mjs';
import { compact, conceptIdFor } from './records.mjs';

/**
 * Reglas por fuente. `prefix` se compara contra el código tal como lo publica
 * la fuente (FONASA y TUSS sin puntos; PAMI rellenado a 6 dígitos, porque el
 * JSON lo trae como número y pierde el cero inicial).
 */
export const TARIFF_RULES = {
  'fonasa-mle': [
    { prefix: '03', domain: 'laboratory', evidence: 'grupo 03: 443 ítems, todos análisis (ácido fólico, mielograma, agregación plaquetaria…)' },
    { prefix: '04', domain: 'imaging', evidence: 'grupo 04: 153 ítems, radiografía/eco/TC/RM' },
    { prefix: '0501', domain: 'imaging', evidence: 'subgrupo 05-01: 38 cintigrafías y captaciones (medicina nuclear diagnóstica); 05-02 son dosis terapéuticas y queda fuera' },
    { prefix: '0801', domain: 'pathology', evidence: 'subgrupo 08-01: 13 citologías y estudios histopatológicos' },
    { prefix: '1001', domain: 'functional', evidence: 'subgrupo 10-01: 5 pruebas funcionales endocrinas (estimulación/frenación, hipoglicemia, privación acuosa…)' },
  ],
  'sigtap-sus': [
    { prefix: '020210', domain: 'genetics', evidence: 'forma 02.02.10 «Exames de genética»' },
    { prefix: '0202', domain: 'laboratory', evidence: 'subgrupo 02.02 «Diagnóstico em laboratório clínico»' },
    { prefix: '0214', domain: 'laboratory', evidence: 'subgrupo 02.14 «Diagnóstico por teste rápido»' },
    { prefix: '0203', domain: 'pathology', evidence: 'subgrupo 02.03 «Diagnóstico por anatomia patológica e citopatologia»' },
    { prefix: '0204', domain: 'imaging', evidence: 'subgrupo 02.04 «Diagnóstico por radiologia»' },
    { prefix: '0205', domain: 'imaging', evidence: 'subgrupo 02.05 «Diagnóstico por ultrasonografia»' },
    { prefix: '0206', domain: 'imaging', evidence: 'subgrupo 02.06 «Diagnóstico por tomografia»' },
    { prefix: '0207', domain: 'imaging', evidence: 'subgrupo 02.07 «Diagnóstico por ressonância magnética»' },
    { prefix: '0208', domain: 'imaging', evidence: 'subgrupo 02.08 «Diagnóstico por medicina nuclear in vivo»' },
    { prefix: '0210', domain: 'imaging', evidence: 'subgrupo 02.10 «Diagnóstico por radiologia intervencionista»' },
    { prefix: '0211', domain: 'functional', evidence: 'subgrupo 02.11 «Métodos diagnósticos em especialidades»' },
    // Del grupo 02 («Procedimentos com finalidade diagnóstica») pero sin dominio AloVida claro: entran sin dominio.
    { prefix: '0201', domain: null, evidence: 'subgrupo 02.01 «Coleta de material»' },
    { prefix: '0209', domain: null, evidence: 'subgrupo 02.09 «Diagnóstico por endoscopia»' },
    { prefix: '0212', domain: null, evidence: 'subgrupo 02.12 «Diagnóstico e procedimentos especiais em hemoterapia»' },
    { prefix: '0213', domain: null, evidence: 'subgrupo 02.13 «Diagnóstico em vigilância epidemiológica e ambiental»' },
  ],
  'tuss-ans': [
    { prefix: '401', domain: 'functional', evidence: '4.01: 123 ítems (ECG convencional, ECG de alta resolução, teste ergométrico…)' },
    { prefix: '403', domain: 'laboratory', evidence: '4.03: 1456 ítems «pesquisa e/ou dosagem» (medicina laboratorial)' },
    { prefix: '405', domain: 'genetics', evidence: '4.05: 145 ítems, cariótipos y estudios moleculares' },
    { prefix: '406', domain: 'pathology', evidence: '4.06: 44 ítems, procedimiento diagnóstico peroperatorio, necropsia, anatomía patológica' },
    { prefix: '408', domain: 'imaging', evidence: '4.08: 295 ítems «RX - …»' },
    { prefix: '409', domain: 'imaging', evidence: '4.09: 95 ítems «US - …»' },
    { prefix: '410', domain: 'imaging', evidence: '4.10: 58 ítems «TC - …»' },
    { prefix: '411', domain: 'imaging', evidence: '4.11: 62 ítems «RM - …»' },
    { prefix: '414', domain: 'functional', evidence: '4.14: 75 ítems, testes diagnósticos (función muscular, pruebas cutáneas, metabolismo de repouso…)' },
  ],
  // ICD-10-PCS: secciones y tipos por posición (`pattern`), con sus nombres oficiales de `pcs_axes`.
  'icd10pcs-cms': [
    { prefix: 'B', domain: 'imaging', evidence: 'sección B «Imaging»: 2978 códigos (fluoroscopía 883, TC 767, radiografía 632, RM 422, ecografía 242, otras 32)' },
    { pattern: '^C.[123]', domain: 'imaging', evidence: 'sección C «Nuclear Medicine», tipos 1–3: imagen planar (208), tomográfica (155) y PET (15)' },
    { pattern: '^C.[456]', domain: null, evidence: 'sección C, tipos 4–6: captación, sonda y ensayo de medicina nuclear sin imagen (73); el tipo 7 es terapia y queda fuera' },
    { prefix: '4A', domain: 'functional', evidence: 'sección 4 «Measurement and Monitoring», sistemas fisiológicos (415)' },
    { prefix: '4B', domain: null, evidence: 'sección 4, 4B: medición de dispositivos (marcapasos, estimuladores) (7)' },
    { pattern: '^F.[0-5]', domain: 'functional', evidence: 'sección F, tipos 0–5: las 546 son «… Assessment» (habla, función motora, AVD, audición, audífono, vestibular); 6–F son tratamiento y quedan fuera' },
  ],
  'pami-nomenclador': [
    { prefix: '66', domain: 'laboratory', evidence: 'capítulo 66: 338 análisis clínicos' },
    { prefix: '77', domain: 'laboratory', evidence: 'códigos 77xxxx: 1305 análisis clínicos (295 con el mismo nombre que en 66; PAMI los publica como prácticas distintas)' },
    { prefix: '88', domain: 'laboratory', evidence: 'códigos 88xxxx: 1015 análisis de laboratorio (hormonas, serologías, cariotipo…)' },
    { prefix: '34', domain: 'imaging', evidence: 'capítulo 34: 234 radioscopias y radiografías' },
    { prefix: '18', domain: 'imaging', evidence: 'capítulo 18: 84 ecografías' },
    { prefix: '21', domain: 'genetics', evidence: 'capítulo 21: 20 estudios genéticos y cariotipos' },
    { prefix: '15', domain: 'pathology', evidence: 'capítulo 15: 41 citologías, biopsias, inmunohistoquímica' },
  ],
};

/**
 * Exclusiones dentro de un prefijo incluido: subprefijos o códigos terapéuticos
 * hallados al barrer los nombres buscando «tratamiento/angioplastía/drenaje…»
 * (ver docs/seed-research/lab-tests.md, pasada 5). Un código exacto tiene la
 * misma forma que un prefijo de su longitud completa.
 */
export const TARIFF_EXCLUSIONS = {
  'fonasa-mle': [
    { prefix: '0402022', reason: 'angioplastía intraluminal coronaria (terapéutica)' },
    { prefix: '0402023', reason: 'angioplastía intraluminal periférica (terapéutica)' },
    { prefix: '0402031', reason: 'embolización o balonización (terapéutica)' },
    { prefix: '0402032', reason: 'instalación de catéter o sonda intracardíaca (procedimiento)' },
  ],
  'tuss-ans': [
    { prefix: '40809', reason: '4.08.09: estudios contrastados mezclados con drenaje percutáneo y colocación de marcador' },
    { prefix: '40813', reason: '4.08.13: radiología intervencionista terapéutica (ablación, angioplastía, stents)' },
    { prefix: '40814', reason: '4.08.14: trombectomía/trombólisis y otros procedimientos terapéuticos' },
    { prefix: '40502210', reason: 'terapia de reposición enzimática por infusión (tratamiento)' },
  ],
  'pami-nomenclador': [
    { prefix: '187143', reason: 'drenajes y/o procedimientos similares bajo eco' },
    { prefix: '180152', reason: 'drenajes y/o procedimientos similares bajo eco' },
    { prefix: '341330', reason: 'drenajes y/o procedimientos similares bajo TAC' },
  ],
};

export function exclusionFor(source, code) {
  return (TARIFF_EXCLUSIONS[source] ?? []).find((x) => code.startsWith(x.prefix)) ?? null;
}

/** La regla más específica que coincide (así 020210 gana a 0202); nulo si una exclusión lo saca. */
export function ruleFor(source, code) {
  if (exclusionFor(source, code)) return null;
  const hits = (TARIFF_RULES[source] ?? []).filter((r) => (r.pattern ? new RegExp(r.pattern).test(code) : code.startsWith(r.prefix)));
  return hits.sort((a, b) => (b.prefix ?? b.pattern).length - (a.prefix ?? a.pattern).length)[0] ?? null;
}

const ruleKey = (r) => (r.pattern ? `patron-${r.pattern}` : `prefijo-${r.prefix}`);

/**
 * Ítems normalizados → registros.
 * @param {string} source clave de TARIFF_RULES (= code system interno)
 * @param {Array<{code, name, display?, lang, category?, properties?}>} items
 * @param {object} prov { sourceName, sourceVersion, sourceUrl, sourceFile, sourceSha256, retrievedAt, license, idUrl?(code) }
 */
export function tariffRecords(source, items, prov) {
  const records = [];
  const excludedByPrefix = {};
  const excludedExplicitly = [];
  for (const it of items) {
    const rule = ruleFor(source, it.code);
    const excluded = exclusionFor(source, it.code);
    if (excluded) {
      excludedExplicitly.push({ code: it.code, name: it.name, reason: excluded.reason });
      continue;
    }
    if (!rule) {
      const k = it.code.slice(0, 4);
      excludedByPrefix[k] = (excludedByPrefix[k] ?? 0) + 1;
      continue;
    }
    const category = it.category ?? { scheme: source, code: rule.prefix ?? rule.pattern, display: `Prefijo ${rule.prefix ?? rule.pattern}` };
    records.push({
      id: conceptIdFor(source, it.code),
      codeSystem: source,
      code: it.code,
      display: it.display ?? it.name,
      definition: null,
      lang: it.lang,
      selectable: it.selectable ?? true,
      status: it.status ?? 'active',
      category,
      domain: rule.domain,
      domainRule: rule.domain ? `${source}:${ruleKey(rule)}` : null,
      properties: compact({ ...it.properties, tariff_official_name: it.name, tariff_rule: ruleKey(rule), tariff_rule_evidence: rule.evidence, lab_catalog_domain: rule.domain, lab_catalog_domain_rule: rule.domain ? `${source}:${ruleKey(rule)}` : null }),
      designations: it.lang === 'es' ? [{ lang: 'es', type: 'preferred', value: it.display ?? it.name }] : [],
      relations: [],
      valueSets: [`lab-catalog-${source}`, `lab-catalog-${source}-cat-${slugify(category.code)}`, ...(rule.domain ? [`lab-catalog-domain-${rule.domain}`] : [])],
      provenance: {
        source,
        sourceName: prov.sourceName,
        sourceId: it.code,
        sourceVersion: prov.sourceVersion,
        sourceUrl: prov.sourceUrl,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  return { records, stats: { items: items.length, included: records.length, excludedByPrefix, excludedExplicitly } };
}

// --- Adaptadores por fuente (forma del archivo → ítems normalizados) ----------

/** FONASA MLE: `[{ code, name, level1_total, level1_copay, … }]`, nombres en mayúsculas. */
export function fonasaItems(rows) {
  return rows.map((r) => ({
    code: String(r.code),
    name: r.name,
    display: displayCase(r.name.replace(/\s+/g, ' ').trim()),
    lang: 'es',
    properties: {
      reference_price: compact({
        currency: 'CLP',
        schedule: 'FONASA MLE',
        level1_total: r.level1_total, level1_copay: r.level1_copay,
        level2_total: r.level2_total, level2_copay: r.level2_copay,
        level3_total: r.level3_total, level3_copay: r.level3_copay,
      }),
    },
  }));
}

/** SIGTAP (grupo 02): procedimientos + nombres oficiales de subgrupo y forma de organización. */
export function sigtapItems(procedures, subGroups, organizationForms) {
  const sg = new Map(subGroups.map((x) => [x.code, x.name]));
  const of = new Map(organizationForms.map((x) => [x.code, x.name]));
  return procedures
    .filter((p) => p.group === '02')
    .map((p) => ({
      code: p.code,
      name: p.name,
      lang: 'pt',
      category: { scheme: 'sigtap-forma-organizacao', code: p.organizationForm, display: `${sg.get(p.subGroup) ?? p.subGroup} › ${of.get(p.organizationForm) ?? p.organizationForm}` },
      properties: {
        sigtap_subgroup: { code: p.subGroup, name: sg.get(p.subGroup) ?? null },
        sigtap_organization_form: { code: p.organizationForm, name: of.get(p.organizationForm) ?? null },
        sigtap_complexity: p.complexity,
        sigtap_sex_restriction: p.sexRestriction,
        sigtap_age_min_months: p.ageMinMonths,
        sigtap_age_max_months: p.ageMaxMonths,
        reference_price: compact({ currency: 'BRL', schedule: 'SIGTAP/SUS', ambulatory_cents: p.ambulatoryValueCents, hospital_cents: p.hospitalValueCents, professional_cents: p.professionalValueCents }),
      },
    }));
}

/** TUSS tabla 22 (procedimientos): `[{ code, name, startsAt, endsAt, … }]`. */
export function tussItems(procedures) {
  return procedures
    .filter((p) => p.table === 22)
    .map((p) => ({
      code: p.code,
      name: p.name,
      lang: 'pt',
      selectable: p.endsAt == null,
      status: p.endsAt == null ? 'active' : 'ended',
      properties: { tuss_table: p.table, tuss_starts_at: p.startsAt, tuss_ends_at: p.endsAt, tuss_implemented_until: p.implementedUntil },
    }));
}

/** Nomenclador PAMI: `[{ name, code:number }]`; el código se rellena a 6 dígitos (el JSON perdió el cero inicial). */
export function pamiItems(rows) {
  return rows.map((r) => ({ code: String(r.code).padStart(6, '0'), name: r.name.replace(/\s+/g, ' ').trim(), lang: 'es', properties: { pami_code_as_published: r.code } }));
}

/**
 * ICD-10-PCS (filas `codes` del índice SQLite, sólo códigos válidos) → ítems.
 * La categoría es sección (posición 1, nombre de `pcs_axes`) + tipo (posición
 * 3). El nombre del tipo se toma del texto oficial (lo que precede a « of ») SÓLO
 * si es idéntico en todos los códigos de esa categoría —así es en B, C y 4—; si
 * no (sección F, donde ese texto es el calificador), queda «tipo <carácter>».
 */
export function pcsItems(codes, sectionNames) {
  const catOf = (code) => `${code[0]}${code[2]}`;
  const typeNames = new Map();
  for (const r of codes) {
    const k = catOf(r.code);
    if (!typeNames.has(k)) typeNames.set(k, new Set());
    typeNames.get(k).add(r.long_desc.split(' of ')[0]);
  }
  return codes.map((r) => {
    const k = catOf(r.code);
    const names = typeNames.get(k);
    const type = names.size === 1 ? [...names][0] : `tipo ${r.code[2]}`;
    return {
      code: r.code,
      name: r.long_desc,
      lang: 'en',
      category: { scheme: 'icd10pcs-section-type', code: k, display: `${sectionNames.get(r.code[0]) ?? r.code[0]} › ${type}` },
      properties: compact({ pcs_section: { value: r.code[0], meaning: sectionNames.get(r.code[0]) ?? null }, pcs_short_description: r.short_desc && r.short_desc !== r.long_desc ? r.short_desc : null }),
    };
  });
}
