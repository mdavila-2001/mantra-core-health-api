import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { INS } from '../insurance.concepts';
import {
  CLAIM_DECIDED_EVENT,
  InsurerReceivedClaimsService,
  MAX_RECEIVED_CLAIMS,
} from './insurer-received-claims.service';
import { InsurerContextService } from './insurer-context.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const CARRIER = 'carrier-1';
const CLAIM_ID = '11111111-1111-4111-8111-111111111111';

/** Miembro OWNER/ADMIN de la aseguradora: la autoridad por membresía. */
const owner = { id: 'u-owner', roles: ['USER'] } as any;
/** Operador con el rol de aseguradora vigente (sin ámbito: excepción global). */
const operator = { id: 'u-op', roles: ['USER', 'INSURANCE_OPERATOR'] } as any;
/** Operador de OTRA aseguradora: su rol está indexado a un tenant ajeno. */
const foreignOperator = {
  id: 'u-ajeno',
  roles: ['USER', 'INSURANCE_OPERATOR'],
  scopedRoles: { 'tenant-9': ['INSURANCE_OPERATOR'] },
} as any;
/** Operador cuyo rol está indexado a ESTE tenant. */
const thisOperatorTenant = {
  id: 'u-op2',
  roles: ['USER', 'INSURANCE_OPERATOR'],
  scopedRoles: { [TENANT]: ['INSURANCE_OPERATOR'] },
} as any;
/** Un paciente, un prestador: nadie con permiso sobre una aseguradora. */
const strange = { id: 'u-extraño', roles: ['USER', 'PATIENT'] } as any;

/** Una solicitud presentada, con lo mínimo que lee la fila. */
function request(over: Record<string, unknown> = {}) {
  return {
    id: CLAIM_ID,
    claimIdentifier: 'CLM-2026-1042',
    insuranceCarrierId: CARRIER,
    patientCoverageId: 'cov-1',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
    billingProviderEntityId: 'practice-1',
    encounterId: 'enc-1',
    statusConceptId: INS.CLAIM_SUBMITTED,
    totalAmount: '400.00',
    currencyConceptId: 'cur-bob',
    submittedAt: new Date('2026-09-26T14:00:00.000Z'),
    inventoryReservationId: undefined,
    serviceRequestId: undefined,
    ...over,
  };
}

/** Los dos renglones de la solicitud: 250,00 y 150,00. */
function renglones() {
  return [
    {
      id: 'l-2',
      insuranceClaimId: CLAIM_ID,
      lineSequence: 2,
      serviceConceptId: 'svc-ecg',
      quantity: '2',
      billedAmount: '150.00',
    },
    {
      id: 'l-1',
      insuranceClaimId: CLAIM_ID,
      lineSequence: 1,
      serviceConceptId: 'svc-eco',
      quantity: '1',
      billedAmount: '250.00',
    },
  ];
}

interface Options {
  /** La organización activa no es una aseguradora. */
  sinAseguradora?: boolean;
  /** `canAdminister` de la sesión. */
  administra?: boolean;
  claim?: ReturnType<typeof request> | null;
  claims?: ReturnType<typeof request>[];
  lines?: ReturnType<typeof renglones>;
  versions?: any[];
  pedidoCambio?: boolean;
}

/**
 * Construye el servicio con dobles.
 *
 * `createVersion` devuelve —y registra— la versión que el servicio escribe, así
 * que la lectura posterior al dictamen ve exactamente lo que se persistió.
 *
 * @param options - Lo que cambia respecto del caso por omisión.
 * @returns El servicio y sus dobles.
 */
function build(options: Options = {}) {
  const claim = 'claim' in options ? options.claim : request();
  const lines = options.lines ?? renglones();
  const versions: any[] = options.versions ?? [];

  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const rows: Record<string, unknown[]> = {
    Persons: [
      { id: 'pat-1', displayName: 'Ana Pérez' },
      { id: 'doc-1', displayName: 'Luis Rojas' },
    ],
    PatientProfiles: [{ profileId: 'pat-1', patientCode: 'PAT-0001' }],
    CatalogConcepts: [
      { id: 'cur-bob', code: 'BOB', display: 'Boliviano' },
      { id: 'svc-eco', code: 'SVC_ECOGRAFIA', display: 'Ecografía' },
      { id: 'svc-ecg', code: 'SVC_ECG', display: 'Electrocardiograma' },
      { id: 'sp-1', code: 'CARDIO', display: 'Cardiología' },
      {
        id: INS.CLAIM_SUBMITTED,
        code: 'CLAIM_SUBMITTED',
        display: 'Reclamo enviado',
      },
    ],
  };
  const em = {
    fork: mockFn(() => ({
      find: mockFn(async (e: { name: string }) => rows[e.name] ?? []),
    })),
    transactional: mockFn(async (cb: any) => cb(tx)),
  };

  const catalogRepo = {
    findCarrierByTenantId: mockFn().mockResolvedValue(
      options.sinAseguradora ? null : { id: CARRIER },
    ),
  };
  const claimReadRepo = {
    findClaimsPage: mockFn().mockResolvedValue(
      options.claims ?? (claim ? [claim] : []),
    ),
    findClaimInScope: mockFn().mockResolvedValue(claim),
    findLinesByClaimIds: mockFn().mockResolvedValue(lines),
    findAdjudicationsByClaimIds: mockFn(async () => versions),
    findCoveragesByIds: mockFn().mockResolvedValue([
      {
        id: 'cov-1',
        patientProfileId: 'pat-1',
        memberIdentifier: 'AF-0001',
        policyIdentifier: 'POL-200313',
        insurancePlanId: 'plan-1',
      },
    ]),
    findEncountersByIds: mockFn().mockResolvedValue([
      {
        id: 'enc-1',
        primaryPractitionerId: 'doc-1',
        // 02:00 UTC es el día anterior en La Paz (−04:00).
        startAt: new Date('2026-09-18T02:00:00.000Z'),
      },
    ]),
    findPlansByIds: mockFn().mockResolvedValue([
      { id: 'plan-1', name: 'Plan Oro' },
    ]),
    findSpecialtiesByPractitionerIds: mockFn().mockResolvedValue([
      {
        practitionerProfileId: 'doc-1',
        specialtyConceptId: 'sp-1',
        isPrimary: true,
      },
    ]),
    findPracticesByIds: mockFn().mockResolvedValue([
      { id: 'practice-1', name: 'Clínica Santa Cruz' },
    ]),
    findDiagnosticUnitsByIds: mockFn().mockResolvedValue([]),
    findUsersByIds: mockFn().mockResolvedValue([
      { id: 'u-owner', displayName: 'Patricia Suárez' },
      { id: 'u-op', displayName: 'Mario Gómez' },
    ]),
  };
  const claimRepo = {
    findClaimForUpdate: mockFn().mockResolvedValue(claim),
    latestVersion: mockFn().mockResolvedValue(versions[0] ?? null),
    createVersion: mockFn((_tx: unknown, data: Record<string, unknown>) => {
      const version = {
        id: 'version-1',
        adjudicatedAt: new Date('2026-09-27T15:00:00.000Z'),
        adjudicatedByUserId: data.actorUserId,
        supersedesVersionId: null,
        ...data,
      };
      versions.push(version);
      return version;
    }),
    createLineAdjudication: mockFn(),
  };
  const tenantAdministration = {
    canAdminister: mockFn().mockResolvedValue(options.administra ?? false),
  };
  const linkedOrders = {
    lockAndResolve: mockFn().mockResolvedValue(null),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new InsurerReceivedClaimsService(
    em as never,
    new InsurerContextService(
      catalogRepo as never,
      tenantAdministration as never,
    ),
    claimReadRepo as never,
    claimRepo as never,
    linkedOrders as never,
    outbox as never,
    logger as never,
  );
  return {
    service,
    tx,
    claim,
    versions,
    catalogRepo,
    claimReadRepo,
    claimRepo,
    tenantAdministration,
    linkedOrders,
    outbox,
    logger,
  };
}

const inTenant = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);

describe('InsurerReceivedClaimsService.list', () => {
  describe('correcto', () => {
    it('arma la fila del contrato con todo resuelto por lote', async () => {
      const d = build({ administra: true });

      const r = await inTenant(() => d.service.list(owner));

      expect(r.truncated).toBe(false);
      expect(r.items).toHaveLength(1);
      expect(r.items[0]).toEqual({
        id: CLAIM_ID,
        claimIdentifier: 'CLM-2026-1042',
        patient: {
          id: 'pat-1',
          displayName: 'Ana Pérez',
          patientCode: 'PAT-0001',
          memberIdentifier: 'AF-0001',
        },
        practitioner: {
          id: 'doc-1',
          displayName: 'Luis Rojas',
          specialty: 'Cardiología',
        },
        providerName: 'Clínica Santa Cruz',
        service: { code: 'SVC_ECOGRAFIA', display: 'Ecografía' },
        additionalServiceCount: 1,
        billedTotal: {
          amount: '400.00',
          currency: { code: 'BOB', display: 'Boliviano' },
        },
        approvedTotal: null,
        submittedAt: '2026-09-26T14:00:00.000Z',
        serviceDate: '2026-09-17',
        policyIdentifier: 'POL-200313',
        planName: 'Plan Oro',
        status: { code: 'SUBMITTED', display: 'Enviada' },
        lines: [
          {
            sequence: 1,
            code: 'SVC_ECOGRAFIA',
            display: 'Ecografía',
            quantity: 1,
            unitPrice: {
              amount: '250.00',
              currency: { code: 'BOB', display: 'Boliviano' },
            },
            billedAmount: {
              amount: '250.00',
              currency: { code: 'BOB', display: 'Boliviano' },
            },
          },
          {
            sequence: 2,
            code: 'SVC_ECG',
            display: 'Electrocardiograma',
            quantity: 2,
            unitPrice: {
              amount: '75.00',
              currency: { code: 'BOB', display: 'Boliviano' },
            },
            billedAmount: {
              amount: '150.00',
              currency: { code: 'BOB', display: 'Boliviano' },
            },
          },
        ],
        decision: null,
        invoice: null,
      });
    });

    it('acota por la aseguradora del tenant activo, nunca por algo que mande el cliente', async () => {
      const d = build({ administra: true });

      await inTenant(() => d.service.list(owner));

      expect(d.catalogRepo.findCarrierByTenantId).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
      );
      expect(d.claimReadRepo.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [],
        {},
        MAX_RECEIVED_CLAIMS,
        null,
        [],
        CARRIER,
      );
    });

    it('una solicitud dictaminada trae su estado, el total aprobado y quién la decidió', async () => {
      const versions = [
        {
          id: 'v-1',
          insuranceClaimId: CLAIM_ID,
          outcomeConceptId: INS.ADJ_OUTCOME_PARTIAL,
          totalApprovedAmount: '150.00',
          dispositionText: 'El plan cubre una parte',
          adjudicatedAt: new Date('2026-09-27T15:00:00.000Z'),
          adjudicatedByUserId: 'u-op',
          supersedesVersionId: null,
        },
      ];
      const d = build({
        administra: true,
        claim: request({ statusConceptId: INS.CLAIM_ADJUDICATED }),
        versions: versions,
      });

      const [item] = (await inTenant(() => d.service.list(owner))).items;

      expect(item.status).toEqual({
        code: 'PARTIAL',
        display: 'Aprobada parcialmente',
      });
      expect(item.approvedTotal).toEqual({
        amount: '150.00',
        currency: { code: 'BOB', display: 'Boliviano' },
      });
      expect(item.decision).toEqual({
        outcome: 'PARTIAL',
        decidedAt: '2026-09-27T15:00:00.000Z',
        decidedBy: 'Mario Gómez',
        reason: 'El plan cubre una parte',
      });
    });

    it.each([
      [INS.ADJ_OUTCOME_APPROVED, 'APPROVED', 'Aprobada'],
      [INS.ADJ_OUTCOME_DENIED, 'REJECTED', 'Rechazada'],
    ])('el resultado %s se ve como %s', async (concept, code, display) => {
      const d = build({
        administra: true,
        claim: request({ statusConceptId: INS.CLAIM_ADJUDICATED }),
        versions: [
          {
            id: 'v-1',
            insuranceClaimId: CLAIM_ID,
            outcomeConceptId: concept,
            totalApprovedAmount: '0.00',
            adjudicatedAt: new Date('2026-09-27T15:00:00.000Z'),
            supersedesVersionId: null,
          },
        ],
      });

      const [item] = (await inTenant(() => d.service.list(owner))).items;

      expect(item.status).toEqual({ code: code, display });
      expect(item.decision?.outcome).toBe(code);
    });

    it('pagada y revertida conservan su estado, sea cual sea el dictamen', async () => {
      for (const [concepto, codigo] of [
        [INS.CLAIM_PAID, 'PAID'],
        [INS.CLAIM_REVERSED, 'REVERSED'],
      ]) {
        const d = build({
          administra: true,
          claim: request({ statusConceptId: concepto }),
        });

        const [item] = (await inTenant(() => d.service.list(owner))).items;

        expect(item.status?.code).toBe(codigo);
      }
    });

    it('una solicitud sin atención asociada viaja sin profesional ni día', async () => {
      const d = build({
        administra: true,
        claim: request({ encounterId: undefined }),
      });

      const [item] = (await inTenant(() => d.service.list(owner))).items;

      expect(item.practitioner).toBeNull();
      expect(item.serviceDate).toBeNull();
    });
  });

  describe('límite', () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => request({ id: `c-${i}` }));

    it('exactamente 500 no se recorta', async () => {
      const d = build({ administra: true, claims: many(500) });

      const r = await inTenant(() => d.service.list(owner));

      expect(r.items).toHaveLength(500);
      expect(r.truncated).toBe(false);
    });

    it('501 se recorta a 500 y lo avisa', async () => {
      const d = build({ administra: true, claims: many(501) });

      const r = await inTenant(() => d.service.list(owner));

      expect(r.items).toHaveLength(500);
      expect(r.truncated).toBe(true);
    });

    it('sin solicitudes responde vacío y no lee nada más', async () => {
      const d = build({ administra: true, claims: [] });

      const r = await inTenant(() => d.service.list(owner));

      expect(r).toEqual({ items: [], truncated: false });
      expect(d.claimReadRepo.findLinesByClaimIds).not.toHaveBeenCalled();
    });

    it('una línea sin servicio catalogado no inventa un código', async () => {
      const d = build({
        administra: true,
        lines: [{ ...renglones()[1], serviceConceptId: undefined } as any],
      });

      const [item] = (await inTenant(() => d.service.list(owner))).items;

      expect(item.service).toBeNull();
      expect(item.lines[0]).toMatchObject({ code: '', display: 'Ítem 1' });
    });
  });

  describe('inválido / no autorizado', () => {
    it('una organización que no es aseguradora recibe 403', async () => {
      const d = build({ sinAseguradora: true, administra: true });

      await expect(
        inTenant(() => d.service.list(owner)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.claimReadRepo.findClaimsPage).not.toHaveBeenCalled();
    });

    it('un paciente o un prestador, sin membresía ni rol de aseguradora, recibe 403', async () => {
      const d = build({ administra: false });

      await expect(
        inTenant(() => d.service.list(strange)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.claimReadRepo.findClaimsPage).not.toHaveBeenCalled();
    });

    it('el rol de aseguradora concedido en OTRA organización no vale en ésta', async () => {
      const d = build({ administra: false });

      await expect(
        inTenant(() => d.service.list(foreignOperator)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('el mismo rol, concedido en este tenant o sin ámbito, sí vale', async () => {
      for (const actor of [operator, thisOperatorTenant]) {
        const d = build({ administra: false });

        const r = await inTenant(() => d.service.list(actor));

        expect(r.items).toHaveLength(1);
      }
    });

    it('los dos rechazos dicen lo mismo: no revelan qué organización es aseguradora', async () => {
      const messages: string[] = [];
      for (const options of [
        { sinAseguradora: true },
        { administra: false },
      ]) {
        const d = build(options);
        const error = await inTenant(() => d.service.list(strange)).catch(
          (e: unknown) => e as Error,
        );
        messages.push((error as Error).message);
      }

      expect(new Set(messages).size).toBe(1);
    });

    it('sin tenant activo responde 422 y no consulta nada', async () => {
      const d = build({ administra: true });

      await expect(d.service.list(owner)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.catalogRepo.findCarrierByTenantId).not.toHaveBeenCalled();
    });
  });
});

describe('InsurerReceivedClaimsService.decide', () => {
  const decide = (d: ReturnType<typeof build>, dto: any, actor = owner) =>
    inTenant(() => d.service.decide(CLAIM_ID, dto, actor));

  /** Los renglones que se escribieron, por id de línea. */
  const written = (d: ReturnType<typeof build>) =>
    new Map<string, any>(
      d.claimRepo.createLineAdjudication.mock.calls.map((c: any[]) => [
        c[1].insuranceClaimLineId,
        c[1],
      ]),
    );

  describe('correcto', () => {
    it('aprobar todo: versión 1 aprobada por el total, líneas aprobadas, solicitud adjudicada y evento publicado', async () => {
      const d = build({ administra: true });

      const r = await decide(d, { outcome: 'APPROVED' });

      expect(d.claimRepo.createVersion.mock.calls[0][1]).toMatchObject({
        insuranceClaimId: CLAIM_ID,
        adjudicationVersion: 1,
        outcomeConceptId: INS.ADJ_OUTCOME_APPROVED,
        totalApprovedAmount: '400.00',
        totalPatientAmount: '0.00',
        totalDeniedAmount: '0.00',
        actorUserId: 'u-owner',
      });
      expect(written(d).get('l-1')).toMatchObject({
        decisionConceptId: INS.LINE_DECISION_APPROVED,
        approvedAmount: '250.00',
        deniedAmount: '0.00',
        policyClauseReference: undefined,
        denialRationale: undefined,
      });
      expect((d.claim as any).statusConceptId).toBe(INS.CLAIM_ADJUDICATED);
      expect(r.status).toEqual({ code: 'APPROVED', display: 'Aprobada' });
      expect(r.approvedTotal?.amount).toBe('400.00');
      expect(r.invoice).toBeNull();
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          eventType: CLAIM_DECIDED_EVENT,
          aggregateType: 'insurance.insurance_claims',
          aggregateId: CLAIM_ID,
        }),
      );
    });

    it('aprobar en parte: reparte el monto entre líneas y fundamenta sólo lo denegado', async () => {
      const d = build({ administra: true });

      const r = await decide(d, {
        outcome: 'PARTIAL',
        approvedAmount: '200.00',
        reason: 'El plan cubre la mitad',
        policyClauseReference: 'Cláusula 7.2',
      });

      expect(d.claimRepo.createVersion.mock.calls[0][1]).toMatchObject({
        outcomeConceptId: INS.ADJ_OUTCOME_PARTIAL,
        dispositionText: 'El plan cubre la mitad',
        totalApprovedAmount: '200.00',
        totalDeniedAmount: '200.00',
      });
      expect(written(d).get('l-1')).toMatchObject({
        approvedAmount: '125.00',
        deniedAmount: '125.00',
        decisionConceptId: INS.LINE_DECISION_APPROVED,
        policyClauseReference: 'Cláusula 7.2',
        denialRationale: 'El plan cubre la mitad',
      });
      expect(written(d).get('l-2')).toMatchObject({
        approvedAmount: '75.00',
        deniedAmount: '75.00',
      });
      expect(r.status).toEqual({
        code: 'PARTIAL',
        display: 'Aprobada parcialmente',
      });
      expect(r.decision).toMatchObject({
        outcome: 'PARTIAL',
        reason: 'El plan cubre la mitad',
      });
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
    });

    it('rechazar: todo denegado, con motivo, y no se publica evento de facturación', async () => {
      const d = build({ administra: true });

      const r = await decide(d, {
        outcome: 'REJECTED',
        reason: 'Servicio no cubierto',
      });

      expect(d.claimRepo.createVersion.mock.calls[0][1]).toMatchObject({
        outcomeConceptId: INS.ADJ_OUTCOME_DENIED,
        totalApprovedAmount: '0.00',
        totalDeniedAmount: '400.00',
      });
      for (const linea of written(d).values()) {
        expect(linea).toMatchObject({
          decisionConceptId: INS.LINE_DECISION_DENIED,
          approvedAmount: '0.00',
          denialRationale: 'Servicio no cubierto',
        });
      }
      expect(r.status).toEqual({ code: 'REJECTED', display: 'Rechazada' });
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('el evento lleva ids e importes, nunca datos del paciente', async () => {
      const d = build({ administra: true });

      await decide(d, { outcome: 'APPROVED' });

      const evento = d.outbox.publishDomainEvent.mock.calls[0][1];
      expect(evento.payloadJson).toEqual({
        claimId: CLAIM_ID,
        insuranceCarrierId: CARRIER,
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
        billingProviderEntityId: 'practice-1',
        outcome: 'APPROVED',
        approvedAmount: '400.00',
        requestedAmount: '400.00',
        currencyConceptId: 'cur-bob',
        decidedByUserId: 'u-owner',
      });
      expect(JSON.stringify(evento)).not.toMatch(/Ana|Pérez|PAT-0001|AF-0001/);
    });

    it('el dictamen se escribe con la solicitud ya bloqueada', async () => {
      const d = build({ administra: true });

      await decide(d, { outcome: 'APPROVED' });

      expect(d.claimRepo.findClaimForUpdate).toHaveBeenCalledWith(
        d.tx,
        CLAIM_ID,
      );
      expect(
        d.claimRepo.findClaimForUpdate.mock.invocationCallOrder[0],
      ).toBeLessThan(d.claimRepo.createVersion.mock.invocationCallOrder[0]);
    });

    it('un operador con el rol de aseguradora también puede dictaminar', async () => {
      const d = build({ administra: false });

      const r = await decide(d, { outcome: 'APPROVED' }, operator);

      expect(r.status?.code).toBe('APPROVED');
    });
  });

  describe('límite', () => {
    it('rechazar con un motivo de exactamente cinco caracteres pasa', async () => {
      const d = build({ administra: true });

      await expect(
        decide(d, { outcome: 'REJECTED', reason: '  Nada. ' }),
      ).resolves.toBeDefined();
    });

    it('aprobar no exige motivo, y si viene con menos de cinco caracteres se acepta', async () => {
      const d = build({ administra: true });

      await decide(d, { outcome: 'APPROVED', reason: 'ok' });

      expect(d.claimRepo.createVersion.mock.calls[0][1]).toMatchObject({
        dispositionText: 'ok',
      });
    });

    it.each(['0.01', '399.99'])(
      'una aprobación parcial de %s está dentro del rango',
      async (amount) => {
        const d = build({ administra: true });

        await decide(d, {
          outcome: 'PARTIAL',
          approvedAmount: amount,
          reason: 'Cobertura parcial',
        });

        expect(d.claimRepo.createVersion.mock.calls[0][1]).toMatchObject({
          totalApprovedAmount: amount,
        });
      },
    );

    it('una aprobación parcial reparte hasta el último centavo', async () => {
      const d = build({
        administra: true,
        claim: request({ totalAmount: '100.00' }),
        lines: [
          { ...renglones()[1], billedAmount: '33.33' },
          { ...renglones()[0], billedAmount: '33.33' },
          {
            ...renglones()[0],
            id: 'l-3',
            lineSequence: 3,
            billedAmount: '33.34',
          },
        ] as any,
      });

      await decide(d, {
        outcome: 'PARTIAL',
        approvedAmount: '0.01',
        reason: 'Cobertura mínima',
      });

      const approved = [...written(d).values()].reduce(
        (sum, l) => sum + Number(l.approvedAmount),
        0,
      );
      expect(approved).toBeCloseTo(0.01, 2);
      expect(written(d).get('l-3')).toMatchObject({ approvedAmount: '0.01' });
    });
  });

  describe('inválido', () => {
    const nothing = (d: ReturnType<typeof build>) => {
      expect(d.claimRepo.createVersion).not.toHaveBeenCalled();
      expect(d.claimRepo.createLineAdjudication).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    };

    it('sin permiso responde 403 antes de tocar la solicitud', async () => {
      const d = build({ administra: false });

      await expect(
        decide(d, { outcome: 'APPROVED' }, strange),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.claimReadRepo.findClaimInScope).not.toHaveBeenCalled();
      nothing(d);
    });

    it('una solicitud inexistente o de otra aseguradora es 404, sin el id en el error', async () => {
      const d = build({ administra: true, claim: null });

      const error = await decide(d, { outcome: 'APPROVED' }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(JSON.stringify((error as any).getResponse())).not.toContain(
        CLAIM_ID,
      );
      nothing(d);
    });

    it('si bajo el bloqueo la solicitud resulta de otra aseguradora, también es 404', async () => {
      const d = build({ administra: true });
      d.claimRepo.findClaimForUpdate.mockResolvedValue(
        request({ insuranceCarrierId: 'carrier-otra' }),
      );

      await expect(decide(d, { outcome: 'APPROVED' })).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      nothing(d);
    });

    it('una solicitud ya dictaminada es 409 con reason ALREADY_DECIDED', async () => {
      const d = build({
        administra: true,
        claim: request({ statusConceptId: INS.CLAIM_ADJUDICATED }),
        versions: [{ id: 'v-0', insuranceClaimId: CLAIM_ID }],
      });

      const error: any = await decide(d, { outcome: 'APPROVED' }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse().details).toEqual({
        reason: 'ALREADY_DECIDED',
      });
      nothing(d);
    });

    it('una solicitud con una versión de dictamen es 409 aunque su estado no lo diga', async () => {
      const d = build({
        administra: true,
        versions: [{ id: 'v-0', insuranceClaimId: CLAIM_ID }],
      });

      await expect(decide(d, { outcome: 'APPROVED' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      nothing(d);
    });

    it('una solicitud pagada o revertida tampoco se dictamina: 409', async () => {
      for (const estado of [INS.CLAIM_PAID, INS.CLAIM_REVERSED]) {
        const d = build({
          administra: true,
          claim: request({ statusConceptId: estado }),
        });

        await expect(
          decide(d, { outcome: 'APPROVED' }),
        ).rejects.toBeInstanceOf(ConflictException);
      }
    });

    it.each([
      ['PARTIAL sin monto', { outcome: 'PARTIAL', reason: 'Parcial' }],
      [
        'PARTIAL con monto cero',
        { outcome: 'PARTIAL', approvedAmount: '0.00', reason: 'Parcial' },
      ],
      [
        'PARTIAL igual a lo solicitado',
        { outcome: 'PARTIAL', approvedAmount: '400.00', reason: 'Parcial' },
      ],
      [
        'PARTIAL mayor que lo solicitado',
        { outcome: 'PARTIAL', approvedAmount: '400.01', reason: 'Parcial' },
      ],
      [
        'PARTIAL con una fracción de centavo',
        { outcome: 'PARTIAL', approvedAmount: '10.005', reason: 'Parcial' },
      ],
      ['PARTIAL sin motivo', { outcome: 'PARTIAL', approvedAmount: '100.00' }],
      [
        'PARTIAL con motivo corto (cuatro caracteres)',
        { outcome: 'PARTIAL', approvedAmount: '100.00', reason: ' Nada ' },
      ],
      ['REJECTED sin motivo', { outcome: 'REJECTED' }],
      [
        'REJECTED con motivo de espacios',
        { outcome: 'REJECTED', reason: '       ' },
      ],
      ['APPROVED con monto', { outcome: 'APPROVED', approvedAmount: '100.00' }],
      [
        'REJECTED con monto',
        { outcome: 'REJECTED', approvedAmount: '0.00', reason: 'No cubierto' },
      ],
    ])('%s es 422 y no escribe nada', async (_caso, dto) => {
      const d = build({ administra: true });

      await expect(decide(d, dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      nothing(d);
    });

    it('si los renglones no suman lo solicitado, 422', async () => {
      const d = build({
        administra: true,
        claim: request({ totalAmount: '500.00' }),
      });

      await expect(decide(d, { outcome: 'APPROVED' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      nothing(d);
    });

    it('una solicitud sin monto solicitado, 422', async () => {
      const d = build({
        administra: true,
        claim: request({ totalAmount: undefined }),
      });

      await expect(decide(d, { outcome: 'APPROVED' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      nothing(d);
    });

    it('el 422 dice qué campo falló, sin repetir lo que el cliente mandó', async () => {
      const d = build({ administra: true });

      const error: any = await decide(d, {
        outcome: 'PARTIAL',
        approvedAmount: '400.00',
        reason: 'Parcial',
      }).catch((e) => e);

      expect(error.getResponse().details).toMatchObject({
        field: 'approvedAmount',
      });
    });
  });

  describe('solicitud enlazada a un pedido', () => {
    const linked = () => request({ inventoryReservationId: 'reserva-1' });

    it('si el pedido cambió desde que se presentó, 422 y no se escribe nada', async () => {
      const d = build({ administra: true, claim: linked() });
      d.linkedOrders.lockAndResolve.mockResolvedValue(null);

      await expect(decide(d, { outcome: 'APPROVED' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.claimRepo.createVersion).not.toHaveBeenCalled();
    });

    it('bloquea el pedido antes que el reclamo', async () => {
      const d = build({ administra: true, claim: linked() });
      d.linkedOrders.lockAndResolve.mockResolvedValue(null);

      await decide(d, { outcome: 'APPROVED' }).catch(() => undefined);

      expect(d.linkedOrders.lockAndResolve).toHaveBeenCalledTimes(1);
      expect(d.claimRepo.findClaimForUpdate).not.toHaveBeenCalled();
    });

    it('una solicitud sin pedido no consulta el pedido', async () => {
      const d = build({ administra: true });

      await decide(d, { outcome: 'APPROVED' });

      expect(d.linkedOrders.lockAndResolve).not.toHaveBeenCalled();
    });
  });
});
