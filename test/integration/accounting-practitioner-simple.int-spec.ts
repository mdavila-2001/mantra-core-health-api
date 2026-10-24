import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { PractitionerSimpleAccountingRepository } from '../../src/modules/accounting/repositories';
import { PractitionerSimpleAccountingService } from '../../src/modules/accounting/services/practitioner-simple-accounting.service';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { BILL } from '../../src/modules/billing/billing.concepts';
import { INS } from '../../src/modules/insurance/domain/insurance.concepts';

/**
 * Contabilidad simple del doctor (P49) contra la base real.
 *
 * Lo que se protege vive en la base —tres tablas nuevas con sus CHECK, su
 * UNIQUE y sus FK— y en el mapeo de MikroORM (fechas `date`, importes
 * `numeric`, `row_version`), así que un doble no demostraría nada. Se usa el
 * servicio y el repositorio **reales** contra PostgreSQL; sólo se sustituyen la
 * comprobación de vinculación profesional↔práctica y la resolución del tenant,
 * que pertenecen a otros módulos y tienen sus propias pruebas.
 *
 * Datos: sólo sintéticos, bajo una práctica propia `P49-<sufijo>` creada y
 * retirada por la prueba. Los padres que no se están probando (tenant, usuario,
 * paciente, profesional, aseguradora, plan, conceptos) se **toman por lectura**
 * de lo que ya exista: sólo se lee su id. No se trunca nada ni se toca `audit.*`.
 */
describe('Contabilidad simple del doctor (DB real)', () => {
  let orm: MikroORM;
  let em: MikroORM['em'];
  let service: PractitionerSimpleAccountingService;
  const mark = `P49-${randomUUID().slice(0, 8)}`;

  const ids = {
    practice: randomUUID(),
    coverage: randomUUID(),
    encounter: randomUUID(),
    appointmentDone: randomUUID(),
    appointmentDoneToo: randomUUID(),
    appointmentBooked: randomUUID(),
    invoice: randomUUID(),
    claimSent: randomUUID(),
    claimPartial: randomUUID(),
    versionPartial: randomUUID(),
  };

  let parent: {
    user: string;
    tenant: string;
    patient: string;
    practitioner: string;
    carrier: string;
    plan: string;
    concept: string;
  };
  let actor: any;

  const run = (sql: string, params: unknown[] = []) =>
    em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => em.getConnection().execute(sql, params, 'all') as Promise<T[]>;
  const sqlState = (error: unknown): string | undefined =>
    (error as { code?: string })?.code;

  async function firstId(table: string, pk = 'id'): Promise<string> {
    const rows = await all<{ pk: string }>(
      `select ${pk} as pk from ${table} limit 1`,
    );
    if (!rows[0])
      throw new Error(`La prueba necesita al menos una fila en ${table}`);
    return rows[0].pk;
  }

  async function rejected(promise: Promise<unknown>): Promise<any> {
    return promise.then(
      () => {
        throw new Error('debía rechazar');
      },
      (error: unknown) => error,
    );
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      discovery: { warnWhenNoEntities: false },
    });
    em = orm.em.fork();

    parent = {
      user: await firstId('iam.users'),
      tenant: await firstId('directory.tenants'),
      patient: await firstId('profiles.patient_profiles', 'profile_id'),
      practitioner: await firstId(
        'profiles.health_practitioner_profiles',
        'profile_id',
      ),
      carrier: await firstId('insurance.insurance_carriers'),
      plan: await firstId('insurance.insurance_plans'),
      concept: await firstId('terminology.catalog_concepts'),
    };
    actor = {
      id: parent.user,
      roles: ['PRACTITIONER'],
      practitionerProfileId: parent.practitioner,
    };

    await run(
      `insert into practice.practices
         (id, code, name, status_concept_id, type_concept_id, tenant_id, admin_user_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.practice,
        mark,
        mark,
        parent.concept,
        parent.concept,
        parent.tenant,
        parent.user,
      ],
    );

    service = new PractitionerSimpleAccountingService(
      orm.em as never,
      new PractitionerSimpleAccountingRepository(),
      { assertOwnsPractice: async () => parent.practitioner } as never,
      { findTenantOfPractice: async () => parent.tenant } as never,
    );
  });

  afterAll(async () => {
    if (!orm) return;
    const clean = (sql: string, params: unknown[] = []) =>
      run(sql, params).catch(() => undefined);
    await clean(
      `delete from insurance.claim_adjudication_versions where insurance_claim_id in (?, ?)`,
      [ids.claimSent, ids.claimPartial],
    );
    await clean(`delete from insurance.insurance_claims where id in (?, ?)`, [
      ids.claimSent,
      ids.claimPartial,
    ]);
    await clean(`delete from insurance.patient_coverages where id = ?`, [
      ids.coverage,
    ]);
    await clean(`delete from billing.invoices where id = ?`, [ids.invoice]);
    await clean(`delete from clinical.encounters where id = ?`, [
      ids.encounter,
    ]);
    await clean(`delete from clinical.appointments where id in (?, ?, ?)`, [
      ids.appointmentDone,
      ids.appointmentDoneToo,
      ids.appointmentBooked,
    ]);
    await clean(
      `delete from accounting.practitioner_simple_transactions where practice_id = ?`,
      [ids.practice],
    );
    await clean(
      `delete from accounting.practitioner_simple_records where practice_id = ?`,
      [ids.practice],
    );
    await clean(
      `delete from accounting.practitioner_simple_accounts where practice_id = ?`,
      [ids.practice],
    );
    await clean(`delete from practice.practices where id = ?`, [ids.practice]);
    await orm.close(true);
  });

  const accountId = async (code: string): Promise<string> => {
    const rows = await all<{ id: string }>(
      `select id from accounting.practitioner_simple_accounts where practice_id = ? and code = ?`,
      [ids.practice, code],
    );
    return rows[0].id;
  };

  it('siembra las 26 generales una sola vez y las lee en orden de código', async () => {
    const first = await service.listAccounts(ids.practice, actor);
    expect(first.items).toHaveLength(26);
    expect(first.items[0]).toMatchObject({
      code: '1.1',
      name: 'Caja',
      accountClass: 'ASSET',
      seeded: true,
    });
    await service.listAccounts(ids.practice, actor);
    const [{ count }] = await all<{ count: string }>(
      `select count(*) from accounting.practitioner_simple_accounts where practice_id = ?`,
      [ids.practice],
    );
    expect(Number(count)).toBe(26);
  });

  it('cuenta propia: crea, rechaza el duplicado sin tildes y la general no cambia de clase ni se borra', async () => {
    const created = await service.createAccount(
      {
        practiceId: ids.practice,
        name: 'Capacitación',
        accountClass: 'EXPENSE',
      },
      actor,
    );
    expect(created).toMatchObject({ code: '5.10', seeded: false });

    const dup = await rejected(
      service.createAccount(
        {
          practiceId: ids.practice,
          name: 'CAPACITACION',
          accountClass: 'EXPENSE',
        },
        actor,
      ),
    );
    expect(dup.getStatus()).toBe(409);

    const caja = await accountId('1.1');
    const classChange = await rejected(
      service.updateAccount(
        caja,
        { name: 'Caja', accountClass: 'EXPENSE' },
        actor,
      ),
    );
    expect(classChange.getStatus()).toBe(409);
    const del = await rejected(service.deleteAccount(caja, actor));
    expect(del.getStatus()).toBe(409);

    const renamed = await service.updateAccount(
      caja,
      { name: 'Caja chica' },
      actor,
    );
    expect(renamed.name).toBe('Caja chica');
    const [row] = await all<{ name: string; row_version: number }>(
      `select name, row_version from accounting.practitioner_simple_accounts where id = ?`,
      [caja],
    );
    expect(row.name).toBe('Caja chica');
    expect(row.row_version).toBe(2);
  });

  it('registro: UI → request → persistencia → recarga, con la fecha y el importe tal cual', async () => {
    const expenseType = await accountId('5.1');
    const created = await service.createRecord(
      {
        practiceId: ids.practice,
        kind: 'EXPENSE',
        date: '2026-09-05',
        accountId: expenseType,
        description: 'Alquiler de septiembre',
        amount: '2800',
      },
      actor,
    );
    expect(created).toMatchObject({
      kind: 'EXPENSE',
      date: '2026-09-05',
      amount: '2800.00',
    });

    const [row] = await all<{ d: string; amount: string; kind: string }>(
      `select record_date::text as d, amount::text as amount, kind
         from accounting.practitioner_simple_records where id = ?`,
      [created.id],
    );
    expect(row).toEqual({
      d: '2026-09-05',
      amount: '2800.00',
      kind: 'EXPENSE',
    });

    // Recarga con un contexto de persistencia limpio.
    const reloaded = await service.listRecords(ids.practice, 'EXPENSE', actor);
    expect(reloaded.items).toEqual([created]);
    expect(
      (await service.listRecords(ids.practice, 'DEBT', actor)).items,
    ).toEqual([]);

    const edited = await service.updateRecord(
      created.id,
      {
        date: '2026-09-10',
        accountId: await accountId('5.3'),
        description: 'Insumos',
        amount: '640.5',
      },
      actor,
    );
    expect(edited).toMatchObject({ date: '2026-09-10', amount: '640.50' });

    const wrongKind = await rejected(
      service.createRecord(
        {
          practiceId: ids.practice,
          kind: 'DEBT',
          date: '2026-09-05',
          accountId: expenseType,
          description: 'Mal tipo',
          amount: '10',
        },
        actor,
      ),
    );
    expect(wrongKind.getStatus()).toBe(422);
    expect(wrongKind.message).toBe('Ese tipo no corresponde.');
  });

  it('transacción: persiste, bloquea el borrado de la cuenta que usa y luego lo permite', async () => {
    const mine = await service.createAccount(
      {
        practiceId: ids.practice,
        name: 'Fondo de caja',
        accountClass: 'ASSET',
      },
      actor,
    );
    const tx = await service.createTransaction(
      {
        practiceId: ids.practice,
        date: '2026-09-02',
        description: 'Depósito de la caja al banco',
        debitAccountId: mine.id,
        creditAccountId: await accountId('1.2'),
        amount: '2500',
      },
      actor,
    );
    expect(tx).toMatchObject({ date: '2026-09-02', amount: '2500.00' });
    expect((await service.listTransactions(ids.practice, actor)).items).toEqual(
      [tx],
    );

    const inUse = await rejected(service.deleteAccount(mine.id, actor));
    expect(inUse.getStatus()).toBe(409);
    expect(inUse.message).toBe(
      'La usa 1 registro: cambiales la cuenta antes de borrarla.',
    );

    const same = await rejected(
      service.createTransaction(
        {
          practiceId: ids.practice,
          date: '2026-09-02',
          description: 'x',
          debitAccountId: mine.id,
          creditAccountId: mine.id,
          amount: '1',
        },
        actor,
      ),
    );
    expect(same.getStatus()).toBe(422);

    await service.deleteTransaction(tx.id, actor);
    await service.deleteAccount(mine.id, actor);
    const gone = await all(
      `select 1 from accounting.practitioner_simple_accounts where id = ?`,
      [mine.id],
    );
    expect(gone).toEqual([]);
  });

  it('la base sostiene sola lo que el servicio promete (CHECK, UNIQUE, FK)', async () => {
    const debit = await accountId('1.2');
    const credit = await accountId('1.3');
    const insertTx = (d: string, c: string, amount: string) =>
      run(
        `insert into accounting.practitioner_simple_transactions
           (id, practice_id, transaction_date, description, debit_account_id, credit_account_id, amount, created_at, updated_at)
         values (?, ?, current_date, ?, ?, ?, ?, now(), now())`,
        [randomUUID(), ids.practice, mark, d, c, amount],
      );
    expect(sqlState(await rejected(insertTx(debit, debit, '5')))).toBe('23514');
    expect(sqlState(await rejected(insertTx(debit, credit, '0')))).toBe(
      '23514',
    );
    expect(sqlState(await rejected(insertTx(debit, randomUUID(), '5')))).toBe(
      '23503',
    );

    expect(
      sqlState(
        await rejected(
          run(
            `insert into accounting.practitioner_simple_accounts
               (id, practice_id, code, name, account_class, seeded, created_at, updated_at)
             values (?, ?, '1.1', 'Repetida', 'ASSET', false, now(), now())`,
            [randomUUID(), ids.practice],
          ),
        ),
      ),
    ).toBe('23505');
    expect(
      sqlState(
        await rejected(
          run(
            `insert into accounting.practitioner_simple_accounts
               (id, practice_id, code, name, account_class, seeded, created_at, updated_at)
             values (?, ?, '9.9', 'Clase inválida', 'REVENUE', false, now(), now())`,
            [randomUUID(), ids.practice],
          ),
        ),
      ),
    ).toBe('23514');
  });

  it('los tres números salen de consultas, facturas y solicitudes reales', async () => {
    const insertAppointment = (id: string, status: string) =>
      run(
        `insert into clinical.appointments
           (id, patient_profile_id, practitioner_profile_id, tenant_id, status_concept_id, start_at, created_at, updated_at)
         values (?, ?, ?, ?, ?, now(), now(), now())`,
        [id, parent.patient, parent.practitioner, parent.tenant, status],
      );
    await insertAppointment(ids.appointmentDone, CLIN.APPOINTMENT_FULFILLED);
    await insertAppointment(ids.appointmentDoneToo, CLIN.APPOINTMENT_FULFILLED);
    await insertAppointment(ids.appointmentBooked, CLIN.APPOINTMENT_BOOKED);

    await run(
      `insert into clinical.encounters
         (id, patient_profile_id, tenant_id, primary_practitioner_id, appointment_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.encounter,
        parent.patient,
        parent.tenant,
        parent.practitioner,
        ids.appointmentDone,
        parent.concept,
      ],
    );
    await run(
      `insert into billing.invoices
         (id, practice_id, encounter_id, patient_profile_id, invoice_number, status_concept_id, issue_date, paid_total, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, current_date, '123.45', now(), now())`,
      [
        ids.invoice,
        ids.practice,
        ids.encounter,
        parent.patient,
        mark,
        BILL.INVOICE_PAID,
      ],
    );
    await run(
      `insert into insurance.patient_coverages
         (id, patient_profile_id, insurance_plan_id, member_identifier, verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.coverage,
        parent.patient,
        parent.plan,
        mark,
        parent.concept,
        parent.concept,
      ],
    );
    const insertClaim = (id: string, status: string, total: string) =>
      run(
        `insert into insurance.insurance_claims
           (id, insurance_carrier_id, patient_coverage_id, billing_provider_type_concept_id, billing_provider_entity_id,
            encounter_id, claim_identifier, status_concept_id, total_amount, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
        [
          id,
          parent.carrier,
          ids.coverage,
          INS.BILLING_PROVIDER_TYPE_PRACTICE,
          ids.practice,
          ids.encounter,
          `${mark}-${id.slice(0, 4)}`,
          status,
          total,
        ],
      );
    await insertClaim(ids.claimSent, INS.CLAIM_SUBMITTED, '1000.00');
    await insertClaim(ids.claimPartial, INS.CLAIM_ADJUDICATED, '900.00');
    await run(
      `insert into insurance.claim_adjudication_versions
         (id, insurance_claim_id, adjudication_version, outcome_concept_id, total_approved_amount, adjudicated_at)
       values (?, ?, 1, ?, '400.25', now())`,
      [ids.versionPartial, ids.claimPartial, INS.ADJ_OUTCOME_PARTIAL],
    );

    const summary = await service.summary(ids.practice, 'year', actor);
    expect(summary).toMatchObject({
      period: 'year',
      patientsSeen: 1,
      consultations: 2,
      collected: '123.45',
      expectedFromInsurers: '1400.25',
      pendingClaims: 2,
    });
    expect(summary.from).toMatch(/^\d{4}-01-01$/);
    expect(summary.to).toMatch(/^\d{4}-12-31$/);
  });
});
