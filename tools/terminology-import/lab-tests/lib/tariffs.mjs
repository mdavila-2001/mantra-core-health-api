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
    { prefix: 'B', domain: 'imaging', evidence: 'sección B «Imaging» (tipos oficiales: Plain Radiography, Fluoroscopy, CT, MRI, Ultrasonography, Other Imaging)' },
    { pattern: '^C.[123]', domain: 'imaging', evidence: 'sección C «Nuclear Medicine», tipos 1–3: Planar, Tomographic y PET Imaging' },
    { pattern: '^C.[456]', domain: null, evidence: 'sección C, tipos 4–6: Nonimaging Uptake, Probe y Assay; el tipo 7 (Systemic Nuclear Medicine Therapy) queda fuera' },
    { prefix: '4A', domain: 'functional', evidence: 'sección 4 «Measurement and Monitoring», sistemas fisiológicos' },
    { prefix: '4B', domain: null, evidence: 'sección 4, 4B: medición de dispositivos (marcapasos, estimuladores)' },
    { pattern: '^F.[0-5]', domain: 'functional', evidence: 'sección F, tipos 0–5 (oficiales: Speech, Motor and/or Nerve Function, Activities of Daily Living, Hearing, Hearing Aid y Vestibular Assessment); 6–F son tratamiento, ajuste o entrenamiento y quedan fuera' },
  ],
  // CUPS (MinSalud Colombia, conjuntos POS Pópuli). Sólo códigos de 6 dígitos (ver cupsItems).
  'cups-co': [
    { prefix: '90', domain: 'laboratory', evidence: 'POSPOPULI-LABORATORIO: los 1 339 códigos son 90xxxx (laboratorio clínico)' },
    { prefix: '911', domain: 'laboratory', evidence: 'PBS 911: anticuerpos irregulares y pruebas inmunohematológicas (64)' },
    ...['870', '871', '872', '873'].map((prefix) => ({ prefix, domain: 'imaging', evidence: `PBS ${prefix}: radiografías` })),
    ...['874', '875', '876', '877'].map((prefix) => ({ prefix, domain: 'imaging', evidence: `PBS ${prefix}: arteriografías, angiografías y estudios contrastados diagnósticos` })),
    { prefix: '879', domain: 'imaging', evidence: 'PBS 879: tomografías computadas (39)' },
    { prefix: '881', domain: 'imaging', evidence: 'PBS 881: ecografías (74)' },
    { prefix: '882', domain: 'imaging', evidence: 'PBS 882: ecografías doppler (43)' },
    { prefix: '883', domain: 'imaging', evidence: 'PBS 883: resonancias magnéticas (59)' },
    { prefix: '886', domain: 'imaging', evidence: 'PBS 886: osteodensitometrías, morfometría vertebral, elastografía (5)' },
    { prefix: '920', domain: 'imaging', evidence: 'PBS 920: gamagrafías (82)' },
    { prefix: '921', domain: 'imaging', evidence: 'PBS 921: gamagrafías con galio, tumorales, de viabilidad (8)' },
    { prefix: '898', domain: 'pathology', evidence: 'PBS 898: estudios de coloración, inmunohistoquímica y citometría en especímenes (68)' },
    ...['891', '892', '894', '895', '897'].map((prefix) => ({ prefix, domain: 'functional', evidence: `PBS ${prefix}: pruebas funcionales y monitoreos diagnósticos (rinomanometría, urodinamia, pruebas de esfuerzo, Holter, monitoría fetal…)` })),
    ...['950', '951', '952'].map((prefix) => ({ prefix, domain: 'functional', evidence: `PBS ${prefix}: pruebas diagnósticas oftalmológicas (campo visual, OCT, electrorretinograma…)` })),
    { prefix: '954', domain: 'functional', evidence: 'PBS 954: audiometrías, impedanciometría y potenciales evocados auditivos (45)' },
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
  'cups-co': [
    { prefix: '911101', reason: 'procesamiento de la unidad de autotransfusión (no es un análisis)' },
    { prefix: '954610', reason: 'liberación y reposicionamiento canalicular: terapia de rehabilitación vestibular' },
    { prefix: '954903', reason: 'revisión y ajuste de dispositivo auditivo implantable (no es una prueba)' },
    { prefix: '954904', reason: 'revisión y ajuste de dispositivo auditivo no implantable (no es una prueba)' },
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
      definition: it.definition ?? null,
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
        ...(it.provenance ?? {}),
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

/**
 * Nomenclador Común de PAMI, CSV oficial (datos.pami.org.ar, ISO-8859-1, `;`):
 * título en la primera fila, cabecera «Módulo;Código de práctica;Descripción de
 * práctica;Valor resultante unidades». Nombre verbatim en mayúsculas; `display`
 * sólo normaliza la caja. El valor viene como texto en pesos («$ 115,32»).
 */
export function pamiOfficialItems(csvRows) {
  const hi = csvRows.findIndex((r) => r.some((c) => c.trim() === 'Código de práctica'));
  if (hi < 0) throw new Error('PAMI: no se encontró la cabecera «Código de práctica»');
  const h = csvRows[hi].map((c) => c.trim());
  const col = (name) => h.indexOf(name);
  const [cMod, cCode, cDesc, cVal] = ['Módulo', 'Código de práctica', 'Descripción de práctica', 'Valor resultante unidades'].map(col);
  const title = csvRows.slice(0, hi).flat().find((c) => c.trim())?.trim() ?? null;
  return csvRows
    .slice(hi + 1)
    .filter((r) => /^\d{5,6}$/.test((r[cCode] ?? '').trim()))
    .map((r) => {
      const name = r[cDesc].replace(/\s+/g, ' ').trim();
      const amount = (r[cVal] ?? '').trim().match(/^\$\s*([\d.]+,\d{2})$/);
      return {
        code: r[cCode].trim().padStart(6, '0'),
        name,
        display: displayCase(name),
        lang: 'es',
        properties: compact({
          pami_module: (r[cMod] ?? '').trim() || null,
          pami_code_as_published: r[cCode].trim(),
          reference_price: amount ? { currency: 'ARS', schedule: title, amount: amount[1].replace(/\./g, '').replace(',', '.'), priceText: r[cVal].trim() } : null,
        }),
      };
    });
}

/** Nomenclador PAMI: `[{ name, code:number }]`; el código se rellena a 6 dígitos (el JSON perdió el cero inicial). */
export function pamiItems(rows) {
  return rows.map((r) => ({ code: String(r.code).padStart(6, '0'), name: r.name.replace(/\s+/g, ' ').trim(), lang: 'es', properties: { pami_code_as_published: r.code } }));
}

/**
 * ICD-10-PCS (filas `codes` del índice SQLite, sólo códigos válidos) → ítems.
 * La categoría es sección (posición 1) + tipo (posición 3), con los nombres
 * oficiales de las code tables de CMS (`typeNames`, de pcsAxisNames). Sin esas
 * tablas, el tipo se toma del texto de la descripción (lo que precede a « of »)
 * SÓLO si es idéntico en toda la categoría; si no, queda «tipo <carácter>».
 */
export function pcsItems(codes, sectionNames, typeNames = new Map()) {
  const catOf = (code) => `${code[0]}${code[2]}`;
  const descPrefixes = new Map();
  for (const r of codes) {
    const k = catOf(r.code);
    if (!descPrefixes.has(k)) descPrefixes.set(k, new Set());
    descPrefixes.get(k).add(r.long_desc.split(' of ')[0]);
  }
  return codes.map((r) => {
    const k = catOf(r.code);
    const names = descPrefixes.get(k);
    const type = typeNames.get(k) ?? (names.size === 1 ? [...names][0] : `tipo ${r.code[2]}`);
    return {
      code: r.code,
      name: r.long_desc,
      lang: 'en',
      category: { scheme: 'icd10pcs-section-type', code: k, display: `${sectionNames.get(r.code[0]) ?? r.code[0]} › ${type}` },
      properties: compact({ pcs_section: { value: r.code[0], meaning: sectionNames.get(r.code[0]) ?? null }, pcs_short_description: r.short_desc && r.short_desc !== r.long_desc ? r.short_desc : null }),
    };
  });
}

/**
 * Designación oficial en castellano para ICD-10-PCS desde CIE-10-ES
 * Procedimientos (Ministerio de Sanidad), que es su traducción oficial y usa
 * los mismos códigos de siete caracteres. Se asigna SÓLO por igualdad exacta de
 * código; lo que no está en CIE-10-ES queda sin designación y se cuenta.
 * @param {Array} records registros de `icd10pcs-cms`
 * @param {Map<string,string>} esByCode código → descripción CIE-10-ES (verbatim)
 * @param {object} prov { edition, url, file, sha256 }
 */
export function addCie10esDesignations(records, esByCode, prov) {
  let added = 0;
  for (const r of records) {
    const es = esByCode.get(r.code);
    if (!es) continue;
    added += 1;
    r.designations = [{ lang: 'es', type: 'preferred', value: es }];
    r.properties.designation_es_source = { source: `CIE-10-ES Procedimientos ${prov.edition} (Ministerio de Sanidad de España)`, rule: 'mismo código ICD-10-PCS', url: prov.url, file: prov.file, sha256: prov.sha256 };
  }
  return { added, missing: records.length - added };
}

/**
 * CUPS de MinSalud Colombia (POS Pópuli): `POSPOPULI-LABORATORIO` + `Procedimiento del PBS`.
 * Sólo códigos CUPS de 6 dígitos: el PBS trae además 811 códigos de 5 dígitos
 * (p. ej. «10101») de otra codificación, que un prefijo podría confundir.
 * `QueEs` es la explicación oficial en lenguaje llano y va como `definition`.
 */
export function cupsItems(labRows, pbsRows, provByDataset = {}) {
  const clean = (v) => (v && v.trim() && v.trim() !== 'Sin dato' ? v.trim() : null);
  const item = (r, dataset) => ({
    ...(provByDataset[dataset] ? { provenance: provByDataset[dataset] } : {}),
    code: r.CodigoCUPS.trim(),
    name: r.Descripcion.trim(),
    display: displayCase(r.Descripcion.replace(/\s+/g, ' ').trim()),
    definition: clean(r.QueEs),
    lang: 'es',
    properties: compact({
      cups_dataset: dataset,
      cups_coverage_pbs: clean(r.CoberturaPlanBeneficiosUPC),
      cups_coverage_detail: clean(r.DetallePlanBeneficiosUPC),
      cups_exclusions_pbs: clean(r.ExclusionesPlanBeneficiosUPC),
      cups_source_row_id: clean(r.CodigoLaboratorio ?? r.CodigoProcedimiento),
    }),
  });
  const sixDigits = (r) => /^\d{6}$/.test((r.CodigoCUPS ?? '').trim());
  return [...labRows.filter(sixDigits).map((r) => item(r, 'POSPOPULI-LABORATORIO')), ...pbsRows.filter(sixDigits).map((r) => item(r, 'Procedimiento del PBS'))];
}

/**
 * Order file oficial de CMS (`icd10pcs_order_<año>.txt`, ancho fijo): orden (5),
 * código (7), válido (1), título abreviado (60), título largo. Sólo `válido = 1`
 * (códigos facturables; los encabezados de tabla son 0).
 */
export function pcsOrderFile(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.length < 78) continue;
    const code = line.slice(6, 13).trim();
    if (line[14] !== '1' || !/^[0-9A-HJ-NP-Z]{7}$/.test(code)) continue;
    out.push({ code, short_desc: line.slice(16, 76).trim(), long_desc: line.slice(77).trim() });
  }
  return out;
}

/** `icd10pcs_tables_<año>.xml` → nombres oficiales de sección (posición 1) y de tipo (posición 3, por sección). */
export function pcsAxisNames(xml) {
  const sections = new Map();
  const types = new Map();
  for (const m of xml.matchAll(/<pcsTable>([\s\S]*?)<\/pcsTable>/g)) {
    const s = m[1].match(/<axis pos="1"[^>]*>\s*<title>[^<]*<\/title>\s*<label code="(.)">([^<]*)<\/label>/);
    const t = m[1].match(/<axis pos="3"[^>]*>\s*<title>[^<]*<\/title>\s*<label code="(.)">([^<]*)<\/label>/);
    if (!s || !t) continue;
    sections.set(s[1], s[2]);
    types.set(`${s[1]}${t[1]}`, t[2]);
  }
  return { sections, types };
}
