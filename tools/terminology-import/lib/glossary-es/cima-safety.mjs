// =============================================================================
// Seguridad del fármaco desde la ficha técnica de CIMA (TAREA-41 F4.2).
//
// Puro: no lee archivos, red ni base. Recibe las secciones ya descargadas
// (respuestas de `docSegmentado/contenido/1`), un índice de designaciones del
// glosario y otro de principios activos del catálogo, y devuelve:
//   - `relationships`: filas para `bulkLoadRelationships` (lib/bulk-copy.mjs);
//   - `interactions`: pares fármaco-fármaco para `clinical_ext.drug_interactions`;
//   - `unmatched`: todo lo que NO casó exacto (va a `out/cima-unmatched.csv`).
//
// Reglas que no se negocian:
//   1. Coincidencia EXACTA de término, nunca interpretación. Una oración aporta
//      una relación sólo si contiene, palabra por palabra (sin tildes ni
//      mayúsculas), una designación o sinónimo del glosario. Se toma la
//      coincidencia más larga en cada posición y no se solapan. Si esa
//      designación pertenece a más de un concepto, no se elige: va a la cola.
//   2. La cita es la oración literal de la ficha (`citationText`) con su
//      sección, el producto, la fecha de la ficha y el enlace público.
//   3. Dosis: nunca (F4.5). La 4.2 no entra por la lista blanca de `cima.mjs`;
//      además, cualquier oración de 4.3/4.5/4.6/4.8 que cite una cantidad, una
//      pauta o remita a la 4.2 se descarta entera con la guardia de dosis del
//      corte S3 (`encyclopedia/s3-farmacos/lib/dose-guard.mjs`) y va a la cola.
//   4. Nunca se envía `ordinal`: es de la relación, no de esta fuente.
// =============================================================================

import { LACTMED_SOURCE } from '../../clinical-pharmacology/lib/lactmed.mjs';
import { doseMatch } from '../../encyclopedia/s3-farmacos/lib/dose-guard.mjs';
import { deterministicId, foldForSearch, htmlToText } from './common.mjs';
import { SAFETY_SECTIONS, assertAllowedSection, sectionPublicUrl } from './cima.mjs';
import { conceptId } from './load-plan.mjs';

export const CURATED_REFERENCE = 'CURATED_REFERENCE';

/** Sección → tipo de relación del grafo (mismos ids que `src/common/constants/concepts.ts`). */
export const SECTION_RELATION = Object.freeze({
  '4.3': { code: 'CONTRAINDICATED_IN', typeId: deterministicId('terminology:relationship:contraindicated-in') },
  '4.6': { code: 'PREGNANCY_LACTATION_CAUTION', typeId: deterministicId('terminology:relationship:pregnancy-lactation-caution') },
  '4.8': { code: 'ADVERSE_EFFECT', typeId: deterministicId('terminology:relationship:adverse-effect') },
});

/** La 4.5 no va al grafo de conceptos: va a `clinical_ext.drug_interactions` (TAREA-41 §F1.1). */
export const INTERACTIONS_SECTION = '4.5';

/**
 * Categorías del glosario que pueden ser destino de 4.3, 4.6 y 4.8
 * («fármaco → enfermedad, estado o hallazgo»). Quedan fuera, por categoría y
 * no por juicio, anatomía, especialidades, pruebas, procedimientos,
 * tratamientos y fármacos: una ficha que dice «a cualquiera de las
 * penicilinas» no contraindica el fármaco «en» la penicilina.
 */
export const CLINICAL_TARGET_CATEGORIES = Object.freeze(['disease', 'signs-symptoms', 'care', 'other']);

/**
 * Destinos permitidos de PREGNANCY_LACTATION_CAUTION (4.6 y LactMed), en orden
 * de preferencia. Lista FIJA de designaciones exactas: una oración de 4.6 que
 * nombra además «diarrea» (en el lactante) no relaciona el fármaco con la
 * diarrea; sólo con el embarazo o la lactancia que nombra.
 */
export const PREGNANCY_LACTATION_TERMS = Object.freeze(['embarazo', 'gestacion', 'lactancia materna', 'lactancia', 'amamantamiento']);

/**
 * Tabla FIJA de frecuencia (F4.2, 4.8). Clave: la etiqueta de frecuencia de
 * la ficha (convención MedDRA/CIOMS de la AEMPS), sin tildes ni mayúsculas.
 * Valor: código de `VS_RELATIONSHIP_FREQUENCY`, o `null` cuando la ficha no
 * da frecuencia («frecuencia no conocida»).
 *
 * OJO, es una correspondencia ORDINAL, no de porcentajes: el value set es el
 * de HPO (HP:0040280–HP:0040285: muy frecuente 80–99 %, frecuente 30–79 %,
 * ocasional 5–29 %, muy raro 1–4 %), y las bandas MedDRA son otras (muy
 * frecuentes ≥ 1/10, frecuentes 1/100–1/10, poco frecuentes 1/1 000–1/100,
 * raras 1/10 000–1/1 000, muy raras < 1/10 000). Ninguna banda MedDRA cabe
 * entera en una sola banda HPO, así que la tabla conserva el ORDEN (sirve para
 * ordenar efectos adversos de un mismo fármaco por fuerza), no el número. La
 * banda literal de la ficha viaja en `citationLocator`. «Raras» y «muy raras»
 * comparten `VERY_RARE`: el value set no tiene un grado más bajo que no sea
 * `EXCLUDED`, y `EXCLUDED` significa «no ocurre», que es lo contrario.
 * `OBLIGATE` y `EXCLUDED` no se asignan nunca desde una ficha.
 */
export const MEDDRA_FREQUENCY = Object.freeze({
  'muy frecuentes': 'VERY_FREQUENT',
  'muy frecuente': 'VERY_FREQUENT',
  frecuentes: 'FREQUENT',
  frecuente: 'FREQUENT',
  'poco frecuentes': 'OCCASIONAL',
  'poco frecuente': 'OCCASIONAL',
  raras: 'VERY_RARE',
  rara: 'VERY_RARE',
  'muy raras': 'VERY_RARE',
  'muy rara': 'VERY_RARE',
  'frecuencia no conocida': null,
  'no conocida': null,
});

/**
 * Tabla FIJA de severidad de interacción (F4.2, 4.5). Se evalúa en orden y
 * gana la primera frase que aparece literal en la oración (sin tildes ni
 * mayúsculas). Sin ninguna → `UNSPECIFIED`. Una negación inmediata
 * («no está contraindicado») anula la frase.
 */
export const INTERACTION_SEVERITY = Object.freeze([
  { code: 'CONTRAINDICATED', pattern: /(?<!\bno (?:esta|estan|es|son) )\bcontraind\s?icad[oa]s?\b/u },
  { code: 'NOT_RECOMMENDED', pattern: /\bno se recomienda\b/u },
]);
export const UNSPECIFIED_SEVERITY = 'UNSPECIFIED';

/**
 * Primeras palabras de las clases de órganos y sistemas (SOC) de MedDRA en
 * castellano. Sólo sirven para poner la SOC en `citationLocator`.
 */
const SOC_LEADS = ['trastornos', 'infecciones', 'neoplasias', 'exploraciones', 'lesiones', 'procedimientos', 'circunstancias', 'embarazo', 'problemas'];

/**
 * Bloque fijo de las fichas europeas («Notificación de sospechas de
 * reacciones adversas»). Es un aviso regulatorio, no un efecto del fármaco:
 * desde su título hasta el final de la sección no se extrae nada.
 */
const REPORTING_NOTICE = /^notificacion de sospechas de reacciones adversas/u;

// --- Texto ---------------------------------------------------------------------

const fold = (text) => foldForSearch(text).replace(/\s+/g, ' ').trim();

/** Palabras del texto plegado (letras y dígitos; guiones internos se conservan). */
export function tokens(text) {
  return fold(text).match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [];
}

const termKey = (text) => tokens(text).join(' ');
const PREGNANCY_LACTATION_KEYS = new Set(PREGNANCY_LACTATION_TERMS.map(termKey));

/**
 * Oraciones de un texto. Corta tras `.`, `;`, `!` o `?` seguidos de espacio y
 * mayúscula; no corta «p. ej. una», «p. ej. CYP3A4» ni «1.000». Devuelve el texto literal.
 */
export function splitSentences(text) {
  return String(text)
    .split(/(?<!\b(?:p|ej|etc|aprox|vs)\.)(?<=[.;!?])\s+(?=[«"(¿¡]?[\p{Lu}])/u)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}]/u.test(s));
}

/** Texto de un fragmento HTML en una sola línea (las celdas con varios párrafos se unen con espacio). */
const inline = (html) => (htmlToText(html) ?? '').replace(/\s*\n\s*/g, ' ').trim();

/**
 * Bloques de una sección en orden de aparición: líneas de texto fuera de las
 * tablas (`{ cells: [texto] }`) y filas de tabla (`{ cells: [...], row: true }`).
 */
export function sectionBlocks(html) {
  const clean = String(html ?? '').replace(/<!--[\s\S]*?-->/g, '');
  const blocks = [];
  // Las fichas cortan párrafos con saltos duros («…que se han comunicado durante los» /
  // «ensayos clínicos…»). Una línea sin puntuación final seguida de otra que empieza en
  // minúscula es la misma oración: se une con un espacio, sin cambiar ninguna palabra.
  const pushText = (fragment) => {
    let previous = null;
    for (const line of (htmlToText(fragment) ?? '').split('\n')) {
      const text = line.trim();
      if (!text) continue;
      if (previous && !/[.;:!?]\s*$/u.test(previous.cells[0]) && /^[\p{Ll}(]/u.test(text)) {
        previous.cells[0] = `${previous.cells[0]} ${text}`;
        continue;
      }
      previous = { cells: [text], row: false };
      blocks.push(previous);
    }
  };
  let last = 0;
  for (const table of clean.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    pushText(clean.slice(last, table.index));
    for (const tr of table[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
      const cells = [...tr[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => inline(m[1])).filter(Boolean);
      if (cells.length) blocks.push({ cells, row: true });
    }
    last = table.index + table[0].length;
  }
  pushText(clean.slice(last));
  return blocks;
}

// --- Índices -------------------------------------------------------------------

/**
 * Índice de términos: clave plegada → conceptos que la llevan.
 *
 * @param {Iterable<{conceptId: string, text: string, categoryKey?: string|null}>} designations
 * @param {{ categories?: readonly string[], minLength?: number }} [options]
 *   `categories`: si se da, sólo entran designaciones de esas categorías.
 *   `minLength`: largo mínimo de la clave (por defecto 3) para no casar siglas sueltas.
 */
export function buildTermIndex(designations, { categories = null, minLength = 3 } = {}) {
  const byKey = new Map();
  let maxTokens = 1;
  for (const { conceptId, text, categoryKey = null } of designations) {
    if (categories && !categories.includes(categoryKey)) continue;
    const key = termKey(text);
    if (key.length < minLength) continue;
    const list = byKey.get(key) ?? [];
    if (!list.includes(conceptId)) list.push(conceptId);
    byKey.set(key, list);
    maxTokens = Math.max(maxTokens, key.split(' ').length);
  }
  return { byKey, maxTokens };
}

/**
 * Términos del índice nombrados en la oración, por coincidencia exacta de
 * palabras. En cada posición gana la designación más larga y las
 * coincidencias no se solapan.
 *
 * @returns {Array<{ term: string, conceptIds: string[] }>}
 */
export function findTerms(index, sentence) {
  const words = tokens(sentence);
  const found = [];
  for (let i = 0; i < words.length; ) {
    let hit = null;
    for (let n = Math.min(index.maxTokens, words.length - i); n >= 1 && !hit; n--) {
      const key = words.slice(i, i + n).join(' ');
      const ids = index.byKey.get(key);
      if (ids) hit = { term: key, conceptIds: ids, length: n };
    }
    if (hit) {
      found.push({ term: hit.term, conceptIds: hit.conceptIds });
      i += hit.length;
    } else i += 1;
  }
  return found;
}

// --- Etiquetas -----------------------------------------------------------------

const labelKey = (text) => fold(String(text).replace(/[*#]+/g, ' ').replace(/[:.]\s*$/u, ''));

/** Código de frecuencia de una etiqueta («*Frecuentes», «Muy raras:»), `undefined` si no es una etiqueta. */
export function frequencyOfLabel(text) {
  const key = labelKey(text);
  return Object.prototype.hasOwnProperty.call(MEDDRA_FREQUENCY, key) ? MEDDRA_FREQUENCY[key] : undefined;
}

/**
 * Etiquetas cuya banda la ficha declara en texto («Frecuentes (≥1/100 a <1/10)»).
 * Sólo a esas se les asigna frecuencia: la tabla de la ficha la «da en texto».
 */
export function declaredFrequencyLabels(text) {
  const declared = new Set();
  const plain = fold(text);
  for (const label of Object.keys(MEDDRA_FREQUENCY)) {
    // «frecuentes» no se da por declarada por aparecer dentro de «muy frecuentes (…)».
    const re = new RegExp(`(?<![\\p{L}])(?<!(?:muy|poco|frecuencia) )${label}\\s*\\([^)]*\\d\\s*/\\s*\\d`, 'u');
    if (re.test(plain)) declared.add(label);
  }
  return declared;
}

/** «Raras: anemia.» → `{ label: 'Raras', rest: 'anemia.' }` si la etiqueta es de frecuencia. */
function leadingLabel(text) {
  const m = /^\s*([*#]*[\p{L} ]{4,30}?)\s*:\s*(.*)$/u.exec(text);
  if (!m || frequencyOfLabel(m[1]) === undefined) return null;
  return { label: m[1].replace(/[*#]/g, '').trim(), rest: m[2] };
}

const isSocHeading = (text) => text.length <= 120 && SOC_LEADS.includes(tokens(text)[0]) && !/[.;]\s*$/u.test(text);

// --- Unidades de cita ------------------------------------------------------------

/**
 * Oraciones citables de una sección, con su contexto. En 4.8 cada oración
 * lleva la etiqueta de frecuencia que la ficha le pone (columna, primera
 * celda de la fila o prefijo «Etiqueta:»), y la SOC en curso.
 *
 * @returns {Array<{ sentence: string, ordinal: number, soc: string|null, label: string|null, row: boolean }>}
 */
export function citationUnits(section, html) {
  const units = [];
  let soc = null;
  let columnLabels = null;
  let n = 0;
  const push = (text, label, row) => {
    for (const sentence of splitSentences(text)) units.push({ sentence, ordinal: ++n, soc, label, row });
  };
  for (const block of sectionBlocks(html)) {
    const { cells, row } = block;
    if (section === '4.8' && !row && REPORTING_NOTICE.test(fold(cells[0]))) break;

    // 4.5: una fila de tabla es una unidad (fármacos | recomendación); las celdas se unen literal.
    if (section === INTERACTIONS_SECTION && row && cells.length > 1) {
      units.push({ sentence: cells.join(' — '), ordinal: ++n, soc: null, label: null, row: true });
      continue;
    }
    if (section !== '4.8') {
      for (const cell of cells) push(cell, null, row);
      continue;
    }

    // 4.8 — encabezado de columnas: todas las celdas después de la primera son etiquetas.
    if (row && cells.length > 1 && cells.slice(1).every((c) => frequencyOfLabel(c) !== undefined)) {
      columnLabels = cells.map((c, i) => (i === 0 ? null : c.replace(/[*#]/g, '').trim()));
      continue;
    }
    if (cells.length === 1) {
      const only = cells[0];
      if (isSocHeading(only)) {
        soc = only.replace(/:\s*$/u, '');
        continue;
      }
      const lead = leadingLabel(only);
      if (lead) push(only, lead.label, row);
      else push(only, null, row);
      continue;
    }
    if (frequencyOfLabel(cells[0]) !== undefined) {
      const label = cells[0].replace(/[*#]/g, '').trim();
      for (const cell of cells.slice(1)) push(cell, label, true);
      continue;
    }
    if (columnLabels) {
      if (isSocHeading(cells[0])) soc = cells[0].replace(/:\s*$/u, '');
      cells.forEach((cell, i) => {
        if (i > 0) push(cell, columnLabels[i] ?? null, true);
      });
      continue;
    }
    for (const cell of cells) push(cell, null, true);
  }
  return units;
}

// --- Extracción ------------------------------------------------------------------

/**
 * Una unidad es citable si es una oración (termina en `.`, `;`, `:`, `!`, `?` o
 * `)`), una fila de tabla, o lleva prefijo de frecuencia («Muy raras: …»). Los
 * subtítulos sueltos («Probenecid», «Embarazo») nombran el término pero no
 * dicen nada de él: no son una cita.
 */
export function isCitable(unit) {
  // «- Ciclosporina:» es un subtítulo que anuncia una lista, no una oración: sin verbo que citar.
  if (!unit.row && unit.label == null && /:\s*$/u.test(unit.sentence) && tokens(unit.sentence).length <= 4) return false;
  return unit.row || unit.label != null || /[.;:!?)]\s*$/u.test(unit.sentence);
}

/**
 * @typedef {object} CimaSafetyDrug
 * @property {string} conceptId   concepto del principio activo en el glosario (`conceptId('cima-vtm-<id>')`)
 * @property {string} slug        `cima-vtm-<id>`
 * @property {string} name        nombre del principio activo
 *
 * @typedef {object} CimaSafetySection
 * @property {string} section     número oficial (4.3, 4.5, 4.6 o 4.8)
 * @property {string} html        `contenido` literal de CIMA
 * @property {string} nregistro   producto de referencia del que sale la ficha
 * @property {string} productName
 * @property {string|null} fichaDate  fecha de la ficha (AAAA-MM-DD), o null si CIMA no la publica
 * @property {string} retrievedAt     fecha de consulta (AAAA-MM-DD)
 */

/** Cita legible de la ficha, con la fecha de su última actualización (exigencia del aviso legal de la AEMPS). */
export function sheetCitation(s) {
  const version = s.fichaDate ? `versión del ${s.fichaDate}` : `sin fecha de versión publicada por CIMA, consultada el ${s.retrievedAt}`;
  return `AEMPS. CIMA. Ficha técnica de ${s.productName} (nº reg. ${s.nregistro}), sección ${s.section}, ${version}. ${sectionPublicUrl(s.nregistro, s.section)}`;
}

function locatorOf(s, unit) {
  const parts = [sheetCitation(s)];
  if (unit.soc) parts.push(`SOC: ${unit.soc}`);
  if (unit.label) parts.push(`frecuencia en la ficha: ${unit.label}`);
  if (unit.row) parts.push('fila de tabla');
  return parts.join(' · ');
}

/** Severidad de la tabla fija para una oración de 4.5. */
export function interactionSeverity(sentence) {
  const plain = fold(sentence);
  return INTERACTION_SEVERITY.find((s) => s.pattern.test(plain))?.code ?? UNSPECIFIED_SEVERITY;
}

/**
 * Relaciones, interacciones y cola de una ficha.
 *
 * @param {object} input
 * @param {CimaSafetyDrug} input.drug
 * @param {CimaSafetySection[]} input.sections
 * @param {ReturnType<typeof buildTermIndex>} input.clinicalIndex   designaciones de destino (4.3, 4.6, 4.8)
 * @param {ReturnType<typeof buildTermIndex>} input.ingredientIndex principios activos del catálogo (4.5)
 */
export function cimaSafety({ drug, sections, clinicalIndex, ingredientIndex }) {
  const relationships = [];
  const interactions = [];
  const unmatched = [];
  const seen = new Set();

  for (const s of sections) {
    assertAllowedSection(s.section);
    const isInteraction = s.section === INTERACTIONS_SECTION;
    const relation = SECTION_RELATION[s.section];
    if (!relation && !isInteraction) continue;
    const declared = s.section === '4.8' ? declaredFrequencyLabels(htmlToText(s.html) ?? '') : new Set();
    const validFrom = s.fichaDate ?? s.retrievedAt;

    for (const unit of citationUnits(s.section, s.html)) {
      const base = { drug: drug.slug, nregistro: s.nregistro, section: s.section, ordinal: unit.ordinal, sentence: unit.sentence };
      if (!isCitable(unit)) {
        unmatched.push({ ...base, reason: 'not-a-sentence', term: '', candidates: [] });
        continue;
      }
      const dose = doseMatch(unit.sentence);
      if (dose) {
        unmatched.push({ ...base, reason: `dose-guard:${dose}`, term: '', candidates: [] });
        continue;
      }
      const found = findTerms(isInteraction ? ingredientIndex : clinicalIndex, unit.sentence).filter(
        (f) =>
          !(f.conceptIds.length === 1 && f.conceptIds[0] === drug.conceptId) && (s.section !== '4.6' || PREGNANCY_LACTATION_KEYS.has(f.term)),
      );
      if (found.length === 0) {
        const reason = isInteraction ? 'no-catalog-ingredient' : s.section === '4.6' ? 'no-pregnancy-lactation-term' : 'no-exact-term';
        unmatched.push({ ...base, reason, term: '', candidates: [] });
        continue;
      }
      const reference = `cima:${s.nregistro}:${s.section}:${unit.ordinal}`;
      for (const f of found) {
        if (f.conceptIds.length > 1) {
          unmatched.push({ ...base, reason: 'ambiguous', term: f.term, candidates: f.conceptIds });
          continue;
        }
        const target = f.conceptIds[0];
        const key = `${s.section}|${target}|${unit.ordinal}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (isInteraction) {
          interactions.push({
            substanceAConceptId: drug.conceptId,
            substanceBConceptId: target,
            substanceA: drug.name,
            substanceB: f.term,
            severityCode: interactionSeverity(unit.sentence),
            citationText: unit.sentence,
            citationLocator: locatorOf(s, unit),
            sourceReference: reference,
            source: 'aemps-cima',
            sourceVersion: validFrom,
          });
          continue;
        }
        const labelKeyed = unit.label ? labelKey(unit.label) : null;
        const frequency = s.section === '4.8' && labelKeyed && declared.has(labelKeyed) ? MEDDRA_FREQUENCY[labelKeyed] ?? null : null;
        relationships.push({
          sourceConceptId: drug.conceptId,
          targetConceptId: target,
          relationshipTypeConceptId: relation.typeId,
          evidenceTier: CURATED_REFERENCE,
          sourceReference: reference,
          citationText: unit.sentence,
          citationLocator: locatorOf(s, unit),
          frequency,
          validFrom,
        });
      }
    }
  }
  return { relationships, interactions, unmatched };
}

/** Respuesta de `docSegmentado/contenido/1` → HTML literal de la sección pedida (o null). */
export function sectionHtml(sectionCode, response) {
  assertAllowedSection(sectionCode);
  const item = Array.isArray(response) ? response.find((r) => r.seccion === sectionCode) ?? null : null;
  return item?.contenido ?? null;
}

// --- Entrada desde el glosario y salidas -------------------------------------------

const SAFETY_SECTIONS_SET = new Set(SAFETY_SECTIONS);

/**
 * Fila del glosario CIMA (`cima.ndjson`, de `import-cima.mjs`) → entrada de
 * `cimaSafety`. Toma sólo las secciones de seguridad del producto de
 * referencia; la 4.2 ya no existe en la fila (lista blanca), y si una fila
 * vieja la trajera, `assertAllowedSection` corta antes de leerla.
 */
export function safetyInputFromRow(row) {
  const sections = (row.drugFacts?.sections ?? [])
    .filter((s) => SAFETY_SECTIONS_SET.has(assertAllowedSection(s.section)))
    .map((s) => ({
      section: s.section,
      html: s.html,
      nregistro: s.nregistro,
      productName: s.productName,
      fichaDate: s.documentDate ? s.documentDate.slice(0, 10) : null,
      retrievedAt: String(s.retrievedAt).slice(0, 10),
    }));
  return { drug: { conceptId: conceptId(row.slug), slug: row.slug, name: row.esName }, sections };
}


/** Principios activos del catálogo CIMA como designaciones (para el índice de 4.5). */
export function ingredientDesignations(rows) {
  return rows
    .filter((r) => r.codeSystem === 'cima-vtm')
    .flatMap((r) => [r.esName, r.drugFacts?.vtmName].filter(Boolean).map((text) => ({ conceptId: conceptId(r.slug), text, categoryKey: 'pharmacology' })));
}

/** Una línea CSV con comillas dobles escapadas. */
export function csvLine(values) {
  return values.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

export const UNMATCHED_COLUMNS = Object.freeze(['drug', 'nregistro', 'section', 'ordinal', 'reason', 'term', 'candidates', 'sentence']);
export const INTERACTION_COLUMNS = Object.freeze([
  'substance_a', 'substance_b', 'substance_a_concept_id', 'substance_b_concept_id', 'severity_code', 'source', 'source_version', 'source_reference', 'citation_text', 'citation_locator',
]);

export function unmatchedCsv(unmatched) {
  return `${[csvLine(UNMATCHED_COLUMNS), ...unmatched.map((u) => csvLine([u.drug, u.nregistro, u.section, u.ordinal, u.reason, u.term, u.candidates.join('|'), u.sentence]))].join('\n')}\n`;
}

export function interactionsCsv(interactions) {
  return `${[
    csvLine(INTERACTION_COLUMNS),
    ...interactions.map((i) => csvLine([i.substanceA, i.substanceB, i.substanceAConceptId, i.substanceBConceptId, i.severityCode, i.source, i.sourceVersion, i.sourceReference, i.citationText, i.citationLocator])),
  ].join('\n')}\n`;
}

// --- LactMed (F4.3) ----------------------------------------------------------------

/** Única sección de LactMed que se cita (F4.3): el resumen, literal y completo. */
export const LACTMED_SUMMARY_SECTION = 'Summary of Use during Lactation';

/** Destino de LactMed: la primera de estas designaciones exactas que exista en el glosario. */
export const LACTATION_TERMS = Object.freeze(['lactancia materna', 'lactancia', 'amamantamiento']);

/**
 * Monografía del corpus de `clinical-pharmacology` (una por ATC 5, ya enlazada
 * a LactMed por UNII → ATC, nunca por nombre) → resúmenes de LactMed. Toda otra
 * sección (CIMA, openFDA, LiverTox, y la posología que el corpus trae para uso
 * profesional) se descarta acá sin leer su texto.
 */
export function lactmedSummariesFromMonograph(monograph) {
  return (monograph.sections ?? [])
    .filter((s) => s.source === LACTMED_SOURCE && s.section?.number === LACTMED_SUMMARY_SECTION && s.text)
    .map((s) => ({
      atc: monograph.code,
      recordId: s.document.id,
      title: s.document.title,
      revised: s.document.effectiveDate ?? null,
      url: s.document.url,
      text: s.text,
      citation: s.citation,
      retrievedAt: String(s.retrievedAt).slice(0, 10),
    }));
}

/** Filas del catálogo CIMA → Map(ATC 5 → principios activos que lo declaran). */
export function catalogDrugsByAtc(rows) {
  const byAtc = new Map();
  for (const r of rows) {
    if (r.codeSystem !== 'cima-vtm') continue;
    for (const atc of r.externalIds?.atc ?? []) {
      const list = byAtc.get(atc) ?? [];
      list.push({ conceptId: conceptId(r.slug), slug: r.slug, name: r.esName });
      byAtc.set(atc, list);
    }
  }
  return byAtc;
}

/**
 * Concepto destino entre designaciones exactas de una lista fija. Devuelve el
 * primero que nombra a un solo concepto; `null` si ninguno existe o todos son
 * ambiguos (entonces nada se carga y todo va a la cola).
 */
export function fixedTarget(index, terms) {
  for (const term of terms) {
    const ids = index.byKey.get(termKey(term));
    if (ids?.length === 1) return { conceptId: ids[0], term: termKey(term) };
  }
  return null;
}

/**
 * F4.3: resúmenes de LactMed → PREGNANCY_LACTATION_CAUTION (CURATED_REFERENCE),
 * citando el resumen literal. Enlace al catálogo por ATC 5 exacto; un ATC que
 * declaran dos principios activos no se resuelve: va a la cola. «Dosis: nunca»:
 * un resumen que cita una cantidad o pauta no se carga, va a la cola.
 *
 * @param {object} input
 * @param {Iterable<ReturnType<typeof lactmedSummariesFromMonograph>[number]>} input.summaries
 * @param {ReturnType<typeof catalogDrugsByAtc>} input.drugsByAtc
 * @param {{conceptId: string, term: string}|null} input.lactationTarget  de `fixedTarget(clinicalIndex, LACTATION_TERMS)`
 */
export function lactmedSafety({ summaries, drugsByAtc, lactationTarget }) {
  const relationships = [];
  const unmatched = [];
  const seen = new Set();
  const typeId = SECTION_RELATION['4.6'].typeId;
  for (const s of summaries) {
    const drugs = drugsByAtc.get(s.atc) ?? [];
    const base = { drug: drugs.map((d) => d.slug).join('|'), nregistro: s.recordId, section: 'lactmed-summary', ordinal: s.atc, sentence: s.text };
    const reject = (reason, candidates = []) => unmatched.push({ ...base, reason, term: '', candidates });
    if (drugs.length === 0) {
      reject('no-catalog-drug');
      continue;
    }
    if (drugs.length > 1) {
      reject('ambiguous-atc', drugs.map((d) => d.conceptId));
      continue;
    }
    if (!lactationTarget) {
      reject('no-lactation-concept');
      continue;
    }
    const dose = doseMatch(s.text);
    if (dose) {
      reject(`dose-guard:${dose}`);
      continue;
    }
    const sourceReference = `lactmed:${s.recordId}`;
    const key = `${drugs[0].conceptId}|${sourceReference}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push({
      sourceConceptId: drugs[0].conceptId,
      targetConceptId: lactationTarget.conceptId,
      relationshipTypeConceptId: typeId,
      evidenceTier: CURATED_REFERENCE,
      sourceReference,
      citationText: s.text,
      citationLocator: `${s.citation} · ATC ${s.atc}`,
      frequency: null,
      validFrom: s.revised ?? s.retrievedAt,
    });
  }
  return { relationships, unmatched };
}

const RELATION_CODE_BY_TYPE = new Map(Object.values(SECTION_RELATION).map((r) => [r.typeId, r.code]));

/** Conteos por sección: relaciones por tipo y frecuencia, interacciones por severidad, cola por motivo. */
export function safetySummary({ relationships, interactions, unmatched }) {
  const bump = (obj, key) => {
    obj[key] = (obj[key] ?? 0) + 1;
  };
  const summary = { relationships: {}, frequency: {}, interactionsBySeverity: {}, unmatchedBySection: {}, unmatchedByReason: {} };
  for (const r of relationships) {
    bump(summary.relationships, RELATION_CODE_BY_TYPE.get(r.relationshipTypeConceptId));
    if (r.relationshipTypeConceptId === SECTION_RELATION['4.8'].typeId) bump(summary.frequency, r.frequency ?? 'SIN_FRECUENCIA');
  }
  for (const i of interactions) bump(summary.interactionsBySeverity, i.severityCode);
  for (const u of unmatched) {
    bump(summary.unmatchedBySection, u.section);
    bump(summary.unmatchedByReason, u.reason.split(':')[0]);
  }
  return summary;
}
