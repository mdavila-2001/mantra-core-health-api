import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PriorAuthService } from './prior-auth.service';
import {
  PriorAuthorizationRequests,
  PatientCoverages,
  InsurancePlans,
} from '../entities';
import { InventoryReservationLines } from '../../pharmacy_inventory/entities';
import { INS } from '../insurance.concepts';
import type { CreatePriorAuthRequestDto } from '../dto';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const actor = { id: 'user', roles: ['USER'] };
const dto: CreatePriorAuthRequestDto = {
  patientCoverageId: 'coverage',
  requestingProviderEntityId: 'pharmacy',
  inventoryReservationId: 'order',
  items: [
    {
      pharmacyProductId: 'product',
      requestedQuantity: '2',
      requestedAmount: '100',
    },
  ],
};
function fixture() {
  const coverage = Object.assign(new PatientCoverages(), {
    patientProfileId: 'patient',
    insurancePlanId: 'plan',
  });
  const plan = Object.assign(new InsurancePlans(), {
    insuranceProductId: 'product',
    currencyConceptId: 'bob',
  });
  const request: PriorAuthorizationRequests = Object.assign(
    new PriorAuthorizationRequests(),
    {
      id: 'prior',
      patientCoverageId: 'coverage',
      inventoryReservationId: 'order',
      requestingProviderEntityId: 'pharmacy',
      statusConceptId: INS.PRIOR_AUTH_SUBMITTED,
    },
  );
  const snapshot: LinkedOrderSnapshot = {
    origin: 'PHARMACY',
    orderId: 'order',
    patientProfileId: 'patient',
    providerTenantId: 'provider',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    billingProviderEntityId: 'pharmacy',
    currencyConceptId: 'bob',
    totalAmount: '100',
    validForSettlement: true,
    canSubmit: true,
    lines: [
      {
        inventoryReservationLineId: 'portion',
        quantity: '2',
        billedAmount: '100',
        serviceConceptId: 'medicine',
      },
    ],
  };
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    findOne: fn().mockResolvedValue(request),
    find: fn(async (entity: unknown) =>
      entity === InventoryReservationLines
        ? [{ id: 'portion', pharmacyProductId: 'product' }]
        : [],
    ),
  };
  const repo = {
    createRequest: fn().mockReturnValue(request),
    createItem: fn(),
    findRequest: fn().mockResolvedValue(request),
    maxDeterminationVersion: fn().mockResolvedValue(0),
    createDetermination: fn().mockReturnValue({ id: 'determination' }),
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
  const service = new PriorAuthService(
    { transactional: (work: (em: unknown) => unknown) => work(tx) } as never,
    repo as never,
    coverageRepo as never,
    { setContext: fn() } as never,
    orders as never,
    access as never,
    {
      findPlan: fn().mockResolvedValue(plan),
      findProduct: fn().mockResolvedValue({ insuranceCarrierId: 'carrier' }),
    } as never,
  );
  return { service, snapshot, tx, repo, access, orders, request, coverageRepo };
}
describe('PriorAuthService linked orders', () => {
  it.each(['linked', 'generic'])(
    'no distingue una autorización %s ajena de una inexistente para STAFF',
    async (kind) => {
      const f = fixture();
      if (kind === 'generic') f.request.inventoryReservationId = undefined;
      f.access.assertInsurer.mockRejectedValue(
        new ForbiddenException('Se requiere OWNER o ADMIN'),
      );
      const denied = await f.service
        .issueDetermination('prior', { decision: 'APPROVED' }, actor)
        .catch((failure: unknown) => failure);
      f.repo.findRequest.mockResolvedValue(null);
      const missing = await f.service
        .issueDetermination('missing', { decision: 'APPROVED' }, actor)
        .catch((failure: unknown) => failure);
      expect(denied).toBeInstanceOf(ForbiddenException);
      expect(missing).toBeInstanceOf(ForbiddenException);
      expect((denied as ForbiddenException).getResponse()).toEqual(
        (missing as ForbiddenException).getResponse(),
      );
      expect(f.repo.createDetermination).not.toHaveBeenCalled();
      expect(f.orders.lockAndResolve).not.toHaveBeenCalled();
    },
  );
  it('persiste enlace directo y tipo farmacia con importes canónicos', async () => {
    const f = fixture();
    await f.service.submitRequest(dto, actor);
    expect(f.repo.createRequest).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        inventoryReservationId: 'order',
        requestingProviderTypeConceptId: INS.ELIG_PROVIDER_TYPE_PHARMACY,
      }),
    );
    expect(f.repo.createItem).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({
        pharmacyProductId: 'product',
        requestedAmount: '100',
        currencyConceptId: 'bob',
      }),
    );
  });
  it('conserva la receta opcional del mismo pedido', async () => {
    const f = fixture();
    f.snapshot.medicationRequestId = 'prescription';
    await f.service.submitRequest(
      { ...dto, medicationRequestId: 'prescription' },
      actor,
    );
    expect(f.repo.createRequest).toHaveBeenCalledWith(
      f.tx,
      expect.objectContaining({ medicationRequestId: 'prescription' }),
    );
  });
  it('rechaza receta ajena aunque paciente y cobertura coincidan', async () => {
    const f = fixture();
    f.snapshot.medicationRequestId = 'prescription';
    await expect(
      f.service.submitRequest({ ...dto, medicationRequestId: 'other' }, actor),
    ).rejects.toThrow('La receta debe pertenecer al mismo pedido');
    expect(f.repo.createRequest).not.toHaveBeenCalled();
  });
  it('rechaza receta sin pedido de farmacia', async () => {
    const f = fixture();
    await expect(
      f.service.submitRequest(
        {
          ...dto,
          inventoryReservationId: undefined,
          serviceRequestId: 'diagnostic',
          medicationRequestId: 'prescription',
        },
        actor,
      ),
    ).rejects.toThrow('La receta requiere su pedido de farmacia vinculado');
    expect(f.repo.createRequest).not.toHaveBeenCalled();
  });

  it.each(['missing-coverage', 'incompatible-coverage'])(
    'no consulta cobertura privada de un pedido ajeno: %s',
    async (variant) => {
      const f = fixture();
      if (variant === 'missing-coverage')
        f.coverageRepo.findCoverage.mockResolvedValue(null);
      else
        f.access.coverageForOrder.mockRejectedValue(
          new Error('Cobertura incompatible'),
        );
      f.access.assertProvider.mockRejectedValue(
        new ForbiddenException('No hay acceso a esa solicitud de seguro'),
      );
      const error = await f.service
        .submitRequest(dto, actor)
        .catch((failure: unknown) => failure);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual({
        message: 'No hay acceso a esa solicitud de seguro',
        error: 'Forbidden',
        statusCode: 403,
      });
      expect(f.coverageRepo.findCoverage).not.toHaveBeenCalled();
      expect(f.access.coverageForOrder).not.toHaveBeenCalled();
      expect(f.repo.createRequest).not.toHaveBeenCalled();
    },
  );

  it('rechaza solicitante sin membresía antes de escribir', async () => {
    const f = fixture();
    f.access.assertAdministrator.mockRejectedValue(new ForbiddenException());
    await expect(f.service.submitRequest(dto, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(f.repo.createRequest).not.toHaveBeenCalled();
  });
  it.each(['product', 'quantity', 'amount', 'currency'])(
    'rechaza ítem que no representa pedido: %s',
    async (field) => {
      const f = fixture();
      const input = structuredClone(dto);
      if (field === 'product') input.items[0].pharmacyProductId = 'other';
      if (field === 'quantity') input.items[0].requestedQuantity = '1';
      if (field === 'amount') input.items[0].requestedAmount = '101';
      if (field === 'currency') input.currencyConceptId = 'usd';
      await expect(f.service.submitRequest(input, actor)).rejects.toThrow();
      expect(f.repo.createRequest).not.toHaveBeenCalled();
    },
  );
  it('rechaza determinación de aseguradora ajena antes de bloquear pedido', async () => {
    const f = fixture();
    f.access.assertInsurer.mockRejectedValue(new ForbiddenException());
    await expect(
      f.service.issueDetermination('prior', { decision: 'APPROVED' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.orders.lockAndResolve).not.toHaveBeenCalled();
    expect(f.repo.createDetermination).not.toHaveBeenCalled();
  });
  it('determina con autorización aseguradora y lock pedido antes de autorización', async () => {
    const f = fixture();
    await f.service.issueDetermination(
      'prior',
      { decision: 'APPROVED', approvedAmount: '100' },
      actor,
    );
    expect(f.access.assertInsurer).toHaveBeenCalledWith(f.tx, actor, 'carrier');
    expect(f.orders.lockAndResolve.mock.invocationCallOrder[0]).toBeLessThan(
      f.tx.findOne.mock.invocationCallOrder[0],
    );
    expect(f.request.statusConceptId).toBe(INS.PRIOR_AUTH_DETERMINED);
  });
  it('mantiene protegida una solicitud genérica', async () => {
    const f = fixture();
    await expect(
      f.service.submitRequest(
        { ...dto, inventoryReservationId: undefined },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
