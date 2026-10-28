// =============================================================================
// Nutrición y alimentos · plan de carga (puro, sin base): del corpus normalizado (data/) a las tuplas de `terminology.*`.
// Ids deterministas (md5 de una clave propia) → la carga es idempotente con ON CONFLICT DO NOTHING.
// =============================================================================
import { createReadStream, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';
import { CODE_SYSTEMS } from './sources.mjs';
import { INTERNAL, SOURCE_DEFS, codeSystemRowId, codeSystemVersionRowId, conceptRowId, md5uuid, sourceRowId } from './model.mjs';

export async function* readNdjsonGz(path) {
  const rl = createInterface({ input: createReadStream(path).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim() !== '') yield JSON.parse(line);
}

/** Archivos de conceptos del corpus: las partes base y, salvo `noBranded`, las de Branded. */
export function conceptParts(dir, { noBranded = false } = {}) {
  if (!existsSync(dir)) throw new Error(`Falta ${dir}: corré build-nutrition-foods.mjs`);
  const all = readdirSync(dir);
  const pick = (re) => all.filter((f) => re.test(f)).sort().map((f) => join(dir, f));
  const base = pick(/^nutrition-foods-concepts\.part-\d+\.ndjson\.gz$/);
  if (base.length === 0) throw new Error(`Sin partes de conceptos en ${dir}`);
  return [...base, ...(noBranded ? [] : pick(/^nutrition-foods-branded\.part-\d+\.ndjson\.gz$/))];
}

export async function readCodeSystems(dir, { noBranded = false } = {}) {
  const path = join(dir, 'nutrition-foods-codesystems.ndjson.gz');
  if (!existsSync(path)) throw new Error(`Falta ${path}`);
  const out = [];
  for await (const cs of readNdjsonGz(path)) if (!(noBranded && cs.heavy)) out.push(cs);
  return out;
}

// --- piezas -----------------------------------------------------------------------------------------

export const dataTypeOf = (v) => (typeof v === 'boolean' ? 'boolean' : typeof v === 'string' ? 'string' : Number.isInteger(v) ? 'integer' : typeof v === 'number' ? 'decimal' : 'json');

/** Plan de las filas que dependen de cada code system: fuentes, code systems, versiones. */
export function structurePlan(codeSystems) {
  const sourceCodes = [...new Set(codeSystems.map((c) => c.sourceCode))].sort();
  for (const c of sourceCodes) if (!SOURCE_DEFS[c]) throw new Error(`fuente sin definición: ${c}`);
  const sources = sourceCodes.map((code) => ({ id: sourceRowId(code), code, ...SOURCE_DEFS[code] }));
  const systems = codeSystems.map((c) => ({
    id: codeSystemRowId(c.internalCode),
    sourceCode: c.sourceCode,
    internalCode: c.internalCode,
    name: c.name,
    canonicalUrl: c.canonicalUrl,
    versionId: codeSystemVersionRowId(c.internalCode, c.version),
    version: c.version,
    checksum: md5uuid(c.artifacts.map((a) => a.sha256).join('|')),
    concepts: c.concepts,
  }));
  return { sources, systems };
}

const versionOfCs = (cs) => {
  const def = CODE_SYSTEMS[cs];
  if (!def) throw new Error(`code system desconocido: ${cs}`);
  return def.version;
};

export const idOf = (cs, code) => conceptRowId(cs, versionOfCs(cs), code);

/** Filas de un concepto: `catalog_concepts`, designaciones, propiedades y relaciones. `artifacts` = cs → {key → artefacto}. */
export function planConcept(rec, artifactsByCs) {
  const def = CODE_SYSTEMS[rec.cs];
  const version = def.version;
  const id = conceptRowId(rec.cs, version, rec.code);
  const [artKey, table] = rec.prov;
  const art = artifactsByCs.get(rec.cs)?.get(artKey);
  if (!art) throw new Error(`${rec.cs} ${rec.code}: artefacto «${artKey}» sin registrar en el code system`);
  const prop = (code, value) => ({ id: md5uuid(`mantra:nutrition-foods:property:${id}:${code}`), conceptId: id, code, dataType: dataTypeOf(value), value });

  const properties = [
    prop('nutrition_provenance', {
      artifact: art.key,
      table,
      sourceUrl: art.url,
      sourceVersion: art.version,
      ...(art.commit ? { sourceCommit: art.commit } : {}),
      sourceSha256: art.sha256,
      retrievedAt: art.retrievedAt,
      license: art.licenseId,
    }),
    prop('source_license', art.licenseId),
  ];
  const entries = Object.entries(rec.properties ?? {});
  if (rec.cs === 'usda-fdc-branded') {
    // 2 millones de alimentos de marca: un único JSON por concepto en vez de una fila por campo
    if (entries.length) properties.push(prop('fdc_branded', rec.properties));
  } else {
    for (const [k, v] of entries) {
      if (v === null || v === undefined) continue;
      if (k === 'nutrition_provenance' || k === 'source_license') throw new Error(`propiedad reservada en la fuente: ${k} (${rec.cs} ${rec.code})`);
      properties.push(prop(k, v));
    }
  }
  if (rec.displayFallback) properties.push(prop('display_source', 'code (la fuente no trae etiqueta; catalog_concepts.display es NOT NULL)'));

  const designations = [];
  const others = [];
  (rec.designations ?? []).forEach((d, i) => {
    const lang = INTERNAL.LANG[d.lang];
    if (!lang) {
      others.push(d);
      return;
    }
    designations.push({
      id: md5uuid(`mantra:nutrition-foods:designation:${id}:${i}`),
      conceptId: id,
      lang,
      type: d.preferred ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM,
      value: d.value,
      preferred: Boolean(d.preferred),
    });
  });
  // los idiomas que la API no siembra (p. ej. francés de Ciqual/CNF) quedan íntegros como propiedad
  if (others.length) properties.push(prop('names_other_languages', others));

  const relationships = [];
  if ((rec.parents ?? []).length) {
    if (def.hierarchy !== 'is-a') throw new Error(`${rec.cs}: trae padres pero su jerarquía no está declarada is-a`);
    rec.parents.forEach(([pcs, pcode], i) => {
      const target = idOf(pcs, pcode);
      relationships.push({ id: md5uuid(`mantra:nutrition-foods:is-a:${id}:${target}`), source: id, target, type: INTERNAL.REL_IS_A, ordinal: i });
    });
  }

  return {
    concept: {
      id,
      versionId: codeSystemVersionRowId(rec.cs, version),
      code: rec.code,
      display: rec.display,
      definition: rec.definition ?? null,
      state: rec.state === 'retired' ? INTERNAL.STATE.retired : INTERNAL.STATE.active,
    },
    designations,
    properties,
    relationships,
  };
}

export function artifactIndex(codeSystems) {
  return new Map(codeSystems.map((c) => [c.internalCode, new Map(c.artifacts.map((a) => [a.key, a]))]));
}
