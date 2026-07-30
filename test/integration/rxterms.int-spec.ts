import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del importador de RxTerms contra la base de datos.
 *
 * NO ejecuta el importador (mismo patrón que icd10cm.int-spec.ts, y por la
 * misma razón): `tools/terminology-import/import-rxterms.mjs` hace ~80
 * llamadas HTTP a la API pública de NLM Clinical Table Search Service y
 * escribe decenas de miles de filas, así que no es apto para correr en cada
 * `beforeAll` de un test. Este spec asume que el importador ya corrió contra
 * esta misma base de datos y sólo verifica el resultado.
 *
 * Metodología de importación (ver tools/terminology-import/import-rxterms.mjs
 * para el detalle completo): enumeración sistemática por 36 prefijos de un
 * solo carácter (a-z, 0-9) sobre la búsqueda por prefijo de token de RxTerms,
 * deduplicando por RXCUI real. Corrida real (2026-07-28): 19,356 RXCUIs
 * únicos descubiertos e importados como terminology.catalog_concepts, todos
 * con código = RXCUI oficial de RxNorm/RxTerms (NLM). El umbral usado abajo
 * (15,000) deja margen de sobra por debajo del conteo real logrado, para que
 * el test siga siendo válido incluso si el catálogo público de RxTerms
 * encoge levemente en el futuro.
 *
 * Los 3 códigos/displays siguientes fueron verificados contra la API NLM en
 * vivo antes de escribir este test (no asumidos):
 *   - RXCUI 311354 = "Lisinopril (Oral Pill) 5 mg Tab"
 *   - RXCUI 314076 = "Lisinopril (Oral Pill) 10 mg Tab"
 *   - RXCUI 861007 = "metFORMIN (Oral Pill) 500 mg Tab"
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('Importación de RxTerms / medicamentos RxNorm (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('el catálogo rxterms tiene más de 15,000 conceptos (RXCUIs) importados', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxterms'
    `);
    const count = Number(rows[0].n);
    expect(count).toBeGreaterThan(15000);
  });

  it.each([
    ['311354', 'Lisinopril (Oral Pill) 5 mg Tab'],
    ['314076', 'Lisinopril (Oral Pill) 10 mg Tab'],
    ['861007', 'metFORMIN (Oral Pill) 500 mg Tab'],
  ])('el RXCUI %s existe con display "%s"', async (rxcui, expectedDisplay) => {
    const { rows } = await db.query(
      `
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxterms'
        AND cc.code = $1
      `,
      [rxcui],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].display).toBe(expectedDisplay);
  });

  it('el RXCUI 311354 (lisinopril 5 mg) tiene la propiedad strength_and_form correcta', async () => {
    const { rows } = await db.query(`
      SELECT p.value_json #>> '{}' AS strength_and_form
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxterms'
        AND cc.code = '311354'
        AND p.property_code = 'strength_and_form'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].strength_and_form).toBe('5 mg Tab');
  });

  it('el code_system_version de rxterms está marcado como default', async () => {
    const { rows } = await db.query(`
      SELECT csv.version, csv.is_default
      FROM terminology.code_system_versions csv
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxterms'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_default).toBe(true);
  });

  it('el code_systems rxterms reutiliza el terminology_sources RXNORM existente (no duplica la fuente)', async () => {
    const { rows } = await db.query(`
      SELECT ts.code AS source_code, count(*) OVER () AS source_row_count
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      WHERE cs.internal_code = 'rxterms'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].source_code).toBe('RXNORM');

    const { rows: sourceRows } = await db.query(
      `SELECT count(*)::bigint AS n FROM terminology.terminology_sources WHERE code = 'RXNORM'`,
    );
    expect(Number(sourceRows[0].n)).toBe(1);
  });
});
