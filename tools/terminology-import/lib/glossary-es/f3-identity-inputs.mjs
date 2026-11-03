// =============================================================================
// Entradas compartidas por los cargadores de F3 (relaciones y jerarquía):
// la identidad MONDO armada con las fuentes descargadas, los códigos CIE-10-ES
// del glosario y el filtro de conceptos que de verdad existen en la base.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildIdentity, parseMondoSssom } from './identity.mjs';
import { readObo } from '../../symptoms/lib/obo.mjs';

export const GLOSSARY_DIAGNOSES_FILE = 'cie10es-diagnosticos';

/** Filas de la ficha CIE-10-ES (`<buildDir>/ndjson/cie10es-diagnosticos.ndjson`); `[]` si no está. */
export function readGlossaryDiagnoses(buildDir) {
  const path = join(buildDir, 'ndjson', `${GLOSSARY_DIAGNOSES_FILE}.ndjson`);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

/**
 * Identidad MONDO (misma construcción que `measure-sources.mjs`).
 * @param {{ sourcesDir: string, buildDir: string }} where
 */
export async function loadF3Identity({ sourcesDir, buildDir }) {
  const need = (name) => {
    const path = join(sourcesDir, name);
    if (!existsSync(path)) throw new Error(`Falta ${path}. Bajalo con: node tools/terminology-import/measure-sources.mjs`);
    return path;
  };
  const mondoTerms = new Map();
  await readObo(need('mondo.obo'), (t) => {
    if (t.id.startsWith('MONDO:')) mondoTerms.set(t.id, t);
  });
  const equivalences = [];
  for (const t of mondoTerms.values()) {
    if (t.obsolete) continue;
    for (const x of t.xrefs) if (x.qualifiers?.includes('MONDO:equivalentTo')) equivalences.push({ mondo: t.id, curie: x.id, via: 'MONDO:equivalentTo' });
  }
  const sssom = parseMondoSssom(readFileSync(need('mondo.sssom.tsv'), 'utf8')).filter((e) => !mondoTerms.get(e.mondo)?.obsolete);
  const glossaryIcd10Codes = new Set(readGlossaryDiagnoses(buildDir).map((r) => r.code).filter(Boolean));
  return buildIdentity([...equivalences, ...sssom], { glossaryIcd10Codes });
}

/**
 * La identidad puede apuntar a una ficha del glosario que esta base no tiene
 * (p. ej. un código CIE-10-CM del glosario sin ficha cargada). No se crea nada:
 * esas enfermedades quedan sin resolver, con su propio motivo.
 */
export async function onlyExistingDiseases(client, identity) {
  const present = await existingConceptIds(client, [...identity.groups.values()].map((g) => g.conceptId).filter(Boolean));
  return {
    ...identity,
    resolve: (curie) => {
      const found = identity.resolve(curie);
      if (!found.conceptId || present.has(found.conceptId)) return found;
      return { ...found, conceptId: null, reason: 'concept-not-in-database' };
    },
  };
}

/** Subconjunto de `ids` que existe en `terminology.catalog_concepts`. */
export async function existingConceptIds(client, ids) {
  const present = new Set();
  const wanted = [...new Set(ids)];
  const CHUNK = 20_000;
  for (let i = 0; i < wanted.length; i += CHUNK) {
    const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [wanted.slice(i, i + CHUNK)]);
    for (const r of rows) present.add(r.id);
  }
  return present;
}
