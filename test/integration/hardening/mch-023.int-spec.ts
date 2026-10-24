import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  type TestContext,
} from '../harness';
import { CONCEPTS, SEED } from '../../../src/common';
import { SYSOPS } from '../../../src/modules/system_ops/system_ops.concepts';
import { RestoreObjectiveStatus } from '../../../src/modules/system_ops/policies';

/**
 * MCH-023 · el resultado de una restauración distingue «no se midió» de «cumple»,
 * contra PostgreSQL.
 *
 * Las unitarias del servicio ya cubren la lógica con un repositorio simulado.
 * Acá se prueba lo que un mock no puede: que el estado **llega a la base** y que
 * la base **defiende el contrato**. La ficha pide explícitamente que DTO,
 * servicio y persistencia compartan los mismos tres estados y que se prueben los
 * tres; el tercero sólo se prueba contra un motor real.
 *
 * También se ejercita MCH-022 por HTTP: la política que antes era imposible de
 * guardar (`RPO=3600` con `RTO=900`) es la que usan todos los casos de abajo.
 *
 * No trunca ni borra nada ajeno: las políticas llevan un sufijo propio de la
 * corrida. Las corridas de restauración son append-only, igual que en
 * producción, y no se borran.
 */
describe('MCH-023 · lo no medido se registra como no medido (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);

  /** RPO mayor que el RTO: la política que la validación vieja rechazaba. */
  const RPO_OBJETIVO = 3600;
  const RTO_OBJETIVO = 900;

  let policyId: string;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  /** Registra una corrida por HTTP y devuelve la respuesta cruda. */
  function registrarCorrida(cuerpo: Record<string, unknown>) {
    return http()
      .post('/internal/ops/restore-test-runs')
      .set(bearer(ctx.adminToken))
      .send({ backupPolicyId: policyId, ...cuerpo });
  }

  /** Lee de la base el estado persistido de una corrida. */
  async function estadoPersistido(runId: string): Promise<string> {
    const [row] = await sql<{ objective_status: string }>(
      'select objective_status from system_ops.restore_test_runs where id = ?',
      [runId],
    );
    return row.objective_status;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // MCH-022 por HTTP: RPO > RTO tiene que entrar. Si este 201 falla, la
    // validación conceptualmente equivocada volvió.
    const politica = await http()
      .post('/admin/ops/backup-policies')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: SEED.tenantId,
        resourceScopeConceptId: SYSOPS.BACKUP_SCOPE_DATABASE,
        backupTypeConceptId: SYSOPS.BACKUP_TYPE_FULL,
        rpoSeconds: RPO_OBJETIVO,
        rtoSeconds: RTO_OBJETIVO,
        retentionDays: 30,
      })
      .expect(201);
    policyId = politica.body.id as string;
  }, 180_000);

  afterAll(async () => {
    // Las corridas son append-only y no se tocan. La política de esta corrida
    // sólo se puede borrar si no quedó ninguna colgando de ella; si quedaron,
    // se deja, que es lo que haría producción.
    await sql(
      `delete from system_ops.backup_policies
        where id = ?
          and not exists (select 1 from system_ops.restore_test_runs
                           where backup_policy_id = ?)`,
      [policyId, policyId],
    ).catch(() => undefined);
    await ctx.app.close();
  });

  it('MCH-022 · la política con RPO=3600 y RTO=900 se guarda tal cual', async () => {
    const [row] = await sql<{ rpo_seconds: number; rto_seconds: number }>(
      'select rpo_seconds, rto_seconds from system_ops.backup_policies where id = ?',
      [policyId],
    );
    expect(row.rpo_seconds).toBe(RPO_OBJETIVO);
    expect(row.rto_seconds).toBe(RTO_OBJETIVO);
  });

  it('sin mediciones, la corrida queda NOT_MEASURED en la respuesta y en la base', async () => {
    const res = await registrarCorrida({
      outcomeConceptId: SYSOPS.RESTORE_OUTCOME_PASS,
      backupReference: `mch023-sin-medir-${sufijo}`,
    }).expect(201);

    // La respuesta no miente: no hay incumplimiento, pero tampoco aprobación.
    expect(res.body.objectiveStatus).toBe(RestoreObjectiveStatus.NOT_MEASURED);
    expect(res.body.objectiveBreached).toBe(false);

    // Y eso es lo que quedó escrito. Sin esto, «no se midió» se perdería al
    // guardar y la fila sería indistinguible de una aprobada.
    await expect(estadoPersistido(res.body.id as string)).resolves.toBe(
      RestoreObjectiveStatus.NOT_MEASURED,
    );
  });

  it('una restauración informada como fallida no se aprueba por omitir métricas', async () => {
    const res = await registrarCorrida({
      outcomeConceptId: SYSOPS.RESTORE_OUTCOME_FAIL,
      backupReference: `mch023-fallida-${sufijo}`,
    }).expect(201);

    expect(res.body.objectiveStatus).toBe(RestoreObjectiveStatus.FAILED);
    expect(res.body.objectiveBreached).toBe(true);
    await expect(estadoPersistido(res.body.id as string)).resolves.toBe(
      RestoreObjectiveStatus.FAILED,
    );
  });

  it('con las dos mediciones dentro del objetivo e integridad verificada, PASSED', async () => {
    const res = await registrarCorrida({
      outcomeConceptId: SYSOPS.RESTORE_OUTCOME_PASS,
      backupReference: `mch023-aprobada-${sufijo}`,
      measuredRpoSeconds: RPO_OBJETIVO - 1,
      measuredRtoSeconds: RTO_OBJETIVO - 1,
      integrityCheckPassed: true,
    }).expect(201);

    expect(res.body.objectiveStatus).toBe(RestoreObjectiveStatus.PASSED);
    expect(res.body.objectiveBreached).toBe(false);
    await expect(estadoPersistido(res.body.id as string)).resolves.toBe(
      RestoreObjectiveStatus.PASSED,
    );
  });

  it('el RTO medido por encima del objetivo es FAILED aunque el RPO cumpla', async () => {
    const res = await registrarCorrida({
      outcomeConceptId: SYSOPS.RESTORE_OUTCOME_PASS,
      backupReference: `mch023-rto-excedido-${sufijo}`,
      measuredRpoSeconds: 10,
      measuredRtoSeconds: RTO_OBJETIVO + 1,
      integrityCheckPassed: true,
    }).expect(201);

    expect(res.body.objectiveStatus).toBe(RestoreObjectiveStatus.FAILED);
    await expect(estadoPersistido(res.body.id as string)).resolves.toBe(
      RestoreObjectiveStatus.FAILED,
    );
  });

  it('la base rechaza cualquier estado fuera del contrato de tres valores', async () => {
    // El tercer lugar donde tiene que vivir el contrato. Si el CHECK no está,
    // una escritura directa podría dejar un «CUMPLE» que nadie sabe leer.
    await expect(
      sql(
        `insert into system_ops.restore_test_runs
           (id, backup_policy_id, outcome_concept_id, started_at,
            objective_status, recorded_by_user_id)
         values (?, ?, ?, now(), 'CUMPLE', ?)`,
        [randomUUID(), policyId, CONCEPTS.STATE_ACTIVE, TEST_ADMIN_ID],
      ),
    ).rejects.toThrow(/ck_restore_test_runs_objective_status/);
  });
});
