import 'dotenv/config';
import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { BillingDocumentLinks } from '../../src/modules/billing/entities/billing_document_links.entity';
import { buildOrmConfig } from '../../src/orm/config/orm.config';

/**
 * Vínculo canónico factura ↔ reclamo de aseguradora, contra la base real
 * (carril 16, corte 2; REQ-16-028 y REQ-16-029).
 *
 * Lo que se protege vive **entero** en la base —una FK, un índice único parcial
 * y un ON DELETE CASCADE—, así que un doble no demostraría nada: una prueba con
 * mocks comprobaría que el mock hace lo que se le escribió. Aquí se ejercitan las
 * constraints reales de PostgreSQL con SQL directo.
 *
 * Datos: sólo sintéticos, marcados con `LANE16-<sufijo>` para poder retirarlos.
 * Los padres que la prueba no está probando (aseguradora, plan, paciente,
 * práctica, conceptos, tenant) se **toman por lectura** de lo que ya exista: sólo
 * se lee su id, nunca su contenido. No se trunca nada ni se toca `audit.*`.
 */
describe('Vínculo factura ↔ reclamo (DB real)', () => {
  let orm: MikroORM;
  let em: MikroORM['em'];
  const mark = `LANE16-${randomUUID().slice(0, 8)}`;

  const ids = {
    coverage: randomUUID(),
    claim: randomUUID(),
    claimLineA: randomUUID(),
    claimLineB: randomUUID(),
    claimLineC: randomUUID(),
    invoice: randomUUID(),
  };
  const createdInvoiceLines: string[] = [];
  const createdLinks: string[] = [];

  let parent: {
    carrier: string;
    plan: string;
    patient: string;
    practice: string;
    concept: string;
    tenant: string;
  };

  const run = (sql: string, params: unknown[] = []) =>
    em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

  /** Código SQLSTATE de un error del driver (23505 único, 23503 FK). */
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

  async function insertInvoiceLine(id: string, claimLineId: string | null) {
    await run(
      `insert into billing.invoice_lines
         (id, invoice_id, insurance_claim_line_id, quantity, unit_price, created_at, updated_at)
       values (?, ?, ?, 1, 10, now(), now())`,
      [id, ids.invoice, claimLineId],
    );
    createdInvoiceLines.push(id);
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      discovery: { warnWhenNoEntities: false },
    });
    em = orm.em.fork();

    parent = {
      carrier: await firstId('insurance.insurance_carriers'),
      plan: await firstId('insurance.insurance_plans'),
      patient: await firstId('profiles.patient_profiles', 'profile_id'),
      practice: await firstId('practice.practices'),
      concept: await firstId('terminology.catalog_concepts'),
      tenant: await firstId('directory.tenants'),
    };

    await run(
      `insert into insurance.patient_coverages
         (id, patient_profile_id, insurance_plan_id, member_identifier,
          verification_status_concept_id, status_concept_id, created_at, updated_at)
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
    await run(
      `insert into insurance.insurance_claims
         (id, insurance_carrier_id, patient_coverage_id, billing_provider_type_concept_id,
          billing_provider_entity_id, claim_identifier, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.claim,
        parent.carrier,
        ids.coverage,
        parent.concept,
        randomUUID(),
        mark,
        parent.concept,
      ],
    );
    for (const [i, id] of [
      ids.claimLineA,
      ids.claimLineB,
      ids.claimLineC,
    ].entries()) {
      await run(
        `insert into insurance.insurance_claim_lines
           (id, insurance_claim_id, line_sequence, created_at)
         values (?, ?, ?, now())`,
        [id, ids.claim, i + 1],
      );
    }
    await run(
      `insert into billing.invoices
         (id, practice_id, invoice_number, patient_profile_id, issue_date,
          status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, current_date, ?, now(), now())`,
      [ids.invoice, parent.practice, mark, parent.patient, parent.concept],
    );
  });

  afterAll(async () => {
    // Orden inverso a la creación. Nada de TRUNCATE ni de tocar audit.*.
    if (em) {
      if (createdLinks.length) {
        await run(
          `delete from billing.billing_document_links where id in (${createdLinks.map(() => '?').join(', ')})`,
          createdLinks,
        );
      }
      await run('delete from billing.invoice_lines where invoice_id = ?', [
        ids.invoice,
      ]);
      await run('delete from billing.invoices where id = ?', [ids.invoice]);
      await run(
        'delete from insurance.insurance_claim_lines where insurance_claim_id = ?',
        [ids.claim],
      );
      await run('delete from insurance.insurance_claims where id = ?', [
        ids.claim,
      ]);
      await run('delete from insurance.patient_coverages where id = ?', [
        ids.coverage,
      ]);
      const left = await all<{ n: number }>(
        `select (
           (select count(*) from billing.invoices where invoice_number = ?) +
           (select count(*) from insurance.insurance_claims where claim_identifier = ?) +
           (select count(*) from insurance.patient_coverages where member_identifier = ?)
         )::int as n`,
        [mark, mark, mark],
      );
      // Quedaría registrado en la salida de jest si la limpieza no fue completa.
      console.log(
        `LANE16 limpieza: filas con la marca ${mark} restantes = ${left[0].n}`,
      );
    }
    await orm?.close(true);
  });

  it('correcto: una línea de factura apunta a su línea de reclamo', async () => {
    const lineId = randomUUID();
    await insertInvoiceLine(lineId, ids.claimLineA);

    const rows = await all<{ invoice_line_id: string; claim_line_id: string }>(
      `select il.id as invoice_line_id, cl.id as claim_line_id
         from billing.invoice_lines il
         join insurance.insurance_claim_lines cl on cl.id = il.insurance_claim_line_id
        where il.id = ?`,
      [lineId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].claim_line_id).toBe(ids.claimLineA);
  });

  it('inválido: la misma línea de reclamo no se factura dos veces (23505)', async () => {
    let error: unknown;
    try {
      await insertInvoiceLine(randomUUID(), ids.claimLineA);
    } catch (caught) {
      error = caught;
    }
    expect(sqlState(error)).toBe('23505');
  });

  it('inválido: línea de reclamo inexistente en la línea de factura (23503)', async () => {
    let error: unknown;
    try {
      await insertInvoiceLine(randomUUID(), randomUUID());
    } catch (caught) {
      error = caught;
    }
    expect(sqlState(error)).toBe('23503');
  });

  it('inválido: reclamo inexistente en billing_document_links (23503) y en reimbursements (23503)', async () => {
    const relationType = parent.concept;
    let linkError: unknown;
    try {
      await run(
        `insert into billing.billing_document_links
           (id, tenant_id, claim_id, relation_type_concept_id, created_at)
         values (?, ?, ?, ?, now())`,
        [randomUUID(), parent.tenant, randomUUID(), relationType],
      );
    } catch (caught) {
      linkError = caught;
    }
    expect(sqlState(linkError)).toBe('23503');

    let reimbursementError: unknown;
    try {
      await run(
        `insert into billing.reimbursements
           (id, claim_id, amount, status_concept_id, created_at, updated_at)
         values (?, ?, 1, ?, now(), now())`,
        [randomUUID(), randomUUID(), parent.concept],
      );
    } catch (caught) {
      reimbursementError = caught;
    }
    expect(sqlState(reimbursementError)).toBe('23503');
  });

  it('contrato: vía ORM un reclamo inexistente lanza la excepción que el filtro global traduce a 422', async () => {
    // `all-exceptions.filter.ts` mapea ForeignKeyConstraintViolationException a
    // 422 PRECONDITION_FAILED. Sin la FK (antes de este corte) la fila entraba y
    // la API respondía 201 con un claimId que no existe.
    const fork = orm.em.fork();
    fork.persist(
      fork.create(BillingDocumentLinks, {
        tenantId: parent.tenant,
        claimId: randomUUID(),
        relationTypeConceptId: parent.concept,
        createdAt: new Date(),
      }),
    );
    await expect(fork.flush()).rejects.toBeInstanceOf(
      ForeignKeyConstraintViolationException,
    );
  });

  it('límite: dos cobros simultáneos de la misma línea de reclamo, gana uno solo', async () => {
    const results = await Promise.allSettled([
      insertInvoiceLine(randomUUID(), ids.claimLineB),
      insertInvoiceLine(randomUUID(), ids.claimLineB),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(sqlState(rejected[0].reason)).toBe('23505');

    const [{ n }] = await all<{ n: number }>(
      'select count(*)::int as n from billing.invoice_lines where insurance_claim_line_id = ?',
      [ids.claimLineB],
    );
    expect(n).toBe(1);
  });

  it('cascada (decisión del propietario): borrar la línea de reclamo borra su línea de factura', async () => {
    await insertInvoiceLine(randomUUID(), ids.claimLineC);
    const before = await all<{ n: number }>(
      'select count(*)::int as n from billing.invoice_lines where insurance_claim_line_id = ?',
      [ids.claimLineC],
    );
    expect(before[0].n).toBe(1);

    await run('delete from insurance.insurance_claim_lines where id = ?', [
      ids.claimLineC,
    ]);

    const after = await all<{ n: number }>(
      'select count(*)::int as n from billing.invoice_lines where insurance_claim_line_id = ?',
      [ids.claimLineC],
    );
    expect(after[0].n).toBe(0);
  });

  it('cascada: borrar el reclamo borra los billing_document_links que lo apuntan', async () => {
    const linkId = randomUUID();
    await run(
      `insert into billing.billing_document_links
         (id, tenant_id, claim_id, relation_type_concept_id, created_at)
       values (?, ?, ?, ?, now())`,
      [linkId, parent.tenant, ids.claim, parent.concept],
    );
    createdLinks.push(linkId);

    // Se borra un reclamo auxiliar (no el de la prueba) para no romper el resto.
    const throwaway = randomUUID();
    await run(
      `insert into insurance.insurance_claims
         (id, insurance_carrier_id, patient_coverage_id, billing_provider_type_concept_id,
          billing_provider_entity_id, claim_identifier, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        throwaway,
        parent.carrier,
        ids.coverage,
        parent.concept,
        randomUUID(),
        `${mark}-aux`,
        parent.concept,
      ],
    );
    const auxLink = randomUUID();
    await run(
      `insert into billing.billing_document_links
         (id, tenant_id, claim_id, relation_type_concept_id, created_at)
       values (?, ?, ?, ?, now())`,
      [auxLink, parent.tenant, throwaway, parent.concept],
    );

    await run('delete from insurance.insurance_claims where id = ?', [
      throwaway,
    ]);

    const left = await all<{ n: number }>(
      'select count(*)::int as n from billing.billing_document_links where id = ?',
      [auxLink],
    );
    expect(left[0].n).toBe(0);
  });
});
