// Plan de carga del catálogo de estudios (puro, sin base): de los JSON versionados
// a las tuplas de `terminology.*`. Separado del ejecutor para probarlo sin
// Postgres y para el dry-run.
//
// Ids deterministas, mismo patrón que tools/terminology-import/:
//   estudio / componente  md5('mantra:mantra-core-internal:<código>')
//   fuente, relación, evidencia, propiedad, designación  md5('mantra:study-catalog:<clase>:…')
// Los conceptos que siembra el arranque de la API (modalidades, regiones, tipos
// de relación) usan `deterministicId('study_catalog:<NOMBRE>')`, igual que
// `defineModuleConcepts`.
//
// Dirección de `part-of`: componente → panel (origen = miembro), la misma que
// escribe el cargador LOINC (lab-tests/lib/loinc.mjs: `relations` del miembro
// apuntan al panel), con `ordinal` = posición en el panel.

import { deterministicId } from '../../terminology-import/lib/glossary-es/common.mjs';
import { md5uuid } from '../../terminology-import/lib/glossary-es/load-plan.mjs';
import { classify } from './catalogs.mjs';

export const INTERNAL_SYSTEM = 'mantra-core-internal';
export const STUDY_VALUE_SET = 'service-request-code';
export const VALUE_SET_ORDINAL_BASE = 1000;

/** Conceptos del arranque de la API que el cargador necesita. */
export const BOOT = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  LANG_ES: deterministicId('terminology:language:es'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_PART_OF: deterministicId('terminology:relationship:part-of'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
  REL_HAS_MODALITY: deterministicId('study_catalog:REL_HAS_MODALITY'),
  REL_HAS_BODY_SITE: deterministicId('study_catalog:REL_HAS_BODY_SITE'),
  REL_SUGGESTED_SPECIMEN: deterministicId('study_catalog:REL_SUGGESTED_SPECIMEN'),
};
export const modalityId = (c) => deterministicId(`study_catalog:MODALITY_${c}`);
export const regionId = (c) => deterministicId(`study_catalog:REGION_${c}`);

export const valueSetVersionId = (code) => deterministicId(`seed:value-set-version:${code}:1`);
export const valueSetMemberId = (code, conceptId) => deterministicId(`seed:value-set-member:${code}:${conceptId}`);

const conceptIdFor = (code) => md5uuid(`mantra:${INTERNAL_SYSTEM}:${code}`);
const sourceIdFor = (id) => md5uuid(`mantra:study-catalog:source:${id}`);
const propertyIdFor = (code, prop) => md5uuid(`mantra:study-catalog:property:${code}:${prop}`);
const designationIdFor = (code, kind, i) => md5uuid(`mantra:study-catalog:designation:es:${kind}:${code}:${i}`);
const relationIdFor = (type, source, target) => md5uuid(`mantra:study-catalog:rel:${type}:${source}:${target}`);
const evidenceIdFor = (rel, source) => md5uuid(`mantra:study-catalog:evidence:${rel}:${source}`);

const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)));
const dataTypeOf = (v) => (typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'decimal') : typeof v === 'string' ? 'string' : 'json');
const splitSources = (f) => [...new Set([].concat(f ?? []).flatMap((x) => String(x).split(';')).map((x) => x.trim()).filter(Boolean))];

/**
 * @param cat      resultado de readCatalogs()
 * @param existing Map código interno → id, de los conceptos LAB_ e IMG_ ya sembrados
 * @param specimenByHl7 Map código HL7 0487 → id del concepto de `specimen-type`
 */
export function buildPlan(cat, existing, specimenByHl7) {
  const { lab, img, reg, sha256 } = cat;
  const { pending, labSeed, imgSeed } = classify(cat);
  const version = lab.version;
  if (img.version !== version) throw new Error(`versiones distintas: laboratorio ${version}, imagenología ${img.version}`);

  const plan = {
    sources: new Map(), concepts: new Map(), designations: [], properties: [],
    relationships: new Map(), evidence: [], valueSetMembers: [], omitted: pending, notes: [], reused: [],
  };

  const fuentes = new Map([...lab.fuentes.map((f) => [f.id, { ...f, file: 'laboratorio.json' }]), ...img.fuentes.map((f) => [f.id, { ...f, file: 'imagenologia.json' }])]);
  const sourceOf = (id) => {
    const f = fuentes.get(id);
    if (!f) throw new Error(`fuente no declarada: ${id}`);
    if (!plan.sources.has(id)) plan.sources.set(id, { id: sourceIdFor(id), code: `study-catalog:${id}`, name: f.nombre, url: f.url ?? null });
    return plan.sources.get(id);
  };

  const addProps = (conceptId, code, props) => {
    for (const [k, v] of Object.entries(compact(props))) plan.properties.push([propertyIdFor(code, k), conceptId, k, dataTypeOf(v), JSON.stringify(v)]);
  };
  const addNames = (conceptId, code, nombre, sinonimos, isExisting) => {
    plan.designations.push([designationIdFor(code, isExisting ? 'catalog-name' : 'preferred', 0), conceptId, BOOT.LANG_ES, isExisting ? BOOT.DESIG_SYNONYM : BOOT.DESIG_PREFERRED, nombre, !isExisting]);
    (sinonimos ?? []).forEach((s, i) => plan.designations.push([designationIdFor(code, 'synonym', i), conceptId, BOOT.LANG_ES, BOOT.DESIG_SYNONYM, s, false]));
  };
  const addRel = (type, typeId, source, target, ordinal, srcIds, file, locator) => {
    const id = relationIdFor(type, source, target);
    if (plan.relationships.has(id)) throw new Error(`relación repetida ${type} ${source} -> ${target}`);
    const ids = splitSources(srcIds);
    if (ids.length === 0) throw new Error(`relación sin fuente: ${type} ${source} -> ${target}`);
    plan.relationships.set(id, { id, source, target, typeId, ordinal, evidenceCount: ids.length });
    for (const sid of ids) {
      const s = sourceOf(sid);
      plan.evidence.push({ id: evidenceIdFor(id, s.id), relationshipId: id, sourceId: s.id, sourceReference: `${file}@${version}`, citationText: locator, citationLocator: sid });
    }
  };
  const fileOf = { LAB: 'laboratorio.json', IMG: 'imagenologia.json' };

  // --- regiones, modalidades, contrastes: sus conceptos los siembra el arranque; acá van propiedades y jerarquía ---
  const reg3d = new Map(reg.regiones.map((r) => [r.region, r]));
  for (const r of img.regiones) {
    const cid = regionId(r.codigo);
    const m = reg3d.get(r.codigo);
    addProps(cid, `IMG_REGION_${r.codigo}`, {
      study_catalog_code: r.codigo, region_type: r.tipo, laterality_admitted: r.admite_lateralidad, laterality_source: r.lateralidad_fuente,
      dicom_body_part: r.dicom_body_part, snomed_code: r.snomed, snomed_display: r.snomed_display,
      uberon_region: m?.uberon_region ?? null, catalog_version: version, source_ids: splitSources(r.fuente), note: r.nota,
    });
    if (r.padre) addRel('is-a', BOOT.REL_IS_A, cid, regionId(r.padre), null, r.fuente, fileOf.IMG, `región ${r.codigo} is-a ${r.padre}`);
  }
  for (const m of img.modalidades) {
    const cid = modalityId(m.codigo);
    addProps(cid, `IMG_MODALITY_${m.codigo}`, { study_catalog_code: m.codigo, dicom_modality: m.dicom, dicom_alternatives: m.dicom_alternativos, catalog_version: version, source_ids: splitSources(m.fuente) });
    (m.sinonimos ?? []).forEach((s, i) => plan.designations.push([designationIdFor(`IMG_MODALITY_${m.codigo}`, 'synonym', i), cid, BOOT.LANG_ES, BOOT.DESIG_SYNONYM, s, false]));
  }

  const studyConcept = (code, existingCode, display, selectable) => {
    const reuse = existingCode ? existing.get(existingCode) : null;
    if (existingCode && !reuse) throw new Error(`el concepto existente ${existingCode} no está sembrado: arrancar la API una vez antes de cargar`);
    const id = reuse ?? conceptIdFor(code);
    if (reuse) plan.reused.push(`${code} -> ${existingCode}`);
    else plan.concepts.set(id, { id, code, display, selectable });
    return { id, reused: Boolean(reuse) };
  };
  const sha = (f) => sha256[f];

  // --- laboratorio ---
  const secciones = new Map(lab.secciones.map((s) => [s.codigo, s]));
  const muestras = new Map(lab.muestras.map((m) => [m.codigo, m]));
  for (const a of labSeed) {
    const { id, reused } = studyConcept(a.codigo, a.codigo_api_existente, a.nombre, true);
    const mu = muestras.get(a.muestra);
    addNames(id, a.codigo, a.nombre, a.sinonimos, reused);
    addProps(id, a.codigo, {
      study_family: 'LAB', study_catalog_code: a.codigo, legacy_code: a.codigo_api_existente, is_panel: a.es_panel, section: secciones.get(a.seccion) && { codigo: a.seccion, nombre: secciones.get(a.seccion).nombre },
      specimen: mu && compact({ codigo: mu.codigo, nombre: mu.nombre, snomed: mu.snomed, snomed_nombre: mu.snomed_nombre, hl7_0487: mu.hl7_0487, nota: mu.nota }),
      fasting: a.ayuno, fasting_source: a.ayuno_fuente, turnaround_hours: a.tiempo_entrega_horas,
      loinc_code: a.loinc, loinc_name: a.loinc_nombre, note: a.nota,
      catalog_version: version, source_ids: splitSources(a.fuente), source_file: 'laboratorio.json', source_file_sha256: sha('laboratorio.json'),
    });
    const spec = mu?.hl7_0487 ? specimenByHl7.get(a.muestra === 'ORINA_24H' ? 'UR24' : mu.hl7_0487) : null;
    if (spec) addRel('suggested-specimen', BOOT.REL_SUGGESTED_SPECIMEN, id, spec, null, a.fuente, 'laboratorio.json', `análisis ${a.codigo} muestra ${a.muestra}`);
    if (!reused) plan.valueSetMembers.push(id);
    a.componentes.forEach((c, i) => {
      const code = `${a.codigo}.${c.codigo}`;
      const comp = studyConcept(code, null, c.nombre, false);
      addNames(comp.id, code, c.nombre, [], false);
      addProps(comp.id, code, {
        study_family: 'LAB', study_component: true, selected_by_default: c.seleccionado_por_defecto, unit_ucum: c.unidad,
        loinc_code: c.loinc, loinc_name: c.loinc_nombre, catalog_version: version, source_ids: splitSources(a.fuente), source_file: 'laboratorio.json', source_file_sha256: sha('laboratorio.json'),
      });
      addRel('part-of', BOOT.REL_PART_OF, comp.id, id, i + 1, a.fuente, 'laboratorio.json', `componente ${c.codigo} de ${a.codigo}`);
    });
  }

  // --- imagenología ---
  for (const e of imgSeed) {
    const { id, reused } = studyConcept(e.codigo, e.codigo_api_existente, e.nombre, true);
    addNames(id, e.codigo, e.nombre, e.sinonimos, reused);
    addProps(id, e.codigo, {
      study_family: 'IMAGING', study_catalog_code: e.codigo, legacy_code: e.codigo_api_existente, modality_code: e.modalidad, region_code: e.region, projections: e.proyecciones,
      contrast: e.contraste, contrast_route: e.via_contraste, requires_laterality: e.requiere_lateralidad, preparation: e.preparacion,
      loinc_code: e.loinc, loinc_name: e.loinc ? e.loinc_nombre : null, loinc_by_laterality: e.loinc_por_lateralidad,
      radlex_rpid: e.radlex_rpid, radlex_name: e.radlex_nombre, radlex_rpid_by_laterality: e.radlex_rpid_por_lateralidad, note: e.nota,
      catalog_version: version, source_ids: splitSources(e.fuente), source_file: 'imagenologia.json', source_file_sha256: sha('imagenologia.json'),
    });
    addRel('has-modality', BOOT.REL_HAS_MODALITY, id, modalityId(e.modalidad), null, e.fuente, 'imagenologia.json', `estudio ${e.codigo} modalidad ${e.modalidad}`);
    addRel('has-body-site', BOOT.REL_HAS_BODY_SITE, id, regionId(e.region), null, e.fuente, 'imagenologia.json', `estudio ${e.codigo} región ${e.region}`);
    if (!reused) plan.valueSetMembers.push(id);
  }
  for (const p of pending) plan.notes.push(`omitido ${p.kind} ${p.code} [${p.why}]`);
  return plan;
}

export function planSummary(plan) {
  return {
    terminology_sources: plan.sources.size, catalog_concepts: plan.concepts.size, concept_designations: plan.designations.length,
    concept_properties: plan.properties.length, concept_relationships: plan.relationships.size, concept_relationship_evidence: plan.evidence.length,
    value_set_members: plan.valueSetMembers.length, reutilizados: plan.reused.length, omitidos: plan.omitted.length,
  };
}
