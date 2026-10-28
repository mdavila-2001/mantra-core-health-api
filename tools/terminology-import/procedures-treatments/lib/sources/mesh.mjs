// =============================================================================
// MeSH 2026 (NLM) — descriptores de procedimientos (árbol E, sin farmacoterapia).
//
// Fuente: https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.gz
// Se leen en streaming los DescriptorRecord y se conservan los que tienen al menos un
// número de árbol bajo:
//   E01 Diagnosis · E02 Therapeutics (salvo E02.319 Drug Therapy) · E03 Anesthesia and
//   Analgesia · E04 Surgical Procedures, Operative · E06 Dentistry
// Quedan afuera E05 (técnicas de investigación: son métodos de laboratorio) y E07 (equipos) y,
// dentro de E02, la farmacoterapia (E02.319), que es de `seed-drug-treatments`. La regla es la
// del PROPIO árbol de MeSH: ningún descriptor se clasifica por su nombre.
//
// El `definition` es la nota de alcance (ScopeNote) del concepto preferido, verbatim.
// =============================================================================

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';
import { decodeEntities } from '../../../lib/glossary-es/common.mjs';
import { procedureRecord } from '../records.mjs';

export const MESH_SYSTEM = 'mesh-procedures';
export const MESH_PROCEDURE_ROOTS = ['E01', 'E02', 'E03', 'E04', 'E06'];
export const MESH_EXCLUDED_SUBTREES = ['E02.319'];

export const isProcedureTree = (tn) =>
  MESH_PROCEDURE_ROOTS.some((r) => tn === r || tn.startsWith(`${r}.`)) && !MESH_EXCLUDED_SUBTREES.some((x) => tn === x || tn.startsWith(`${x}.`));

const text = (s) => decodeEntities(s).replace(/\s+/g, ' ').trim();

/** Un DescriptorRecord (texto XML) → { ui, name, trees, scopeNote, classCode } o null si no es un descriptor. */
export function parseDescriptorRecord(xml) {
  const ui = xml.match(/<DescriptorUI>(D\d+)<\/DescriptorUI>/)?.[1];
  if (!ui) return null;
  const name = text(xml.match(/<DescriptorName>\s*<String>([\s\S]*?)<\/String>/)?.[1] ?? '');
  const trees = [...xml.matchAll(/<TreeNumber>([^<]+)<\/TreeNumber>/g)].map((m) => m[1].trim());
  const preferred = xml.match(/<Concept PreferredConceptYN="Y"[\s\S]*?<\/Concept>/)?.[0] ?? '';
  const scope = preferred.match(/<ScopeNote>([\s\S]*?)<\/ScopeNote>/)?.[1];
  return { ui, name, trees, scopeNote: scope ? text(scope) : null, descriptorClass: xml.match(/<DescriptorRecord[^>]*DescriptorClass\s*=\s*"(\d)"/)?.[1] ?? null };
}

/** Lee desc2026.gz en streaming; devuelve todos los descriptores con árbol bajo E (para estadística) y la edición. */
export async function readMeshDescriptors(gzPath) {
  const rl = createInterface({ input: createReadStream(gzPath).pipe(createGunzip()), crlfDelay: Infinity });
  const all = [];
  let buf = null;
  let total = 0;
  let dtd = null;
  for await (const line of rl) {
    if (!dtd) dtd = line.match(/nlmdescriptorrecordset_(\d{8})\.dtd/)?.[1] ?? null;
    if (buf === null) {
      if (line.startsWith('<DescriptorRecord ')) buf = [line];
      continue;
    }
    buf.push(line);
    if (line.trim() === '</DescriptorRecord>') {
      total += 1;
      const d = parseDescriptorRecord(buf.join('\n'));
      if (d && d.trees.some((t) => t.startsWith('E'))) all.push(d);
      buf = null;
    }
  }
  return { descriptors: all, total, dtd };
}

/** Descriptores de procedimiento (según el árbol) como registros de concepto propio. */
export function meshProcedureRecords(descriptors, meta, uri) {
  const out = [];
  const stats = { descriptorsInTreeE: descriptors.length, included: 0, excludedByTree: 0, byRoot: {} };
  for (const d of descriptors) {
    const qualifying = d.trees.filter(isProcedureTree);
    if (!qualifying.length) {
      stats.excludedByTree += 1;
      continue;
    }
    stats.included += 1;
    for (const r of new Set(qualifying.map((t) => t.split('.')[0]))) stats.byRoot[r] = (stats.byRoot[r] ?? 0) + 1;
    out.push(
      procedureRecord({
        system: MESH_SYSTEM,
        code: d.ui,
        display: d.name,
        category: `mesh-${qualifying[0].slice(0, 3)}`,
        owned: true,
        meta,
        uri: `${uri}${d.ui}`,
        extra: { definition: d.scopeNote, properties: { mesh_tree_numbers: d.trees, mesh_procedure_tree_numbers: qualifying } },
      }),
    );
  }
  return { procedures: out, stats };
}
