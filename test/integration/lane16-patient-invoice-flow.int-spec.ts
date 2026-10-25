import 'dotenv/config';
import { ForbiddenException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PreconditionFailedException, runWithTenant } from '../../src/common';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { CONCEPTS, SEED } from '../../src/common/constants/concepts';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import {
  assertPermanentResidueTarget,
  resolveResetTarget,
} from './disposable-database';
import { BILL } from '../../src/modules/billing/billing.concepts';
import { InvoicesRepository } from '../../src/modules/billing/repositories';
import { PaymentsReceivedRepository } from '../../src/modules/billing/repositories/payments-received.repository';
import { PaymentsReceivedService } from '../../src/modules/billing/services/payments-received.service';
import { ClaimCoveragePolicy } from '../../src/modules/insurance/application/services/claim-coverage-policy';
import { ClaimPatientInvoiceService } from '../../src/modules/insurance/application/services/claim-patient-invoice.service';
import { ClaimQuoteService } from '../../src/modules/insurance/application/services/claim-quote.service';
import { ClaimsService } from '../../src/modules/insurance/application/services/claims.service';
import { PatientChargeObjectionService } from '../../src/modules/insurance/application/services/patient-charge-objection.service';
import { PatientConsentValidator } from '../../src/modules/insurance/application/services/patient-consent-validator';
import { INS } from '../../src/modules/insurance/domain/insurance.concepts';
import { BillingPatientInvoiceAdapter } from '../../src/modules/insurance/infrastructure/adapters/billing-patient-invoice.adapter';
import { NoPatientChargeAcceptanceAdapter } from '../../src/modules/insurance/infrastructure/adapters/no-patient-charge-acceptance.adapter';
import {
  CatalogRepository,
  ClaimRepository,
  CoverageRepository,
  DisputeRepository,
} from '../../src/modules/insurance/infrastructure/repositories';

/**
 * Protección al paciente en el cobro con seguro, contra PostgreSQL real
 * (carril 16, REQ-16-026, 028 a 034 y 035 puntos 3 y 4).
 *
 * Qué es real: la base, el ORM, los repositorios, `ClaimsService.submitClaim`,
 * `ClaimCoveragePolicy`, `ClaimQuoteService`, `ClaimPatientInvoiceService`,
 * `PatientChargeObjectionService`, `PaymentsReceivedService`,
 * el adaptador de billing, el `FOR UPDATE` del reclamo y el índice único.
 *
 * Qué es un doble, y por eso NO queda verificado acá: la capa HTTP (guards,
 * pipes, interceptores de tenant y de auditoría), el outbox (los eventos se
 * registran en memoria), el aviso al paciente, el puerto de propiedad del
 * perfil y la tabla de aceptaciones del paciente, que no existe todavía en el
 * modelo (el adaptador real falla cerrado; el «sí aceptó» es un doble).
 *
 * Datos: sólo sintéticos, marcados con `LANE16-<sufijo>`. La prueba crea sus
 * propios padres (aseguradora, plan, beneficios, paciente, práctica, usuarios)
 * con SQL directo, así que no depende de filas previas ni toca un plan real.
 *
 * **Residuo en una base con historial.** Los reclamos y las facturas que crea la
 * aplicación escriben historial en `audit.*`, que es de sólo inserción, y la
 * decisión de una apelación es inmutable por trigger. Esas filas no se pueden
 * borrar sin saltarse esos controles, y la prueba no los salta: la limpieza es
 * de mejor esfuerzo, informa lo que quedó y nunca falla. Por eso conviene
 * correrla contra una base desechable (la de CI); en una compartida cada corrida
 * deja un conjunto sintético completo y marcado. Nada se trunca ni se toca `audit.*`.
 * Por eso `beforeAll` se niega a correr (`assertPermanentResidueTarget`) si el host
 * no es local o la base no se declara descartable: por nombre (`test`, `ci`, `tmp`,
 * `scratch`, `smoke` o `disposable` como palabra) o con `ALLOW_PERMANENT_TEST_RESIDUE=yes`.
 */
describe('Protección al paciente en el cobro con seguro (DB real)', () => {
  let orm: MikroORM;
  const mark = `LANE16-${randomUUID().slice(0, 8)}`;

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.fork().getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) =>
    orm.em.fork().getConnection().execute(sql, params, 'all') as Promise<T[]>;
  const count = async (sql: string, params: unknown[] = []) =>
    Number((await all<{ n: number }>(sql, params))[0].n);

  // Padres sintéticos: se crean en `beforeAll` con SQL directo.
  const ids = {
    tenant: randomUUID(),
    carrier: randomUUID(),
    product: randomUUID(),
    plan: randomUUID(),
    practice: randomUUID(),
    patient: randomUUID(),
    otherPatient: randomUUID(),
    userBiller: randomUUID(),
    userPatient: randomUUID(),
    userOtherPatient: randomUUID(),
  };
  const carrier = ids.carrier;
  const plan = ids.plan;
  const patient = ids.patient;
  const otherPatient = ids.otherPatient;
  const practice = ids.practice;
  const tenant = ids.tenant;
  const userBiller = ids.userBiller;
  const userPatient = ids.userPatient;
  const userOtherPatient = ids.userOtherPatient;
  // Cualquier concepto del catálogo sirve de «servicio»: sólo es una FK de prueba
  // y el plan sintético no tiene más beneficios que los que esta prueba crea.
  const consultConcept = INS.BENEFIT_CATEGORY_OUTPATIENT;
  const surgeryConcept = INS.PRODUCT_TYPE_HEALTH;
  const uncoveredConcept = INS.VERIFY_PENDING;

  // Filas sintéticas.
  const coverageId = randomUUID();
  const benefitIds: string[] = [];
  const paymentIds: string[] = [];
  // Plan y cobertura extra de las pruebas de alcance (se retiran al final).
  const extraPlanIds: string[] = [];
  const extraCoverageIds: string[] = [];

  // Colaboradores.
  const events: Array<{ eventType: string; payloadJson: any }> = [];
  const acceptances = new Map<
    string,
    { acceptedAmount: string; acceptedAt: Date; acceptedByUserId: string }
  >();
  let claims: ClaimsService;
  let quoteService: ClaimQuoteService;
  let invoiceService: ClaimPatientInvoiceService;
  let invoiceServiceWithAcceptance: ClaimPatientInvoiceService;
  let objectionService: PatientChargeObjectionService;
  let payments: PaymentsReceivedService;
  const invoicesRepo = new InvoicesRepository();

  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };

  const biller = () =>
    ({ id: userBiller, roles: ['BILLING'], tenantIds: [tenant] }) as never;
  const admin = () =>
    ({
      id: userBiller,
      roles: ['SECURITY_ADMIN'],
      tenantIds: [tenant],
    }) as never;
  const patientActor = () =>
    ({
      id: userPatient,
      roles: ['PATIENT'],
      patientProfileId: patient,
    }) as never;
  const otherPatientActor = () =>
    ({
      id: userOtherPatient,
      roles: ['PATIENT'],
      patientProfileId: otherPatient,
    }) as never;

  const inTenant = <T>(work: () => Promise<T>) => runWithTenant(tenant, work);

  /** Reclamo directo real: `submitClaim` aplica la política contra el plan. */
  async function submitClaim(
    lines: Array<{ serviceConceptId: string; billedAmount: string }>,
    extra: Record<string, unknown> = {},
  ) {
    const created = await inTenant(() =>
      claims.submitClaim(
        {
          insuranceCarrierId: carrier,
          patientCoverageId: coverageId,
          billingProviderEntityId: practice,
          claimIdentifier: `${mark}-${randomUUID().slice(0, 6)}`,
          lines: lines.map((line, index) => ({
            lineSequence: index + 1,
            ...line,
          })),
          ...extra,
        } as never,
        biller(),
      ),
    );
    const claimLines = await all<{ id: string; line_sequence: number }>(
      'select id, line_sequence from insurance.insurance_claim_lines where insurance_claim_id = ? order by line_sequence',
      [created.id],
    );
    return { claimId: created.id, lineIds: claimLines.map((line) => line.id) };
  }

  const issue = (
    claimId: string,
    claimLineId: string,
    extra: Record<string, unknown> = {},
    service: ClaimPatientInvoiceService = invoiceService,
  ) =>
    inTenant(() =>
      service.issue(claimId, { claimLineId, ...extra } as never, biller()),
    );

  const invoiceLinesOf = (claimLineId: string) =>
    count(
      'select count(*)::int as n from billing.invoice_lines where insurance_claim_line_id = ?',
      [claimLineId],
    );

  async function failureOf(promise: Promise<unknown>): Promise<any> {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error('se esperaba un error y la operación terminó bien');
  }
  const reasonOf = (error: any) => error?.details?.reason;

  beforeAll(async () => {
    // Antes de abrir una sola conexión: esta prueba deja historial que no se puede
    // borrar (`audit.*` es de sólo inserción), así que no corre contra una base
    // compartida de desarrollo (#827). No envía SQL.
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);

    // Sin entidades descubiertas no hay prueba: las globs apuntan a `dist/`, así
    // que hace falta `yarn build` antes (como el resto de los specs con servicios).
    orm = await MikroORM.init(buildOrmConfig());

    // Los conceptos los siembra el arranque de la API; si la base todavía no los
    // tiene (una base de CI recién materializada), se materializan igual que lo
    // haría el arranque. Idempotente: sólo inserta lo que falta.
    const needed = [
      INS.DISPUTE_TYPE_PATIENT_OBJECTION,
      INS.DISPUTE_REASON_CHARGE_AMOUNT,
      INS.DISPUTE_REASON_SERVICE_NOT_RECEIVED,
      INS.DISPUTE_REASON_NOT_INFORMED,
      INS.BENEFIT_CATEGORY_GENERAL,
      INS.BENEFIT_CATEGORY_OUTPATIENT,
      INS.BENEFIT_ACTIVE,
      INS.VERIFY_VERIFIED,
      INS.VERIFY_PENDING,
      INS.CARRIER_ACTIVE,
      INS.PRODUCT_ACTIVE,
      INS.PRODUCT_TYPE_HEALTH,
      INS.PLAN_ACTIVE,
      INS.CLAIM_REVERSED,
      INS.DISPUTE_RESOLVED,
      BILL.INVOICE_ISSUED,
      CONCEPTS.USER_ACTIVE,
    ];
    const present = await count(
      `select count(*)::int as n from terminology.catalog_concepts where id in (${needed.map(() => '?').join(', ')})`,
      needed,
    );
    if (present < needed.length) {
      await new TerminologySeedService(orm, logger as never).run();
    }

    // Padres sintéticos (mínimo de columnas obligatorias de cada tabla).
    const any = INS.CARRIER_ACTIVE;
    for (const user of [
      ids.userBiller,
      ids.userPatient,
      ids.userOtherPatient,
    ]) {
      await run(
        `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at)
         values (?, ?, ?, now(), now())`,
        [user, CONCEPTS.USER_ACTIVE, `${mark}-user`],
      );
    }
    await run(
      `insert into directory.tenants
         (id, code, tenant_type_concept_id, legal_name, legal_entity_type_concept_id,
          status_concept_id, verification_status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [ids.tenant, mark, any, mark, any, any, any],
    );
    await run(
      `insert into practice.practices
         (id, tenant_id, code, name, type_concept_id, admin_user_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [ids.practice, ids.tenant, mark, mark, any, ids.userBiller, any],
    );
    for (const person of [ids.patient, ids.otherPatient]) {
      await run(
        `insert into profiles.persons (id, person_status_concept_id, created_at, updated_at)
         values (?, ?, now(), now())`,
        [person, any],
      );
      await run(
        `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at)
         values (?, ?, now(), now())`,
        [person, `${mark}-${person.slice(0, 4)}`],
      );
    }
    await run(
      `insert into insurance.insurance_carriers
         (id, tenant_id, carrier_code, legal_name, verification_status_concept_id,
          status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.carrier,
        ids.tenant,
        mark,
        mark,
        INS.VERIFY_VERIFIED,
        INS.CARRIER_ACTIVE,
      ],
    );
    await run(
      `insert into insurance.insurance_products
         (id, insurance_carrier_id, product_code, name, product_type_concept_id,
          status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        ids.product,
        ids.carrier,
        mark,
        mark,
        INS.PRODUCT_TYPE_HEALTH,
        INS.PRODUCT_ACTIVE,
      ],
    );
    await run(
      `insert into insurance.insurance_plans
         (id, insurance_product_id, plan_code, name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [ids.plan, ids.product, mark, mark, INS.PLAN_ACTIVE],
    );

    const addBenefit = async (
      serviceConceptId: string,
      percent: string,
      copay: string | null,
      requiresPriorAuthorization: boolean,
    ) => {
      const id = randomUUID();
      await run(
        `insert into insurance.insurance_plan_benefits
           (id, insurance_plan_id, benefit_category_concept_id, service_concept_id,
            coverage_percent, copay_amount, requires_prior_authorization,
            effective_from, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, current_date - 30, ?, now(), now())`,
        [
          id,
          plan,
          INS.BENEFIT_CATEGORY_GENERAL,
          serviceConceptId,
          percent,
          copay,
          requiresPriorAuthorization,
          INS.BENEFIT_ACTIVE,
        ],
      );
      benefitIds.push(id);
    };
    // 500 Bs, copago 50, 80 % → paciente 140 y aseguradora 360 (el ejemplo del propietario).
    await addBenefit(consultConcept, '80', '50.00', false);
    await addBenefit(surgeryConcept, '90', null, true);

    await run(
      `insert into insurance.patient_coverages
         (id, patient_profile_id, insurance_plan_id, member_identifier,
          verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        coverageId,
        patient,
        plan,
        mark,
        INS.VERIFY_VERIFIED,
        INS.CARRIER_ACTIVE,
      ],
    );

    const em = orm.em;
    const claimRepo = new ClaimRepository();
    const coverageRepo = new CoverageRepository();
    const catalogRepo = new CatalogRepository();
    const policy = new ClaimCoveragePolicy();
    const practiceLookup = {
      findActivePracticeIdsForTenant: async (id: string) =>
        id === tenant ? [practice] : [],
      findTenantOfPractice: async (id: string) =>
        id === practice ? tenant : null,
    };
    const publisher = {
      publish: async (_tx: unknown, event: any) => {
        events.push({
          eventType: event.eventType,
          payloadJson: event.payloadJson,
        });
      },
    };
    const notices = { notifyPatient: async () => undefined };
    const billingPort = new BillingPatientInvoiceAdapter(invoicesRepo);
    const accepted = {
      findLatestAcceptance: async (
        _em: unknown,
        query: { claimLineId: string },
      ) => acceptances.get(query.claimLineId) ?? null,
    };

    claims = new ClaimsService(
      em as never,
      claimRepo,
      coverageRepo,
      catalogRepo,
      practiceLookup as never,
      logger as never,
      {} as never,
      {} as never,
      policy,
    );
    quoteService = new ClaimQuoteService(
      em as never,
      coverageRepo,
      catalogRepo,
      policy,
    );
    const build = (acceptancePort: unknown) =>
      new ClaimPatientInvoiceService(
        em as never,
        claimRepo,
        coverageRepo,
        policy,
        new PatientConsentValidator(acceptancePort as never),
        billingPort,
        publisher as never,
        practiceLookup as never,
        notices as never,
        logger as never,
      );
    // El adaptador real falla cerrado; el segundo servicio simula la tabla futura.
    invoiceService = build(new NoPatientChargeAcceptanceAdapter());
    invoiceServiceWithAcceptance = build(accepted);
    const ownership = {
      assertOwnsPatientProfile: async (
        _em: unknown,
        profileId: string,
        actor: { patientProfileId?: string },
      ) => {
        if (actor.patientProfileId !== profileId) {
          throw new ForbiddenException('Sólo el titular del perfil');
        }
      },
    };
    objectionService = new PatientChargeObjectionService(
      em as never,
      claimRepo,
      coverageRepo,
      ownership as never,
      publisher as never,
      practiceLookup as never,
      logger as never,
    );
    payments = new PaymentsReceivedService(
      em as never,
      new PaymentsReceivedRepository(),
      invoicesRepo,
      practiceLookup as never,
      logger as never,
    );
  });

  afterAll(async () => {
    if (orm) {
      // Mejor esfuerzo y en orden inverso: lo que tiene historial en `audit.*` o es
      // inmutable se conserva y se informa, nunca se fuerza. No hay TRUNCATE.
      const attempt = async (sql: string, params: unknown[] = []) => {
        try {
          await run(sql, params);
        } catch {
          /* protegido por historial o por una FK: se informa abajo */
        }
      };
      // Un padre y sus líneas se borran juntos o no se borran: si el padre está
      // protegido, las líneas quedan, y no queda una factura o un reclamo huérfano.
      const attemptTogether = async (
        statements: Array<[string, unknown[]]>,
      ) => {
        try {
          await orm.em.fork().transactional(async (tx) => {
            for (const [sql, params] of statements) {
              await tx.execute(sql, params);
            }
          });
        } catch {
          /* protegido: se conserva entero y se informa abajo */
        }
      };
      const claimIds = (
        await all<{ id: string }>(
          'select id from insurance.insurance_claims where claim_identifier like ?',
          [`${mark}%`],
        )
      ).map((row) => row.id);
      const inList = (values: string[]) => values.map(() => '?').join(', ');
      if (claimIds.length) {
        const lineIds = (
          await all<{ id: string }>(
            `select id from insurance.insurance_claim_lines where insurance_claim_id in (${inList(claimIds)})`,
            claimIds,
          )
        ).map((row) => row.id);
        const invoiceIds = lineIds.length
          ? (
              await all<{ invoice_id: string }>(
                `select distinct invoice_id from billing.invoice_lines where insurance_claim_line_id in (${inList(lineIds)})`,
                lineIds,
              )
            ).map((row) => row.invoice_id)
          : [];
        if (invoiceIds.length) {
          paymentIds.push(
            ...(
              await all<{ payment_received_id: string }>(
                `select distinct payment_received_id from billing.receivable_payment_allocations where invoice_id in (${inList(invoiceIds)})`,
                invoiceIds,
              )
            ).map((row) => row.payment_received_id),
          );
          await attempt(
            `delete from billing.receivable_payment_allocations where invoice_id in (${inList(invoiceIds)})`,
            invoiceIds,
          );
        }
        if (paymentIds.length) {
          await attempt(
            `delete from billing.payments_received where id in (${inList(paymentIds)})`,
            paymentIds,
          );
        }
        await attempt(
          `delete from insurance.claim_disputes where insurance_claim_id in (${inList(claimIds)})`,
          claimIds,
        );
        for (const id of invoiceIds) {
          await attemptTogether([
            ['delete from billing.invoice_lines where invoice_id = ?', [id]],
            ['delete from billing.invoices where id = ?', [id]],
          ]);
        }
        for (const id of claimIds) {
          await attemptTogether([
            [
              'delete from insurance.insurance_claim_lines where insurance_claim_id = ?',
              [id],
            ],
            ['delete from insurance.insurance_claims where id = ?', [id]],
          ]);
        }
      }
      // Los beneficios alteran el cotizador de su plan: siempre se retiran.
      if (benefitIds.length) {
        await attempt(
          `delete from insurance.insurance_plan_benefits where id in (${inList(benefitIds)})`,
          benefitIds,
        );
      }
      for (const id of extraCoverageIds) {
        await attempt('delete from insurance.patient_coverages where id = ?', [
          id,
        ]);
      }
      await attempt('delete from insurance.patient_coverages where id = ?', [
        coverageId,
      ]);
      for (const id of extraPlanIds) {
        await attempt('delete from insurance.insurance_plans where id = ?', [
          id,
        ]);
      }
      await attempt('delete from insurance.insurance_plans where id = ?', [
        ids.plan,
      ]);
      await attempt('delete from insurance.insurance_products where id = ?', [
        ids.product,
      ]);
      await attempt('delete from insurance.insurance_carriers where id = ?', [
        ids.carrier,
      ]);
      for (const person of [ids.patient, ids.otherPatient]) {
        await attempt(
          'delete from profiles.patient_profiles where profile_id = ?',
          [person],
        );
        await attempt('delete from profiles.persons where id = ?', [person]);
      }
      await attempt('delete from practice.practices where id = ?', [
        ids.practice,
      ]);
      await attempt('delete from directory.tenants where id = ?', [ids.tenant]);
      for (const user of [
        ids.userBiller,
        ids.userPatient,
        ids.userOtherPatient,
      ]) {
        await attempt('delete from iam.users where id = ?', [user]);
      }
      const left = await all<{
        claims: number;
        invoices: number;
        benefits: number;
      }>(
        `select
           (select count(*) from insurance.insurance_claims where claim_identifier like ?)::int as claims,
           (select count(*) from billing.invoices where patient_profile_id in (?, ?))::int as invoices,
           (select count(*) from insurance.insurance_plan_benefits where insurance_plan_id = ?)::int as benefits`,
        [`${mark}%`, ids.patient, ids.otherPatient, ids.plan],
      );
      console.log(
        `LANE16 limpieza (marca ${mark}): reclamos conservados = ${left[0].claims}, ` +
          `facturas conservadas = ${left[0].invoices}, beneficios restantes = ${left[0].benefits}. ` +
          'Lo conservado tiene historial en audit.* (sólo inserción) y no se fuerza.',
      );
    }
    await orm?.close(true);
  });

  describe('reparto paciente/aseguradora y alcance del cobro directo (REQ-16-023 a 025)', () => {
    const claimsWith = async (identifier: string) =>
      count(
        'select count(*)::int as n from insurance.insurance_claims where claim_identifier = ?',
        [identifier],
      );
    const partOfPatient = async (claimId: string) =>
      (
        await all<{ p: string; b: string }>(
          `select patient_responsibility_amount::text as p, billed_amount::text as b
             from insurance.insurance_claim_lines where insurance_claim_id = ?`,
          [claimId],
        )
      )[0];
    const lineOf = (extra: Record<string, unknown> = {}) => [
      {
        lineSequence: 1,
        serviceConceptId: consultConcept,
        billedAmount: '500.00',
        ...extra,
      },
    ];

    it('caso feliz: 500 Bs, copago 50, 80 % guarda 140 del paciente aunque el cliente no lo mande', async () => {
      const { claimId } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      expect(await partOfPatient(claimId)).toEqual({
        p: '140.00',
        b: '500.00',
      });
    });

    it('caso feliz: el cliente declara 140.00, coincide con el plan y se guarda', async () => {
      const { claimId } = await submitClaim([
        {
          serviceConceptId: consultConcept,
          billedAmount: '500.00',
          patientResponsibilityAmount: '140.00',
        } as never,
      ]);
      expect((await partOfPatient(claimId)).p).toBe('140.00');
    });

    it('monto inflado: el cliente declara 300 y el servidor responde 422 PATIENT_SHARE_MISMATCH sin guardar nada', async () => {
      const identifier = `${mark}-inflado`;
      const error = await failureOf(
        inTenant(() =>
          claims.submitClaim(
            {
              insuranceCarrierId: carrier,
              patientCoverageId: coverageId,
              billingProviderEntityId: practice,
              claimIdentifier: identifier,
              lines: lineOf({ patientResponsibilityAmount: '300.00' }),
            } as never,
            biller(),
          ),
        ),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(reasonOf(error)).toBe('PATIENT_SHARE_MISMATCH');
      expect(error.details).toMatchObject({
        declaredPatientAmount: '300.00',
        expectedPatientAmount: '140.00',
      });
      expect(await claimsWith(identifier)).toBe(0);
    });

    it('la práctica de otra organización no puede cobrar: 403 y no se guarda nada', async () => {
      const identifier = `${mark}-otra-organizacion`;
      const error = await failureOf(
        runWithTenant(randomUUID(), () =>
          claims.submitClaim(
            {
              insuranceCarrierId: carrier,
              patientCoverageId: coverageId,
              billingProviderEntityId: practice,
              claimIdentifier: identifier,
              lines: lineOf(),
            } as never,
            biller(),
          ),
        ),
      );
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(await claimsWith(identifier)).toBe(0);
    });

    it('una cobertura de otro plan no se contrasta con los beneficios de este: 422 COVERAGE_PLAN_MISMATCH', async () => {
      const otherPlan = randomUUID();
      const otherCoverage = randomUUID();
      extraPlanIds.push(otherPlan);
      extraCoverageIds.push(otherCoverage);
      await run(
        `insert into insurance.insurance_plans
           (id, insurance_product_id, plan_code, name, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, now(), now())`,
        [otherPlan, ids.product, `${mark}-2`, `${mark}-2`, INS.PLAN_ACTIVE],
      );
      await run(
        `insert into insurance.patient_coverages
           (id, patient_profile_id, insurance_plan_id, member_identifier,
            verification_status_concept_id, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, now(), now())`,
        [
          otherCoverage,
          patient,
          otherPlan,
          `${mark}-2`,
          INS.VERIFY_VERIFIED,
          INS.CARRIER_ACTIVE,
        ],
      );
      const policy = new ClaimCoveragePolicy();
      const evaluate = (planId: string, patientCoverageId: string) =>
        orm.em.fork().transactional((tx) =>
          policy.evaluate(tx, {
            planId,
            patientCoverageId,
            lines: lineOf(),
            at: new Date(),
          }),
        );

      // El par correcto reparte con los beneficios del plan.
      expect(await evaluate(plan, coverageId)).toHaveLength(1);
      // La cobertura de OTRO plan, ni existe ni vale para este plan.
      expect(reasonOf(await failureOf(evaluate(plan, otherCoverage)))).toBe(
        'COVERAGE_PLAN_MISMATCH',
      );
      expect(reasonOf(await failureOf(evaluate(plan, randomUUID())))).toBe(
        'COVERAGE_PLAN_MISMATCH',
      );
    });
  });

  describe('cotización previa (REQ-16-026)', () => {
    it('500 Bs, copago 50, 80 % → paciente 140 y aseguradora 360, y no escribe nada', async () => {
      const before = {
        claims: await count(
          'select count(*)::int as n from insurance.insurance_claims',
        ),
        invoices: await count(
          'select count(*)::int as n from billing.invoices',
        ),
        disputes: await count(
          'select count(*)::int as n from insurance.claim_disputes',
        ),
      };
      const result = await quoteService.quote(
        {
          insuranceCarrierId: carrier,
          patientCoverageId: coverageId,
          lines: [
            {
              lineSequence: 1,
              serviceConceptId: consultConcept,
              billedAmount: '500.00',
            },
          ],
        } as never,
        biller(),
      );
      expect(result).toMatchObject({
        canSubmit: true,
        totalBilledAmount: '500.00',
        totalPatientAmount: '140.00',
        totalInsurerAmount: '360.00',
      });
      expect(result.lines[0]).toMatchObject({
        covered: true,
        coveragePercent: '80',
        copayAmount: '50.00',
        priorAuthorizationStatus: 'NOT_REQUIRED',
      });
      const after = {
        claims: await count(
          'select count(*)::int as n from insurance.insurance_claims',
        ),
        invoices: await count(
          'select count(*)::int as n from billing.invoices',
        ),
        disputes: await count(
          'select count(*)::int as n from insurance.claim_disputes',
        ),
      };
      expect(after).toEqual(before);
    });

    it('aprobación previa exigida y ausente: no se puede enviar, y el envío real lo rechaza con el mismo motivo', async () => {
      const result = await quoteService.quote(
        {
          insuranceCarrierId: carrier,
          patientCoverageId: coverageId,
          lines: [
            {
              lineSequence: 1,
              serviceConceptId: surgeryConcept,
              billedAmount: '1000.00',
            },
          ],
        } as never,
        biller(),
      );
      expect(result.canSubmit).toBe(false);
      expect(result.lines[0]).toMatchObject({
        priorAuthorizationStatus: 'MISSING',
        reason: 'PRIOR_AUTHORIZATION_REQUIRED',
        patientAmount: '100.00',
      });
      const error = await failureOf(
        submitClaim([
          { serviceConceptId: surgeryConcept, billedAmount: '1000.00' },
        ]),
      );
      expect(reasonOf(error)).toBe('PRIOR_AUTHORIZATION_REQUIRED');
    });

    it('un paciente no puede cotizar', async () => {
      const error = await failureOf(
        quoteService.quote(
          {
            insuranceCarrierId: carrier,
            patientCoverageId: coverageId,
            lines: [],
          } as never,
          patientActor(),
        ),
      );
      expect(error).toBeInstanceOf(ForbiddenException);
    });
  });

  describe('factura al paciente (REQ-16-028 y 029)', () => {
    it('reclamo → factura: exactamente 140, vinculada a la línea, con los totales de la factura', async () => {
      const { claimId, lineIds } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      const stored = await all<{ patient_responsibility_amount: string }>(
        'select patient_responsibility_amount from insurance.insurance_claim_lines where id = ?',
        [lineIds[0]],
      );
      expect(Number(stored[0].patient_responsibility_amount)).toBe(140);

      const result = await issue(claimId, lineIds[0], {
        patientAmount: '140.00',
      });
      expect(result).toMatchObject({
        chargeKind: 'INSURED_SHARE',
        patientAmount: '140.00',
        insurerAmount: '360.00',
        billedAmount: '500.00',
      });

      const rows = await all<any>(
        `select il.unit_price, il.line_total, il.insurance_claim_line_id,
                i.total, i.balance, i.paid_total, i.status_concept_id,
                i.patient_profile_id, i.practice_id
           from billing.invoice_lines il
           join billing.invoices i on i.id = il.invoice_id
          where il.insurance_claim_line_id = ?`,
        [lineIds[0]],
      );
      expect(rows).toHaveLength(1);
      expect(Number(rows[0].unit_price)).toBe(140);
      expect(Number(rows[0].line_total)).toBe(140);
      expect(Number(rows[0].total)).toBe(140);
      expect(Number(rows[0].balance)).toBe(140);
      expect(Number(rows[0].paid_total)).toBe(0);
      expect(rows[0].status_concept_id).toBe(BILL.INVOICE_ISSUED);
      expect(rows[0].patient_profile_id).toBe(patient);
      expect(rows[0].practice_id).toBe(practice);
      expect(events.at(-1)).toMatchObject({
        eventType: 'InsuranceClaimPatientInvoiceIssued',
        payloadJson: { patientAmount: '140.00', insurerAmount: '360.00' },
      });

      // Intento de doble cobro: 422 tipificado y sigue habiendo una sola fila.
      const again = await failureOf(issue(claimId, lineIds[0]));
      expect(again).toBeInstanceOf(PreconditionFailedException);
      expect(reasonOf(again)).toBe('PATIENT_INVOICE_ALREADY_ISSUED');
      expect(again.details.invoiceId).toBe(result.invoiceId);
      expect(await invoiceLinesOf(lineIds[0])).toBe(1);
    });

    it('factura al paciente por el total de un servicio reclamado: 422 y no se crea nada', async () => {
      const { claimId, lineIds } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      const error = await failureOf(
        issue(claimId, lineIds[0], { patientAmount: '500.00' }),
      );
      expect(reasonOf(error)).toBe('PATIENT_INVOICE_AMOUNT_MISMATCH');
      expect(error.details).toMatchObject({
        declaredPatientAmount: '500.00',
        expectedPatientAmount: '140.00',
      });
      expect(await invoiceLinesOf(lineIds[0])).toBe(0);
      expect(events.at(-1)).toMatchObject({
        eventType: 'InsuranceClaimPatientInvoiceRejected',
        payloadJson: { reason: 'PATIENT_INVOICE_AMOUNT_MISMATCH' },
      });
    });

    it('dos pedidos en paralelo para la misma línea: una factura y un 422 (5 rondas)', async () => {
      for (let round = 0; round < 5; round += 1) {
        const { claimId, lineIds } = await submitClaim([
          { serviceConceptId: consultConcept, billedAmount: '500.00' },
        ]);
        const settled = await Promise.allSettled([
          issue(claimId, lineIds[0]),
          issue(claimId, lineIds[0]),
        ]);
        const fulfilled = settled.filter((r) => r.status === 'fulfilled');
        const rejected = settled.filter(
          (r): r is PromiseRejectedResult => r.status === 'rejected',
        );
        expect({
          round,
          ok: fulfilled.length,
          failed: rejected.length,
        }).toEqual({
          round,
          ok: 1,
          failed: 1,
        });
        expect(rejected[0].reason).toBeInstanceOf(PreconditionFailedException);
        expect(reasonOf(rejected[0].reason)).toBe(
          'PATIENT_INVOICE_ALREADY_ISSUED',
        );
        expect(await invoiceLinesOf(lineIds[0])).toBe(1);
      }
    });

    it('un escritor sin el lock choca con el índice único y el 409 se convierte en 422', async () => {
      const { claimId, lineIds } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      // Otra transacción inserta la factura de esa línea y la deja sin confirmar:
      // el caso de uso no la ve (la comprobación previa lee lo confirmado) y su
      // propio insert espera el índice único hasta que la otra confirme.
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      let started!: () => void;
      const inserted = new Promise<void>((resolve) => (started = resolve));
      const invoiceId = randomUUID();
      const holder = orm.em.fork().transactional(async (tx) => {
        await tx.execute(
          `insert into billing.invoices
             (id, practice_id, invoice_number, patient_profile_id, issue_date,
              status_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, current_date, ?, now(), now())`,
          [
            invoiceId,
            practice,
            `${mark}-HOLD-${randomUUID().slice(0, 4)}`,
            patient,
            BILL.INVOICE_ISSUED,
          ],
        );
        await tx.execute(
          `insert into billing.invoice_lines
             (id, invoice_id, insurance_claim_line_id, quantity, unit_price, created_at, updated_at)
           values (?, ?, ?, 1, 140, now(), now())`,
          [randomUUID(), invoiceId, lineIds[0]],
        );
        started();
        await gate;
      });
      await inserted;

      const racing = issue(claimId, lineIds[0]);
      // Esperar a que el caso de uso esté bloqueado por el índice único.
      let waiting = 0;
      for (let attempt = 0; attempt < 40 && waiting === 0; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        waiting = await count(
          `select count(*)::int as n from pg_stat_activity
            where wait_event_type = 'Lock' and datname = current_database()
              and pid <> pg_backend_pid() and query ilike '%invoice_lines%'`,
        );
      }
      expect(waiting).toBeGreaterThan(0);
      release();
      await holder;

      const error = await failureOf(racing);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(reasonOf(error)).toBe('PATIENT_INVOICE_ALREADY_ISSUED');
      expect(await invoiceLinesOf(lineIds[0])).toBe(1);
    });

    it('reclamo de otra práctica, línea ajena e inexistente responden el mismo 403', async () => {
      const first = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      const second = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      const foreignTenant = randomUUID();
      const foreignPractice = await failureOf(
        runWithTenant(foreignTenant, () =>
          invoiceService.issue(
            first.claimId,
            { claimLineId: first.lineIds[0] } as never,
            biller(),
          ),
        ),
      );
      const otherClaimLine = await failureOf(
        issue(first.claimId, second.lineIds[0]),
      );
      const missing = await failureOf(issue(randomUUID(), randomUUID()));
      for (const error of [foreignPractice, otherClaimLine, missing]) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.getResponse()).toEqual(foreignPractice.getResponse());
      }
      expect(await invoiceLinesOf(first.lineIds[0])).toBe(0);
      expect(await invoiceLinesOf(second.lineIds[0])).toBe(0);
    });

    it('reclamo revertido: 422', async () => {
      const { claimId, lineIds } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      await run(
        'update insurance.insurance_claims set status_concept_id = ? where id = ?',
        [INS.CLAIM_REVERSED, claimId],
      );
      const error = await failureOf(issue(claimId, lineIds[0]));
      expect(reasonOf(error)).toBe('CLAIM_REVERSED_NO_PATIENT_CHARGE');
      expect(await invoiceLinesOf(lineIds[0])).toBe(0);
    });
  });

  describe('cobro particular y consentimiento (REQ-16-030)', () => {
    /** Una línea sin parte calculada, como las de un reclamo vinculado. */
    async function claimLineWithoutShare(serviceConceptId: string) {
      const { claimId, lineIds } = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      await run(
        'update insurance.insurance_claim_lines set patient_responsibility_amount = null, service_concept_id = ? where id = ?',
        [serviceConceptId, lineIds[0]],
      );
      return { claimId, lineId: lineIds[0] };
    }

    it('servicio no cubierto sin aceptación del paciente: 422 y no se factura', async () => {
      const { claimId, lineId } = await claimLineWithoutShare(uncoveredConcept);
      const error = await failureOf(issue(claimId, lineId));
      expect(reasonOf(error)).toBe('PATIENT_CONSENT_REQUIRED');
      expect(error.details.consent).toBe('MISSING');
      expect(await invoiceLinesOf(lineId)).toBe(0);
    });

    it('con aceptación previa por el mismo importe se factura el total (doble de la tabla futura)', async () => {
      const { claimId, lineId } = await claimLineWithoutShare(uncoveredConcept);
      acceptances.set(lineId, {
        acceptedAmount: '500.00',
        acceptedAt: new Date(Date.now() - 60_000),
        acceptedByUserId: userPatient,
      });
      const result = await issue(
        claimId,
        lineId,
        {},
        invoiceServiceWithAcceptance,
      );
      expect(result).toMatchObject({
        chargeKind: 'PRIVATE_FULL',
        patientAmount: '500.00',
        insurerAmount: '0.00',
      });
      expect(await invoiceLinesOf(lineId)).toBe(1);
      expect(events.at(-1)?.payloadJson.consent).toMatchObject({
        acceptedByUserId: userPatient,
      });
    });

    it('con aceptación por otro importe: 422', async () => {
      const { claimId, lineId } = await claimLineWithoutShare(uncoveredConcept);
      acceptances.set(lineId, {
        acceptedAmount: '300.00',
        acceptedAt: new Date(Date.now() - 60_000),
        acceptedByUserId: userPatient,
      });
      const error = await failureOf(
        issue(claimId, lineId, {}, invoiceServiceWithAcceptance),
      );
      expect(reasonOf(error)).toBe('PATIENT_CONSENT_REQUIRED');
      expect(error.details.consent).toBe('AMOUNT_DIFFERS');
      expect(await invoiceLinesOf(lineId)).toBe(0);
    });
  });

  describe('objeción del paciente y pausa del cobro (REQ-16-032 y 033)', () => {
    let claimId: string;
    let lineId: string;
    let invoiceId: string;
    let disputeId: string;

    const apply = (amount: string) =>
      inTenant(() =>
        payments.apply(
          {
            practiceId: practice,
            patientProfileId: patient,
            amount,
            allocations: [{ invoiceId, allocatedAmount: amount }],
          } as never,
          admin(),
        ),
      );
    const paymentsCount = () =>
      count(
        'select count(*)::int as n from billing.payments_received where practice_id = ? and patient_profile_id = ?',
        [practice, patient],
      );

    beforeAll(async () => {
      const submitted = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      claimId = submitted.claimId;
      lineId = submitted.lineIds[0];
      invoiceId = (await issue(claimId, lineId)).invoiceId;
    });

    it('el titular objeta: queda una disputa de tipo objeción, iniciada por el paciente', async () => {
      const result = await inTenant(() =>
        objectionService.object(
          claimId,
          {
            initiatedBy: 'PATIENT',
            objectionReason: 'AMOUNT_DIFFERS',
          } as never,
          patientActor(),
        ),
      );
      disputeId = result.id;
      const rows = await all<any>(
        'select * from insurance.claim_disputes where insurance_claim_id = ?',
        [claimId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: disputeId,
        dispute_type_concept_id: INS.DISPUTE_TYPE_PATIENT_OBJECTION,
        dispute_reason_concept_id: INS.DISPUTE_REASON_CHARGE_AMOUNT,
        initiated_by_party_type_concept_id: INS.PARTY_PATIENT,
        status_concept_id: INS.DISPUTE_OPEN,
        initiated_by_entity_id: patient,
      });
      expect(events.at(-1)).toMatchObject({
        eventType: 'InsuranceClaimPatientChargeObjected',
        payloadJson: { disputeId, objectionReason: 'AMOUNT_DIFFERS' },
      });
    });

    it('objetar de nuevo, aun en paralelo, devuelve la misma disputa', async () => {
      const results = await Promise.all([
        objectionService.object(
          claimId,
          { initiatedBy: 'PATIENT' } as never,
          patientActor(),
        ),
        objectionService.object(
          claimId,
          { initiatedBy: 'PATIENT' } as never,
          patientActor(),
        ),
      ]);
      expect(results.map((r) => r.id)).toEqual([disputeId, disputeId]);
      expect(
        await count(
          'select count(*)::int as n from insurance.claim_disputes where insurance_claim_id = ?',
          [claimId],
        ),
      ).toBe(1);
    });

    it('otro paciente recibe el mismo 403 que ante un reclamo inexistente', async () => {
      const foreign = await failureOf(
        objectionService.object(
          claimId,
          { initiatedBy: 'PATIENT' } as never,
          otherPatientActor(),
        ),
      );
      const missing = await failureOf(
        objectionService.object(
          randomUUID(),
          { initiatedBy: 'PATIENT' } as never,
          otherPatientActor(),
        ),
      );
      expect(foreign).toBeInstanceOf(ForbiddenException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(
        await count(
          'select count(*)::int as n from insurance.claim_disputes where insurance_claim_id = ?',
          [claimId],
        ),
      ).toBe(1);
    });

    it('con la objeción abierta el cobro está en pausa: 422 y no se guarda ningún pago', async () => {
      expect(
        await invoicesRepo.hasOpenPatientObjection(orm.em.fork(), invoiceId),
      ).toBe(true);
      const before = await paymentsCount();
      const error = await failureOf(apply('50.00'));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe('PAYMENT_RECEIVED_INVOICE_ON_HOLD');
      expect(await paymentsCount()).toBe(before);
      const invoice = await all<any>(
        'select balance, paid_total from billing.invoices where id = ?',
        [invoiceId],
      );
      expect(Number(invoice[0].balance)).toBe(140);
      expect(Number(invoice[0].paid_total)).toBe(0);
    });

    it('al resolverse la disputa, el cobro se libera', async () => {
      // `AppealsService.decide` hace exactamente este cambio de estado
      // (`dispute.statusConceptId = DISPUTE_RESOLVED`), pero además inserta una
      // decisión que es inmutable por trigger y no se podría retirar. Acá se
      // cambia sólo el estado: lo que se prueba es que la pausa deriva de él.
      await run(
        'update insurance.claim_disputes set status_concept_id = ? where id = ?',
        [INS.DISPUTE_RESOLVED, disputeId],
      );
      expect(
        await invoicesRepo.hasOpenPatientObjection(orm.em.fork(), invoiceId),
      ).toBe(false);
      // Liberado: un cobro mayor al saldo ya no se rechaza por la pausa sino por
      // su propia regla, y al fallar no deja ningún pago ni toca la factura.
      const before = await paymentsCount();
      const error = await failureOf(apply('500.00'));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(
        'PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE',
      );
      expect(await paymentsCount()).toBe(before);
      const invoice = await all<any>(
        'select balance, paid_total from billing.invoices where id = ?',
        [invoiceId],
      );
      expect(Number(invoice[0].balance)).toBe(140);
      expect(Number(invoice[0].paid_total)).toBe(0);
    });

    it('una factura sin objeción no se ve afectada por la de otra', async () => {
      const other = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      const otherInvoice = (await issue(other.claimId, other.lineIds[0]))
        .invoiceId;
      expect(
        await invoicesRepo.hasOpenPatientObjection(orm.em.fork(), otherInvoice),
      ).toBe(false);
    });

    it('reclamo revertido: la objeción se rechaza con 422', async () => {
      const reversed = await submitClaim([
        { serviceConceptId: consultConcept, billedAmount: '500.00' },
      ]);
      await run(
        'update insurance.insurance_claims set status_concept_id = ? where id = ?',
        [INS.CLAIM_REVERSED, reversed.claimId],
      );
      const error = await failureOf(
        objectionService.object(
          reversed.claimId,
          { initiatedBy: 'PATIENT' } as never,
          patientActor(),
        ),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(reasonOf(error)).toBe('CLAIM_REVERSED_NOT_DISPUTABLE');
      expect(
        await count(
          'select count(*)::int as n from insurance.claim_disputes where insurance_claim_id = ?',
          [reversed.claimId],
        ),
      ).toBe(0);
    });
  });
});
