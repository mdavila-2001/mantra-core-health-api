// =============================================================================
// openEHR CKM → filas normalizadas del importador de enfermería.
//
// Un arquetipo publica tres niveles de términos con código propio:
//   archetype  (código = id del arquetipo, p. ej. openEHR-EHR-OBSERVATION.braden_scale.v1)
//   node       (código = <id>::atNNNN; CLUSTER/ELEMENT/paso del flujo de una ACTION)
//   value      (código = <id>::atNNNN; respuesta codificada de un ELEMENT, con su
//               valor ordinal si la fuente lo declara)
// La jerarquía es la del propio arquetipo (padre = nodo contenedor). Los nodos
// estructurales del modelo de referencia (HISTORY, EVENT, ITEM_TREE…) no son
// términos clínicos: no se cargan, y sus hijos cuelgan del ancestro cargado.
//
// Licencia del CONTENIDO (distinta de la licencia del arquetipo, CC-BY-SA):
// ver `classifyContentLicense`. Si el contenido no es libre, sólo se carga la
// fila del arquetipo con sus metadatos; ítems y respuestas quedan afuera.
//
// Nada se traduce ni se redacta: los textos son los del arquetipo, en el idioma
// que el arquetipo publica, con el autor de la traducción cuando no es el original.
// =============================================================================

import { ontologyLanguages, termBindings, termText } from './adl.mjs';

export const CODE_SYSTEM = 'openehr-ckm';

/** Tipos del modelo de referencia que son contenedores técnicos, no términos. */
const STRUCTURAL_RM_TYPES = new Set([
  'HISTORY', 'EVENT', 'POINT_EVENT', 'INTERVAL_EVENT', 'ITEM_TREE', 'ITEM_LIST', 'ITEM_SINGLE', 'ITEM_TABLE',
  'ITEM_STRUCTURE', 'ACTIVITY', 'ISM_TRANSITION_STRUCTURE', 'EVENT_CONTEXT', 'PARTY_IDENTIFIED', 'PARTY_SELF',
]);

/** Tipos que sí se cargan como nodo. ISM_TRANSITION = paso del flujo de cuidados de una ACTION. */
const TERM_RM_TYPES = new Set(['CLUSTER', 'ELEMENT', 'ISM_TRANSITION']);

/**
 * Clases de arquetipo que se cargan (contenido clínico). Las demográficas,
 * composiciones y secciones son estructura de documento o de personas: quedan
 * afuera y se cuentan en el reporte de cobertura.
 */
export const LOADED_ARCHETYPE_CLASSES = new Set(['OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY', 'CLUSTER']);

/** Clase del modelo de referencia, sólo para arquetipos del paquete EHR (los DEMOGRAPHIC quedan afuera). */
export function archetypeClass(archetypeId) {
  const m = /^[^-]+-EHR-([A-Z_]+)\./.exec(archetypeId);
  return m ? m[1] : null;
}

/** Clase sin filtrar por paquete, para el reporte de lo excluido. */
export function archetypeRmLabel(archetypeId) {
  const m = /^[^-]+-([A-Z]+)-([A-Z_]+)\./.exec(archetypeId);
  return m ? `${m[1]}-${m[2]}` : 'unknown';
}

/** Prioridad de idioma castellano: `es` y luego las variantes regionales en orden alfabético. */
export function pickSpanish(languages) {
  const es = languages.filter((l) => l === 'es' || l.startsWith('es-')).sort((a, b) => (a === 'es' ? -1 : b === 'es' ? 1 : a.localeCompare(b)));
  return es[0] ?? null;
}

const sentences = (text) => String(text ?? '').split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

/** Frases de los textos del arquetipo (idioma original) que hablan de derechos sobre el contenido. */
function rightsSentences(archetype) {
  const lang = archetype.originalLanguage;
  const d = archetype.description?.details?.[lang] ?? {};
  const od = archetype.description?.other_details ?? {};
  // `ip_acknowledgements` habla de SNOMED/LOINC (terminologías enlazadas), no del instrumento: se excluye.
  const fields = { use: d.use, misuse: d.misuse, copyright: d.copyright, references: od.references, notes: od.notes };
  const out = [];
  for (const [field, text] of Object.entries(fields)) for (const s of sentences(text)) out.push({ field, text: s });
  return out;
}

/** Organizaciones que firman el modelado del arquetipo (su © no es de un tercero). */
const MODELLING_ORGS = /openEHR|Clinical Models UK|Apperta|Nasjonal IKT|Helse|While openEHR archetypes/i;

const RE_DECLARED_FREE = /\b(is|are) in the public domain\b|\bno permission (is )?required\b|\bmay be reproduced without permission\b/i;
const RE_THIRD_PARTY = /copyright statement|all rights reserved|copyright protected ©|is copyright(ed)? (protected|by)|\bcopyrighted by\b|owns the copyright|\bwritten permission\b|explicit permission|permission: rightslink|©/i;
/** Nombre de instrumento de autor externo (escala, puntaje, cuestionario…). «index» y «test» no: BMI, TFG. */
const RE_INSTRUMENT_NAME = /\b(scale|score|scores|tool|questionnaire|inventory|instrument|classification|criteria)\b/i;
const RE_POSSIBLE = /may be copyright protected|if a copyright exists/i;

/**
 * Clasifica la licencia del contenido del instrumento que modela el arquetipo.
 *
 *  - `declared-free`: el propio arquetipo dice que el instrumento es de dominio
 *    público o que se reproduce sin permiso.
 *  - `third-party-copyright`: el arquetipo transcribe un aviso de copyright de un tercero.
 *  - `possible-third-party-copyright`: el arquetipo advierte que «puede» haberlo.
 *  - `scoring-instrument-unverified`: no hay aviso, pero tiene elementos con
 *    puntaje ordinal (es un instrumento de puntuación de autor externo) y nadie
 *    verificó su licencia. Se trata como restringido hasta que se verifique.
 *  - `openehr-model`: modelo clínico propio de openEHR (sin ordinales, sin aviso).
 *
 * `overrides` permite fijar el estado de un arquetipo con evidencia verificada
 * (URL, fecha y cita): ver `LICENSE_OVERRIDES` en `scale-licenses.mjs`.
 */
export function classifyContentLicense(archetype, overrides = {}) {
  const ov = overrides[archetype.archetypeId];
  if (ov) return { status: ov.status, ...(ov.approvalKey ? { approvalKey: ov.approvalKey, approvalReason: ov.approvalReason } : {}), evidence: [{ field: 'override', text: ov.quote, url: ov.url, checkedAt: ov.checkedAt }], rule: 'override' };
  const rights = rightsSentences(archetype);
  const free = rights.filter((s) => RE_DECLARED_FREE.test(s.text));
  const third = rights.filter((s) => RE_THIRD_PARTY.test(s.text) && !(s.field === 'copyright' && MODELLING_ORGS.test(s.text)) && !RE_DECLARED_FREE.test(s.text));
  const possible = rights.filter((s) => RE_POSSIBLE.test(s.text));
  const hasOrdinal = archetype.definition.nodes.some((n) => n.values.some((v) => v.ordinal !== null));
  const rootName = termText(archetype, archetype.originalLanguage, archetype.conceptAt ?? 'at0000')?.text ?? '';
  const namedInstrument = RE_INSTRUMENT_NAME.test(rootName) || RE_INSTRUMENT_NAME.test(archetype.archetypeId.replace(/_/g, ' '));
  if (third.length) return { status: 'third-party-copyright', evidence: third, rule: 'third-party-notice' };
  if (free.length) return { status: 'declared-free', evidence: free, rule: 'declared-free-notice' };
  if (possible.length) return { status: 'possible-third-party-copyright', evidence: possible, rule: 'possible-notice' };
  if (hasOrdinal) return { status: 'scoring-instrument-unverified', evidence: [], rule: 'ordinal-without-notice' };
  if (namedInstrument) return { status: 'scoring-instrument-unverified', evidence: [], rule: 'instrument-name-without-notice' };
  return { status: 'openehr-model', evidence: [], rule: 'no-notice-no-ordinal' };
}

/** Estados cuyo contenido (ítems y respuestas) se puede cargar. */
export const CONTENT_LOADABLE = new Set(['declared-free', 'openehr-model', 'verified-free']);

/**
 * Estados con la licencia leída pero con una decisión del propietario sin tomar: las filas de contenido se GENERAN (así la
 * decisión se puede ejecutar sin volver a armar) pero llevan `ownerApproval` y el cargador las omite salvo
 * `--owner-approved=<clave>` (ver `load-nursing-care.mjs`).
 */
export const OWNER_APPROVAL_STATUSES = new Set(['pending-owner-decision']);

// --- Subconjunto de enfermería (navegación, no juicio clínico) ----------------

/**
 * Reglas de texto, sobre el NOMBRE en inglés del arquetipo y su id, que
 * transcriben el alcance del pedido del propietario (2026-10-24): escalas de
 * valoración nombradas (Braden, Norton, Morse, Downton, Barthel, Glasgow) y los
 * procedimientos enumerados (curaciones y heridas, úlceras/lesiones por presión,
 * accesos venosos y catéteres, sondajes, administración de medicación, ostomías,
 * signos vitales). N1 agrega todo arquetipo cuyo propio texto menciona enfermería.
 */
export const NURSING_RULES = [
  { key: 'N1-mentions-nursing', test: (a) => /\bnurs(e|es|ing)\b/i.test(nursingHaystack(a)) },
  { key: 'N2-named-scales', test: (a) => /braden|norton|morse|downton|barthel|glasgow_coma|waterlow|stratify|humpty_dumpty|phfrat|news2?|news_uk|pews|neonatal_skin_risk/.test(a.archetypeId) },
  { key: 'N3-pressure-injury-and-wounds', test: (a) => /pressure_(ulcer|injury)|wound|ulcer|burn/.test(a.archetypeId) },
  { key: 'N4-vascular-access-and-catheters', test: (a) => /catheter|cannula|vascular_access|venous_access|picc|drain/.test(a.archetypeId) },
  { key: 'N5-tubes-and-probes', test: (a) => /feeding|nasogastric|gastrostom|sonde/.test(a.archetypeId) },
  { key: 'N6-medication-administration', test: (a) => /ACTION\.medication|medication_administration|INSTRUCTION\.medication_order|supplemental_oxygen|transfusion/.test(a.archetypeId) },
  { key: 'N7-ostomy', test: (a) => /stoma|ostomy/.test(a.archetypeId) },
  { key: 'N8-vital-signs', test: (a) => /OBSERVATION\.(blood_pressure|pulse|body_temperature|temperature|respiration|pulse_oximetry|body_weight|height|body_mass_index|capillary_refill|avpu|acvpu)\./.test(a.archetypeId) },
  { key: 'N9-fluids-elimination-nutrition', test: (a) => /fluid_(balance|input|output)|faecal_output|bristol_stool|urinalysis|nutrition|malnutrition|must\.|infant_feeding/.test(a.archetypeId) },
  { key: 'N10-pain-and-sedation', test: (a) => /pain|rass\.|comfort_behaviour|critical_pain/.test(a.archetypeId) },
  { key: 'N11-care-plan-and-education', test: (a) => /care_plan|care_pathway|health_education|functional_support|functional_ability/.test(a.archetypeId) },
];

function nursingHaystack(a) {
  const d = a.description?.details?.[a.originalLanguage] ?? {};
  const kw = Array.isArray(d.keywords) ? d.keywords.join(' ') : (d.keywords ?? '');
  return [d.purpose, d.use, kw].filter(Boolean).join(' ');
}

export function nursingRules(archetype) {
  return NURSING_RULES.filter((r) => r.test(archetype)).map((r) => r.key);
}

// --- Filas --------------------------------------------------------------------

const asText = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(', ') : typeof v === 'string' ? v : null);

function details(archetype, lang) {
  if (!lang) return null;
  const d = archetype.description?.details?.[lang];
  if (!d) return null;
  return { purpose: asText(d.purpose), use: asText(d.use), misuse: asText(d.misuse), keywords: Array.isArray(d.keywords) ? d.keywords : d.keywords ? [d.keywords] : [], copyright: asText(d.copyright) };
}

function translator(archetype, lang) {
  const t = archetype.translations?.[lang];
  if (!t) return null;
  return { name: t.author?.name ?? null, organisation: t.author?.organisation ?? null, accreditation: t.accreditation ?? null };
}

/**
 * Un término sirve si tiene texto y no es un marcador. CKM marca lo que falta
 * traducir copiando el original entre `*` y `(en)` (p. ej. «*Pulse oximetry(en)»):
 * eso NO es castellano y se trata como ausente.
 */
const UNTRANSLATED = /^\*.*\([a-z]{2}(-[a-z]{2})?\)\s*$/is;
const usable = (t) => (t?.text && t.text !== '*' && !UNTRANSLATED.test(t.text) && !/^@ internal @$/.test(t.description ?? '') ? t : null);

/**
 * Perfil de una fuente de arquetipos: qué sistema de códigos llena, qué tipos
 * del modelo de referencia son términos, cómo se clasifica la licencia del
 * contenido y qué reglas de enfermería aplican. El de openEHR CKM es el default.
 */
export const CKM_PROFILE = {
  codeSystem: CODE_SYSTEM,
  sourceLabel: 'openEHR Clinical Knowledge Manager (espejo oficial openEHR/CKM-mirror)',
  termRmTypes: TERM_RM_TYPES,
  includeSlots: false,
  rmClass: (id) => archetypeClass(id),
  classify: (archetype, ctx) => classifyContentLicense(archetype, ctx.overrides),
  loadable: CONTENT_LOADABLE,
  rules: (archetype) => nursingRules(archetype),
  /** Reglas que además llevan el arquetipo al glosario («Cuidados de enfermería»). */
  glossaryRule: () => true,
};

/**
 * @param {ReturnType<import('./adl.mjs').parseArchetype>} archetype
 * `retrievedAt` ya no entra en la fila (el hash del corpus no depende de la fecha de descarga): vive en `sources.meta.json`
 * y el cargador la agrega al guardar la procedencia.
 * @param {{ path: string, commit: string, repoUrl: string, overrides?: object, profile?: typeof CKM_PROFILE }} ctx
 */
export function archetypeRows(archetype, ctx) {
  const profile = ctx.profile ?? CKM_PROFILE;
  const id = archetype.archetypeId;
  const orig = archetype.originalLanguage;
  const esLang = pickSpanish(ontologyLanguages(archetype));
  const od = archetype.description?.other_details ?? {};
  const contentLicense = profile.classify(archetype, ctx);
  const loadContent = profile.loadable.has(contentLicense.status) || OWNER_APPROVAL_STATUSES.has(contentLicense.status);
  const approvalKey = OWNER_APPROVAL_STATUSES.has(contentLicense.status) ? contentLicense.approvalKey : null;
  const nursing = profile.rules(archetype);
  const uri = `${ctx.repoUrl}/blob/${ctx.commit}/${ctx.path}`;
  const provenance = {
    source: profile.sourceLabel,
    sourceId: id,
    version: od.revision ?? null,
    uri,
    commit: ctx.commit,
    path: ctx.path,
    lifecycleState: archetype.description?.lifecycle_state ?? null,
    archetypeLicence: (od.licence ?? '').trim() || null,
    custodian: od.custodian_organisation ?? null,
    originalPublisher: od.original_publisher ?? null,
    originalAuthor: archetype.description?.original_author ?? null,
    otherContributors: archetype.description?.other_contributors ?? null,
    references: od.references ?? null,
    ipAcknowledgements: od.ip_acknowledgements ?? null,
  };
  const bindings = termBindings(archetype);
  // Clave del enlace: un código at o una ruta (`/data[at0002]/events[at0003]`), que enlaza su último nodo.
  const bindingAt = (key) => (key.startsWith('/') ? [...key.matchAll(/\[(at[0-9.]+)\]/g)].at(-1)?.[1] ?? null : key);
  const bindingsFor = (at) => bindings.filter((b) => bindingAt(b.key) === at).map(({ terminology, code, uri: u }) => ({ terminology, code, uri: u }));
  const rootAt = archetype.conceptAt ?? 'at0000';
  const rootEn = termText(archetype, orig, rootAt);
  const rootEs = esLang ? usable(termText(archetype, esLang, rootAt)) : null;
  const rows = [];
  rows.push({
    key: id,
    codeSystem: profile.codeSystem,
    code: id,
    kind: 'archetype',
    rmType: profile.rmClass(id),
    archetypeId: id,
    atCode: rootAt,
    parentCode: null,
    specialises: archetype.specialises,
    ordinalValue: null,
    nameEs: rootEs?.text ?? null,
    descriptionEs: rootEs?.description ?? null,
    nameOriginal: rootEn?.text ?? id,
    descriptionOriginal: rootEn?.description ?? null,
    originalLanguage: orig,
    esLanguage: rootEs ? esLang : null,
    esTranslator: rootEs ? translator(archetype, esLang) : null,
    detailsEs: rootEs ? details(archetype, esLang) : null,
    detailsOriginal: details(archetype, orig),
    contentLicense,
    contentLoaded: loadContent,
    ...(approvalKey ? { contentOwnerApproval: approvalKey } : {}),
    nursingRules: nursing,
    glossaryEligible: nursing.some((r) => profile.glossaryRule(r)),
    bindings: bindingsFor(rootAt),
    provenance,
  });
  if (!loadContent) return rows;

  const nodes = archetype.definition.nodes.filter((n) => n.atCode !== rootAt);
  const kept = new Map(); // atCode → code de la fila
  const byAt = new Map(nodes.map((n) => [n.atCode, n]));
  const parentCodeOf = (parentAt) => {
    let at = parentAt;
    while (at && at !== rootAt) {
      if (kept.has(at)) return kept.get(at);
      at = byAt.get(at)?.parentAt ?? null;
    }
    return id;
  };
  const textRow = (at, extra) => {
    const en = termText(archetype, orig, at);
    const es = esLang ? usable(termText(archetype, esLang, at)) : null;
    return {
      key: `${id}::${at}`,
      codeSystem: profile.codeSystem,
      code: `${id}::${at}`,
      archetypeId: id,
      atCode: at,
      nameEs: es?.text ?? null,
      descriptionEs: es?.description ?? null,
      nameOriginal: en?.text ?? null,
      descriptionOriginal: en?.description ?? null,
      originalLanguage: orig,
      esLanguage: es ? esLang : null,
      esTranslator: es ? translator(archetype, esLang) : null,
      contentLicense,
      contentLoaded: true,
      ...(approvalKey ? { ownerApproval: approvalKey } : {}),
      nursingRules: nursing,
      bindings: bindingsFor(at),
      provenance,
      ...extra,
    };
  };
  for (const n of nodes) {
    if ((n.slot && !profile.includeSlots) || STRUCTURAL_RM_TYPES.has(n.rmType) || !profile.termRmTypes.has(n.rmType)) continue;
    const en = termText(archetype, orig, n.atCode);
    if (!usable(en)) continue;
    const code = `${id}::${n.atCode}`;
    if (kept.has(n.atCode)) continue; // mismo at repetido en dos ramas: una fila
    const slot = n.slot ? { slotIncludes: n.includes, slotExcludes: n.excludes } : {};
    rows.push(textRow(n.atCode, { kind: 'node', rmType: n.rmType, dataTypes: n.dataTypes, parentCode: parentCodeOf(n.parentAt), ordinalValue: null, ...slot }));
    kept.set(n.atCode, code);
  }
  const seenValues = new Set();
  for (const n of nodes) {
    if (!kept.has(n.atCode)) continue;
    for (const v of n.values) {
      const vcode = `${id}::${v.atCode}`;
      if (seenValues.has(vcode) || kept.has(v.atCode)) continue;
      if (!usable(termText(archetype, orig, v.atCode))) continue;
      seenValues.add(vcode);
      rows.push(textRow(v.atCode, { kind: 'value', rmType: 'DV_CODED_TEXT', parentCode: kept.get(n.atCode), ordinalValue: v.ordinal, dataTypes: v.ordinal !== null ? ['DV_ORDINAL'] : ['DV_CODED_TEXT'] }));
    }
  }
  return rows;
}
