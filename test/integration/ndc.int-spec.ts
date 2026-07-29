import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL de la importación del NDC Directory (FDA) contra la base
 * de datos. Igual que loinc.int-spec.ts, NO re-ejecuta el importador completo
 * (particionar por product_type + rangos de fecha y paginar toma minutos y
 * golpea openFDA cientos de veces). Asume que
 * `tools/terminology-import/import-ndc.mjs` ya corrió contra esta misma base
 * de datos y verifica volumen + un spot-check contra la API en vivo.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

// El total real reportado por openFDA (`meta.results.total`) ronda 137,468;
// la estrategia de particionamiento por product_type + rango de fecha logró
// 134,748 (~98%) de forma estable (0 filas nuevas en corridas repetidas).
// Umbral conservador para detectar una importación vacía o gravemente
// incompleta sin acoplar el test a la cifra exacta.
const MIN_EXPECTED_CONCEPTS = 100000;

async function fetchLiveProduct(
  productNdc: string,
): Promise<{ brand_name?: string; generic_name?: string } | null> {
  const params = new URLSearchParams({
    search: `product_ndc:"${productNdc}"`,
    limit: '1',
  });
  const res = await fetch(`https://api.fda.gov/drug/ndc.json?${params.toString()}`);
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`openFDA respondió HTTP ${res.status} para product_ndc=${productNdc}`);
  const json = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const result = json.results?.[0];
  if (!result) return null;
  return {
    brand_name: result.brand_name as string | undefined,
    generic_name: result.generic_name as string | undefined,
  };
}

describe('Importación de NDC Directory / FDA (DB real vs. API openFDA en vivo)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it(`el catálogo 'ndc' tiene al menos ${MIN_EXPECTED_CONCEPTS} conceptos importados`, async () => {
    const { rows } = await db.query(`
      SELECT count(*)::int AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'ndc'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].n).toBeGreaterThanOrEqual(MIN_EXPECTED_CONCEPTS);
  });

  it('todos los códigos importados son product_ndc únicos (sin duplicados)', async () => {
    const { rows } = await db.query(`
      SELECT count(*)::int AS total, count(DISTINCT cc.code)::int AS distinct_codes
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'ndc'
    `);
    expect(rows[0].total).toBe(rows[0].distinct_codes);
  });

  it("el code_system 'ndc' está correctamente enlazado a la fuente FDA_NDC y tiene una versión por defecto", async () => {
    const { rows } = await db.query(`
      SELECT cs.internal_code, cs.canonical_url, ts.code AS source_code, csv.version, csv.is_default
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      JOIN terminology.code_system_versions csv ON csv.code_system_id = cs.id
      WHERE cs.internal_code = 'ndc' AND csv.is_default = true
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].source_code).toBe('FDA_NDC');
    expect(rows[0].canonical_url).toBe('http://hl7.org/fhir/sid/ndc');
  });

  it('un product_ndc conocido (0078-1525) existe con display consistente con la API en vivo', async () => {
    const { rows } = await db.query(
      `
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'ndc' AND cc.code = $1
    `,
      ['0078-1525'],
    );
    expect(rows).toHaveLength(1);

    const live = await fetchLiveProduct('0078-1525');
    expect(live).not.toBeNull();
    const liveDisplay = live?.brand_name || live?.generic_name;
    expect(rows[0].display).toBe(liveDisplay);
  }, 30000);

  it('el producto 0078-1525 tiene la propiedad manufacturer poblada', async () => {
    const { rows } = await db.query(`
      SELECT p.value_json #>> '{}' AS manufacturer
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'ndc' AND cc.code = '0078-1525' AND p.property_code = 'manufacturer'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].manufacturer).toBeTruthy();
  });

  it('el producto 0078-1525 tiene la propiedad active_ingredients como array no vacío', async () => {
    const { rows } = await db.query(`
      SELECT p.value_json AS active_ingredients
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'ndc' AND cc.code = '0078-1525' AND p.property_code = 'active_ingredients'
    `);
    expect(rows).toHaveLength(1);
    expect(Array.isArray(rows[0].active_ingredients)).toBe(true);
    expect(rows[0].active_ingredients.length).toBeGreaterThan(0);
  });
});
