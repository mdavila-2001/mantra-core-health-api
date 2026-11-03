// =============================================================================
// Acceso a Postgres de los cargadores de síntomas: configuración por `.env`
// (`DB_*`, igual que el resto de `tools/terminology-import/`) e inserción por
// lotes con `ON CONFLICT DO NOTHING`. Cuenta filas NUEVAS: 0 en la segunda
// corrida = idempotente.
// =============================================================================

export const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const BATCH = 1000;

/**
 * Inserta `tuples` en `terminology.<table>` agregando created_at/updated_at/
 * row_version (salvo `audit: false`). Cada lote va en su propia transacción.
 */
export async function insertMany(client, table, columns, tuples, casts, { audit = true, conflict = 'ON CONFLICT DO NOTHING', schema = 'terminology' } = {}) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}${audit ? ', now(), now(), 1' : ''})`;
    });
    const cols = audit ? [...columns, 'created_at', 'updated_at', 'row_version'] : columns;
    const sql = `INSERT INTO ${schema}.${table} (${cols.join(', ')}) VALUES ${values.join(',\n')} ${conflict}`;
    await client.query('BEGIN');
    try {
      const res = await client.query(sql, params);
      await client.query('COMMIT');
      inserted += res.rowCount;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`);
    }
  }
  return inserted;
}

/**
 * Fuente + code system + versión, reusando las filas que ya existan (otra
 * corrida, u otro importador que cargó el mismo sistema con otro id): el code
 * system se busca por `internal_code` o por `canonical_url`, que son únicos.
 */
export async function ensureCodeSystem(client, plan, activeConceptId) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.source.id, plan.source.code, plan.source.name, plan.source.owner, plan.source.officialUrl, plan.source.license, activeConceptId],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [plan.source.code]);
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, false, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.codeSystem.id, src[0].id, plan.codeSystem.internalCode, plan.codeSystem.name, plan.codeSystem.canonicalUrl, plan.codeSystem.caseSensitive, activeConceptId],
  );
  const { rows: cs } = await client.query(
    'SELECT id, internal_code FROM terminology.code_systems WHERE internal_code = $1 OR canonical_url = $2 ORDER BY (internal_code = $1) DESC LIMIT 1',
    [plan.codeSystem.internalCode, plan.codeSystem.canonicalUrl],
  );
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, activeConceptId],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  return { sourceId: src[0].id, codeSystemId: cs[0].id, codeSystemInternalCode: cs[0].internal_code, versionId: csv[0].id };
}

/** code → id real de los conceptos de una versión (por si otra carga los creó con otro id). */
export async function conceptIdsByCode(client, versionId) {
  const { rows } = await client.query('SELECT id, code FROM terminology.catalog_concepts WHERE code_system_version_id = $1', [versionId]);
  return new Map(rows.map((r) => [r.code, r.id]));
}
