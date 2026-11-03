import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import { InsuranceErrorReason } from '../../domain/insurance.error-reasons';
import { ReconciliationService } from './reconciliation.service';

/** Mock laxo, como en el resto de los specs del módulo. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const T3 = '33333333-3333-4333-8333-333333333333';
const CARRIER_A = 'carrier-a';
const CARRIER_B = 'carrier-b';
const PRACTICE_1 = 'practice-1';
const PRACTICE_2 = 'practice-2';
const BATCH = 'batch-1';
const CLAIM = 'claim-1';
const VERSION = 'version-1';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as never;

/** Aseguradoras de la prueba: A es del tenant T1; B es de T2. */
const carriers: Record<string, { id: string; tenantId: string }> = {
  [CARRIER_A]: { id: CARRIER_A, tenantId: T1 },
  [CARRIER_B]: { id: CARRIER_B, tenantId: T2 },
};
/** Prácticas de la prueba: la 1 es de T3; la 2 es de T2. */
const practiceTenants: Record<string, string> = {
  [PRACTICE_1]: T3,
  [PRACTICE_2]: T2,
};

/**
 * Ejecuta el servicio dentro del contexto de un tenant.
 *
 * @param tenantId - Tenant activo.
 * @param fn - Operación.
 * @returns Resultado de la operación.
 */
function as<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return runWithTenant(tenantId, fn);
}

/**
 * Construye el servicio con repositorios dobles.
 *
 * @returns Servicio y dobles.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findBatch: mockFn(),
    createBatch: mockFn((_tx: unknown, data: any) => ({
      id: BATCH,
      createdAt: new Date('2026-01-01'),
      ...data,
    })),
    createItem: mockFn(() => ({ id: 'item-1' })),
  };
  const claims = { findClaim: mockFn(), findVersion: mockFn() };
  const catalog = {
    findCarrier: mockFn(
      async (_tx: unknown, id: string) => carriers[id] ?? null,
    ),
  };
  const practiceLookup = {
    findTenantOfPractice: mockFn(
      async (id: string) => practiceTenants[id] ?? null,
    ),
    findActivePracticeIdsForTenant: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReconciliationService(
    em as never,
    repo as never,
    claims as never,
    catalog as never,
    practiceLookup as never,
    logger as never,
  );
  return { service, tx, repo, claims, catalog, practiceLookup };
}

const batchDto = (over: Record<string, unknown> = {}) =>
  ({
    insuranceCarrierId: CARRIER_A,
    providerEntityId: PRACTICE_1,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    ...over,
  }) as never;

/** Lote abierto entre la aseguradora A y la práctica 1. */
const openBatch = (over: Record<string, unknown> = {}) => ({
  id: BATCH,
  insuranceCarrierId: CARRIER_A,
  providerTypeConceptId: INS.RECON_PROVIDER_TYPE_PRACTICE,
  providerEntityId: PRACTICE_1,
  ...over,
});
/** Reclamo de la aseguradora A presentado por la práctica 1. */
const claimOf = (over: Record<string, unknown> = {}) => ({
  id: CLAIM,
  insuranceCarrierId: CARRIER_A,
  billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
  billingProviderEntityId: PRACTICE_1,
  ...over,
});
const itemDto = (over: Record<string, unknown> = {}) =>
  ({
    insuranceClaimId: CLAIM,
    claimAdjudicationVersionId: VERSION,
    expectedAmount: '100.00',
    acceptedAmount: '90.00',
    ...over,
  }) as never;

/**
 * Afirma que la promesa falla como "no existe": 404, el `reason` del catálogo y sin `details`.
 *
 * @param promise - Operación bajo prueba.
 */
async function expectNotAvailable(promise: Promise<unknown>): Promise<any> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.reason).toBe(
    InsuranceErrorReason.RECONCILIATION_RESOURCE_NOT_AVAILABLE,
  );
  expect(error.details).toBeUndefined();
  return error;
}

describe('ReconciliationService (INS-02)', () => {
  describe('createBatch', () => {
    it('la aseguradora dueña abre el lote con una práctica existente', async () => {
      const d = build();
      const res = await as(T1, () => d.service.createBatch(batchDto(), actor));
      expect(res.id).toBe(BATCH);
      expect(d.repo.createBatch).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          insuranceCarrierId: CARRIER_A,
          providerEntityId: PRACTICE_1,
        }),
      );
    });

    it('el tenant dueño de la práctica también puede abrirlo', async () => {
      const d = build();
      await expect(
        as(T3, () => d.service.createBatch(batchDto(), actor)),
      ).resolves.toMatchObject({ id: BATCH });
    });

    it('un tenant que no es parte (ni aseguradora ni prestador) recibe 404 uniforme y no se crea el lote', async () => {
      const d = build();
      await expectNotAvailable(
        as(T2, () => d.service.createBatch(batchDto(), actor)),
      );
      expect(d.repo.createBatch).not.toHaveBeenCalled();
    });

    it('una práctica inexistente o una aseguradora inexistente responden igual que una ajena', async () => {
      const d = build();
      const foreign = await expectNotAvailable(
        as(T2, () => d.service.createBatch(batchDto(), actor)),
      );
      const noPractice = await expectNotAvailable(
        as(T1, () =>
          d.service.createBatch(batchDto({ providerEntityId: 'nope' }), actor),
        ),
      );
      const noCarrier = await expectNotAvailable(
        as(T1, () =>
          d.service.createBatch(
            batchDto({ insuranceCarrierId: 'nope' }),
            actor,
          ),
        ),
      );
      expect(noPractice.getResponse()).toEqual(foreign.getResponse());
      expect(noCarrier.getResponse()).toEqual(foreign.getResponse());
      expect(d.repo.createBatch).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto se rechaza (412)', async () => {
      const d = build();
      await expect(
        d.service.createBatch(batchDto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createBatch).not.toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    /**
     * Prepara el caso feliz: lote A/práctica 1, reclamo y versión coherentes.
     *
     * @returns Dobles con los datos cargados.
     */
    function ready() {
      const d = build();
      d.repo.findBatch.mockResolvedValue(openBatch());
      d.claims.findClaim.mockResolvedValue(claimOf());
      d.claims.findVersion.mockResolvedValue({
        id: VERSION,
        insuranceClaimId: CLAIM,
      });
      return d;
    }

    it('concilia una versión válida del reclamo del mismo carrier y prestador', async () => {
      const d = ready();
      const res = await as(T1, () =>
        d.service.addItem(BATCH, itemDto(), actor),
      );
      expect(res).toEqual({ id: 'item-1' });
      expect(d.repo.createItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          insuranceReconciliationBatchId: BATCH,
          varianceAmount: '10.00',
        }),
      );
    });

    it('un reclamo de otro carrier se rechaza como inexistente y no se crea el ítem', async () => {
      const d = ready();
      d.claims.findClaim.mockResolvedValue(
        claimOf({ insuranceCarrierId: CARRIER_B }),
      );
      await expectNotAvailable(
        as(T1, () => d.service.addItem(BATCH, itemDto(), actor)),
      );
      expect(d.claims.findVersion).not.toHaveBeenCalled();
      expect(d.repo.createItem).not.toHaveBeenCalled();
    });

    it('un reclamo de otro prestador se rechaza como inexistente y no se crea el ítem', async () => {
      const d = ready();
      d.claims.findClaim.mockResolvedValue(
        claimOf({ billingProviderEntityId: PRACTICE_2 }),
      );
      await expectNotAvailable(
        as(T1, () => d.service.addItem(BATCH, itemDto(), actor)),
      );
      expect(d.repo.createItem).not.toHaveBeenCalled();
    });

    it('un reclamo cuyo facturador no es una práctica se rechaza', async () => {
      const d = ready();
      d.claims.findClaim.mockResolvedValue(
        claimOf({ billingProviderTypeConceptId: 'otro-tipo' }),
      );
      await expectNotAvailable(
        as(T1, () => d.service.addItem(BATCH, itemDto(), actor)),
      );
    });

    it('una versión que es de otro reclamo se rechaza como inexistente', async () => {
      const d = ready();
      d.claims.findVersion.mockResolvedValue({
        id: VERSION,
        insuranceClaimId: 'otro-reclamo',
      });
      await expectNotAvailable(
        as(T1, () => d.service.addItem(BATCH, itemDto(), actor)),
      );
      expect(d.repo.createItem).not.toHaveBeenCalled();
    });

    it('un lote de dos terceros responde 404 uniforme y no se lee el reclamo', async () => {
      const d = ready();
      d.repo.findBatch.mockResolvedValue(
        openBatch({
          insuranceCarrierId: CARRIER_B,
          providerEntityId: PRACTICE_2,
        }),
      );
      await expectNotAvailable(
        as(T1, () => d.service.addItem(BATCH, itemDto(), actor)),
      );
      expect(d.claims.findClaim).not.toHaveBeenCalled();
      expect(d.repo.createItem).not.toHaveBeenCalled();
    });

    it('un lote inexistente responde igual que uno ajeno', async () => {
      const foreign = ready();
      foreign.repo.findBatch.mockResolvedValue(
        openBatch({
          insuranceCarrierId: CARRIER_B,
          providerEntityId: PRACTICE_2,
        }),
      );
      const missing = ready();
      missing.repo.findBatch.mockResolvedValue(null);
      const a = await expectNotAvailable(
        as(T1, () => foreign.service.addItem(BATCH, itemDto(), actor)),
      );
      const b = await expectNotAvailable(
        as(T1, () => missing.service.addItem(BATCH, itemDto(), actor)),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('sin tenant en el contexto se rechaza (412) antes de leer el lote', async () => {
      const d = ready();
      await expect(
        d.service.addItem(BATCH, itemDto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.findBatch).not.toHaveBeenCalled();
    });
  });
});
