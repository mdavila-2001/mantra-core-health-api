// =============================================================================
// Resolución de alineamientos: cada xref apunta a un concepto de este catálogo
// (`internal`), a una clave cruzada que se crea acá (`key`), a otro importador
// (`external`) o a nada que se haya cargado (`unresolved`, se cuenta y no se
// inserta: no se fabrica el destino de una ontología).
//
// Las claves cruzadas nacen de dos lados: los xref de las ontologías y las
// «citas» de fuentes que sólo nombran códigos (`citations.mjs`). Una clave
// guarda quién la cita (`citedBy`) para poder medir qué aporta cada pasada.
// =============================================================================

import { KEY_VERSION, SYSTEMS } from './code-systems.mjs';

/**
 * Sistema de respaldo: si un código citado como `ncit-disease` no está en C2991, se busca en `ncit-xref`
 * (los conceptos de NCIt que citan las fuentes de enfermedades y quedan fuera de ese subárbol, o retirados).
 */
const FALLBACK_SYSTEM = { 'ncit-disease': 'ncit-xref' };
/** Un sistema admite claves (código sin nombre) si es sólo-clave o tiene respaldo de claves (MeSH). */
const admitsKeys = (cs) => Boolean(SYSTEMS[cs]?.keyOnly || SYSTEMS[cs]?.keyFallback);

function keyRecord(cs, code) {
  return {
    cs,
    code,
    display: code,
    lang: null,
    definition: null,
    definitionLang: null,
    definitionRefs: [],
    designations: [],
    parents: [],
    status: 'active',
    replacedBy: null,
    properties: { disease_xref_key: { displayIsCode: true, citedBy: {} } },
    xrefs: [],
    provenance: { source: SYSTEMS[cs].sourceCode, sourceId: code, version: KEY_VERSION, uri: SYSTEMS[cs].uri(code), retrievedAt: null },
  };
}

/**
 * @param records registros de las ontologías
 * @param citations { [citer]: [{ cs, code }] }
 * @param seeded claves que ya traen alineamientos (y propiedades) propios (p. ej. CIE-10 → CIE-11 de la OMS), con `citer`
 * @param notes `{ '<cs>|<code>': { reason, replacedBy } }`: qué dice la propia fuente de un código que ya no existe
 *   (p. ej. una clase EFO obsoleta con su reemplazo); se agrega al xref sin resolver, no crea ningún cruce.
 */
export function resolveXrefs(records, citations = {}, seeded = [], notes = {}) {
  const real = new Set(records.map((r) => `${r.cs}|${r.code}`));
  const targetKind = (x) => {
    if (real.has(`${x.cs}|${x.code}`)) return 'internal';
    const fb = FALLBACK_SYSTEM[x.cs];
    if (fb && real.has(`${fb}|${x.code}`)) {
      x.cs = fb;
      return 'internal';
    }
    return admitsKeys(x.cs) ? 'key' : 'unresolved';
  };
  const keys = new Map();
  const unresolved = {};
  const citationStats = {};
  const touchKey = (cs, code, citer) => {
    const id = `${cs}|${code}`;
    if (!keys.has(id)) keys.set(id, keyRecord(cs, code));
    const cited = keys.get(id).properties.disease_xref_key.citedBy;
    cited[citer] = (cited[citer] ?? 0) + 1;
    return keys.get(id);
  };
  for (const s of seeded) {
    const k = touchKey(s.cs, s.code, s.citer);
    k.xrefs.push(...s.xrefs);
    Object.assign(k.properties, s.properties ?? {});
  }
  for (const r of records) {
    for (const x of r.xrefs) {
      if (x.external) {
        x.resolution = 'external';
        continue;
      }
      const kind = targetKind(x);
      if (kind === 'internal') x.resolution = 'internal';
      else if (kind === 'key') {
        x.resolution = 'key';
        touchKey(x.cs, x.code, r.cs);
      } else {
        x.resolution = 'unresolved';
        unresolved[`${r.cs}→${x.cs}`] = (unresolved[`${r.cs}→${x.cs}`] ?? 0) + 1;
        // El alineamiento publicado se conserva como referencia aunque no haya concepto destino.
        const note = notes[`${x.cs}|${x.code}`];
        (r.properties.disease_unresolved_xrefs ??= []).push({ cs: x.cs, code: x.code, context: x.context, ...(note ? { sourceSays: note } : {}) });
      }
    }
  }
  // Xrefs de las claves sembradas (sólo hacia sistemas con nomenclatura propia).
  for (const k of keys.values()) {
    for (const x of k.xrefs) {
      if (real.has(`${x.cs}|${x.code}`)) x.resolution = 'internal';
      else {
        x.resolution = 'unresolved';
        unresolved[`${k.cs}→${x.cs}`] = (unresolved[`${k.cs}→${x.cs}`] ?? 0) + 1;
      }
    }
  }
  for (const [citer, list] of Object.entries(citations)) {
    const st = (citationStats[citer] = { cited: list.length, existing: 0, keys: 0, unresolved: 0 });
    for (const c of list) {
      if (real.has(`${c.cs}|${c.code}`)) st.existing += 1;
      else if (admitsKeys(c.cs)) {
        touchKey(c.cs, c.code, citer);
        st.keys += 1;
      } else st.unresolved += 1;
    }
  }
  return { keyRecords: [...keys.values()], unresolved, citationStats };
}
