// =============================================================================
// Inserción de aristas `REL_IS_A` (filas de `hierarchyToRelationshipRows`) en
// `terminology.concept_relationships`. Compartida por los cargadores de F3.4 y
// F3.6. Todos los lotes van en la transacción del llamador, así `--dry-run`
// revierte todo; `ON CONFLICT DO NOTHING` cubre el id determinista y el índice
// único (origen, destino, tipo).
// =============================================================================

const COLUMNS = ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'];
const CASTS = ['uuid', 'uuid', 'uuid', 'uuid', 'int'];
const BATCH = 1000;

/** @returns {Promise<number>} filas realmente nuevas */
export async function insertIsARows(client, rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}::${CASTS[j]}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const res = await client.query(
      `INSERT INTO terminology.concept_relationships (${[...COLUMNS, 'created_at', 'updated_at', 'row_version'].join(', ')}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
}
