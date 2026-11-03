// =============================================================================
// Alcanzabilidad (TAREA-41 F3.7). Qué fracción de los conceptos cargados tiene
// ALGÚN camino para que alguien los vea: el defecto R-4 borró 1 441 367 filas de
// MeSH que nadie consultaba, y esta métrica es el candado contra repetirlo.
//
// Un concepto es **alcanzable** si cumple al menos una:
//   - relación: es origen o destino de una fila de `concept_relationships`
//     (cualquier tipo, incluida la jerarquía `REL_IS_A`), que es lo que lee el
//     vecindario del glosario;
//   - faceta: es miembro incluido de un value set (`value_set_members.included`),
//     que es como el glosario lo agrupa por categoría y etiqueta.
// Un **huérfano** no cumple ninguna. Los mapas a otros sistemas (`concept_maps`)
// no cuentan: llevan a un código, no a una pantalla; se informan aparte.
//
// Meta de la ficha: huérfanos < 15 %. Si son más, se informa y se decide si se
// cargan (no se borra nada acá: esto sólo mide).
// =============================================================================

export const ORPHAN_LIMIT_PERCENT = 15;

/** Una fila por sistema de códigos; sólo lectura. */
export const REACHABILITY_SQL = `
WITH rel AS (
  SELECT source_concept_id AS id FROM terminology.concept_relationships
  UNION
  SELECT target_concept_id FROM terminology.concept_relationships
), facet AS (
  SELECT DISTINCT concept_id AS id FROM terminology.value_set_members WHERE included
), mapped AS (
  SELECT DISTINCT source_concept_id AS id FROM terminology.concept_maps
)
SELECT cs.internal_code AS code_system,
       count(*)::int AS total,
       count(*) FILTER (WHERE r.id IS NOT NULL)::int AS with_relation,
       count(*) FILTER (WHERE f.id IS NOT NULL)::int AS with_facet,
       count(*) FILTER (WHERE r.id IS NULL AND f.id IS NULL)::int AS orphans,
       count(*) FILTER (WHERE r.id IS NULL AND f.id IS NULL AND m.id IS NOT NULL)::int AS orphans_with_map
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
  LEFT JOIN rel r ON r.id = c.id
  LEFT JOIN facet f ON f.id = c.id
  LEFT JOIN mapped m ON m.id = c.id
 GROUP BY cs.internal_code
 ORDER BY orphans DESC, cs.internal_code`;

const percent = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 10_000) / 100);

/**
 * Filas de `REACHABILITY_SQL` → resumen con porcentaje y veredicto por sistema y total.
 * @param {{ code_system: string, total: number, with_relation: number, with_facet: number, orphans: number, orphans_with_map: number }[]} rows
 */
export function summarizeReachability(rows, limit = ORPHAN_LIMIT_PERCENT) {
  const bySystem = rows.map((r) => ({
    codeSystem: r.code_system, total: r.total, withRelation: r.with_relation, withFacet: r.with_facet,
    orphans: r.orphans, orphansWithMap: r.orphans_with_map, orphanPercent: percent(r.orphans, r.total), withinLimit: percent(r.orphans, r.total) < limit,
  }));
  const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
  const total = sum('total');
  const orphans = sum('orphans');
  return {
    limitPercent: limit,
    total, withRelation: sum('with_relation'), withFacet: sum('with_facet'), orphans, orphansWithMap: sum('orphans_with_map'),
    orphanPercent: percent(orphans, total), withinLimit: percent(orphans, total) < limit,
    systemsOverLimit: bySystem.filter((s) => !s.withinLimit).map((s) => s.codeSystem),
    bySystem,
  };
}

export function reachabilityMarkdown(summary, { measuredAt, database }) {
  const n = (x) => Number(x).toLocaleString('es-ES').replace(/\./g, ' ');
  const pct = (x) => `${String(x).replace('.', ',')} %`;
  const head = '| Sistema de códigos | Conceptos | Con relación | Con faceta | Huérfanos | % huérfanos | Huérfanos con mapa |\n|---|---:|---:|---:|---:|---:|---:|';
  const body = summary.bySystem.map((s) => `| ${s.codeSystem} | ${n(s.total)} | ${n(s.withRelation)} | ${n(s.withFacet)} | ${n(s.orphans)} | ${pct(s.orphanPercent)}${s.withinLimit ? '' : ' ⚠'} | ${n(s.orphansWithMap)} |`);
  return `# Alcanzabilidad de los conceptos (F3.7)

Medido el ${measuredAt} sobre ${database}. Alcanzable = tiene relación o es miembro de una faceta (value set); ver \`lib/glossary-es/reachability.mjs\`.

**Total: ${n(summary.total)} conceptos · ${n(summary.orphans)} huérfanos = ${pct(summary.orphanPercent)}** (meta < ${summary.limitPercent} %): ${summary.withinLimit ? 'DENTRO de la meta' : 'FUERA de la meta'}.

${head}
${body.join('\n')}
`;
}
