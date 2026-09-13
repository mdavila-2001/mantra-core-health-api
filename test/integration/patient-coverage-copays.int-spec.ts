import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import request from 'supertest';
import { CONCEPTS, SEED, sumarDecimales } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { INS } from '../../src/modules/insurance/insurance.concepts';
import type { TestContext } from './harness';
import type {
  CopaysPharmacyScenario,
  CopaysPharmacyOrder,
} from '../support/copays-pharmacy-scenario';
import { multiplyAmounts } from '../../src/modules/pharmacy_inventory/services/pharmacy-pricing';
import { MedicationDispensations } from '../../src/modules/pharmacy_inventory/entities';

const isolated =
  process.env.COPAYS_ISOLATED_TEST === 'true' ? describe : describe.skip;
type Organization = {
  tenantId: string;
  token: string;
  carrierId?: string;
  diagnosticUnitId?: string;
};
type Patient = {
  nationalId: string;
  password: string;
  profileId: string;
  token: string;
};

/** Las relaciones del recorrido se crean por HTTP; las consultas ORM sólo observan. */
isolated('Coberturas y copagos: HTTP → PostgreSQL aislado', () => {
  let ctx: TestContext;
  let patient: Patient;
  let otherPatient: Patient;
  let insurer: Organization;
  let otherInsurer: Organization;
  let provider: Organization;
  let otherProvider: Organization;
  let coverageId: string;
  let offeringId: string;
  const claimLineIds = new Map<string, string[]>();
  const diagnosticOrders: Record<string, string> = {};
  const pharmacyOrders: Record<string, string> = {};
  let pharmacy: CopaysPharmacyScenario;
  const claims: Record<string, { id: string; versionId: string }> = {};
  const suffix = randomUUID().slice(0, 8);
  const http = () => request(ctx.app.getHttpServer());
  const auth = (
    actor?: Organization | Patient,
    tenantId = 'tenantId' in (actor ?? {})
      ? (actor as Organization).tenantId
      : SEED.tenantId,
  ) => ({
    Authorization: `Bearer ${actor?.token ?? ctx.adminToken}`,
    'X-Tenant-Id': tenantId,
  });
  async function post(
    path: string,
    body: object,
    actor?: Organization | Patient,
    expected = 201,
    tenantId?: string,
  ) {
    const response = await http()
      .post(path)
      .set(auth(actor, tenantId))
      .send(body);
    if (response.status !== expected)
      throw new Error(
        `${path}: expected ${expected}, received ${response.status}: ${JSON.stringify(response.body.message ?? response.body.error ?? response.body)}`,
      );
    if (path === '/insurance-claims' && expected === 201) {
      expect(Array.isArray(response.body.lineIds)).toBe(true);
      claimLineIds.set(response.body.id, response.body.lineIds);
    }
    return response.body;
  }
  async function registerOrganization(
    label: string,
    tenantType: 'PAYER' | 'DIAGNOSTIC_CENTER',
  ): Promise<Organization> {
    const email = `copays-${label}-${suffix}@example.test`;
    const password = 'Copays-local-passw0rd';
    const created = await post('/iam/auth/register-organization', {
      organization: {
        code: `COPAYS_${label}_${suffix}`,
        legalName: `Seguro y prestador ${label} de prueba`,
        tenantType,
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: CONCEPTS.JURISDICTION_BO,
        ...(tenantType === 'PAYER'
          ? {
              payer: {
                carrierCode: `COPAYS_${label}_${suffix}`,
                sigla: label,
                address: 'Dirección de integración',
                regulatorIdentifier: `REG-${suffix}-${label}`,
              },
            }
          : {
              diagnosticUnit: {
                code: `LAB_${label}_${suffix}`,
                name: `Laboratorio ${label}`,
                diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
                walkInAvailable: true,
              },
            }),
      },
      owner: { email, password, name: 'Administrador', lastName: label },
    });
    const login = await post(
      '/iam/auth/login',
      { email, password },
      undefined,
      200,
    );
    const organization: Organization = {
      tenantId: created.tenantId,
      token: login.accessToken,
      diagnosticUnitId: created.diagnosticUnitId,
    };
    if (tenantType === 'PAYER') {
      const directory = await http()
        .get('/insurance-carriers')
        .set(auth(organization))
        .expect(200);
      expect(directory.body.items).toHaveLength(1);
      organization.carrierId = directory.body.items[0].id;
    }
    return organization;
  }

  async function registerPatient(label: string): Promise<Patient> {
    const { camposObligatoriosDePaciente } = await import('./harness.js');
    const nationalId = `COPAYS-${label}-${suffix}`;
    const password = 'Copays-local-passw0rd';
    await post('/iam/auth/register-patient', {
      ...(await camposObligatoriosDePaciente(ctx)),
      nationalId,
      password,
      displayName: `Paciente Copagos ${label}`,
      email: `copays-patient-${label}-${suffix}@example.test`,
    });
    const login = await post(
      '/iam/auth/login',
      { nationalId, password },
      undefined,
      200,
    );
    const token = login.accessToken as string;
    const profile = await http()
      .get('/diagnostic-results/me/orders')
      .set({ Authorization: `Bearer ${token}` })
      .expect(200);
    return {
      nationalId,
      password,
      token,
      profileId: profile.body.patientProfileId,
    };
  }
  async function newOrder() {
    return post('/clinical/service-requests', {
      custodianTenantId: SEED.tenantId,
      patientProfileId: patient.profileId,
      performerTenantId: provider.tenantId,
      codeConceptId: DUNIT.STUDY_COMPLETE_BLOOD_COUNT,
      categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    });
  }
  function claimBody(orderId: string) {
    return {
      insuranceCarrierId: insurer.carrierId,
      patientCoverageId: coverageId,
      billingProviderEntityId: provider.diagnosticUnitId,
      serviceRequestId: orderId,
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
      claimIdentifier: `C-${randomUUID()}`,
      lines: [
        {
          lineSequence: 1,
          serviceConceptId: DUNIT.STUDY_COMPLETE_BLOOD_COUNT,
          diagnosticStudyOfferingId: offeringId,
          quantity: '1',
          billedAmount: '100.005',
        },
      ],
    };
  }
  async function adjudicate(
    claimId: string,
    result: 'approved' | 'partial' | 'denied',
  ) {
    const lines = claimLineIds.get(claimId);
    if (!lines?.length)
      throw new Error('Claim creation did not return line IDs');
    const amounts =
      result === 'approved'
        ? ['80.004', '20.001', '0']
        : result === 'partial'
          ? ['60.002', '10.001', '30.002']
          : ['0', '0', '100.005'];
    return post(
      `/insurance-claims/${claimId}/adjudications`,
      {
        outcome: result === 'denied' ? 'DENIED' : 'APPROVED',
        totalApprovedAmount: amounts[0],
        totalPatientAmount: amounts[1],
        totalDeniedAmount: amounts[2],
        lineAdjudications: lines.map((line) => ({
          insuranceClaimLineId: line,
          decision: result === 'denied' ? 'DENIED' : 'APPROVED',
          approvedAmount: amounts[0],
          patientAmount: amounts[1],
          deniedAmount: amounts[2],
          ...(result !== 'approved'
            ? {
                policyClauseReference:
                  'Cláusula 4.2. El seguro excluye la prestación indicada por superar el alcance del beneficio contratado; este importe queda sin asignar y no constituye una responsabilidad adjudicada al paciente.',
              }
            : {}),
        })),
      },
      insurer,
    );
  }
  async function ownOrders(actor = patient) {
    const response = await http()
      .get('/diagnostic-results/me/orders')
      .set(auth(actor))
      .expect(200);
    return response.body.items as Array<{
      id: string;
      insuranceSettlementAvailability: string;
      insuranceSettlement: Record<string, unknown> | null;
      preparationInstructions?: string;
    }>;
  }

  // El arranque en frío de AppModule y sus seeds superó 300 s en este entorno.
  // El límite cubre también el alta HTTP del fixture; las etapas localizan demoras.
  beforeAll(async () => {
    const startedAt = Date.now();
    const logStage = (stage: string) => {
      process.stdout.write(
        `[copays setup] ${new Date().toISOString()} +${Date.now() - startedAt}ms ${stage}\n`,
      );
    };
    logStage('isolation:start');
    for (const key of [
      'POSTGRES_READ_URL',
      'POSTGRES_WRITE_URL',
      'POSTGRES_ADMIN_URL',
    ]) {
      const url = new URL(process.env[key] ?? 'about:blank');
      if (
        url.hostname !== '127.0.0.1' ||
        url.port !== '55434' ||
        url.pathname !== '/mantra_copays_test'
      )
        throw new Error(`Unsafe integration target: ${key}`);
    }
    logStage('isolation:complete');
    logStage('harness-import:start');
    const { bootstrapTestApp } = await import('./harness.js');
    logStage('harness-import:complete');
    logStage('application-bootstrap:start');
    ctx = await bootstrapTestApp({ reset: true });
    logStage('application-bootstrap:complete');
    logStage('patients:start');
    patient = await registerPatient('Ana');
    otherPatient = await registerPatient('Bruno');
    logStage('patients:complete');
    logStage('insurers:start');
    insurer = await registerOrganization('A', 'PAYER');
    otherInsurer = await registerOrganization('B', 'PAYER');
    logStage('insurers:complete');
    logStage('providers:start');
    provider = await registerOrganization('CentroA', 'DIAGNOSTIC_CENTER');
    otherProvider = await registerOrganization('CentroB', 'DIAGNOSTIC_CENTER');
    logStage('providers:complete');
    logStage('insurance-product:start');
    const product = await post(
      `/insurance-carriers/${insurer.carrierId}/products`,
      { productCode: `COPAYS_${suffix}`, name: 'Producto Copagos Real' },
    );
    logStage('insurance-product:complete');
    logStage('insurance-plan:start');
    const plan = await post(
      `/insurance-products/${product.id}/plans`,
      {
        planCode: `COPAYS_${suffix}`,
        name: 'Plan Copagos Real',
        effectiveFrom: '2020-01-01',
        effectiveTo: '2099-12-31',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      },
      insurer,
    );
    logStage('insurance-plan:complete');
    logStage('insurance-benefit:start');
    await post(
      `/insurance-plans/${plan.id}/benefits`,
      {
        benefitCategoryConceptId: INS.BENEFIT_CATEGORY_OUTPATIENT,
        serviceConceptId: DUNIT.STUDY_COMPLETE_BLOOD_COUNT,
        coveragePercent: '80.25',
        copayAmount: '0',
        deductibleAmount: '10.50',
      },
      insurer,
    );
    logStage('insurance-benefit:complete');
    logStage('patient-coverage:start');
    const coverage = await post('/patient-coverages', {
      insurancePlanId: plan.id,
      patientProfileId: patient.profileId,
      memberIdentifier: `MEMBER-${suffix}`,
      policyIdentifier: `POL-COPAYS-${suffix}`,
      coverageOrder: 1,
    });
    coverageId = coverage.id;
    logStage('patient-coverage:complete');
    logStage('diagnostic-offering:start');
    const offering = await post(
      `/diagnostic-units/${provider.diagnosticUnitId}/study-offerings`,
      {
        studyCode: `CBC_${suffix}`,
        studyConceptId: DUNIT.STUDY_COMPLETE_BLOOD_COUNT,
        displayName: 'Hemograma completo',
        preparationInstructions:
          'Presentarse con la orden y seguir las instrucciones del laboratorio.',
      },
    );
    offeringId = offering.id;
    logStage('diagnostic-offering:complete');
    logStage('setup:complete');
  }, 600_000);

  afterAll(async () => {
    if (ctx) await ctx.app.close();
  });

  it('bootstraps real participants and coverage through HTTP', async () => {
    expect(patient.profileId).not.toBe(otherPatient.profileId);
    expect(insurer.tenantId).not.toBe(otherInsurer.tenantId);
    expect(provider.tenantId).not.toBe(otherProvider.tenantId);
    const profile = await http()
      .get('/profiles/patients/me')
      .set(auth(patient))
      .expect(200);
    expect(JSON.stringify(profile.body)).toContain('Plan Copagos Real');
  });

  it('creates and publishes approval, partial approval and denial using the provider and insurer memberships', async () => {
    for (const result of [
      'approved',
      'partial',
      'denied',
      'pending',
    ] as const) {
      const order = await newOrder();
      diagnosticOrders[result] = order.id;
      const claim = await post(
        '/insurance-claims',
        claimBody(order.id),
        provider,
      );
      expect(
        (await ownOrders()).find((row) => row.id === order.id)
          ?.insuranceSettlement,
      ).toBeNull();
      if (result === 'pending') continue;
      const version = await adjudicate(claim.id, result);
      claims[result] = { id: claim.id, versionId: version.id };
      expect(
        (await ownOrders()).find((row) => row.id === order.id)
          ?.insuranceSettlementAvailability,
      ).toBe('PENDING_PUBLICATION');
      await post(`/insurance-claims/${claim.id}/eob`, {}, insurer);
      const row = (await ownOrders()).find(
        (candidate) => candidate.id === order.id,
      );
      expect(row?.insuranceSettlementAvailability).toBe('AVAILABLE');
      expect(row?.insuranceSettlement?.result).toBe(
        result === 'partial' ? 'PARTIALLY_APPROVED' : result.toUpperCase(),
      );
      expect(row?.preparationInstructions).toContain(
        'Presentarse con la orden',
      );
      if (result === 'denied')
        expect(row?.insuranceSettlement?.totalPatientAmount).toBe('0');
    }
  });

  it('rejects foreign patients, providers, insurers, offers and incompatible coverage', async () => {
    expect(await ownOrders(otherPatient)).toEqual([]);
    const order = await newOrder();
    const body = claimBody(order.id);
    await post('/insurance-claims', body, otherProvider, 403);
    await post(
      '/insurance-claims',
      { ...body, insuranceCarrierId: otherInsurer.carrierId },
      provider,
      422,
    );
    await post(
      '/insurance-claims',
      {
        ...body,
        lines: [{ ...body.lines[0], diagnosticStudyOfferingId: randomUUID() }],
      },
      provider,
      403,
    );
    await post(
      `/insurance-claims/${claims.approved.id}/eob`,
      {},
      otherInsurer,
      403,
    );
    await post(
      `/insurance-claims/${claims.approved.id}/eob`,
      {},
      provider,
      403,
    );
  });

  it('rejects incomplete or contradictory financial versions without withdrawing the published one', async () => {
    const claim = claims.approved;
    const line = {
      insuranceClaimLineId: claimLineIds.get(claim.id)![0],
      decision: 'APPROVED',
      approvedAmount: '80.004',
      patientAmount: '20.001',
      deniedAmount: '0',
    };
    const base = {
      outcome: 'APPROVED',
      totalApprovedAmount: '80.004',
      totalPatientAmount: '20.001',
      totalDeniedAmount: '0',
    };
    for (const changes of [
      { lineAdjudications: [{ ...line, patientAmount: undefined }] },
      { lineAdjudications: [{ ...line, patientAmount: '-1' }] },
      { lineAdjudications: [line, line] },
      {
        lineAdjudications: [
          {
            ...line,
            deniedAmount: '20',
            patientAmount: '0.001',
            policyClauseReference: ' ',
          },
        ],
      },
      { lineAdjudications: [line], totalPatientAmount: '20.002' },
    ])
      await post(
        `/insurance-claims/${claim.id}/adjudications`,
        { ...base, ...changes },
        insurer,
        422,
      );
    const row = (await ownOrders()).find(
      (order) => order.id === diagnosticOrders.approved,
    );
    expect(row?.insuranceSettlementAvailability).toBe('AVAILABLE');
    expect(row?.insuranceSettlement?.adjudicationVersion).toBe(1);
  });

  it('serializes concurrent claims for the same order', async () => {
    const order = await newOrder();
    const responses = await Promise.all(
      [1, 2].map(() =>
        http()
          .post('/insurance-claims')
          .set(auth(provider))
          .send(claimBody(order.id)),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
  });

  it('withdraws old versions until publication and permits a replacement after reversal', async () => {
    const order = await newOrder();
    const claim = await post(
      '/insurance-claims',
      claimBody(order.id),
      provider,
    );
    await adjudicate(claim.id, 'approved');
    await post(`/insurance-claims/${claim.id}/eob`, {}, insurer);
    const version = await adjudicate(claim.id, 'partial');
    expect(
      (await ownOrders()).find((row) => row.id === order.id)
        ?.insuranceSettlementAvailability,
    ).toBe('PENDING_PUBLICATION');
    await post(`/insurance-claims/${claim.id}/eob`, {}, insurer);
    await post(
      `/insurance-claims/${claim.id}/reversals`,
      { reversedAdjudicationVersionId: version.id },
      insurer,
    );
    expect(
      (await ownOrders()).find((row) => row.id === order.id)
        ?.insuranceSettlementAvailability,
    ).toBe('UNDER_REVIEW');
    await post('/insurance-claims', claimBody(order.id), provider);
    expect(
      (await ownOrders()).find((row) => row.id === order.id)
        ?.insuranceSettlementAvailability,
    ).toBe('PENDING_PUBLICATION');
  });

  it('links each physical pharmacy line and keeps orders sharing a prescription separate', async () => {
    const { createCopaysPharmacyScenario } =
      await import('../support/copays-pharmacy-scenario.js');
    pharmacy = await createCopaysPharmacyScenario(ctx, {
      pharmacyTenantId: SEED.tenantId,
      patientToken: patient.token,
      patientProfileId: patient.profileId,
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
    });
    const [first, second] = pharmacy.orders;
    expect(first.lines).toHaveLength(3);
    const prior = await post('/prior-authorization-requests', {
      patientCoverageId: coverageId,
      requestingProviderEntityId: pharmacy.pharmacyId,
      inventoryReservationId: first.orderId,
      medicationRequestId: pharmacy.medicationRequestId,
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
      items: pharmacy.productIds.map((pharmacyProductId, index) => ({
        pharmacyProductId,
        requestedQuantity: '2',
        requestedAmount: index === 0 ? '40.00' : '60.00',
      })),
    });
    await post(
      `/prior-authorization-requests/${prior.id}/determinations`,
      { decision: 'APPROVED', approvedAmount: '100.00' },
      insurer,
    );
    const bodyFor = (order: CopaysPharmacyOrder) => ({
      insuranceCarrierId: insurer.carrierId,
      patientCoverageId: coverageId,
      billingProviderEntityId: pharmacy.pharmacyId,
      inventoryReservationId: order.orderId,
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
      claimIdentifier: `PH-${randomUUID()}`,
      lines: order.lines,
    });
    await post(
      '/insurance-claims',
      { ...bodyFor(second), priorAuthorizationRequestId: prior.id },
      undefined,
      422,
    );
    await post(
      '/insurance-claims',
      { ...bodyFor(first), lines: [second.lines[0], ...first.lines.slice(1)] },
      undefined,
      422,
    );
    const orders = [
      first,
      second,
      await pharmacy.createOrder(),
      await pharmacy.createOrder(),
    ];
    for (const [index, result] of (
      ['approved', 'partial', 'denied', 'pending'] as const
    ).entries()) {
      const order = orders[index];
      pharmacyOrders[result] = order.orderId;
      const claim = await post('/insurance-claims', {
        ...bodyFor(order),
        ...(index === 0 ? { priorAuthorizationRequestId: prior.id } : {}),
      });
      if (result === 'pending') continue;
      const lineIds = claimLineIds.get(claim.id)!;
      expect(lineIds).toHaveLength(order.lines.length);
      const lines = order.lines.map((line, ordinal) => ({
        ...line,
        id: lineIds[ordinal],
      }));
      const decisions = lines.map((line, ordinal) => {
        const denied =
          result === 'denied' || (result === 'partial' && ordinal === 0);
        return {
          insuranceClaimLineId: line.id,
          decision: denied ? 'DENIED' : 'APPROVED',
          approvedAmount: denied
            ? '0'
            : multiplyAmounts(line.billedAmount!, '0.8'),
          patientAmount: denied
            ? '0'
            : multiplyAmounts(line.billedAmount!, '0.2'),
          deniedAmount: denied ? line.billedAmount! : '0',
          ...(denied
            ? {
                policyClauseReference:
                  'Cláusula 5.3. Este medicamento está excluido del beneficio contratado. El importe no se asigna al paciente mediante esta liquidación.',
              }
            : {}),
        };
      });
      await post(
        `/insurance-claims/${claim.id}/adjudications`,
        {
          outcome: result === 'denied' ? 'DENIED' : 'APPROVED',
          totalApprovedAmount: sumarDecimales(
            decisions.map((line) => line.approvedAmount),
          ),
          totalPatientAmount: sumarDecimales(
            decisions.map((line) => line.patientAmount),
          ),
          totalDeniedAmount: sumarDecimales(
            decisions.map((line) => line.deniedAmount),
          ),
          lineAdjudications: decisions,
        },
        insurer,
      );
      await post(`/insurance-claims/${claim.id}/eob`, {}, insurer);
      const detail = await http()
        .get(`/pharmacy/orders/${order.orderId}`)
        .set(auth(patient))
        .expect(200);
      expect(detail.body.insuranceSettlementAvailability).toBe('AVAILABLE');
      expect(detail.body.insuranceSettlement.result).toBe(
        result === 'partial' ? 'PARTIALLY_APPROVED' : result.toUpperCase(),
      );
      const staff = await http()
        .get(`/pharmacy/orders/${order.orderId}`)
        .set(auth())
        .expect(200);
      expect(staff.body.insuranceSettlement).toBeNull();
      expect(staff.body.insuranceSettlementAvailability).toBe('NOT_AVAILABLE');
      await http()
        .get(`/pharmacy/orders/${order.orderId}`)
        .set(auth(otherPatient))
        .expect(404);
      if (result === 'approved') {
        const code = await pharmacy.ready(order.orderId);
        await pharmacy.dispense(order.orderId, code, [pharmacy.productIds[0]]);
        const dispensations = await ctx.orm.em
          .fork()
          .find(MedicationDispensations, {
            inventoryReservationId: order.orderId,
          });
        expect(dispensations).toHaveLength(1);
        expect(dispensations[0].insuranceClaimId).toBe(claim.id);
        const partial = await http()
          .get(`/pharmacy/orders/${order.orderId}`)
          .set(auth(patient))
          .expect(200);
        expect(partial.body.insuranceSettlementAvailability).toBe('AVAILABLE');
      }
    }
    const list = await http()
      .get('/pharmacy/orders/me')
      .set(auth(patient))
      .expect(200);
    for (const result of ['approved', 'partial', 'denied', 'pending']) {
      const item = list.body.items.find(
        (row: { id: string }) => row.id === pharmacyOrders[result],
      );
      expect(item.insuranceSettlementAvailability).toBe(
        result === 'pending' ? 'PENDING_PUBLICATION' : 'AVAILABLE',
      );
    }
  }, 180000);

  it('exports real browser fixtures without tokens', async () => {
    const credentials = ({ nationalId, password, profileId }: Patient) => ({
      nationalId,
      password,
      profileId,
    });
    await mkdir('node_modules/.cache', { recursive: true });
    await writeFile(
      'node_modules/.cache/copays-e2e-fixture.json',
      JSON.stringify(
        {
          patient: credentials(patient),
          otherPatient: credentials(otherPatient),
          diagnosticOrders,
          pharmacyOrders,
          pharmacyTenantId: SEED.tenantId,
        },
        null,
        2,
      ),
    );
  });
});
