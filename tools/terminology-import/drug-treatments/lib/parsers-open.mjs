// =============================================================================
// Parsers de las fuentes abiertas por HTTP → afirmaciones comunes (puros).
//
// Misma convención que `parsers.mjs`: cada parser recibe el texto del archivo
// (ya extraído por fetch-open-sources.mjs) y su procedencia, y devuelve
// `{ assertions, stats }`; `stats` cuenta, por motivo, lo que la fuente trae
// y NO entra como relación. Los códigos son los que publica la fuente; nada se
// deduce por nombre.
// =============================================================================

import { SYSTEM, code, curie, makeAssertion, mergeById, sortedUnique } from './common.mjs';
import { RELATION_TYPES } from './sources.mjs';

export function counter() {
  const map = {};
  return { add: (k, n = 1) => (map[k] = (map[k] ?? 0) + n), value: map };
}

const lines = (text) => text.split(/\r?\n/).filter((l) => l.trim() !== '');

/** TSV con cabecera (sin comillas): filas como objetos. */
export function tsvRows(text) {
  const [head, ...rows] = lines(text);
  const cols = head.split('\t');
  return rows.map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()]));
  });
}

const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
export const decodeXml = (s) =>
  s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : XML_ENTITIES[e],
  );

// --- MED-RT -----------------------------------------------------------------------

const MEDRT_TYPES = { may_treat: 'medrt:may_treat', may_prevent: 'medrt:may_prevent', may_diagnose: 'medrt:may_diagnose', CI_with: 'medrt:CI_with' };

const xmlField = (block, tag) => {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(block);
  return m ? decodeXml(m[1].trim()) : null;
};

/**
 * Una afirmación por (relación, origen, destino MeSH). Origen: ingrediente
 * RxNorm (RxCUI) o clase farmacológica de MED-RT (NUI; `evidence.subjectKind`
 * lo dice: una clase NO es un fármaco). Destino: concepto MeSH (M#); el
 * descriptor D se agrega después por el cruce de MeSH, no acá. Si varias
 * autoridades (MEDRT, FMTSME, FDASPL) afirman lo mismo, se acumulan.
 */
export function parseMedRt(xml, provenance) {
  const stats = counter();
  const out = [];
  const re = /<association>([\s\S]*?)<\/association>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const name = xmlField(block, 'name');
    stats.add('associations');
    const type = MEDRT_TYPES[name];
    if (!type) {
      stats.add(`excluded:association=${name}`);
      continue;
    }
    const fromNs = xmlField(block, 'from_namespace');
    const toNs = xmlField(block, 'to_namespace');
    if (toNs !== 'MeSH') {
      stats.add(`excluded:${name} con destino ${toNs} (no MeSH)`);
      continue;
    }
    const fromCode = xmlField(block, 'from_code');
    const toCode = xmlField(block, 'to_code');
    const drug = fromNs === 'RxNorm' ? code(SYSTEM.RXCUI, fromCode) : fromNs === 'MED-RT' ? code(SYSTEM.MEDRT_NUI, fromCode) : null;
    const condition = code(SYSTEM.MESH_CONCEPT, toCode);
    if (!drug || !condition) {
      stats.add(`excluded:origen ${fromNs} o destino sin código válido`);
      continue;
    }
    const authority = /<name>Authority<\/name>\s*<value>([^<]*)<\/value>/.exec(block)?.[1] ?? null;
    out.push(
      makeAssertion({
        source: 'medrt',
        recordId: `${name}|${fromNs}:${fromCode}|${toCode}`,
        uri: 'https://evs.nci.nih.gov/ftp1/MED-RT/Core_MEDRT_XML.zip',
        type,
        drug: { label: xmlField(block, 'from_name'), codes: [drug] },
        condition: { label: xmlField(block, 'to_name'), codes: [condition] },
        evidence: {
          subjectKind: fromNs === 'RxNorm' ? 'rxnorm-ingredient' : 'medrt-pharmacologic-class',
          authorities: authority ? [authority] : [],
        },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a, b) => ({ ...a, authorities: sortedUnique([...a.authorities, ...b.authorities]) }));
  for (const a of assertions) a.evidence.authorities = sortedUnique(a.evidence.authorities);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

/**
 * concepto M → descriptor D, solo si el concepto es el preferido del descriptor (equivalencia exacta);
 * y encabezado principal (DescriptorName) → descriptor D, solo si el encabezado identifica UN descriptor.
 */
export function meshConceptIndex(text) {
  const byConcept = new Map();
  const byHeading = new Map();
  const seen = new Set();
  let notPreferred = 0;
  for (const r of tsvRows(text)) {
    if (r.preferred_concept === 'Y') byConcept.set(r.concept_ui, r.descriptor_ui);
    else notPreferred++;
    if (r.descriptor_name && !seen.has(r.descriptor_ui)) {
      seen.add(r.descriptor_ui);
      if (!byHeading.has(r.descriptor_name)) byHeading.set(r.descriptor_name, []);
      byHeading.get(r.descriptor_name).push(r.descriptor_ui);
    }
  }
  return { byConcept, byHeading, notPreferred };
}

// --- Cruces a ATC -------------------------------------------------------------------

/** RxClass: RxCUI → códigos ATC nivel 5 (RxClass los publica por RxCUI de ingrediente/combinación). */
export function rxclassAtcIndex(text) {
  const byRxcui = new Map();
  for (const r of tsvRows(text)) {
    const atc = code(SYSTEM.ATC, r.atc_code);
    if (!atc) continue;
    if (!byRxcui.has(r.rxcui)) byRxcui.set(r.rxcui, []);
    byRxcui.get(r.rxcui).push({ ...atc, via: 'rxclass-atc', tty: r.tty });
  }
  return byRxcui;
}

// --- DrugCentral 2027 (volcado) ---------------------------------------------------------

const DC_TYPES = {
  indication: 'drugcentral:indication',
  contraindication: 'drugcentral:contraindication',
  'off-label use': 'drugcentral:off-label-use',
  'symptomatic treatment': 'drugcentral:symptomatic-treatment',
  'reduce risk': 'drugcentral:reduce-risk',
  diagnosis: 'drugcentral:diagnosis',
};

/** struct_id → nombre del fármaco (etiqueta literal de DrugCentral). */
export function drugCentralNames(text) {
  return new Map(tsvRows(text).map((r) => [r.id, r.name]));
}

/**
 * Una afirmación por (fármaco, UMLS CUI, tipo de relación). Las filas que repiten el par con otro
 * concepto OMOP acumulan nombres y tipos semánticos. Sin UMLS CUI no hay código de enfermedad:
 * la fila se cuenta y se excluye (el SNOMED CT ya no viene en el extracto).
 */
export function parseDrugCentral(relationshipsText, namesText, provenance) {
  const stats = counter();
  const names = drugCentralNames(namesText);
  const out = [];
  for (const r of tsvRows(relationshipsText)) {
    stats.add('rows');
    const type = DC_TYPES[r.relationship_name];
    if (!type) {
      stats.add(`excluded:relationship_name=${r.relationship_name || '(vacío)'}`);
      continue;
    }
    const drug = code(SYSTEM.DRUGCENTRAL, r.struct_id);
    const condition = code(SYSTEM.UMLS, r.umls_cui);
    if (!drug || !condition) {
      stats.add('excluded:fila sin UMLS CUI (la enfermedad no tiene código que se pueda cargar)');
      continue;
    }
    out.push(
      makeAssertion({
        source: 'drugcentral',
        recordId: `${r.struct_id}|${condition.code}|${r.relationship_name}`,
        uri: `https://drugcentral.org/drugcard/${r.struct_id}`,
        type,
        drug: { label: names.get(r.struct_id) || null, codes: [drug] },
        condition: { label: r.concept_name, codes: [condition] },
        evidence: { conceptNames: [r.concept_name], cuiSemanticTypes: r.cui_semantic_type ? [r.cui_semantic_type] : [], omopConceptIds: [r.concept_id] },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a, b) => ({
    conceptNames: sortedUnique([...a.conceptNames, ...b.conceptNames]),
    cuiSemanticTypes: sortedUnique([...a.cuiSemanticTypes, ...b.cuiSemanticTypes]),
    omopConceptIds: sortedUnique([...a.omopConceptIds, ...b.omopConceptIds]),
  }));
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

const DC_ID_SYSTEMS = { RXNORM: SYSTEM.RXCUI, DRUGBANK_ID: SYSTEM.DRUGBANK, ChEMBL_ID: SYSTEM.CHEMBL, UNII: SYSTEM.UNII, MESH_DESCRIPTOR_UI: SYSTEM.MESH, MESH_SUPPLEMENTAL_RECORD_UI: SYSTEM.MESH, CHEBI: SYSTEM.CHEBI };

/** struct_id → códigos que DrugCentral publica para el fármaco (tabla identifier del volcado 2027). */
export function drugCentralIdentifiers2027(text) {
  const byDrug = new Map();
  for (const r of tsvRows(text)) {
    const system = DC_ID_SYSTEMS[r.id_type];
    if (!system) continue;
    const c = code(system, system === SYSTEM.CHEBI ? r.identifier.replace(/^CHEBI:/, '') : r.identifier);
    if (!c) continue;
    if (!byDrug.has(r.struct_id)) byDrug.set(r.struct_id, []);
    byDrug.get(r.struct_id).push(c);
  }
  return byDrug;
}

/** `DRUGCENTRAL:<struct_id>` → ATC nivel 5 (struct2atc). */
export function drugCentralAtcIndex(text) {
  const map = new Map();
  for (const r of tsvRows(text)) {
    const atc = code(SYSTEM.ATC, r.atc_code);
    if (!atc) continue;
    const key = `DRUGCENTRAL:${r.struct_id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(atc);
  }
  return map;
}

// --- WHO eEML (páginas /recommendations/N) ---------------------------------------------------

const stripTags = (html) => decodeXml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/**
 * Extrae de UNA página de recomendación del eEML los campos estructurados que usa la carga:
 * medicamento, códigos ATC (los que publica el propio eEML), secciones, lista (EML/EMLc), tipo de lista,
 * indicación (texto literal) y códigos ICD-11 MMS. NO se guardan formulaciones ni concentraciones.
 */
export function parseEemlPage(html, recommendationId) {
  const medicine = /<div class="medicine-title" title="([^"]*)">\s*<a title="[^"]*" href="https:\/\/list\.essentialmeds\.org\/medicines\/(\d+)">\s*([^<]*?)\s*<\/a>/.exec(html);
  const sections = [...html.matchAll(/<a class="section-link"[^>]*>\s*<span>([\s\S]*?)<\/span>/g)].map((m) => stripTags(m[1]));
  const header = /<div class="decision-data">([\s\S]*?)<div class="header-data">/.exec(html)?.[1] ?? '';
  const atc = [...header.matchAll(/code=([A-Z]\d{2}[A-Z]{2}\d{2})"/g)].map((m) => m[1]);
  const lists = [...header.matchAll(/<div class="decision-data-item (emlc?)">/gi)].map((m) => m[1].toUpperCase());
  const indication = /<div class="inidication-text">\s*<span>([\s\S]*?)<\/span>/.exec(html);
  const icd = [...html.matchAll(/<a class="icd-link" href="([^"]*)"[^>]*>\s*([^<\s][^<]*?)\s*<\/a>/g)].map((m) => ({ code: m[2], entity: /icd\/entity\/(\d+)/.exec(m[1])?.[1] ?? null }));
  const rows = {};
  for (const m of html.matchAll(/<div class="label-cell">([\s\S]*?)<\/div>\s*<div class="content-cell">([\s\S]*?)<\/div>\s*<\/div>/g)) rows[stripTags(m[1])] = stripTags(m[2]);
  return {
    recommendationId: String(recommendationId),
    medicineId: medicine?.[2] ?? null,
    medicineName: medicine ? decodeXml(medicine[3]) : null,
    sections,
    atc: [...new Set(atc)],
    lists: [...new Set(lists)],
    recommendationClass: /<div class="recommendation-header ([a-z ]*?)">/.exec(html)?.[1]?.trim() ?? null,
    indication: indication ? stripTags(indication[1]) : null,
    icd11: icd,
    listType: rows['List type'] ?? null,
    medicineType: rows['Medicine type'] ?? null,
    statusHistory: (rows['EML status history'] ?? '').replace(/\(\s*TRS\s+\d+\s*\)/g, '').replace(/\s+/g, ' ').trim() || null,
  };
}

/** Una afirmación por (medicamento, indicación con ICD-11). Sin código ICD-11 o sin ATC no hay código que cargar. */
export function parseEeml(ndjson, provenance) {
  const stats = counter();
  const out = [];
  for (const line of lines(ndjson)) {
    const r = JSON.parse(line);
    stats.add('recommendations');
    const atcs = (r.atc ?? []).map((a) => code(SYSTEM.ATC, a)).filter(Boolean);
    const icd = (r.icd11 ?? []).map((i) => code(SYSTEM.ICD11MMS, i.code)).filter(Boolean);
    if (atcs.length === 0) {
      stats.add('excluded:sin código ATC (p. ej. medicamento sin ATC asignado)');
      continue;
    }
    if (icd.length === 0) {
      stats.add('excluded:indicación sin código ICD-11 (categoría/grupo terapéutico, no una enfermedad)');
      continue;
    }
    out.push(
      makeAssertion({
        source: 'eeml',
        recordId: String(r.recommendationId),
        uri: `https://list.essentialmeds.org/recommendations/${r.recommendationId}`,
        type: 'eeml:recommendation',
        drug: { label: r.medicineName, codes: atcs },
        condition: { label: r.indication, codes: icd },
        evidence: {
          medicineId: r.medicineId,
          sections: r.sections,
          lists: r.lists,
          listType: r.listType,
          medicineType: r.medicineType,
          statusHistory: r.statusHistory,
          icd11Entities: (r.icd11 ?? []).map((i) => i.entity).filter(Boolean),
        },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a) => a);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- CIViC (evidencia predictiva aceptada) -------------------------------------------------

const CIVIC_DIRECTION = { SUPPORTS: 'supports', DOES_NOT_SUPPORT: 'does-not-support' };
const CIVIC_SIGNIFICANCE = { SENSITIVITYRESPONSE: 'sensitivity-response', RESISTANCE: 'resistance', REDUCED_SENSITIVITY: 'reduced-sensitivity', ADVERSE_RESPONSE: 'adverse-response' };

/**
 * Una afirmación por (evidencia, terapia). Terapias en COMBINACIÓN: el fármaco es el conjunto de NCIt;
 * en SUBSTITUTES (o sin tipo de interacción con varias), cada terapia es una afirmación aparte.
 * Siempre CONDICIONADA al perfil molecular de la evidencia (polaridad `conditional`).
 */
export function parseCivic(ndjson, provenance) {
  const stats = counter();
  const out = [];
  for (const line of lines(ndjson)) {
    const e = JSON.parse(line);
    stats.add('evidence items');
    const dir = CIVIC_DIRECTION[e.evidenceDirection];
    const sig = CIVIC_SIGNIFICANCE[e.significance];
    if (!dir || !sig) {
      stats.add(`excluded:direction=${e.evidenceDirection}/significance=${e.significance}`);
      continue;
    }
    const condition = e.disease?.doid ? code(SYSTEM.DOID, e.disease.doid) : null;
    if (!condition) {
      stats.add('excluded:enfermedad sin DOID');
      continue;
    }
    const therapies = (e.therapies ?? []).map((t) => ({ ...t, code: t.ncitId ? code(SYSTEM.NCIT, t.ncitId) : null }));
    if (therapies.length === 0 || therapies.some((t) => !t.code)) {
      stats.add(therapies.length === 0 ? 'excluded:evidencia sin terapia' : 'excluded:terapia sin código NCIt');
      continue;
    }
    const interaction = e.therapyInteractionType ?? null;
    if (interaction !== 'COMBINATION' && interaction !== 'SUBSTITUTES' && therapies.length > 1) {
      // SEQUENTIAL (A y después B) o varias terapias sin tipo de interacción: no es ni el conjunto ni cada una por separado.
      stats.add(`excluded:${therapies.length} terapias con interacción ${interaction ?? '(sin tipo)'}`);
      continue;
    }
    const units = interaction === 'COMBINATION' ? [therapies] : therapies.map((t) => [t]);
    for (const unit of units) {
      const codes = unit.map((t) => t.code);
      out.push(
        makeAssertion({
          source: 'civic',
          recordId: `${e.id}|${codes.map((c) => c.code).sort().join('+')}`,
          uri: `https://civicdb.org/links/evidence_items/${e.id}`,
          type: `civic:predictive-${dir}-${sig}`,
          drug: { label: unit.map((t) => t.name).join(' + '), codes, combination: unit.length > 1 },
          condition: { label: e.disease.name, codes: [condition] },
          evidence: {
            evidenceItem: e.name,
            molecularProfile: e.molecularProfile ? { id: e.molecularProfile.id, name: e.molecularProfile.name } : null,
            evidenceLevel: e.evidenceLevel,
            evidenceRating: e.evidenceRating ?? null,
            therapyInteractionType: e.therapyInteractionType ?? null,
            variantOrigin: e.variantOrigin ?? null,
            citation: e.source ? `${e.source.sourceType}:${e.source.citationId}` : null,
            conditionalOnMolecularProfile: true,
          },
          provenance,
        }),
      );
    }
  }
  const assertions = mergeById(out, (a) => a);
  for (const a of assertions) a.drug.combination = a.drug.codes.length > 1;
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- ChEMBL drug_indication -------------------------------------------------------------------

/**
 * Una afirmación por registro `drug_indication` (drugind_id). Tipo = fase máxima que publica ChEMBL
 * (4 = aprobada; menor = en estudio). Fármaco: ChEMBL de la molécula y de su padre. Enfermedad: MeSH y
 * EFO/MONDO/Orphanet/HP tal cual los publica la fila. Las referencias se conservan (tipo e id).
 */
export function parseChembl(ndjson, provenance) {
  const stats = counter();
  const out = [];
  for (const line of lines(ndjson)) {
    const r = JSON.parse(line);
    stats.add('rows');
    const phase = r.max_phase_for_ind == null || r.max_phase_for_ind === '' ? 'null' : Number(r.max_phase_for_ind) === -1 ? 'unknown' : String(Number(r.max_phase_for_ind));
    const type = `chembl:indication-phase-${phase}`;
    if (!RELATION_TYPES[type]) {
      stats.add(`excluded:max_phase_for_ind=${r.max_phase_for_ind} (sin tipo declarado)`);
      continue;
    }
    const drugCodes = [code(SYSTEM.CHEMBL, r.parent_molecule_chembl_id), code(SYSTEM.CHEMBL, r.molecule_chembl_id)].filter(Boolean);
    const conditionCodes = [r.mesh_id ? code(SYSTEM.MESH, r.mesh_id) : null, r.efo_id ? curie(r.efo_id) : null].filter(Boolean);
    if (drugCodes.length === 0 || conditionCodes.length === 0) {
      stats.add('excluded:fila sin código de fármaco o de enfermedad');
      continue;
    }
    if (r.efo_id && !curie(r.efo_id)) stats.add(`note:efo_id con prefijo no cargado (${String(r.efo_id).split(':')[0]})`);
    out.push(
      makeAssertion({
        source: 'chembl',
        recordId: String(r.drugind_id),
        uri: `https://www.ebi.ac.uk/chembl/explore/compound/${r.parent_molecule_chembl_id ?? r.molecule_chembl_id}`,
        type,
        drug: { label: null, codes: drugCodes },
        condition: { label: r.mesh_heading ?? r.efo_term ?? null, codes: conditionCodes },
        evidence: {
          drugIndicationId: r.drugind_id,
          maxPhaseForIndication: r.max_phase_for_ind == null ? null : Number(r.max_phase_for_ind),
          meshHeading: r.mesh_heading ?? null,
          efoTerm: r.efo_term ?? null,
          references: (r.indication_refs ?? []).map((x) => ({ type: x.ref_type, id: x.ref_id })),
        },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a) => a);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

/** `CHEMBL…` → ATC nivel 5 (molecule.atc_classifications). */
export function chemblAtcIndex(text) {
  const map = new Map();
  for (const r of tsvRows(text)) {
    const atc = code(SYSTEM.ATC, r.atc_code);
    if (!atc) continue;
    const key = `CHEMBL:${r.chembl_id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(atc);
  }
  return map;
}

// --- EMA (informe de medicamentos) ---------------------------------------------------------------------

/**
 * Una afirmación por (medicamento humano AUTORIZADO, área terapéutica). Fármaco: códigos ATC que publica la
 * propia fila (solo los de nivel 5). Enfermedad: el encabezado MeSH tal cual lo publica la EMA
 * (`MESH_HEADING`); el descriptor D se agrega después, y solo si el encabezado es EXACTAMENTE el nombre de
 * un único descriptor (cruce por texto declarado como tal en `crosswalk`).
 */
export function parseEma(text, provenance) {
  const stats = counter();
  const out = [];
  for (const r of tsvRows(text)) {
    stats.add('rows');
    if (r.Category !== 'Human') {
      stats.add(`excluded:Category=${r.Category}`);
      continue;
    }
    if (r['Medicine status'] !== 'Authorised') {
      stats.add(`excluded:Medicine status=${r['Medicine status']} (no afirma un tratamiento vigente)`);
      continue;
    }
    const atcs = r['ATC code (human)'].split(';').map((a) => code(SYSTEM.ATC, a.trim())).filter(Boolean);
    const areas = r['Therapeutic area (MeSH)'].split(';').map((a) => a.trim()).filter(Boolean);
    if (atcs.length === 0) {
      stats.add('excluded:sin código ATC de nivel 5');
      continue;
    }
    if (areas.length === 0) {
      stats.add('excluded:sin área terapéutica (MeSH)');
      continue;
    }
    for (const area of areas) {
      out.push(
        makeAssertion({
          source: 'ema',
          recordId: `${r['EMA product number']}|${area}`,
          uri: r['Medicine URL'] || 'https://www.ema.europa.eu/en/medicines',
          type: 'ema:therapeutic-area-authorised',
          drug: { label: r['Active substance'] || r['International non-proprietary name (INN) / common name'] || null, codes: atcs },
          condition: { label: area, codes: [{ system: SYSTEM.MESH_HEADING, code: area }] },
          evidence: { productNumber: r['EMA product number'], medicineName: r['Name of medicine'], inn: r['International non-proprietary name (INN) / common name'] || null, status: r['Medicine status'] },
          provenance,
        }),
      );
    }
  }
  const assertions = mergeById(out, (a) => a);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- Open Targets (informes de la EMA) ----------------------------------------------------------------------

const otDisease = (id) => (id ? curie(String(id).replace('_', ':')) : null);

/** Una afirmación por (informe APPROVAL, enfermedad); varios fármacos en el informe = combinación (el conjunto). */
export function parseOpenTargetsEma(ndjson, provenance) {
  const stats = counter();
  const out = [];
  for (const line of lines(ndjson)) {
    const r = JSON.parse(line);
    stats.add('reports');
    // Solo lo autorizado: WITHDRAWAL, PREAPPROVAL, etc. no afirman un tratamiento vigente (igual que el filtro «Authorised» de la EMA).
    if (r.clinicalStage !== 'APPROVAL') {
      stats.add(`excluded:clinicalStage=${r.clinicalStage} (no es APPROVAL)`);
      continue;
    }
    const drugs = (r.drugs ?? []).map((d) => code(SYSTEM.CHEMBL, d.drugId));
    if (drugs.length === 0 || drugs.some((d) => d === null)) {
      stats.add('excluded:informe sin drugId ChEMBL válido');
      continue;
    }
    for (const d of r.diseases ?? []) {
      const condition = otDisease(d.diseaseId);
      if (!condition) {
        stats.add(`excluded:diseaseId sin sistema cargado (${String(d.diseaseId).split('_')[0]})`);
        continue;
      }
      out.push(
        makeAssertion({
          source: 'opentargets',
          recordId: `${r.id}|${drugs.map((x) => x.code).sort().join('+')}|${d.diseaseId}`,
          uri: r.url || 'https://platform.opentargets.org/',
          type: 'opentargets:ema-human-drugs-indication',
          drug: { label: (r.drugs ?? []).map((x) => x.drugFromSource).join(' + '), codes: drugs, combination: drugs.length > 1 },
          condition: { label: d.diseaseFromSource ?? null, codes: [condition] },
          evidence: { clinicalReportId: r.id, clinicalStage: r.clinicalStage, origin: r.origin, source: r.source, year: r.year ?? null },
          provenance,
        }),
      );
    }
  }
  const assertions = mergeById(out, (a) => a);
  for (const a of assertions) a.drug.combination = a.drug.codes.length > 1;
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- Wikidata (P2175 / P2176) -----------------------------------------------------------------------

/** Códigos que publica un ítem de Wikidata, por lado. Los que no tienen la forma del sistema se descartan. */
function wikidataDrugCodes(ids) {
  const pick = (prop, system, f = (v) => v) => (ids[prop] ?? []).map((v) => code(system, f(v))).filter(Boolean);
  return {
    pharma: [...pick('P3345', SYSTEM.RXCUI), ...pick('P592', SYSTEM.CHEMBL), ...pick('P715', SYSTEM.DRUGBANK), ...pick('P652', SYSTEM.UNII), ...pick('P267', SYSTEM.ATC)],
    other: [...pick('P486', SYSTEM.MESH), ...pick('P683', SYSTEM.CHEBI, (v) => v.replace(/^CHEBI:/, ''))],
  };
}

function wikidataConditionCodes(ids) {
  const pick = (prop, system, f = (v) => v) => (ids[prop] ?? []).map((v) => code(system, f(v))).filter(Boolean);
  return [
    ...pick('P486', SYSTEM.MESH),
    ...(ids.P699 ?? []).map((v) => curie(/^DOID:/.test(v) ? v : `DOID:${v}`)).filter(Boolean),
    ...(ids.P5270 ?? []).map((v) => code(SYSTEM.MONDO, String(v).replace(/^MONDO:/, ''))).filter(Boolean),
    ...pick('P2892', SYSTEM.UMLS),
    ...pick('P494', SYSTEM.ICD10WHO),
    ...pick('P4229', SYSTEM.ICD10CM),
    ...pick('P7329', SYSTEM.ICD11MMS),
    ...pick('P492', SYSTEM.OMIM),
    ...pick('P1550', SYSTEM.ORPHA),
    ...pick('P1748', SYSTEM.NCIT),
  ];
}

const wikidataItems = (idsNdjson) => new Map(lines(idsNdjson).map((l) => JSON.parse(l)).map((e) => [e.qid, e]));

/**
 * Una afirmación por declaración de Wikidata. P2176 está en la ENFERMEDAD (objeto = fármaco o terapia) y
 * P2175 en el FÁRMACO (objeto = enfermedad). Rango «deprecated» = declaración que la comunidad marca como
 * errónea: se excluye. El «fármaco» exige al menos un identificador farmacéutico (RxNorm, ChEMBL, DrugBank,
 * UNII o ATC): una terapia sin ninguno (cirugía, dieta…) no entra.
 */
export function parseWikidata(statementsNdjson, idsNdjson, provenance) {
  const stats = counter();
  const items = wikidataItems(idsNdjson);
  const out = [];
  for (const line of lines(statementsNdjson)) {
    const st = JSON.parse(line);
    stats.add(`statements ${st.property}`);
    if (st.rank === 'DeprecatedRank') {
      stats.add('excluded:rango deprecated');
      continue;
    }
    const drugQ = st.property === 'P2176' ? st.object : st.subject;
    const condQ = st.property === 'P2176' ? st.subject : st.object;
    const drugItem = items.get(drugQ);
    const condItem = items.get(condQ);
    if (!drugItem || !condItem) {
      stats.add('excluded:ítem sin datos');
      continue;
    }
    const dc = wikidataDrugCodes(drugItem.ids);
    if (dc.pharma.length === 0) {
      stats.add('excluded:fármaco/terapia sin identificador farmacéutico (RxNorm, ChEMBL, DrugBank, UNII, ATC)');
      continue;
    }
    const cc = wikidataConditionCodes(condItem.ids);
    if (cc.length === 0) {
      stats.add('excluded:enfermedad sin código (MeSH, DOID, MONDO, UMLS, ICD, OMIM, Orphanet, NCIt)');
      continue;
    }
    out.push(
      makeAssertion({
        source: 'wikidata',
        recordId: `${st.property}|${st.statement}`,
        uri: `https://www.wikidata.org/wiki/${st.subject}`,
        type: `wikidata:${st.property}`,
        drug: { label: drugItem.label, codes: [...dc.pharma, ...dc.other] },
        condition: { label: condItem.label, codes: cc },
        evidence: { drugItem: drugQ, conditionItem: condQ, rank: st.rank, statedIn: st.statedIn, drugInstanceOf: drugItem.instanceOf },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a) => a);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

/**
 * Wikidata: código de fármaco → ATC (P267) del MISMO ítem. Un código que aparece en ítems con ATC distintos
 * (más de un ítem) es ambiguo y no se usa.
 */
export function wikidataAtcIndex(idsNdjson) {
  const owner = new Map(); // codeKey → Set(qid)
  const atcOf = new Map(); // codeKey → [ATC]
  for (const e of wikidataItems(idsNdjson).values()) {
    const atcs = (e.ids.P267 ?? []).map((v) => code(SYSTEM.ATC, v)).filter(Boolean);
    if (atcs.length === 0) continue;
    const keys = [
      ...(e.ids.P3345 ?? []).map((v) => code(SYSTEM.RXCUI, v)),
      ...(e.ids.P592 ?? []).map((v) => code(SYSTEM.CHEMBL, v)),
      ...(e.ids.P715 ?? []).map((v) => code(SYSTEM.DRUGBANK, v)),
      ...(e.ids.P652 ?? []).map((v) => code(SYSTEM.UNII, v)),
      ...(e.ids.P486 ?? []).map((v) => code(SYSTEM.MESH, v)),
    ].filter(Boolean);
    for (const k of keys) {
      const key = `${k.system}:${k.code}`;
      if (!owner.has(key)) owner.set(key, new Set());
      owner.get(key).add(e.qid);
      atcOf.set(key, atcs);
    }
  }
  const map = new Map();
  for (const [key, qs] of owner) if (qs.size === 1) map.set(key, atcOf.get(key));
  return { map, ambiguous: owner.size - map.size };
}

// --- ClinicalTrials.gov ----------------------------------------------------------------------------------

const CT_PHASE_ORDER = ['EARLY_PHASE1', 'PHASE1', 'PHASE1/PHASE2', 'PHASE2', 'PHASE2/PHASE3', 'PHASE3', 'PHASE4'];

/**
 * Una afirmación por (término MeSH de intervención, término MeSH de condición): «figuran juntos en N estudios
 * registrados». Solo los términos MeSH que ClinicalTrials.gov asigna a cada estudio (no se cruzan nombres).
 * La relación es a nivel de estudio: un estudio con varias intervenciones y condiciones aporta todos los pares,
 * y por eso el tipo es «en estudio», nunca una indicación. Evidencia: estudios (NCT), fases y estados.
 */
export function parseClinicalTrials(ndjson, provenance) {
  const stats = counter();
  const pairs = new Map();
  for (const line of lines(ndjson)) {
    const st = JSON.parse(line);
    stats.add('studies');
    if (st.c.length === 0 || st.i.length === 0) {
      stats.add(`excluded:estudio sin ${st.c.length === 0 ? 'término MeSH de condición' : 'término MeSH de intervención'}`);
      continue;
    }
    const phase = st.p.length ? st.p.join('/') : 'NA';
    for (const [iid, iterm] of st.i) {
      for (const [cid, cterm] of st.c) {
        const key = `${iid}|${cid}`;
        let e = pairs.get(key);
        if (!e) pairs.set(key, (e = { iid, iterm, cid, cterm, nct: [], phases: {}, status: {} }));
        e.nct.push(st.n);
        e.phases[phase] = (e.phases[phase] ?? 0) + 1;
        const status = st.s ?? 'UNKNOWN';
        e.status[status] = (e.status[status] ?? 0) + 1;
      }
    }
  }
  const out = [];
  for (const e of pairs.values()) {
    const drug = code(SYSTEM.MESH, e.iid);
    const condition = code(SYSTEM.MESH, e.cid);
    if (!drug || !condition) {
      stats.add('excluded:identificador MeSH con forma inesperada');
      continue;
    }
    const maxPhase = [...Object.keys(e.phases)].flatMap((p) => p.split('/')).map((p) => CT_PHASE_ORDER.indexOf(p)).reduce((m, i) => Math.max(m, i), -1);
    out.push(
      makeAssertion({
        source: 'clinicaltrials',
        recordId: `${e.iid}|${e.cid}`,
        uri: `https://clinicaltrials.gov/search?intr=${encodeURIComponent(e.iterm)}&cond=${encodeURIComponent(e.cterm)}`,
        type: 'clinicaltrials:studied-in-registered-study',
        drug: { label: e.iterm, codes: [drug] },
        condition: { label: e.cterm, codes: [condition] },
        evidence: {
          studyCount: e.nct.length,
          nctIds: e.nct.sort(),
          phases: Object.fromEntries(Object.entries(e.phases).sort()),
          overallStatus: Object.fromEntries(Object.entries(e.status).sort()),
          maxPhase: maxPhase >= 0 ? CT_PHASE_ORDER[maxPhase] : null,
        },
        provenance,
      }),
    );
  }
  stats.add('assertions', out.length);
  return { assertions: out, stats: stats.value };
}

export { curie };
