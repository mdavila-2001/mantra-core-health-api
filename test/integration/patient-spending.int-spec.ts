import 'dotenv/config';
import { BadRequestException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS, PreconditionFailedException } from '../../src/common';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { BILL } from '../../src/modules/billing/billing.concepts';
import { PatientSpendingRepository } from '../../src/modules/billing/repositories/patient-spending.repository';
import { PatientSpendingService } from '../../src/modules/billing/services/patient-spending.service';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';

/**
 * «Mis gastos» (P44) contra PostgreSQL real: el `PatientSpendingService` con su
 * repositorio de verdad (la consulta SQL que deriva cada movimiento de las
 * facturas), sin dobles.
 *
 * A la paciente A se le emiten por SQL facturas de cada forma que la lectura
 * tiene que entender —consulta con descuento, parte del paciente de reclamos de
 * farmacia, laboratorio e imagen, cargo de procedimiento, nota de crédito, plan
 * de pagos con su cuota, factura sin moneda— y otras que **no** son gasto o no
 * van en la respuesta: borrador, en USD, con fecha de mañana y fuera del rango.
 * Al paciente B, una sola. Las facturas de A van en una ventana de hace unos
 * 2,5 años para no cruzarse con las de las semillas.
 *
 * Datos: sólo sintéticos, marcados con `P44-<sufijo>` en `invoice_number`,
 * `claim_identifier` y `member_identifier`, y retirados al final. Los padres que
 * la prueba no está probando (los dos perfiles de paciente, práctica,
 * encuentro, plan, aseguradora, oferta de estudio, caso quirúrgico, servicio
 * del catálogo, reserva de farmacia) se toman por lectura: sólo su id.
 *
 * Lo que esta prueba no cubre (el guard de rol, el `ValidationPipe` y
 * `@AccessLogged` de la ruta HTTP) lo cubren las pruebas unitarias del
 * controlador; ver el reporte de P44.
 */
describe('Mis gastos del paciente (DB real, P44)', () => {
  let orm: MikroORM;
  let service: PatientSpendingService;
  const mark = `P44-${randomUUID().slice(0, 8)}`;
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  };

  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    orm.em.getConnection().execute(text, params, 'all') as Promise<T[]>;

  async function firstId(
    table: string,
    where = 'true',
    pk = 'id',
    offset = 0,
  ): Promise<string> {
    const rows = await sql<{ id: string }>(
      `select ${pk} as id from ${table} where ${where} order by ${pk} limit 1 offset ${offset}`,
    );
    if (!rows[0]) throw new Error(`La prueba necesita una fila en ${table}`);
    return rows[0].id;
  }

  /** Fecha `YYYY-MM-DD` en La Paz, desplazada `days` días desde hoy. */
  function day(days: number): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
    }).format(new Date(Date.now() + days * 86_400_000));
  }

  /** Primer día de la ventana de A. */
  const BASE = -930;
  const at = (offset: number) => day(BASE + offset);

  const parent: Record<string, string> = {};
  const ids: Record<string, string> = {};
  const createdInvoices: string[] = [];
  const createdClaims: string[] = [];
  const coverageId = randomUUID();
  let patientA = '';
  let patientB = '';

  const actor = (patientProfileId?: string) =>
    ({ id: randomUUID(), roles: ['PATIENT'], patientProfileId }) as never;

  interface InvoiceInput {
    key: string;
    patient: string;
    issueDate: string;
    status: string;
    total: string;
    balance?: string;
    discount?: string;
    currency?: string | null;
    encounter?: boolean;
    /** Hora local de creación el mismo día de emisión (si no, se crea hoy). */
    createdLocalTime?: string;
    line?: { description?: string; lineTotal: string; claimLine?: string };
  }

  async function invoice(input: InvoiceInput): Promise<string> {
    const id = randomUUID();
    ids[input.key] = id;
    createdInvoices.push(id);
    const createdAt = input.createdLocalTime
      ? `(cast(? as date) + cast(? as time)) at time zone 'America/La_Paz'`
      : 'now()';
    const createdParams = input.createdLocalTime
      ? [input.issueDate, input.createdLocalTime]
      : [];
    await sql(
      `insert into billing.invoices
         (id, practice_id, invoice_number, patient_profile_id, encounter_id,
          issue_date, status_concept_id, subtotal, tax_total, discount_total,
          total, paid_total, balance, currency_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, cast(? as date), ?, ?, 0, ?, ?, 0, ?, ?, ${createdAt}, now())`,
      [
        id,
        parent.practice,
        `${mark}-${input.key}`,
        input.patient,
        input.encounter ? parent.encounter : null,
        input.issueDate,
        input.status,
        input.total,
        input.discount ?? '0',
        input.total,
        input.balance ?? input.total,
        input.currency === undefined ? CONCEPTS.CURRENCY_BOB : input.currency,
        ...createdParams,
      ],
    );
    if (input.line) {
      const lineId = randomUUID();
      ids[`${input.key}:line`] = lineId;
      await sql(
        `insert into billing.invoice_lines
           (id, invoice_id, insurance_claim_line_id, description, quantity,
            unit_price, line_total, created_at, updated_at)
         values (?, ?, ?, ?, 1, ?, ?, now(), now())`,
        [
          lineId,
          id,
          input.line.claimLine ?? null,
          input.line.description ?? null,
          input.line.lineTotal,
          input.line.lineTotal,
        ],
      );
    }
    return id;
  }

  /** Un reclamo con una línea facturada al seguro por `billed`. */
  async function claimLine(
    key: string,
    billed: string,
    link: { reservation?: boolean; offering?: string },
  ): Promise<string> {
    const claimId = randomUUID();
    createdClaims.push(claimId);
    await sql(
      `insert into insurance.insurance_claims
         (id, insurance_carrier_id, patient_coverage_id, billing_provider_type_concept_id,
          billing_provider_entity_id, inventory_reservation_id, claim_identifier,
          status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        claimId,
        parent.carrier,
        coverageId,
        parent.concept,
        parent.practice,
        link.reservation ? parent.reservation : null,
        `${mark}-${key}`,
        parent.concept,
      ],
    );
    const lineId = randomUUID();
    await sql(
      `insert into insurance.insurance_claim_lines
         (id, insurance_claim_id, line_sequence, diagnostic_study_offering_id,
          billed_amount, created_at)
       values (?, ?, 1, ?, ?, now())`,
      [lineId, claimId, link.offering ?? null, billed],
    );
    return lineId;
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });
    service = new PatientSpendingService(
      orm.em.fork() as never,
      new PatientSpendingRepository(),
    );

    // Los conceptos de estado de factura (y las categorías SPEND_*) se
    // materializan con el seed de terminología, como en el arranque.
    const needed = [
      BILL.INVOICE_ISSUED,
      BILL.SPEND_OTHER,
      CONCEPTS.CURRENCY_USD,
    ];
    const [{ n }] = await sql<{ n: number }>(
      `select count(*)::int as n from terminology.catalog_concepts where id in (?, ?, ?)`,
      needed,
    );
    if (n < needed.length) {
      await new TerminologySeedService(orm, logger as never).run();
    }

    patientA = await firstId('profiles.patient_profiles', 'true', 'profile_id');
    patientB = await firstId(
      'profiles.patient_profiles',
      'true',
      'profile_id',
      1,
    );
    parent.practice = await firstId('practice.practices');
    parent.encounter = await firstId('clinical.encounters');
    parent.carrier = await firstId('insurance.insurance_carriers');
    parent.plan = await firstId('insurance.insurance_plans');
    parent.reservation = await firstId(
      'pharmacy_inventory.inventory_reservations',
    );
    parent.concept = await firstId('terminology.catalog_concepts');
    parent.labOffering = await firstId(
      'diagnostic_units.diagnostic_study_offerings',
      `modality_concept_id = '${DUNIT.MODALITY_LABORATORY}'`,
    );
    parent.imagingOffering = await firstId(
      'diagnostic_units.diagnostic_study_offerings',
      `modality_concept_id <> '${DUNIT.MODALITY_LABORATORY}'`,
    );
    parent.procedureCase = await firstId(
      'procedures_perioperative.procedure_cases',
    );
    parent.service = await firstId('billing.service_catalog');

    await sql(
      `insert into insurance.patient_coverages
         (id, patient_profile_id, insurance_plan_id, member_identifier,
          verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [coverageId, patientA, parent.plan, mark, parent.concept, parent.concept],
    );

    await invoice({
      key: 'consulta',
      patient: patientA,
      issueDate: at(0),
      status: BILL.INVOICE_PAID,
      total: '250.00',
      discount: '50.00',
      encounter: true,
      createdLocalTime: '09:30',
      line: { description: 'Consulta de control', lineTotal: '250.00' },
    });
    await invoice({
      key: 'farmacia',
      patient: patientA,
      issueDate: at(1),
      status: BILL.INVOICE_ISSUED,
      total: '60.00',
      line: {
        lineTotal: '60.00',
        claimLine: await claimLine('farmacia', '200.00', { reservation: true }),
      },
    });
    await invoice({
      key: 'laboratorio',
      patient: patientA,
      issueDate: at(2),
      status: BILL.INVOICE_ISSUED,
      total: '120.00',
      line: {
        description: 'Parte del paciente de un servicio con seguro',
        lineTotal: '120.00',
        claimLine: await claimLine('laboratorio', '300.00', {
          offering: parent.labOffering,
        }),
      },
    });
    await invoice({
      key: 'imagen',
      patient: patientA,
      issueDate: at(3),
      status: BILL.INVOICE_PARTIALLY_PAID,
      total: '90.00',
      line: {
        lineTotal: '90.00',
        claimLine: await claimLine('imagen', '400.00', {
          offering: parent.imagingOffering,
        }),
      },
    });
    await invoice({
      key: 'procedimiento',
      patient: patientA,
      issueDate: at(4),
      status: BILL.INVOICE_ISSUED,
      total: '1000.00',
      encounter: true,
      line: { description: 'Cirugía menor', lineTotal: '1000.00' },
    });
    ids.chargeItem = randomUUID();
    await sql(
      `insert into procedures_perioperative.procedure_charge_items
         (id, procedure_case_id, charge_item_type_concept_id, billable_item_id,
          quantity, unit_price, invoice_line_id, status_concept_id,
          created_at, updated_at)
       values (?, ?, ?, ?, 1, 1000, ?, ?, now(), now())`,
      [
        ids.chargeItem,
        parent.procedureCase,
        parent.concept,
        parent.service,
        ids['procedimiento:line'],
        parent.concept,
      ],
    );
    await invoice({
      key: 'nota',
      patient: patientA,
      issueDate: at(5),
      status: BILL.INVOICE_CREDIT_NOTE,
      total: '-50.00',
      encounter: true,
      line: { description: 'Ajuste de tarifa', lineTotal: '-50.00' },
    });
    await invoice({
      key: 'plan',
      patient: patientA,
      issueDate: at(6),
      status: BILL.INVOICE_PAYMENT_PLAN,
      total: '500.00',
      balance: '300.00',
      encounter: true,
    });
    await invoice({
      key: 'cuota',
      patient: patientA,
      issueDate: at(7),
      status: BILL.INVOICE_ISSUED,
      total: '300.00',
    });
    await invoice({
      key: 'sin-moneda',
      patient: patientA,
      issueDate: at(8),
      status: BILL.INVOICE_ISSUED,
      total: '10.50',
      currency: null,
    });
    // Lo que no debe aparecer.
    await invoice({
      key: 'borrador',
      patient: patientA,
      issueDate: at(8),
      status: BILL.INVOICE_DRAFT,
      total: '999.00',
    });
    await invoice({
      key: 'usd',
      patient: patientA,
      issueDate: at(8),
      status: BILL.INVOICE_ISSUED,
      total: '15.00',
      currency: CONCEPTS.CURRENCY_USD,
    });
    await invoice({
      key: 'manana',
      patient: patientA,
      issueDate: day(1),
      status: BILL.INVOICE_ISSUED,
      total: '44.00',
    });
    await invoice({
      key: 'antigua',
      patient: patientA,
      issueDate: at(-200),
      status: BILL.INVOICE_PAID,
      total: '33.00',
    });
    await invoice({
      key: 'paciente-b',
      patient: patientB,
      issueDate: at(9),
      status: BILL.INVOICE_PAID,
      total: '77.77',
    });
  });

  afterAll(async () => {
    if (!orm) return;
    // Orden inverso a la creación. Nada de TRUNCATE ni de tocar audit.*.
    if (ids.chargeItem) {
      await sql(
        'delete from procedures_perioperative.procedure_charge_items where id = ?',
        [ids.chargeItem],
      );
    }
    if (createdInvoices.length) {
      const marks = createdInvoices.map(() => '?').join(', ');
      await sql(
        `delete from billing.invoice_lines where invoice_id in (${marks})`,
        createdInvoices,
      );
      await sql(
        `delete from billing.invoices where id in (${marks})`,
        createdInvoices,
      );
    }
    if (createdClaims.length) {
      const marks = createdClaims.map(() => '?').join(', ');
      await sql(
        `delete from insurance.insurance_claim_lines where insurance_claim_id in (${marks})`,
        createdClaims,
      );
      await sql(
        `delete from insurance.insurance_claims where id in (${marks})`,
        createdClaims,
      );
    }
    await sql('delete from insurance.patient_coverages where id = ?', [
      coverageId,
    ]);
    const left = await sql<{ n: number }>(
      `select ((select count(*) from billing.invoices where invoice_number like ?) +
               (select count(*) from insurance.insurance_claims where claim_identifier like ?) +
               (select count(*) from insurance.patient_coverages where member_identifier = ?))::int as n`,
      [`${mark}-%`, `${mark}-%`, mark],
    );
    console.log(
      `P44 limpieza: filas con la marca ${mark} restantes = ${left[0].n}`,
    );
    await orm.close(true);
  });

  const WINDOW = () => ({ from: at(0), to: at(9) });

  it('correcto: un movimiento por factura, con importes exactos, categoría y orden', async () => {
    const res = await service.listMine(actor(patientA), WINDOW());

    expect(res.currency).toBe('BOB');
    expect(res.truncated).toBe(false);
    const byId = new Map(res.items.map((item) => [item.id, item]));
    const pick = (key: string) => {
      const item = byId.get(ids[key]);
      expect(item).toBeDefined();
      return {
        category: item!.category.code,
        gross: item!.grossAmount,
        covered: item!.coveredAmount,
        discount: item!.discountAmount,
        paid: item!.paidAmount,
        description: item!.description,
      };
    };

    expect(pick('consulta')).toEqual({
      category: 'SPEND_CONSULTATION',
      gross: '300.00',
      covered: '0.00',
      discount: '50.00',
      paid: '250.00',
      description: 'Consulta de control',
    });
    expect(pick('farmacia')).toEqual({
      category: 'SPEND_PHARMACY',
      gross: '200.00',
      covered: '140.00',
      discount: '0.00',
      paid: '60.00',
      description: 'Compra en farmacia',
    });
    expect(pick('laboratorio')).toMatchObject({
      category: 'SPEND_LABORATORY',
      gross: '300.00',
      covered: '180.00',
      paid: '120.00',
    });
    expect(pick('imagen')).toMatchObject({
      category: 'SPEND_IMAGING',
      gross: '400.00',
      covered: '310.00',
      paid: '90.00',
    });
    expect(pick('procedimiento')).toMatchObject({
      category: 'SPEND_PROCEDURE',
      paid: '1000.00',
      description: 'Cirugía menor',
    });
    expect(pick('nota')).toEqual({
      category: 'SPEND_CONSULTATION',
      gross: '-50.00',
      covered: '0.00',
      discount: '0.00',
      paid: '-50.00',
      description: 'Nota de crédito: Ajuste de tarifa',
    });
    // El plan sólo pesa lo pagado antes del plan; el saldo lo carga la cuota.
    expect(pick('plan')).toMatchObject({ gross: '200.00', paid: '200.00' });
    expect(pick('cuota')).toMatchObject({
      category: 'SPEND_OTHER',
      paid: '300.00',
      description: 'Gasto de salud',
    });
    expect(pick('sin-moneda')).toMatchObject({ paid: '10.50' });

    // Identidad del contrato, en centavos enteros.
    const cents = (value: string) => Math.round(Number(value) * 100);
    for (const item of res.items) {
      expect(cents(item.paidAmount)).toBe(
        cents(item.grossAmount) -
          cents(item.coveredAmount) -
          cents(item.discountAmount),
      );
    }

    // Orden: del más reciente al más antiguo (la ventana es sólo nuestra).
    expect(res.items.map((item) => item.id)).toEqual(
      [
        'sin-moneda',
        'cuota',
        'plan',
        'nota',
        'procedimiento',
        'imagen',
        'laboratorio',
        'farmacia',
        'consulta',
      ].map((key) => ids[key]),
    );

    // Instante: la hora real si se emitió el día en que se creó; si no, el mediodía.
    expect(byId.get(ids.consulta)!.occurredAt).toBe(`${at(0)}T13:30:00.000Z`);
    expect(byId.get(ids.cuota)!.occurredAt).toBe(`${at(7)}T16:00:00.000Z`);
    expect(byId.get(ids.consulta)!.providerName).toEqual(expect.any(String));

    for (const key of ['borrador', 'usd', 'manana', 'antigua', 'paciente-b']) {
      expect(byId.has(ids[key])).toBe(false);
    }
  });

  it('negativo: otro paciente sólo ve lo suyo, y nada de lo ajeno', async () => {
    const res = await service.listMine(actor(patientB), WINDOW());
    expect(res.items.map((item) => item.id)).toEqual([ids['paciente-b']]);
    expect(res.items[0].paidAmount).toBe('77.77');
    for (const id of createdInvoices.filter((x) => x !== ids['paciente-b'])) {
      expect(res.items.some((item) => item.id === id)).toBe(false);
    }
  });

  it('negativo: sin perfil de paciente en la sesión no hay lectura', async () => {
    await expect(service.listMine(actor(), WINDOW())).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('límite: el tope recorta y lo dice; el rango deja afuera lo anterior y lo futuro', async () => {
    const page = await service.listMine(actor(patientA), {
      ...WINDOW(),
      limit: 2,
    });
    expect(page.items.map((item) => item.id)).toEqual([
      ids['sin-moneda'],
      ids.cuota,
    ]);
    expect(page.truncated).toBe(true);

    const exact = await service.listMine(actor(patientA), {
      ...WINDOW(),
      limit: 9,
    });
    expect(exact.truncated).toBe(false);

    const older = await service.listMine(actor(patientA), {
      from: at(-200),
      to: at(9),
    });
    expect(older.items.some((item) => item.id === ids.antigua)).toBe(true);

    // `to` en el futuro: lo de mañana no se gastó todavía.
    const toTomorrow = await service.listMine(actor(patientA), {
      from: at(0),
      to: day(1),
    });
    expect(toTomorrow.items.some((item) => item.id === ids.manana)).toBe(false);
  });

  it('inválido: rango invertido, de más de tres años o día inexistente → 400', async () => {
    const reason = async (from: string, to: string) => {
      try {
        await service.listMine(actor(patientA), { from, to });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        return ((error as BadRequestException).getResponse() as any).reason;
      }
      return 'no falló';
    };
    expect(await reason(at(1), at(0))).toBe('PATIENT_SPENDING_RANGE_INVERTED');
    expect(await reason('2020-01-01', '2026-01-01')).toBe(
      'PATIENT_SPENDING_RANGE_TOO_LONG',
    );
    expect(await reason('2026-02-30', '2026-03-01')).toBeUndefined();
  });

  it('las categorías están sembradas como conceptos del catálogo', async () => {
    // El seed guarda la clave del módulo como código (`billing:SPEND_*`) con el
    // id determinista que usa el código; la respuesta lleva el código corto.
    const keys = [
      'SPEND_CONSULTATION',
      'SPEND_IMAGING',
      'SPEND_INSURANCE_PREMIUM',
      'SPEND_LABORATORY',
      'SPEND_OTHER',
      'SPEND_PHARMACY',
      'SPEND_PROCEDURE',
    ] as const;
    const seeded = await sql<{ code: string }>(
      `select code from terminology.catalog_concepts
        where id in (${keys.map(() => '?').join(', ')}) order by code`,
      keys.map((key) => BILL[key]),
    );
    expect(seeded.map((row) => row.code)).toEqual(
      keys.map((key) => `billing:${key}`),
    );
  });
});
