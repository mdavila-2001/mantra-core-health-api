import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import {
  InsuranceClaimLines,
  InsuranceClaims,
  InsurancePlanBenefits,
  PriorAuthorizationDeterminations,
  PriorAuthorizationItems,
  PriorAuthorizationRequests,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import type { CreateClaimDto } from '../../presentation/dto';
import {
  CLAIM_COVERAGE_REASON,
  ClaimCoveragePolicy,
} from './claim-coverage-policy';
import { memoryEm, type Row } from './claim-coverage.testing';
import { CLAIM_COVERAGE_AUDIT, ClaimsService } from './claims.service';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

/**
 * Reclamos que nacen de un pedido de farmacia o de diagnóstico: el servidor los
 * contrasta con el plan igual que al cobro directo, guarda la parte del
 * paciente que calcula él y sella cada decisión en la bitácora (carril 16,
 * REQ-16-023 a 025).
 */

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const PLAN = 'plan-1';
const COVERAGE = 'coverage-1';
const PROVIDER_TENANT = 'tenant-provider';
const MEDICINE = 'service-medicine';
const STUDY = 'service-study';
const PA = 'pa-1';
const ITEM = 'pa-item-1';
const DAY = 24 * 60 * 60 * 1000;
const actor = { id: 'user-admin', roles: ['USER'] } as never;

type Origin = 'PHARMACY' | 'DIAGNOSTIC';

const ORIGINS: Record<
  Origin,
  {
    service: string;
    order: Row;
    auditEntity: string;
    snapshot: (serviceConceptId?: string | null) => LinkedOrderSnapshot;
    dto: (
      overrides?: Partial<CreateClaimDto>,
      patient?: string,
    ) => CreateClaimDto;
  }
> = {
  PHARMACY: {
    service: MEDICINE,
    order: { inventoryReservationId: 'reservation-1', serviceRequestId: null },
    auditEntity: 'inventory_reservation',
    snapshot: (serviceConceptId = MEDICINE) => ({
      origin: 'PHARMACY',
      orderId: 'reservation-1',
      patientProfileId: 'patient-1',
      providerTenantId: PROVIDER_TENANT,
      billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
      billingProviderEntityId: 'pharmacy-1',
      currencyConceptId: 'bob',
      totalAmount: '500.00',
      canSubmit: true,
      validForSettlement: true,
      lines: [
        {
          inventoryReservationLineId: 'portion-1',
          serviceConceptId,
          quantity: '2',
          billedAmount: '500.00',
        },
      ],
    }),
    dto: (overrides = {}, patient) => ({
      insuranceCarrierId: 'carrier-1',
      patientCoverageId: COVERAGE,
      billingProviderEntityId: 'pharmacy-1',
      inventoryReservationId: 'reservation-1',
      claimIdentifier: 'CLM-PH-1',
      lines: [
        {
          lineSequence: 1,
          inventoryReservationLineId: 'portion-1',
          billedAmount: '500.00',
          ...(patient !== undefined
            ? { patientResponsibilityAmount: patient }
            : {}),
        },
      ],
      ...overrides,
    }),
  },
  DIAGNOSTIC: {
    service: STUDY,
    order: { inventoryReservationId: null, serviceRequestId: 'request-1' },
    auditEntity: 'service_request',
    snapshot: (serviceConceptId = STUDY) => ({
      origin: 'DIAGNOSTIC',
      orderId: 'request-1',
      patientProfileId: 'patient-1',
      providerTenantId: PROVIDER_TENANT,
      billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
      billingProviderEntityId: 'unit-1',
      currencyConceptId: 'bob',
      totalAmount: '500.00',
      canSubmit: true,
      validForSettlement: true,
      lines: [
        {
          diagnosticStudyOfferingId: 'offering-1',
          serviceConceptId,
          quantity: '1',
          billedAmount: '500.00',
        },
      ],
    }),
    dto: (overrides = {}, patient) => ({
      insuranceCarrierId: 'carrier-1',
      patientCoverageId: COVERAGE,
      billingProviderEntityId: 'unit-1',
      serviceRequestId: 'request-1',
      currencyConceptId: 'bob',
      claimIdentifier: 'CLM-DX-1',
      lines: [
        {
          lineSequence: 1,
          diagnosticStudyOfferingId: 'offering-1',
          billedAmount: '500.00',
          ...(patient !== undefined
            ? { patientResponsibilityAmount: patient }
            : {}),
        },
      ],
      ...overrides,
    }),
  },
};

function benefit(service: string, overrides: Row = {}): Row {
  return {
    id: `benefit-${service}`,
    insurancePlanId: PLAN,
    serviceConceptId: service,
    statusConceptId: INS.BENEFIT_ACTIVE,
    effectiveFrom: new Date(Date.now() - 30 * DAY),
    effectiveTo: null,
    coveragePercent: '80',
    copayAmount: '50.00',
    requiresPriorAuthorization: false,
    ...overrides,
  };
}

function setup(
  origin: Origin,
  rows: {
    benefits?: Row[];
    requests?: Row[];
    items?: Row[];
    determinations?: Row[];
    snapshot?: LinkedOrderSnapshot;
  } = {},
) {
  const o = ORIGINS[origin];
  const tables = new Map<unknown, Row[]>([
    [InsurancePlanBenefits, rows.benefits ?? [benefit(o.service)]],
    [PriorAuthorizationRequests, rows.requests ?? []],
    [PriorAuthorizationItems, rows.items ?? []],
    [PriorAuthorizationDeterminations, rows.determinations ?? []],
    [InsuranceClaims, []],
    [InsuranceClaimLines, []],
  ]);
  // Cada transacción es un objeto propio: así se ve si el rechazo se selló
  // fuera de la que se revirtió.
  const transactions: object[] = [];
  const em = {
    transactional: async (work: (tx: unknown) => unknown) => {
      const tx = {
        ...memoryEm(tables),
        flush: fn().mockResolvedValue(undefined),
      };
      transactions.push(tx);
      return work(tx);
    },
  };
  const createdLines: Row[] = [];
  const repo = {
    findByIdempotency: fn().mockResolvedValue(null),
    createClaim: fn((_tx: unknown, data: Row) => ({
      id: 'claim-1',
      createdAt: new Date(),
      ...data,
    })),
    createLine: fn((_tx: unknown, data: Row) => {
      createdLines.push(data);
      return { id: `line-${createdLines.length}`, ...data };
    }),
  };
  const access = {
    assertAdministrator: fn().mockResolvedValue(PROVIDER_TENANT),
    assertProvider: fn().mockResolvedValue(undefined),
    coverageForOrder: fn().mockResolvedValue({
      coverage: { id: COVERAGE, insurancePlanId: PLAN },
      plan: { id: PLAN, currencyConceptId: 'bob' },
      insuranceCarrierId: 'carrier-1',
    }),
  };
  const orders = {
    lockAndResolve: fn().mockResolvedValue(rows.snapshot ?? o.snapshot()),
  };
  const auditTrail = { record: fn().mockResolvedValue(undefined) };
  const logger = { setContext: fn(), info: fn(), error: fn() };
  const service = new ClaimsService(
    em as never,
    repo as never,
    {} as never,
    {} as never,
    {} as never,
    logger as never,
    orders as never,
    access as never,
    new ClaimCoveragePolicy(),
    auditTrail as never,
  );
  return { service, repo, auditTrail, logger, transactions, createdLines, o };
}

/** Pedido con aprobación previa: la del pedido, para su servicio. */
function withPriorAuthorization(origin: Origin, determination: Row | null) {
  const o = ORIGINS[origin];
  return {
    benefits: [benefit(o.service, { requiresPriorAuthorization: true })],
    requests: [
      {
        id: PA,
        patientCoverageId: COVERAGE,
        ...o.order,
      },
    ],
    items: [
      {
        id: ITEM,
        priorAuthorizationRequestId: PA,
        serviceConceptId: o.service,
      },
    ],
    determinations: determination
      ? [
          {
            id: 'det-1',
            priorAuthorizationRequestId: PA,
            priorAuthorizationItemId: ITEM,
            determinationVersion: 1,
            decisionConceptId: INS.DECISION_APPROVED,
            approvedAmount: null,
            validFrom: null,
            validTo: null,
            ...determination,
          },
        ]
      : [],
  };
}

async function rejectionOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => {
      throw new Error('se esperaba un rechazo');
    },
    (failure: unknown) => failure,
  );
  expect(error).toBeInstanceOf(PreconditionFailedException);
  return (error as PreconditionFailedException).details ?? {};
}

describe.each(['PHARMACY', 'DIAGNOSTIC'] as const)(
  'ClaimsService — reclamo vinculado (%s) contrastado con el plan',
  (origin) => {
    it('guarda la parte del paciente que calcula el servidor (140 de 500) y sella el reparto', async () => {
      const f = setup(origin);
      const response = await f.service.submitClaim(f.o.dto(), actor);
      expect(f.createdLines).toEqual([
        expect.objectContaining({
          billedAmount: '500.00',
          serviceConceptId: f.o.service,
          patientResponsibilityAmount: '140.00',
        }),
      ]);
      expect(f.transactions).toHaveLength(1);
      expect(f.auditTrail.record).toHaveBeenCalledTimes(1);
      expect(f.auditTrail.record).toHaveBeenCalledWith(
        f.transactions[0],
        actor,
        {
          action: CLAIM_COVERAGE_AUDIT.APPLIED,
          entity: 'insurance_claim',
          entityId: response.id,
          tenantId: PROVIDER_TENANT,
        },
      );
      expect(f.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'APPLIED',
          claimId: 'claim-1',
          priorAuthorizationRequestId: null,
          lines: [
            {
              lineSequence: 1,
              benefitId: `benefit-${f.o.service}`,
              coveragePercent: '80',
              copayAmount: '50.00',
              requiresPriorAuthorization: false,
              patientAmount: '140.00',
              insurerAmount: '360.00',
            },
          ],
        }),
        expect.any(String),
      );
    });

    it('acepta la parte del paciente declarada si coincide con la del plan', async () => {
      const f = setup(origin);
      await f.service.submitClaim(f.o.dto({}, '140'), actor);
      expect(f.createdLines[0]).toMatchObject({
        patientResponsibilityAmount: '140.00',
      });
    });

    it('con aprobación PARCIAL suficiente, cobra y deja la aprobación en el desglose', async () => {
      const f = setup(
        origin,
        withPriorAuthorization(origin, {
          decisionConceptId: INS.DECISION_PARTIAL,
          approvedAmount: '500.00',
        }),
      );
      await f.service.submitClaim(
        f.o.dto({ priorAuthorizationRequestId: PA }),
        actor,
      );
      expect(f.repo.createClaim).toHaveBeenCalledTimes(1);
      expect(f.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'APPLIED',
          priorAuthorizationRequestId: PA,
          lines: [
            expect.objectContaining({ requiresPriorAuthorization: true }),
          ],
        }),
        expect.any(String),
      );
    });

    it.each([
      {
        reason: CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
        rows: () => ({ benefits: [] }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.BENEFIT_AMBIGUOUS,
        rows: () => ({
          benefits: [
            benefit(ORIGINS[origin].service),
            benefit(ORIGINS[origin].service, { id: 'benefit-dup' }),
          ],
        }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.SERVICE_REQUIRED,
        rows: () => ({ snapshot: ORIGINS[origin].snapshot(null) }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_REQUIRED,
        rows: () => withPriorAuthorization(origin, null),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_PENDING,
        attachPriorAuthorization: true,
        rows: () => withPriorAuthorization(origin, null),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED,
        attachPriorAuthorization: true,
        rows: () =>
          withPriorAuthorization(origin, {
            decisionConceptId: INS.DECISION_DENIED,
          }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_EXPIRED,
        attachPriorAuthorization: true,
        rows: () =>
          withPriorAuthorization(origin, {
            validTo: new Date(Date.now() - DAY),
          }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED,
        attachPriorAuthorization: true,
        rows: () =>
          withPriorAuthorization(origin, {
            decisionConceptId: INS.DECISION_PARTIAL,
            approvedAmount: '300.00',
          }),
      },
      {
        reason: CLAIM_COVERAGE_REASON.PATIENT_SHARE_MISMATCH,
        rows: () => ({}),
        declaredPatientAmount: '0',
      },
    ])(
      '$reason: 422, no crea nada y sella el rechazo aparte',
      async ({
        reason,
        rows,
        attachPriorAuthorization,
        declaredPatientAmount,
      }) => {
        const f = setup(origin, rows());
        const details = await rejectionOf(
          f.service.submitClaim(
            f.o.dto(
              attachPriorAuthorization
                ? { priorAuthorizationRequestId: PA }
                : {},
              declaredPatientAmount,
            ),
            actor,
          ),
        );
        expect(details).toMatchObject({ reason, lineSequence: 1 });
        expect(f.repo.createClaim).not.toHaveBeenCalled();
        expect(f.createdLines).toHaveLength(0);
        // La transacción del alta se revierte: el rechazo va en otra.
        expect(f.transactions).toHaveLength(2);
        expect(f.auditTrail.record).toHaveBeenCalledTimes(1);
        expect(f.auditTrail.record).toHaveBeenCalledWith(
          f.transactions[1],
          actor,
          {
            action: `${CLAIM_COVERAGE_AUDIT.REJECTED}:${reason}`,
            entity: f.o.auditEntity,
            entityId: f.o.snapshot().orderId,
            tenantId: PROVIDER_TENANT,
            success: false,
          },
        );
      },
    );

    it('si la bitácora falla al sellar el rechazo, el 422 original sigue su curso', async () => {
      const f = setup(origin, { benefits: [] });
      f.auditTrail.record.mockRejectedValue(new Error('audit down'));
      const details = await rejectionOf(
        f.service.submitClaim(f.o.dto(), actor),
      );
      expect(details.reason).toBe(CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED);
      expect(f.logger.error).toHaveBeenCalled();
    });

    it('un rechazo ajeno a la cobertura no se sella como decisión de cobertura', async () => {
      const f = setup(origin);
      await expect(
        f.service.submitClaim(
          f.o.dto({ priorAuthorizationRequestId: 'pa-unknown' }),
          actor,
        ),
      ).rejects.toThrow('misma cobertura y pedido');
      expect(f.auditTrail.record).not.toHaveBeenCalled();
    });
  },
);
