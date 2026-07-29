import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del importador de HCPCS Level II contra la base de datos.
 *
 * NO ejecuta el importador (mismo patrón que icd10cm.int-spec.ts y
 * rxterms.int-spec.ts): `tools/terminology-import/import-hcpcs.mjs` hace
 * ~400 llamadas HTTP a la API pública de NLM Clinical Table Search Service y
 * tarda ~2-3 minutos, así que no es apto para correr en cada `beforeAll` de
 * un test. Este spec asume que el importador ya corrió contra esta misma
 * base de datos y sólo verifica el resultado.
 *
 * Escala real de la fuente (NO inflada): HCPCS Level II es un catálogo
 * intrínsecamente pequeño comparado con ICD-10-CM/RxTerms — el total
 * reportado por la API sin filtro es 8893. La corrida real descubrió menos
 * códigos únicos que ese total bruto porque la tabla fuente de NLM tiene, en
 * un subconjunto de códigos, DOS filas físicas duplicadas para el mismo
 * código (verificado con B4185/B9998/B9999: total=54 para el prefijo "B"
 * pero sólo 51 códigos únicos) — un artefacto de la fuente, no del
 * importador. El umbral usado abajo (8000) deja margen amplio por debajo del
 * conteo real logrado.
 *
 * Los códigos/descripciones siguientes fueron verificados contra la API NLM
 * en vivo antes de escribir este test (no asumidos), pidiendo explícitamente
 * el campo `short_desc` oficial de CMS (el que se usa como `display`):
 *   - A0021 = "Ambulance service, outside state per mile, transport (medicaid only)"
 *     -> short_desc real: "Outside state ambulance serv"
 *   - E1130 = "Standard wheelchair, fixed full length arms, fixed or swing away
 *     detachable footrests" -> short_desc real: "Whlchr stand fxd arm ft rest"
 *   - G0008 = "Administration of influenza virus vaccine" -> short_desc real:
 *     "Admin influenza virus vac"
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('Importación de HCPCS Level II (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('el catálogo hcpcs tiene más de 8,000 conceptos importados', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'hcpcs'
    `);
    const count = Number(rows[0].n);
    expect(count).toBeGreaterThan(8000);
  });

  it.each([
    ['A0021', 'Outside state ambulance serv'],
    ['E1130', 'Whlchr stand fxd arm ft rest'],
    ['G0008', 'Admin influenza virus vac'],
  ])(
    'el código %s existe con display (short_desc oficial) "%s"',
    async (code, expectedDisplay) => {
      const { rows } = await db.query(
        `
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'hcpcs'
        AND cc.code = $1
      `,
        [code],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].display).toBe(expectedDisplay);
    },
  );

  it('el código A0021 tiene la definition (long_desc oficial) correcta', async () => {
    const { rows } = await db.query(
      `
      SELECT cc.definition
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'hcpcs'
        AND cc.code = 'A0021'
      `,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].definition).toBe(
      'Ambulance service, outside state per mile, transport (medicaid only)',
    );
  });

  it('ningún display de hcpcs excede el límite físico de un índice btree (evita el bug de índice reproducido durante la importación)', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::bigint AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'hcpcs' AND length(cc.display) > 200
    `);
    expect(Number(rows[0].n)).toBe(0);
  });

  it('el code_system_version de hcpcs está marcado como default', async () => {
    const { rows } = await db.query(`
      SELECT csv.version, csv.is_default
      FROM terminology.code_system_versions csv
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'hcpcs'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_default).toBe(true);
  });

  it('el terminology_sources HCPCS existe con owner CMS', async () => {
    const { rows } = await db.query(`
      SELECT ts.code, ts.owner
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      WHERE cs.internal_code = 'hcpcs'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('HCPCS');
    expect(rows[0].owner).toBe(
      'Centers for Medicare & Medicaid Services (CMS)',
    );
  });
});
