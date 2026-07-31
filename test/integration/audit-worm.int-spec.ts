import 'dotenv/config';
import pg from 'pg';
import { CONCEPTS, SEED } from '../../src/common';

/**
 * Verificación REAL de tamper-RESISTANCE (CAN-AUDIT-001 / C-19) contra la base
 * de datos: `database/SQL/99_migrations/2026-07-28_audit_worm_guard.sql`
 * instala triggers que rechazan UPDATE/DELETE sobre `audit.audit_log` (las dos
 * operaciones) y UPDATE sobre `audit.data_access_log` (DELETE se reserva para
 * la purga de retención, UC-10-09), sea cual sea el rol — incluido el
 * propietario del esquema.
 *
 * Hasta ahora esa garantía sólo se demostraba con mocks (la cadena hash da
 * tamper-EVIDENCE, no prueba que la base la haga cumplir). Esta prueba conecta
 * como el propio rol propietario (`DB_USER`, el más privilegiado posible) e
 * inserta una fila real; si el trigger fallara o se hubiera desinstalado, la
 * mutación se aceptaría en silencio y esta prueba lo detectaría.
 *
 * No es opt-in (a diferencia de `rls.int-spec.ts`): no aplica ninguna
 * migración, sólo comprueba una que ya es parte del esquema base.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('WORM de audit.audit_log / audit.data_access_log (DB real)', () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client(ADMIN);
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('rechaza UPDATE y DELETE sobre una fila real de audit_log, incluso como propietario', async () => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO audit.audit_log
         (id, user_id, action, entity, outcome_concept_id, record_hash, recorded_at, recorded_by_user_id)
       VALUES (gen_random_uuid(), $1, 'WORM_PROBE', 'worm_test_probe', $2, 'probe-hash', now(), $1)
       RETURNING id`,
      [SEED.systemWorkerUserId, CONCEPTS.OUTCOME_SUCCESS],
    );
    const id = rows[0].id;

    await expect(
      client.query("UPDATE audit.audit_log SET action='HACKED' WHERE id=$1", [
        id,
      ]),
    ).rejects.toThrow(/WORM/);

    await expect(
      client.query('DELETE FROM audit.audit_log WHERE id=$1', [id]),
    ).rejects.toThrow(/WORM/);

    // La fila sigue intacta y sin poder borrarse — es el comportamiento
    // esperado, no un residuo de la prueba: audit_log es append-only por
    // diseño y este probe queda como evidencia permanente, minúscula e
    // identificable (`entity='worm_test_probe'`), de que el trigger corrió.
    const { rows: after } = await client.query(
      'SELECT action FROM audit.audit_log WHERE id=$1',
      [id],
    );
    expect(after[0].action).toBe('WORM_PROBE');
  });

  it('rechaza UPDATE sobre una fila real de data_access_log, pero permite el DELETE de retención', async () => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO audit.data_access_log
         (id, user_id, action_concept_id, recorded_at, recorded_by_user_id)
       VALUES (gen_random_uuid(), $1, $2, now(), $1)
       RETURNING id`,
      [SEED.systemWorkerUserId, CONCEPTS.OUTCOME_SUCCESS],
    );
    const id = rows[0].id;

    await expect(
      client.query(
        "UPDATE audit.data_access_log SET resource_type='HACKED' WHERE id=$1",
        [id],
      ),
    ).rejects.toThrow(/append-only/);

    // A diferencia de audit_log, el DELETE por retención SÍ está permitido —
    // se limpia el probe para no dejar residuo, y de paso se prueba que el
    // guard no bloquea la operación que la retención necesita.
    await client.query('DELETE FROM audit.data_access_log WHERE id=$1', [id]);
    const { rows: after } = await client.query(
      'SELECT 1 FROM audit.data_access_log WHERE id=$1',
      [id],
    );
    expect(after).toHaveLength(0);
  });
});
