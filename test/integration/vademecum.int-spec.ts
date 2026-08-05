import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

/**
 * Verificación REAL del seed de VADEMÉCUM contra la base de datos.
 *
 * Aplica `database/SQL/98_seeds/vademecum_medications.sql`, desde la raíz del
 * repositorio (idempotente: usa UUIDs deterministas y `ON CONFLICT DO NOTHING`),
 * y comprueba que:
 *   1. La vancomicina existe como concepto con su código ATC J01XA01.
 *   2. Tiene la propiedad rxnorm_cui = 11124.
 *   3. Existe la interacción Vancomicina + Gentamicina.
 *
 * La prueba re-aplica el SQL en cada corrida, así que es repetible sin duplicar.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('Seed de Vademécum de medicamentos (DB real)', () => {
  let db: pg.Client;

  beforeAll(async () => {
    db = new pg.Client(ADMIN);
    await db.connect();

    // Aplica el seed (idempotente).
    const sql = readFileSync(
      join(
        process.cwd(),
        'database',
        'SQL',
        '98_seeds',
        'vademecum_medications.sql',
      ),
      'utf8',
    );
    await db.query(sql);
  }, 120000);

  afterAll(async () => {
    if (db) await db.end();
  });

  it('la vancomicina existe con su código ATC J01XA01 en el catálogo vademecum', async () => {
    const { rows } = await db.query(`
      SELECT cc.code, cc.display
      FROM terminology.catalog_concepts cc
      JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
      WHERE cs.internal_code = 'vademecum'
        AND cc.display ILIKE 'vancomycin'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('J01XA01');
  });

  it('la vancomicina tiene la propiedad rxnorm_cui = 11124', async () => {
    const { rows } = await db.query(`
      SELECT p.value_json #>> '{}' AS rxnorm
      FROM terminology.concept_properties p
      JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
      WHERE cc.display ILIKE 'vancomycin'
        AND cc.code = 'J01XA01'
        AND p.property_code = 'rxnorm_cui'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].rxnorm).toBe('11124');
  });

  it('existe la interacción Vancomicina + Gentamicina', async () => {
    const { rows } = await db.query(`
      SELECT di.severity_concept_id
      FROM clinical_ext.drug_interactions di
      JOIN terminology.catalog_concepts a ON a.id = di.substance_a_concept_id
      JOIN terminology.catalog_concepts b ON b.id = di.substance_b_concept_id
      WHERE a.code = 'J01XA01' AND b.code = 'J01GB03'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].severity_concept_id).toBeTruthy();
  });
});
