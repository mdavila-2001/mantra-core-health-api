// =============================================================================
// Resolución de códigos contra conceptos YA cargados en `terminology.*`.
//
// `TARGETS` dice en qué code systems de la base se busca cada sistema de
// código de las afirmaciones. Sólo se listan code systems cuyos `code` son
// exactamente ese identificador (p. ej. `rxnorm_full` guarda RxCUI). Los de
// enfermedades de `justin/seed-diseases` se agregan con `--targets <json>`
// cuando esa rama declare sus `internal_code` (ver docs/seed-research/diseases.md):
// nada se adivina.
// =============================================================================

export const DEFAULT_TARGETS = {
  RXCUI: ['rxnorm_full', 'rxterms'],
  ICD10CM: ['icd10cm'],
  ATC: ['vademecum'],
};

/** Une los destinos por defecto con los de un archivo `{ "MESH": ["mesh"], ... }`. */
export function mergeTargets(extra = {}) {
  const out = Object.fromEntries(Object.entries(DEFAULT_TARGETS).map(([k, v]) => [k, [...v]]));
  for (const [k, v] of Object.entries(extra)) out[k] = [...new Set([...(out[k] ?? []), ...v])];
  return out;
}

/** Todos los códigos de una afirmación por sistema (los de la fuente y los de cruces). */
export function codesBySystem(assertions) {
  const by = new Map();
  for (const a of assertions) {
    for (const c of [...a.drug.codes, ...a.crosswalk.drug, ...a.condition.codes, ...a.crosswalk.condition]) {
      if (!by.has(c.system)) by.set(c.system, new Set());
      by.get(c.system).add(c.code);
    }
  }
  return by;
}

/**
 * Consulta la base: `SISTEMA:código` → [concept_id]. Por lotes de 5 000
 * códigos y sólo en los code systems configurados que existan.
 */
export async function resolveTargets(client, assertions, targets) {
  const { rows: present } = await client.query('SELECT internal_code FROM terminology.code_systems');
  const existing = new Set(present.map((r) => r.internal_code));
  const map = new Map();
  const used = {};
  for (const [system, codes] of codesBySystem(assertions)) {
    const systems = (targets[system] ?? []).filter((cs) => existing.has(cs));
    used[system] = systems;
    if (systems.length === 0) continue;
    const list = [...codes];
    for (let i = 0; i < list.length; i += 5000) {
      const { rows } = await client.query(
        `SELECT cc.id, cc.code FROM terminology.catalog_concepts cc
           JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
           JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
          WHERE cs.internal_code = ANY($1::varchar[]) AND cc.code = ANY($2::varchar[])`,
        [systems, list.slice(i, i + 5000)],
      );
      for (const r of rows) {
        const key = `${system}:${r.code}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r.id);
      }
    }
  }
  return { map, used, existingCodeSystems: [...existing].sort() };
}

/** Cuántas afirmaciones resuelven fármaco, enfermedad y ambos, por fuente. */
export function linkStats(assertions, map) {
  const has = (codes) => codes.some((c) => map.has(`${c.system}:${c.code}`));
  const out = {};
  for (const a of assertions) {
    const s = (out[a.source.key] ??= { assertions: 0, drug: 0, condition: 0, both: 0 });
    const d = !a.drug.combination && has([...a.drug.codes, ...a.crosswalk.drug]);
    const c = has([...a.condition.codes, ...a.crosswalk.condition]);
    s.assertions++;
    if (d) s.drug++;
    if (c) s.condition++;
    if (d && c) s.both++;
  }
  return out;
}
