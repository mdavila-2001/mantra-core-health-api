import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL de la importación de LOINC contra la base de datos.
 *
 * A diferencia de vademecum.int-spec.ts (que aplica un .sql pequeño en
 * beforeAll), este test NO re-ejecuta el importador completo (recorrer todo
 * el árbol de prefijos de LOINC tarda minutos y golpea la API pública
 * cientos de veces; no es apropiado para un beforeAll de test). Asume que
 * `tools/terminology-import/import-loinc.mjs` ya corrió contra esta misma
 * base de datos y verifica:
 *
 *   1. El volumen total importado supera un umbral razonable (bien por
 *      debajo del total real esperado, para tolerar reintentos parciales o
 *      variaciones menores de la API entre corridas, pero suficientemente
 *      alto para detectar una importación vacía o gravemente incompleta).
 *   2. 3 códigos LOINC muy conocidos (Glucosa, Creatinina, Hemoglobina)
 *      existen en el catálogo con el código correcto, Y su `display`
 *      coincide EXACTAMENTE con el SHORTNAME que reporta la API en vivo en
 *      este momento (consulta puntual, no bulk) — esto valida no sólo que
 *      el dato existe, sino que es fiel a la fuente oficial.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

// Umbral conservador: la exploración empírica de la API (suma de totales por
// hoja del árbol de prefijos LOINC_NUM) reportó un total real del orden de
// ~100k códigos, muy por encima del ejemplo base de ~78,739 usado sólo para
// validar que la API responde sin cuenta. 40,000 es un umbral que detecta
// con margen una importación vacía, abortada muy temprano, o rota, sin
// acoplar el test a la cifra exacta (que puede variar levemente entre
// corridas de NLM).
const MIN_EXPECTED_CONCEPTS = 40000;

const KNOWN_CODES = [
  { code: '2345-7', hint: 'glucose' },
  { code: '2160-0', hint: 'creatinine' },
  { code: '718-7', hint: 'hemoglobin' },
];

async function fetchLiveShortName(code: string): Promise<string | null> {
  const params = new URLSearchParams({
    terms: code,
    sf: 'LOINC_NUM',
    ef: 'SHORTNAME',
    maxList: '1',
  });
  const res = await fetch(
    `https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?${params.toString()}`,
  );
  if (!res.ok)
    throw new Error(`LOINC API respondió HTTP ${res.status} para code=${code}`);
  // Cuando se pasa `ef=`, la forma de la respuesta es
  // [total, codes, efObject, displayList] — el objeto de campos extra va en
  // el índice 2, NO en el 3 (verificado empíricamente contra la API real).
  const json = (await res.json()) as [
    number,
    string[],
    { SHORTNAME: string[] },
  ];
  const [total, codes, ef] = json;
  if (total === 0 || codes.length === 0) return null;
  const idx = codes.indexOf(code);
  if (idx === -1) return null;
  return ef.SHORTNAME[idx] ?? null;
}

describe('Importación de LOINC (DB real vs. API NLM en vivo)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();
  }, 30000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it(`el catálogo 'loinc' tiene al menos ${MIN_EXPECTED_CONCEPTS} conceptos importados`, async () => {
    const { rows } = await db.query(`
      SELECT count(*)::int AS n
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'loinc'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].n).toBeGreaterThanOrEqual(MIN_EXPECTED_CONCEPTS);
  });

  it("el code_system 'loinc' está correctamente enlazado a su fuente LOINC y tiene una versión por defecto", async () => {
    const { rows } = await db.query(`
      SELECT cs.internal_code, cs.canonical_url, ts.code AS source_code, csv.version, csv.is_default
      FROM terminology.code_systems cs
      JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
      JOIN terminology.code_system_versions csv ON csv.code_system_id = cs.id
      WHERE cs.internal_code = 'loinc' AND csv.is_default = true
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].source_code).toBe('LOINC');
    expect(rows[0].canonical_url).toBe('http://loinc.org');
  });

  it.each(KNOWN_CODES)(
    'el código LOINC $code ($hint) existe y su display coincide con la API en vivo',
    async ({ code }) => {
      const liveShortName = await fetchLiveShortName(code);
      expect(liveShortName).not.toBeNull();

      const { rows } = await db.query(
        `
        SELECT cc.code, cc.display
        FROM terminology.catalog_concepts cc
        JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
        JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        WHERE cs.internal_code = 'loinc' AND cc.code = $1
      `,
        [code],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].code).toBe(code);
      expect(rows[0].display).toBe(liveShortName);
    },
    30000,
  );

  it('el código LOINC 2345-7 (Glucosa) tiene la propiedad component con valor "Glucose"', async () => {
    const { rows } = await db.query(`
      SELECT p.value_json #>> '{}' AS component
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'loinc' AND cc.code = '2345-7' AND p.property_code = 'component'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].component).toBe('Glucose');
  });
});
