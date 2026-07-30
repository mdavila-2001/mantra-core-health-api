import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del importador de NUCC Health Care Provider Taxonomy
 * (especialidades médicas) contra la base de datos.
 *
 * A diferencia de icd10cm/rxterms/hcpcs, este importador descarga un único
 * CSV (~530KB) sin paginación ni docenas de llamadas HTTP, así que es rápido
 * — pero igual NO se ejecuta en `beforeAll` (mismo patrón que el resto de
 * specs de terminología en esta carpeta) para no depender de red durante la
 * corrida de tests y para verificar el resultado ya persistido.
 *
 * Escala real de la fuente (NO inflada): NUCC Health Care Provider Taxonomy
 * es un catálogo intrínsecamente pequeño — no existen "cientos de miles" de
 * especialidades médicas reales. La corrida real descargó la versión vigente
 * del CSV (26.1, efectiva 7/1/2026 — la tarea original asumía la versión
 * 25.1/"251", que ya estaba desactualizada al momento de esta corrida) y
 * parseó 883 filas de datos, todas insertadas. El umbral usado abajo (800)
 * deja margen por debajo del conteo real logrado.
 *
 * El código/display siguiente fue verificado contra el CSV real (descargado
 * en vivo) antes de escribir este test:
 *   - 207R00000X = "Internal Medicine Physician" (Grouping: "Allopathic &
 *     Osteopathic Physicians", Classification: "Internal Medicine")
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('Importación de NUCC Health Care Provider Taxonomy (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('el catálogo nucc_taxonomy tiene más de 800 conceptos (especialidades) importados', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'nucc_taxonomy'
    `);
    const count = Number(rows[0].n);
    expect(count).toBeGreaterThan(800);
  });

  it('el código 207R00000X (Internal Medicine) existe con el display oficial', async () => {
    const { rows } = await db.query(
      `
      SELECT cc.code, cc.display, cc.definition
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'nucc_taxonomy'
        AND cc.code = '207R00000X'
      `,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].display).toBe('Internal Medicine Physician');
    expect(rows[0].definition).toContain('long-term, comprehensive care');
  });

  it('el código 207Q00000X (Family Medicine) existe', async () => {
    const { rows } = await db.query(
      `
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'nucc_taxonomy'
        AND cc.code = '207Q00000X'
      `,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].display).toBe('Family Medicine Physician');
  });

  it('el code_system_version de nucc_taxonomy está marcado como default', async () => {
    const { rows } = await db.query(`
      SELECT csv.version, csv.is_default
      FROM terminology.code_system_versions csv
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'nucc_taxonomy'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_default).toBe(true);
  });

  it('el terminology_sources NUCC existe con owner National Uniform Claim Committee', async () => {
    const { rows } = await db.query(`
      SELECT ts.code, ts.owner
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      WHERE cs.internal_code = 'nucc_taxonomy'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('NUCC');
    expect(rows[0].owner).toBe('National Uniform Claim Committee');
  });
});
