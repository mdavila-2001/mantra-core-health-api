import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, type TestContext } from './harness';
import { CONCEPTS, SEED } from '../../src/common';
import { PractitionerSimpleAccountingRepository } from '../../src/modules/accounting/repositories';
import { PractitionerSimpleAccountingService } from '../../src/modules/accounting/services/practitioner-simple-accounting.service';
import { AccountingScopeService } from '../../src/modules/accounting/services/accounting-scope.service';
import { inTenant } from '../../src/modules/accounting/services/accounting-scope.testing';

/**
 * Contabilidad simple del doctor (P49) · siembra concurrente de las 26 cuentas
 * generales, contra PostgreSQL real.
 *
 * El primer acceso a una práctica siembra sus 26 cuentas. Dos pedidos
 * simultáneos veían ambos «cero sembradas» y cada uno intentaba insertar las 26:
 * la restricción única `(practice_id, code)` hacía fallar al segundo. Aquí se
 * lanzan varios pedidos a la vez sobre una práctica sin cuentas y se exige que
 * todos respondan y que quede exactamente una vez cada cuenta general, también
 * cuando la siembra compite con el alta de una cuenta propia y cuando el doctor
 * ya había renombrado una general.
 *
 * Se usan el servicio y el repositorio reales; sólo se sustituyen la
 * vinculación profesional↔práctica y la resolución del tenant, que pertenecen a
 * otros módulos (el recorrido completo por HTTP está en
 * `accounting-practitioner-simple-http.int-spec.ts`).
 */
describe('Contabilidad simple del doctor · siembra concurrente (DB real)', () => {
  let ctx: TestContext;
  let service: PractitionerSimpleAccountingService;
  let actor: any;
  const mark = `P49S-${randomUUID().slice(0, 8)}`;
  const practices: string[] = [];

  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(text, params);

  async function newPractice(label: string): Promise<string> {
    const id = randomUUID();
    await sql(
      `insert into practice.practices
         (id, code, name, status_concept_id, type_concept_id, tenant_id, admin_user_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        id,
        `${mark}-${label}`,
        `${mark}-${label}`,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        SEED.tenantId,
        ctx.adminUserId,
      ],
    );
    practices.push(id);
    return id;
  }

  const accountRows = (practiceId: string) =>
    sql<{ code: string; name: string; seeded: boolean; row_version: number }>(
      `select code, name, seeded, row_version
         from accounting.practitioner_simple_accounts
        where practice_id = ? order by code`,
      [practiceId],
    );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    actor = {
      id: ctx.adminUserId,
      roles: ['PRACTITIONER'],
      practitionerProfileId: ctx.practitionerSubtypeId,
    };
    const lookup = {
      findTenantOfPractice: async () => SEED.tenantId,
    } as never;
    service = inTenant(
      new PractitionerSimpleAccountingService(
        ctx.orm.em as never,
        new PractitionerSimpleAccountingRepository(),
        { assertOwnsPractice: async () => ctx.practitionerSubtypeId } as never,
        lookup,
        new AccountingScopeService(
          lookup,
          ...(Array(8).fill(undefined) as [
            never,
            never,
            never,
            never,
            never,
            never,
            never,
            never,
          ]),
        ),
      ),
      SEED.tenantId,
    );
  });

  afterAll(async () => {
    const clean = (text: string, params: unknown[] = []) =>
      sql(text, params).catch(() => undefined);
    for (const id of practices) {
      await clean(
        `delete from accounting.practitioner_simple_transactions where practice_id = ?`,
        [id],
      );
      await clean(
        `delete from accounting.practitioner_simple_records where practice_id = ?`,
        [id],
      );
      await clean(
        `delete from accounting.practitioner_simple_accounts where practice_id = ?`,
        [id],
      );
      await clean(`delete from practice.practices where id = ?`, [id]);
    }
    await ctx.app.close();
  });

  it('N lecturas simultáneas al primer acceso: todas responden y quedan exactamente 26 cuentas', async () => {
    const practiceId = await newPractice('lectura');
    expect(await accountRows(practiceId)).toHaveLength(0);

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => service.listAccounts(practiceId, actor)),
    );

    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String((r.reason as Error)?.message ?? r.reason));
    expect(failures).toEqual([]);
    for (const result of results) {
      const { items } = (
        result as PromiseFulfilledResult<
          Awaited<ReturnType<typeof service.listAccounts>>
        >
      ).value;
      expect(items).toHaveLength(26);
      expect(items.every((a) => a.seeded)).toBe(true);
    }

    const rows = await accountRows(practiceId);
    expect(rows).toHaveLength(26);
    expect(new Set(rows.map((r) => r.code)).size).toBe(26);
    expect(rows.every((r) => r.seeded)).toBe(true);
  });

  it('la siembra compite con el alta de una cuenta propia: nada falla y la propia queda con el código siguiente', async () => {
    const practiceId = await newPractice('mezcla');

    const results = await Promise.allSettled([
      service.listAccounts(practiceId, actor),
      service.listAccounts(practiceId, actor),
      service.createAccount(
        { practiceId, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      ),
      service.listAccounts(practiceId, actor),
    ]);

    expect(
      results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => String((r.reason as Error)?.message ?? r.reason)),
    ).toEqual([]);

    const rows = await accountRows(practiceId);
    expect(rows.filter((r) => r.seeded)).toHaveLength(26);
    expect(rows.filter((r) => !r.seeded)).toHaveLength(1);
    expect(rows).toHaveLength(27);
    expect(rows.find((r) => !r.seeded)).toMatchObject({
      name: 'Capacitación',
    });
  });

  it('N altas simultáneas de la misma clase: ninguna choca con el UNIQUE y cada una recibe un código distinto (#995)', async () => {
    const practiceId = await newPractice('altas');
    await service.listAccounts(practiceId, actor);

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) =>
        service.createAccount(
          { practiceId, name: `Gasto propio ${i}`, accountClass: 'EXPENSE' },
          actor,
        ),
      ),
    );

    expect(
      results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => String((r.reason as Error)?.message ?? r.reason)),
    ).toEqual([]);
    const own = (await accountRows(practiceId)).filter((r) => !r.seeded);
    expect(own).toHaveLength(6);
    expect(new Set(own.map((r) => r.code)).size).toBe(6);
  });

  it('no pisa un renombre: una lectura posterior, también concurrente, deja la cuenta renombrada tal cual', async () => {
    const practiceId = await newPractice('renombre');
    const first = await service.listAccounts(practiceId, actor);
    const caja = first.items.find((a) => a.code === '1.1')!;
    await service.updateAccount(caja.id, { name: 'Caja chica' }, actor);

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => service.listAccounts(practiceId, actor)),
    );
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);

    const rows = await accountRows(practiceId);
    expect(rows).toHaveLength(26);
    expect(rows.find((r) => r.code === '1.1')).toMatchObject({
      name: 'Caja chica',
      row_version: 2,
    });
  });

  it('si ya existe una cuenta con el código de una general, la siembra la respeta: no falla ni la pisa', async () => {
    const practiceId = await newPractice('parcial');
    // Una cuenta `1.1` no sembrada (carga manual anterior): el contador de
    // generales sigue en 0, así que la siembra corre y choca con ese código.
    await sql(
      `insert into accounting.practitioner_simple_accounts
         (id, practice_id, code, name, account_class, seeded, created_at, updated_at)
       values (?, ?, '1.1', 'Caja del consultorio', 'ASSET', false, now(), now())`,
      [randomUUID(), practiceId],
    );

    const { items } = await service.listAccounts(practiceId, actor);
    expect(items).toHaveLength(26);
    const rows = await accountRows(practiceId);
    expect(rows).toHaveLength(26);
    expect(rows.find((r) => r.code === '1.1')).toMatchObject({
      name: 'Caja del consultorio',
      seeded: false,
    });
  });
});
