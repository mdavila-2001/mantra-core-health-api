import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import {
  InsuranceClaims,
  InsuranceClaimLines,
  PatientCoverages,
  InsurancePlans,
  ClaimLineAdjudications,
  PriorAuthorizationRequests,
} from '../entities';
import { INS } from '../insurance.concepts';
import type { CreateClaimDto, CreateAdjudicationDto } from '../dto';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const actor = { id: 'user', roles: ['USER'] };
const claimInput: CreateClaimDto = {
  insuranceCarrierId: 'carrier',
  patientCoverageId: 'coverage',
  billingProviderEntityId: 'pharmacy',
  inventoryReservationId: 'order',
  claimIdentifier: 'claim-ref',
  lines: [
    {
      lineSequence: 1,
      inventoryReservationLineId: 'portion',
      billedAmount: '100.00',
    },
  ],
};
const adjudication: CreateAdjudicationDto = {
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

function fixture() {
  const claim: InsuranceClaims = Object.assign(new InsuranceClaims(), {
    id: 'claim',
    claimIdentifier: 'claim-ref',
    inventoryReservationId: 'order',
    patientCoverageId: 'coverage',
    insuranceCarrierId: 'carrier',
    billingProviderEntityId: 'pharmacy',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    totalAmount: '100.00',
    currencyConceptId: 'bob',
    statusConceptId: INS.CLAIM_SUBMITTED,
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
    id: 'version',
    insuranceClaimId: 'claim',
    adjudicationVersion: 1,
    totalApprovedAmount: '60',
    totalPatientAmount: '10',
    totalDeniedAmount: '30',
  };
  const decision = {
    ...adjudication.lineAdjudications[0],
    claimAdjudicationVersionId: 'version',
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
  const repo = {
    findClaim: fn().mockResolvedValue(claim),
    findClaimForUpdate: fn().mockResolvedValue(claim),
    findByIdempotency: fn().mockResolvedValue(null),
    createClaim: fn((_tx: unknown, data: object) => ({ ...claim, ...data })),
    createLine: fn((_tx: unknown, data: { lineSequence: number }) =>
      Object.assign(new InsuranceClaimLines(), {
        ...data,
        id: 'created-' + data.lineSequence,
      }),
    ),
    latestVersion: fn().mockResolvedValue(version),
    createVersion: fn().mockReturnValue({ id: 'next-version' }),
    createLineAdjudication: fn(),
    findEob: fn().mockResolvedValue(null),
    createEob: fn().mockReturnValue({ id: 'eob' }),
    findVersion: fn().mockResolvedValue(version),
    createReversal: fn().mockReturnValue({ id: 'reversal' }),
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
  return {
    service,
    claim,
    line,
    coverage,
    plan,
    snapshot,
    version,
    tx,
    repo,
    access,
    orders,
    coverageRepo,
    catalog,
  };
}

describe('ClaimsService linked orders', () => {
  it.each(['linked', 'generic'])(
    'un recurso %s inexistente y uno denegado a STAFF tienen el mismo cuerpo',
    async (kind) => {
      const f = fixture();
      if (kind === 'generic') f.claim.inventoryReservationId = undefined;
      f.access.assertInsurer.mockRejectedValue(
        new ForbiddenException('Se requiere OWNER o ADMIN'),
      );
      const denied = await f.service
        .adjudicate('claim', adjudication, actor)
        .catch((failure: unknown) => failure);
      f.repo.findClaim.mockResolvedValue(null);
      const missing = await f.service
        .adjudicate('missing', adjudication, actor)
        .catch((failure: unknown) => failure);
      expect(denied).toBeInstanceOf(ForbiddenException);
      expect(missing).toBeInstanceOf(ForbiddenException);
      expect((denied as ForbiddenException).getResponse()).toEqual(
        (missing as ForbiddenException).getResponse(),
      );
      expect(f.repo.createVersion).not.toHaveBeenCalled();
      expect(f.repo.findClaimForUpdate).not.toHaveBeenCalled();
    },
  );
  it('persiste el tipo farmacia, porciones y cantidades canónicas antes del retiro', async () => {
    const f = fixture();
    await f.service.submitClaim(claimInput, actor);
    expect(f.repo.createClaim).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
        inventoryReservationId: 'order',
        totalAmount: '100.00',
        currencyConceptId: 'bob',
      }),
    );
    expect(f.repo.createLine).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        inventoryReservationLineId: 'portion',
        quantity: '2',
        serviceConceptId: 'medicine',
        patientResponsibilityAmount: undefined,
      }),
    );
    expect(f.catalog.findPlanForCarrier).not.toHaveBeenCalled();
    expect(f.access.coverageForOrder).toHaveBeenCalledWith(
      f.tx,
      'coverage',
      f.snapshot,
      'carrier',
      true,
    );
    expect(f.access.assertProvider.mock.invocationCallOrder[0]).toBeLessThan(
      f.access.coverageForOrder.mock.invocationCallOrder[0],
    );
    expect(f.orders.lockAndResolve.mock.invocationCallOrder[0]).toBeLessThan(
      f.tx.findOne.mock.invocationCallOrder[0],
    );
  });
  it.each(['missing-coverage', 'incompatible-coverage'])(
    'un pedido ajeno no revela la cobertura: %s',
    async (variant) => {
      const f = fixture();
      if (variant === 'missing-coverage')
        f.coverageRepo.findCoverage.mockResolvedValue(null);
      else f.catalog.findPlanForCarrier.mockResolvedValue(null);
      f.access.assertProvider.mockRejectedValue(
        new ForbiddenException('No hay acceso a esa solicitud de seguro'),
      );
      const error = await f.service
        .submitClaim(claimInput, actor)
        .catch((failure: unknown) => failure);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual({
        message: 'No hay acceso a esa solicitud de seguro',
        error: 'Forbidden',
        statusCode: 403,
      });
      expect(f.coverageRepo.findCoverage).not.toHaveBeenCalled();
      expect(f.catalog.findPlanForCarrier).not.toHaveBeenCalled();
      expect(f.access.coverageForOrder).not.toHaveBeenCalled();
      expect(f.repo.createClaim).not.toHaveBeenCalled();
    },
  );
  it('devuelve los IDs creados en orden de secuencia para adjudicar por HTTP', async () => {
    const f = fixture();
    f.snapshot.lines = [
      {
        ...f.snapshot.lines[0],
        inventoryReservationLineId: 'portion-b',
        billedAmount: '60',
        quantity: '1',
      },
      {
        ...f.snapshot.lines[0],
        inventoryReservationLineId: 'portion-a',
        billedAmount: '40',
        quantity: '1',
      },
    ];
    const response = await f.service.submitClaim(
      {
        ...claimInput,
        lines: [
          {
            lineSequence: 2,
            inventoryReservationLineId: 'portion-b',
            billedAmount: '60',
          },
          {
            lineSequence: 1,
            inventoryReservationLineId: 'portion-a',
            billedAmount: '40',
          },
        ],
      },
      actor,
    );
    expect(response.lineIds).toEqual(['created-1', 'created-2']);
  });
  it('un replay equivalente conserva IDs aun después del retiro sin crear otro reclamo', async () => {
    const f = fixture();
    f.repo.findByIdempotency.mockResolvedValue(f.claim);
    f.snapshot.canSubmit = false;
    const response = await f.service.submitClaim(
      {
        ...claimInput,
        idempotencyKey: 'same-key',
        lines: [
          { ...claimInput.lines[0], billedAmount: '100.000', quantity: '2.00' },
        ],
      },
      actor,
    );
    expect(response).toEqual({
      id: f.claim.id,
      status: f.claim.statusConceptId,
      createdAt: f.claim.createdAt,
      lineIds: [f.line.id],
    });
    expect(f.repo.createClaim).not.toHaveBeenCalled();
    expect(f.repo.createLine).not.toHaveBeenCalled();
    expect(f.access.coverageForOrder).not.toHaveBeenCalled();
  });
  it('un replay ordena los IDs congelados aunque la base los devuelva invertidos', async () => {
    const f = fixture();
    f.repo.findByIdempotency.mockResolvedValue(f.claim);
    f.tx.find.mockResolvedValue([
      Object.assign(new InsuranceClaimLines(), {
        ...f.line,
        id: 'second',
        lineSequence: 2,
        inventoryReservationLineId: 'portion-b',
        billedAmount: '60',
      }),
      Object.assign(new InsuranceClaimLines(), {
        ...f.line,
        id: 'first',
        lineSequence: 1,
        inventoryReservationLineId: 'portion-a',
        billedAmount: '40',
      }),
    ]);
    const response = await f.service.submitClaim(
      {
        ...claimInput,
        idempotencyKey: 'same-key',
        lines: [
          {
            lineSequence: 2,
            inventoryReservationLineId: 'portion-b',
            billedAmount: '60',
          },
          {
            lineSequence: 1,
            inventoryReservationLineId: 'portion-a',
            billedAmount: '40',
          },
        ],
      },
      actor,
    );
    expect(response.lineIds).toEqual(['first', 'second']);
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it.each([
    'order',
    'coverage',
    'carrier',
    'provider',
    'amount',
    'sequence',
    'line',
    'currency',
    'identifier',
  ])('rechaza reutilizar una clave con otro payload: %s', async (variant) => {
    const f = fixture();
    f.repo.findByIdempotency.mockResolvedValue(f.claim);
    const input = structuredClone({
      ...claimInput,
      idempotencyKey: 'same-key',
    });
    if (variant === 'order') input.inventoryReservationId = 'another-order';
    if (variant === 'coverage') input.patientCoverageId = 'another-coverage';
    if (variant === 'carrier') input.insuranceCarrierId = 'another-carrier';
    if (variant === 'provider')
      input.billingProviderEntityId = 'another-provider';
    if (variant === 'amount') input.lines[0].billedAmount = '101';
    if (variant === 'sequence') input.lines[0].lineSequence = 2;
    if (variant === 'line')
      input.lines[0].inventoryReservationLineId = 'another-line';
    if (variant === 'currency') input.currencyConceptId = 'usd';
    if (variant === 'identifier') input.claimIdentifier = 'another-identifier';
    await expect(f.service.submitClaim(input, actor)).rejects.toThrow(
      'idempotencia',
    );
    expect(f.repo.createClaim).not.toHaveBeenCalled();
    expect(f.repo.createLine).not.toHaveBeenCalled();
  });
  it('una clave ajena no se consulta antes de autorizar el pedido', async () => {
    const f = fixture();
    f.access.assertProvider.mockRejectedValue(new ForbiddenException());
    await expect(
      f.service.submitClaim(
        { ...claimInput, idempotencyKey: 'other-key' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.repo.findByIdempotency).not.toHaveBeenCalled();
  });

  it('un OWNER con rol global USER no obtiene acceso a reclamos genéricos', async () => {
    const f = fixture();
    await expect(
      f.service.submitClaim(
        {
          ...claimInput,
          inventoryReservationId: undefined,
          lines: [{ lineSequence: 1, billedAmount: '100' }],
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.coverageRepo.findCoverage).not.toHaveBeenCalled();
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it('mantiene la respuesta genérica y el facturador práctica para plataforma', async () => {
    const f = fixture();
    const response = await f.service.submitClaim(
      {
        ...claimInput,
        inventoryReservationId: undefined,
        lines: [{ lineSequence: 1, billedAmount: '100' }],
      },
      { id: 'platform', roles: ['SUPERADMIN'] },
    );
    expect(response).not.toHaveProperty('lineIds');
    expect(f.repo.createClaim).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
      }),
    );
    expect(f.orders.lockAndResolve).not.toHaveBeenCalled();
    expect(f.catalog.findPlanForCarrier).toHaveBeenCalledWith(
      f.tx,
      'plan',
      'carrier',
    );
  });
  it('conserva el conflicto histórico de idempotencia en un reclamo genérico', async () => {
    const f = fixture();
    f.repo.findByIdempotency.mockResolvedValue(f.claim);
    await expect(
      f.service.submitClaim(
        {
          ...claimInput,
          inventoryReservationId: undefined,
          idempotencyKey: 'same-key',
          lines: [{ lineSequence: 1, billedAmount: '100' }],
        },
        { id: 'platform', roles: ['SUPERADMIN'] },
      ),
    ).rejects.toThrow('Reclamo duplicado');
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });

  it('rechaza alta ajena antes de escribir', async () => {
    const f = fixture();
    f.access.assertProvider.mockRejectedValue(new ForbiddenException());
    await expect(
      f.service.submitClaim(claimInput, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it.each([
    'both-origins',
    'foreign-line',
    'duplicate-line',
    'wrong-total',
    'wrong-quantity',
    'wrong-provider',
    'wrong-currency',
  ])('rechaza vínculo inválido %s', async (reason) => {
    const f = fixture();
    const input = structuredClone(claimInput);
    if (reason === 'both-origins') input.serviceRequestId = 'diagnostic';
    if (reason === 'foreign-line')
      input.lines[0].inventoryReservationLineId = 'other';
    if (reason === 'duplicate-line')
      input.lines.push({ ...input.lines[0], lineSequence: 2 });
    if (reason === 'wrong-total') input.lines[0].billedAmount = '101';
    if (reason === 'wrong-quantity') input.lines[0].quantity = '3';
    if (reason === 'wrong-provider') input.billingProviderEntityId = 'other';
    if (reason === 'wrong-currency') input.currencyConceptId = 'usd';
    await expect(f.service.submitClaim(input, actor)).rejects.toThrow();
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it('rechaza cobertura cuyo plan no pertenece a la aseguradora', async () => {
    const f = fixture();
    f.access.coverageForOrder.mockRejectedValue(
      new Error('La cobertura no corresponde a la aseguradora indicada'),
    );
    await expect(f.service.submitClaim(claimInput, actor)).rejects.toThrow();
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it('rechaza segundo reclamo activo con el pedido bloqueado', async () => {
    const f = fixture();
    f.tx.findOne.mockResolvedValue(f.claim);
    await expect(f.service.submitClaim(claimInput, actor)).rejects.toThrow(
      'reclamo activo',
    );
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it('rechaza alta posterior al retiro o durante sustitución pendiente', async () => {
    const f = fixture();
    f.snapshot.canSubmit = false;
    await expect(f.service.submitClaim(claimInput, actor)).rejects.toThrow();
    expect(f.repo.createClaim).not.toHaveBeenCalled();
  });
  it('exige una autorización previa del mismo pedido y cobertura', async () => {
    const f = fixture();
    f.tx.findOne.mockImplementation(async (entity: unknown) =>
      entity === PriorAuthorizationRequests
        ? {
            patientCoverageId: 'coverage',
            inventoryReservationId: 'other-order',
          }
        : null,
    );
    await expect(
      f.service.submitClaim(
        { ...claimInput, priorAuthorizationRequestId: 'prior' },
        actor,
      ),
    ).rejects.toThrow('misma cobertura y pedido');
  });
  it('no interpreta datos de responsabilidad del prestador como deuda confirmada', async () => {
    const f = fixture();
    const input = structuredClone(claimInput);
    input.lines[0].patientResponsibilityAmount = '100';
    await expect(f.service.submitClaim(input, actor)).rejects.toThrow();
  });
  it('adjudica bajo autorización de aseguradora y locks pedido → reclamo', async () => {
    const f = fixture();
    await f.service.adjudicate('claim', adjudication, actor);
    expect(f.access.assertInsurer).toHaveBeenCalledWith(f.tx, actor, 'carrier');
    expect(f.orders.lockAndResolve.mock.invocationCallOrder[0]).toBeLessThan(
      f.repo.findClaimForUpdate.mock.invocationCallOrder[0],
    );
    expect(f.repo.createVersion).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        supersedesVersionId: 'version',
        adjudicationVersion: 2,
      }),
    );
    expect(f.claim.statusConceptId).toBe(INS.CLAIM_ADJUDICATED);
  });
  it('permite re-adjudicación append-only y no reescribe la versión previa', async () => {
    const f = fixture();
    f.claim.statusConceptId = INS.CLAIM_ADJUDICATED;
    await f.service.adjudicate('claim', adjudication, actor);
    expect(f.repo.createVersion).toHaveBeenCalled();
    expect(f.version.totalDeniedAmount).toBe('30');
  });
  it('rechaza adjudicación incompleta sin insertar versión', async () => {
    const f = fixture();
    await expect(
      f.service.adjudicate(
        'claim',
        { ...adjudication, lineAdjudications: [] },
        actor,
      ),
    ).rejects.toThrow();
    expect(f.repo.createVersion).not.toHaveBeenCalled();
  });
  it('publica para el paciente real de cobertura, después de conciliar la versión', async () => {
    const f = fixture();
    f.claim.statusConceptId = INS.CLAIM_ADJUDICATED;
    await f.service.publishEob('claim', {}, actor);
    expect(f.repo.createEob).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        patientProfileId: 'patient',
        claimAdjudicationVersionId: 'version',
      }),
    );
  });
  it.each(['reversed', 'changed-order', 'missing-line', 'missing-coverage'])(
    'no publica evidencia inválida %s',
    async (reason) => {
      const f = fixture();
      f.claim.statusConceptId = INS.CLAIM_ADJUDICATED;
      if (reason === 'reversed') f.claim.statusConceptId = INS.CLAIM_REVERSED;
      if (reason === 'changed-order') f.snapshot.validForSettlement = false;
      if (reason === 'missing-line')
        f.tx.find.mockImplementation(async (entity: unknown) =>
          entity === InsuranceClaimLines ? [f.line] : [],
        );
      if (reason === 'missing-coverage')
        f.coverageRepo.findCoverage.mockResolvedValue(null);
      await expect(f.service.publishEob('claim', {}, actor)).rejects.toThrow();
      expect(f.repo.createEob).not.toHaveBeenCalled();
    },
  );
  it.each(['adjudicate', 'publishEob', 'reverse'] as const)(
    'rechaza aseguradora ajena en %s',
    async (method) => {
      const f = fixture();
      f.access.assertInsurer.mockRejectedValue(new ForbiddenException());
      const dto =
        method === 'adjudicate'
          ? adjudication
          : method === 'reverse'
            ? { reversedAdjudicationVersionId: 'version' }
            : {};
      await expect(
        f.service[method]('claim', dto as never, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(f.orders.lockAndResolve).not.toHaveBeenCalled();
    },
  );
  it('revierte conservando la evidencia de versión y EOB', async () => {
    const f = fixture();
    f.claim.statusConceptId = INS.CLAIM_ADJUDICATED;
    await f.service.reverse(
      'claim',
      { reversedAdjudicationVersionId: 'version' },
      actor,
    );
    expect(f.claim.statusConceptId).toBe(INS.CLAIM_REVERSED);
    expect(f.repo.createReversal).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({ reversedAdjudicationVersionId: 'version' }),
    );
    expect(f.version.totalPatientAmount).toBe('10');
  });
  it('no permite revertir una versión sustituida', async () => {
    const f = fixture();
    f.claim.statusConceptId = INS.CLAIM_ADJUDICATED;
    f.repo.latestVersion.mockResolvedValue({ ...f.version, id: 'newer' });
    await expect(
      f.service.reverse(
        'claim',
        { reversedAdjudicationVersionId: 'version' },
        actor,
      ),
    ).rejects.toThrow();
    expect(f.repo.createReversal).not.toHaveBeenCalled();
  });
});
