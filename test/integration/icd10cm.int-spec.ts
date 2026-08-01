import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del importador de ICD-10-CM contra la base de datos.
 *
 * NO ejecuta el importador (a diferencia de vademecum.int-spec.ts, que aplica
 * un .sql idempotente en cada corrida): `tools/terminology-import/import-icd10cm.mjs`
 * hace ~2000-3000 llamadas HTTP a la API pública de NLM y tarda minutos, así
 * que no es apto para correr en cada `beforeAll` de un test. Este spec asume
 * que el importador ya corrió contra esta misma base de datos (ver README /
 * reporte de la sesión que lo ejecutó) y sólo verifica el resultado:
 *   1. El conteo total de conceptos ICD-10-CM supera 70,000 filas.
 *   2. 3 códigos conocidos existen con su display oficial exacto (verificado
 *      contra la API NLM en vivo antes de escribir este test, no asumido):
 *        - E11.9  = "Type 2 diabetes mellitus without complications"
 *        - I10    = "Essential (primary) hypertension"
 *        - J45.909 = "Unspecified asthma, uncomplicated"
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const describeDataset =
  process.env.TERMINOLOGY_DATASET_TESTS === '1' ? describe : describe.skip;

describeDataset('Importación de ICD-10-CM (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('el catálogo ICD-10-CM tiene más de 70,000 conceptos importados', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'icd10cm'
    `);
    const count = Number(rows[0].n);
    expect(count).toBeGreaterThan(70000);
  });

  it.each([
    ['E11.9', 'Type 2 diabetes mellitus without complications'],
    ['I10', 'Essential (primary) hypertension'],
    ['J45.909', 'Unspecified asthma, uncomplicated'],
  ])('el código %s existe con display "%s"', async (code, expectedDisplay) => {
    const { rows } = await db.query(
      `
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'icd10cm'
        AND cc.code = $1
      `,
      [code],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].display).toBe(expectedDisplay);
  });

  it('el code_system_version de icd10cm está marcado como default', async () => {
    const { rows } = await db.query(`
      SELECT csv.version, csv.is_default
      FROM terminology.code_system_versions csv
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'icd10cm'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_default).toBe(true);
  });
});
