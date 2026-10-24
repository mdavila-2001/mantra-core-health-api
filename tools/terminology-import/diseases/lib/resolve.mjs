// =============================================================================
// Resolución de alineamientos: cada xref apunta a un concepto de este catálogo
// (`internal`), a una clave cruzada que se crea acá (`key`), a otro importador
// (`external`) o a nada que se haya cargado (`unresolved`, se cuenta y no se
// inserta: no se fabrica el destino de una ontología).
// =============================================================================

import { KEY_VERSION, SYSTEMS } from './code-systems.mjs';

/** Crea los conceptos de clave cruzada y marca cada xref como resuelto o no. */
export function resolveXrefs(records) {
  const real = new Set(records.map((r) => `${r.cs}|${r.code}`));
  const keys = new Map();
  const unresolved = {};
  for (const r of records) {
    for (const x of r.xrefs) {
      const id = `${x.cs}|${x.code}`;
      if (x.external) {
        x.resolution = 'external';
      } else if (SYSTEMS[x.cs]?.keyOnly) {
        x.resolution = 'key';
        if (!keys.has(id)) keys.set(id, { cs: x.cs, code: x.code, citedBy: {} });
        const k = keys.get(id);
        k.citedBy[r.cs] = (k.citedBy[r.cs] ?? 0) + 1;
      } else if (real.has(id)) {
        x.resolution = 'internal';
      } else {
        x.resolution = 'unresolved';
        unresolved[`${r.cs}→${x.cs}`] = (unresolved[`${r.cs}→${x.cs}`] ?? 0) + 1;
      }
    }
  }
  const keyRecords = [...keys.values()].map((k) => ({
    cs: k.cs,
    code: k.code,
    display: k.code,
    lang: null,
    definition: null,
    definitionLang: null,
    definitionRefs: [],
    designations: [],
    parents: [],
    status: 'active',
    replacedBy: null,
    properties: { disease_xref_key: { displayIsCode: true, citedBy: k.citedBy } },
    xrefs: [],
    provenance: {
      source: SYSTEMS[k.cs].name,
      sourceId: k.code,
      version: KEY_VERSION,
      uri: SYSTEMS[k.cs].uri(k.code),
      file: null,
      license: SYSTEMS[k.cs].license,
      note: 'Código citado por un alineamiento publicado; sin título propio.',
    },
  }));
  return { keyRecords, unresolved };
}
