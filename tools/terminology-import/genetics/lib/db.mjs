// =============================================================================
// Acceso a Postgres del cargador de genética. A diferencia de otros cargadores,
// `--apply` NO tiene valores por defecto: exige DB_HOST, DB_PORT, DB_USER y
// DB_NAME explícitos (los otros apuntan por defecto a 5433/mantra_redesa_health,
// la base del stack real).
// =============================================================================

const BATCH = 2000;

export function dbConfig(env = process.env) {
  const missing = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Falta ${missing.join(', ')}: --apply exige la conexión explícita (sin valores por defecto).`);
  return { host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME };
}

/** Inserta `tuples` en `terminology.<table>` (+ created_at/updated_at/row_version) con ON CONFLICT DO NOTHING; cuenta filas NUEVAS. */
export async function insertMany(client, table, columns, tuples, casts, { audit = true, schema = 'terminology' } = {}) {
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
    const sql = `INSERT INTO ${schema}.${table} (${cols.join(', ')}) VALUES ${values.join(',')} ON CONFLICT DO NOTHING`;
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
 * Fuente + code system + versión. Un code system que ya existe (mismo `internal_code` o misma URL canónica, únicos) se REUSA tal cual,
 * con su fuente: así `hgnc` y `sequence-ontology`, que también carga `dictionaries/`, quedan como un solo sistema con una versión por
 * importador. La versión nueva sólo es `is_default` si el sistema todavía no tiene una por defecto: no se le quita a otro importador.
 */
export async function ensureCodeSystem(client, plan, activeConceptId) {
  const find = () =>
    client.query(
      'SELECT id, source_id FROM terminology.code_systems WHERE internal_code = $1 OR canonical_url = $2 ORDER BY (internal_code = $1) DESC LIMIT 1',
      [plan.codeSystem.internalCode, plan.codeSystem.canonicalUrl],
    );
  let { rows: cs } = await find();
  let reused = cs.length > 0;
  if (!reused) {
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
    ({ rows: cs } = await find());
  }
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, checksum, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, NULL, $4,
             NOT EXISTS (SELECT 1 FROM terminology.code_system_versions d WHERE d.code_system_id = $2::uuid AND d.is_default),
             $5::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, plan.version.checksum, activeConceptId],
  );
  const { rows: csv } = await client.query('SELECT id, is_default FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  return { codeSystemId: cs[0].id, versionId: csv[0].id, sourceId: cs[0].source_id, reusedCodeSystem: reused, isDefault: csv[0].is_default };
}
