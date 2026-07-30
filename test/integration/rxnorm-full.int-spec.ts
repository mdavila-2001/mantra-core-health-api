import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del importador de RxNorm COMPLETO (todos los TTY, vía
 * RxNav REST API pública de NLM) contra la base de datos.
 *
 * NO ejecuta el importador (mismo patrón que rxterms.int-spec.ts / icd10cm.int-spec.ts,
 * y por la misma razón): `tools/terminology-import/import-rxnorm-full.mjs`
 * hace 16 llamadas HTTP a la API pública RxNav de NLM (una por TTY, algunas
 * respuestas de hasta ~1.7 MB) y escribe más de 100,000 filas, así que no es
 * apto para correr en cada `beforeAll` de un test. Este spec asume que el
 * importador ya corrió contra esta misma base de datos y sólo verifica el
 * resultado.
 *
 * Metodología de importación (ver import-rxnorm-full.mjs para el detalle
 * completo): 1 request a `GET /REST/allconcepts.json?tty=<TTY>` por cada uno
 * de los 16 TTY estándar de RxNorm (IN, PIN, MIN, DF, DFG, SCDC, SCDF, SCDG,
 * SCD, SBDC, SBDF, SBDG, SBD, BN, BPCK, GPCK), todos validados empíricamente
 * como no-vacíos antes de codificar el importador. Deduplicación por RXCUI
 * global (0 colisiones observadas entre TTYs en la corrida real).
 *
 * Corrida real (2026-07-28): 110,177 RXCUIs únicos descubiertos e importados
 * como terminology.catalog_concepts bajo code_systems.internal_code=
 * 'rxnorm_full' (catálogo separado del 'rxterms' preexistente, que no fue
 * tocado — sigue en 19,356 conceptos). El umbral usado abajo (100,000) deja
 * margen por debajo del conteo real logrado, para que el test siga siendo
 * válido incluso si el catálogo público de RxNorm/RxNav encoge levemente en
 * el futuro. El importador se corrió una segunda vez completa y confirmó
 * idempotencia real: 0 catalog_concepts y 0 concept_properties nuevos en la
 * segunda corrida.
 *
 * Los RXCUIs/nombres siguientes fueron verificados contra la API NLM en vivo
 * (endpoint /REST/rxcui/<id>/property.json?propName=RxNorm%20Name) antes de
 * escribir este test (no asumidos):
 *   - RXCUI 197884 = "lisinopril 40 MG Oral Tablet" (tty=SCD)
 *   - RXCUI 29046  = "lisinopril" (tty=IN, ingrediente puro)
 *   - RXCUI 5640   = "ibuprofen" (tty=IN)
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('Importación de RxNorm completo (todos los TTY, vía RxNav REST) (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('el catálogo rxnorm_full tiene más de 100,000 conceptos (RXCUIs) importados', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxnorm_full'
    `);
    const count = Number(rows[0].n);
    expect(count).toBeGreaterThan(100000);
  });

  it.each([
    ['IN', 10000],
    ['SCD', 15000],
    ['SBD', 8000],
    ['BN', 4000],
  ])(
    'el TTY %s tiene más de %d conceptos con la propiedad term_type correspondiente',
    async (tty, minCount) => {
      const { rows } = await db.query(
        `
      SELECT count(*)::bigint AS n
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxnorm_full'
        AND p.property_code = 'term_type'
        AND p.value_json #>> '{}' = $1
      `,
        [tty],
      );
      expect(Number(rows[0].n)).toBeGreaterThan(minCount);
    },
  );

  it.each([
    ['197884', 'lisinopril 40 MG Oral Tablet', 'SCD'],
    ['29046', 'lisinopril', 'IN'],
    ['5640', 'ibuprofen', 'IN'],
  ])(
    'el RXCUI %s existe con display "%s" y term_type "%s"',
    async (rxcui, expectedDisplay, expectedTty) => {
      const { rows } = await db.query(
        `
      SELECT cc.code, cc.display, p.value_json #>> '{}' AS term_type
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      LEFT JOIN terminology.concept_properties p
        ON p.concept_id = cc.id AND p.property_code = 'term_type'
      WHERE cs.internal_code = 'rxnorm_full'
        AND cc.code = $1
      `,
        [rxcui],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].display).toBe(expectedDisplay);
      expect(rows[0].term_type).toBe(expectedTty);
    },
  );

  it('el code_system_version de rxnorm_full está marcado como default', async () => {
    const { rows } = await db.query(`
      SELECT csv.version, csv.is_default
      FROM terminology.code_system_versions csv
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'rxnorm_full'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_default).toBe(true);
  });

  it('el code_systems rxnorm_full reutiliza el terminology_sources RXNORM existente (no duplica la fuente)', async () => {
    const { rows } = await db.query(`
      SELECT ts.code AS source_code
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      WHERE cs.internal_code = 'rxnorm_full'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].source_code).toBe('RXNORM');

    const { rows: sourceRows } = await db.query(
      `SELECT count(*)::bigint AS n FROM terminology.terminology_sources WHERE code = 'RXNORM'`,
    );
    expect(Number(sourceRows[0].n)).toBe(1);
  });

  it('rxnorm_full es un catálogo separado de rxterms: ambos coexisten y rxterms conserva su conteo previo (>15,000)', async () => {
    const { rows } = await db.query(`
      SELECT cs.internal_code, count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code IN ('rxterms', 'rxnorm_full')
      GROUP BY cs.internal_code
    `);
    const byCode = Object.fromEntries(
      rows.map((r) => [r.internal_code, Number(r.n)]),
    );
    expect(byCode.rxterms).toBeGreaterThan(15000);
    expect(byCode.rxnorm_full).toBeGreaterThan(100000);
  });
});
