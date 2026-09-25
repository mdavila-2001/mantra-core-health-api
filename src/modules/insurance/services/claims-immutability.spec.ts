import { jest } from '@jest/globals';
import { ConflictException } from '../../../common';
import { ClaimsService } from './claims.service';
import {
  ClaimLineAdjudications,
  InsuranceClaimLines,
  InsurancePlans,
  PatientCoverages,
} from '../entities';
import { INS } from '../insurance.concepts';
import type { CreateAdjudicationDto } from '../dto';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

/**
 * CA-3.4 — inmutabilidad de la EOB publicada (contrato §6). Reutiliza el
 * patrón de dobles de `claims-linked.service.spec.ts`: un reclamo vinculado a
 * un pedido de farmacia, para que `adjudicate`/`publishEob`/`reverse` recorran
 * la validación real (`validateLinkedClaimSettlement`,
 * `matchesLinkedClaimSnapshot`) y no sólo la rama «legacy», que en el código
 * actual ni siquiera admite re-adjudicar (ver `claimForMutation`).
 */
const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const actor = { id: 'insurer-user', roles: ['USER'] };

const adjudicationApproved: CreateAdjudicationDto = {
  outcome: 'APPROVED',
  totalApprovedAmount: '60',
  totalPatientAmount: '10',
  totalDeniedAmount: '30',
  lineAdjudications: [
    {
      insuranceClaimLineId: 'line',
      decision: 'APPROVED',
      approvedAmount: '60',
      patientAmount: '10',
      deniedAmount: '30',
      policyClauseReference: 'Cláusula 3',
    },
  ],
};

function fixture(overVersion: Record<string, unknown> = {}) {
  const claim = Object.assign(Object.create(null) as Record<string, unknown>, {
    id: 'claim',
    claimIdentifier: 'claim-ref',
    inventoryReservationId: 'order',
    patientCoverageId: 'coverage',
    insuranceCarrierId: 'carrier',
    billingProviderEntityId: 'pharmacy',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    totalAmount: '100.00',
    currencyConceptId: 'bob',
    statusConceptId: INS.CLAIM_ADJUDICATED,
  });
  const line = Object.assign(new InsuranceClaimLines(), {
    id: 'line',
    lineSequence: 1,
    insuranceClaimId: claim.id,
    inventoryReservationLineId: 'portion',
    billedAmount: '100.00',
    quantity: '2',
    serviceConceptId: 'medicine',
  });
  const coverage = Object.assign(new PatientCoverages(), {
    id: 'coverage',
    patientProfileId: 'patient',
    insurancePlanId: 'plan',
  });
  const plan = Object.assign(new InsurancePlans(), {
    id: 'plan',
    insuranceProductId: 'product',
    currencyConceptId: 'bob',
  });
  const snapshot: LinkedOrderSnapshot = {
    origin: 'PHARMACY',
    orderId: 'order',
    patientProfileId: 'patient',
    providerTenantId: 'provider',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    billingProviderEntityId: 'pharmacy',
    currencyConceptId: 'bob',
    totalAmount: '100.00',
    canSubmit: true,
    validForSettlement: true,
    lines: [
      {
        inventoryReservationLineId: 'portion',
        billedAmount: '100.00',
        quantity: '2',
        serviceConceptId: 'medicine',
      },
    ],
  };
  const version = {
    id: 'version-1',
    insuranceClaimId: 'claim',
    adjudicationVersion: 1,
    totalApprovedAmount: '60',
    totalPatientAmount: '10',
    totalDeniedAmount: '30',
    supersedesVersionId: undefined,
    ...overVersion,
  };
  const decision = {
    ...adjudicationApproved.lineAdjudications[0],
    claimAdjudicationVersionId: version.id,
    decisionConceptId: INS.LINE_DECISION_APPROVED,
  };
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    count: fn().mockResolvedValue(0),
    findOne: fn().mockResolvedValue(null),
    find: fn(async (entity: unknown) =>
      entity === InsuranceClaimLines
        ? [line]
        : entity === ClaimLineAdjudications
          ? [decision]
          : [],
    ),
  };
  const em = {
    transactional: (callback: (tx: unknown) => unknown) => callback(tx),
  };
  const versionsCreated: Record<string, unknown>[] = [];
  const repo = {
    findClaim: fn().mockResolvedValue(claim),
    findClaimForUpdate: fn().mockResolvedValue(claim),
    findByIdempotency: fn().mockResolvedValue(null),
    createClaim: fn((_tx: unknown, data: object) => ({ ...claim, ...data })),
    createLine: fn(),
    latestVersion: fn().mockResolvedValue(version),
    createVersion: fn((_tx: unknown, data: Record<string, unknown>) => {
      const created = { id: 'version-2', ...data };
      versionsCreated.push(created);
      return created;
    }),
    createLineAdjudication: fn(),
    findEob: fn().mockResolvedValue(null),
    createEob: fn().mockReturnValue({ id: 'eob-1' }),
    findVersion: fn().mockResolvedValue(version),
    createReversal: fn().mockReturnValue({ id: 'reversal-1' }),
  };
  const access = {
    assertAdministrator: fn().mockResolvedValue('provider'),
    assertProvider: fn().mockResolvedValue(undefined),
    assertInsurer: fn().mockResolvedValue(undefined),
    coverageForOrder: fn().mockResolvedValue({
      coverage,
      plan,
      insuranceCarrierId: 'carrier',
    }),
  };
  const orders = { lockAndResolve: fn().mockResolvedValue(snapshot) };
  const coverageRepo = { findCoverage: fn().mockResolvedValue(coverage) };
  const catalog = { findPlanForCarrier: fn().mockResolvedValue(plan) };
  const service = new ClaimsService(
    em as never,
    repo as never,
    coverageRepo as never,
    catalog as never,
    {} as never,
    { setContext: fn(), info: fn() } as never,
    orders as never,
    access as never,
  );
  return { service, claim, line, version, tx, repo, versionsCreated };
}

describe('ClaimsService — inmutabilidad de la EOB publicada (CA-3.4)', () => {
  it('publicar la EOB de una versión que ya la tiene responde 409 y no crea una segunda fila', async () => {
    const f = fixture();
    f.repo.findEob.mockResolvedValue({ id: 'eob-existente' });

    await expect(
      f.service.publishEob('claim', {}, actor as never),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(f.repo.createEob).not.toHaveBeenCalled();
  });

  it('adjudicar de nuevo después de publicar crea la versión N+1 con supersedesVersionId = N, sin tocar N', async () => {
    const f = fixture();

    const result = await f.service.adjudicate(
      'claim',
      adjudicationApproved,
      actor as never,
    );

    expect(result.id).toBe('version-2');
    expect(f.repo.createVersion).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        adjudicationVersion: 2,
        supersedesVersionId: 'version-1',
      }),
    );
    // La versión 1 original nunca se muta: no hay ninguna llamada que la edite,
    // sólo la lectura de `latestVersion` y la creación de la nueva.
    expect(f.version).toEqual(
      expect.objectContaining({ id: 'version-1', adjudicationVersion: 1 }),
    );
  });

  it('revertir una versión que no es la vigente se rechaza con 422, sin crear la reversión', async () => {
    const f = fixture();
    // La vigente es 'version-1' (latestVersion); se intenta revertir otra.
    f.repo.findVersion.mockResolvedValue({
      id: 'version-old',
      insuranceClaimId: 'claim',
      adjudicationVersion: 0,
    });

    const error = await f.service
      .reverse(
        'claim',
        { reversedAdjudicationVersionId: 'version-old' },
        actor as never,
      )
      .catch((failure: unknown) => failure);

    expect(error).toMatchObject({ getStatus: expect.any(Function) });
    expect((error as { getStatus(): number }).getStatus()).toBe(422);
    expect(f.repo.createReversal).not.toHaveBeenCalled();
  });

  it('revertir la versión vigente sí se acepta', async () => {
    const f = fixture();
    f.repo.findVersion.mockResolvedValue(f.version);

    const result = await f.service.reverse(
      'claim',
      { reversedAdjudicationVersionId: 'version-1' },
      actor as never,
    );

    expect(result).toEqual({ id: 'reversal-1' });
    expect(f.repo.createReversal).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({ reversedAdjudicationVersionId: 'version-1' }),
    );
  });
});
