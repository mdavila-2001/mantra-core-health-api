import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  ClaimReversals,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientExplanationsOfBenefit,
} from '../entities';
import { CatalogConcepts } from '../../terminology/entities';
import { DiagnosticUnits } from '../../diagnostic_units/entities';
import { Pharmacies } from '../../pharmacy/entities';
import { INS } from '../insurance.concepts';
import { PractitionerSettlementBatchesService } from './practitioner-settlement-batches.service';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);

const CARRIER = 'carrier-1';
const PROVIDER = 'provider-1';
const TENANT = 'tenant-1';
const actor = { id: 'insurer-user', roles: ['USER'] } as never;

const dto = {
  insuranceCarrierId: CARRIER,
  providerEntityId: PROVIDER,
  cadence: 'MONTHLY' as const,
  periodStart: '2026-09-01',
};

function claim(id: string, over: Record<string, unknown> = {}) {
  return Object.assign(new InsuranceClaims(), {
    id,
    claimIdentifier: `CLM-${id}`,
    insuranceCarrierId: CARRIER,
    billingProviderEntityId: PROVIDER,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
    totalAmount: '100.00',
    currencyConceptId: 'bob',
    statusConceptId: INS.CLAIM_ADJUDICATED,
    ...over,
  });
}
function line(id: string, claimId: string) {
  return Object.assign(new InsuranceClaimLines(), {
    id,
    insuranceClaimId: claimId,
    lineSequence: 1,
    billedAmount: '100.00',
  });
}
function version(
  id: string,
  claimId: string,
  over: Record<string, unknown> = {},
) {
  return Object.assign(new ClaimAdjudicationVersions(), {
    id,
    insuranceClaimId: claimId,
    adjudicationVersion: 1,
    totalApprovedAmount: '80.00',
    totalPatientAmount: '20.00',
    totalDeniedAmount: '0.00',
    ...over,
  });
}
function adjudication(lineId: string, versionId: string) {
  return Object.assign(new ClaimLineAdjudications(), {
    id: `adj-${lineId}`,
    claimAdjudicationVersionId: versionId,
    insuranceClaimLineId: lineId,
    decisionConceptId: INS.LINE_DECISION_APPROVED,
    approvedAmount: '80.00',
    patientAmount: '20.00',
    deniedAmount: '0.00',
  });
}
function eob(id: string, versionId: string, publishedAt: Date) {
  return Object.assign(new PatientExplanationsOfBenefit(), {
    id,
    claimAdjudicationVersionId: versionId,
    statusConceptId: INS.EOB_PUBLISHED,
    publishedAt,
  });
}

/** Doble de `tx`/`em.fork()`: despacha `find`/`findOne` por la clase de entidad. */
function em(byEntity: (entity: unknown) => unknown[] = () => []) {
  const tx = {
    find: fn(async (entity: unknown, _where?: unknown) => byEntity(entity)),
    findOne: fn(async (entity: unknown) => byEntity(entity)[0] ?? null),
    flush: fn().mockResolvedValue(undefined),
  };
  return {
    transactional: (callback: (tx: unknown) => unknown) => callback(tx),
    fork: () => tx,
  };
}

function service(
  overrides: {
    repo?: Record<string, unknown>;
    catalog?: Record<string, unknown>;
    linkedAccess?: Record<string, unknown>;
    practiceLookup?: Record<string, unknown>;
    emDouble?: unknown;
  } = {},
) {
  const repo = {
    lockSettlementPair: fn().mockResolvedValue(undefined),
    findSettlementBatchByNaturalKey: fn().mockResolvedValue(null),
    findClaimsByCarrierAndProvider: fn().mockResolvedValue([]),
    findSettlementItemsByClaimIds: fn().mockResolvedValue([]),
    findSettlementItemsByBatchIds: fn().mockResolvedValue([]),
    createBatch: fn((_tx: unknown, data: Record<string, unknown>) => ({
      id: 'batch-1',
      createdAt: new Date('2026-09-25T00:00:00Z'),
      ...data,
    })),
    createItem: fn((_tx: unknown, data: Record<string, unknown>) => ({
      id: 'item-new',
      ...data,
    })),
    findBatch: fn().mockResolvedValue(null),
    findSettlementBatches: fn().mockResolvedValue([]),
    ...overrides.repo,
  };
  const catalog = {
    findCarrier: fn().mockResolvedValue({
      id: CARRIER,
      legalName: 'Aseguradora X',
    }),
    findCarrierByTenantId: fn().mockResolvedValue(null),
    ...overrides.catalog,
  };
  const linkedAccess = {
    assertInsurer: fn().mockResolvedValue(undefined),
    ...overrides.linkedAccess,
  };
  const practiceLookup = {
    findActivePracticeIdsForTenant: fn().mockResolvedValue([]),
    ...overrides.practiceLookup,
  };
  const emDouble = overrides.emDouble ?? em();
  const svc = new PractitionerSettlementBatchesService(
    emDouble as never,
    repo as never,
    catalog as never,
    linkedAccess as never,
    practiceLookup as never,
  );
  return { svc, repo, catalog, linkedAccess, practiceLookup };
}

describe('PractitionerSettlementBatchesService.generate', () => {
  it('genera un lote nuevo, incluye el reclamo elegible y nunca escribe un importe pagado', async () => {
    const c1 = claim('c1');
    const l1 = line('l1', 'c1');
    const v1 = version('v1', 'c1');
    const a1 = adjudication('l1', 'v1');
    const e1 = eob('eob1', 'v1', new Date('2026-09-05T12:00:00Z'));

    const byEntity = (entity: unknown): unknown[] => {
      if (entity === InsuranceClaimLines) return [l1];
      if (entity === ClaimAdjudicationVersions) return [v1];
      if (entity === ClaimReversals) return [];
      if (entity === ClaimLineAdjudications) return [a1];
      if (entity === PatientExplanationsOfBenefit) return [e1];
      if (entity === CatalogConcepts) return [{ id: 'bob', code: 'BOB' }];
      return [];
    };
    const { svc, repo } = service({
      repo: { findClaimsByCarrierAndProvider: fn().mockResolvedValue([c1]) },
      emDouble: em(byEntity),
    });

    const { dto: result, created } = await svc.generate(dto, actor);

    expect(created).toBe(true);
    expect(result.replayed).toBe(false);
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0]).toMatchObject({
      claimId: 'c1',
      totalApprovedAmount: '80.00',
      totalPatientAmount: '20.00',
      totalDeniedAmount: '0.00',
    });
    expect(result.totals.totalApprovedAmount).toBe('80.00');

    // El cerrojo se toma antes de crear nada.
    expect(repo.lockSettlementPair).toHaveBeenCalledWith(
      expect.anything(),
      CARRIER,
      PROVIDER,
    );
    expect(repo.createItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        insuranceClaimId: 'c1',
        statusConceptId: INS.SETTLEMENT_ITEM_INCLUDED,
      }),
    );

    // CA-3.2 §11: ningún dato de pago en lo que se persiste.
    const batchCallArgs = repo.createBatch.mock.calls[0]![1] as Record<
      string,
      unknown
    >;
    expect(Object.keys(batchCallArgs).join(',')).not.toMatch(/paid/i);
    for (const call of repo.createItem.mock.calls) {
      const itemArgs = call[1] as Record<string, unknown>;
      expect(Object.keys(itemArgs).join(',')).not.toMatch(
        /paid|accepted|variance/i,
      );
    }
  });

  it('repetir la misma petición devuelve el lote existente con replayed: true, sin volver a crear ítems', async () => {
    const existingBatch = {
      id: 'batch-existing',
      insuranceCarrierId: CARRIER,
      providerEntityId: PROVIDER,
      periodStart: new Date('2026-09-01T00:00:00Z'),
      periodEnd: new Date('2026-09-30T00:00:00Z'),
      totalClaimedAmount: '100.00',
      totalApprovedAmount: '80.00',
      currencyConceptId: 'bob',
      statusConceptId: INS.SETTLEMENT_BATCH_ISSUED,
      createdAt: new Date('2026-09-10T00:00:00Z'),
    };
    const { svc, repo } = service({
      repo: {
        findSettlementBatchByNaturalKey: fn().mockResolvedValue(existingBatch),
        findSettlementItemsByBatchIds: fn().mockResolvedValue([]),
      },
      emDouble: em(() => []),
    });

    const { dto: result, created } = await svc.generate(dto, actor);

    expect(created).toBe(false);
    expect(result.replayed).toBe(true);
    expect(result.id).toBe('batch-existing');
    expect(repo.createBatch).not.toHaveBeenCalled();
    expect(repo.createItem).not.toHaveBeenCalled();
  });

  it('un reclamo sin EOB publicada queda excluido con EOB_NOT_PUBLISHED y no se incluye', async () => {
    const c1 = claim('c1');
    const l1 = line('l1', 'c1');
    const v1 = version('v1', 'c1');
    const a1 = adjudication('l1', 'v1');
    const byEntity = (entity: unknown): unknown[] => {
      if (entity === InsuranceClaimLines) return [l1];
      if (entity === ClaimAdjudicationVersions) return [v1];
      if (entity === ClaimLineAdjudications) return [a1];
      return [];
    };
    const { svc, repo } = service({
      repo: { findClaimsByCarrierAndProvider: fn().mockResolvedValue([c1]) },
      emDouble: em(byEntity),
    });

    const { dto: result } = await svc.generate(dto, actor);

    expect(result.claims).toHaveLength(0);
    expect(result.excludedClaims).toEqual([
      { claimId: 'c1', claimIdentifier: 'CLM-c1', reason: 'EOB_NOT_PUBLISHED' },
    ]);
    expect(repo.createItem).not.toHaveBeenCalled();
  });

  it('un reclamo revertido ya incluido en un lote anterior genera un ajuste negativo, no un ítem incluido', async () => {
    const c1 = claim('c1', { statusConceptId: INS.CLAIM_REVERSED });
    const reversal = Object.assign(new ClaimReversals(), {
      id: 'reversal-1',
      insuranceClaimId: 'c1',
    });
    const { svc, repo } = service({
      repo: {
        findClaimsByCarrierAndProvider: fn().mockResolvedValue([c1]),
        findSettlementItemsByClaimIds: fn().mockResolvedValue([
          {
            id: 'item-old',
            insuranceClaimId: 'c1',
            expectedAmount: '80.00',
            statusConceptId: INS.SETTLEMENT_ITEM_INCLUDED,
          },
        ]),
      },
      emDouble: em((entity: unknown) =>
        entity === ClaimReversals ? [reversal] : [],
      ),
    });

    const { dto: result } = await svc.generate(dto, actor);

    expect(result.claims).toHaveLength(0);
    expect(result.reversalAdjustments).toEqual([
      {
        claimId: 'c1',
        claimIdentifier: 'CLM-c1',
        previousBatchId: '',
        adjustmentAmount: '-80.00',
      },
    ]);
    expect(repo.createItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        insuranceClaimId: 'c1',
        expectedAmount: '-80.00',
        statusConceptId: INS.SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT,
      }),
    );
  });

  it('rechaza generar para una aseguradora ajena, con el mismo cuerpo que cualquier 403 del módulo', async () => {
    const { svc } = service({
      linkedAccess: {
        assertInsurer: fn().mockRejectedValue(
          new ForbiddenException('No hay acceso a esa solicitud de seguro'),
        ),
      },
    });

    const error = await svc
      .generate(dto, actor)
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual({
      message: 'No hay acceso a esa solicitud de seguro',
      error: 'Forbidden',
      statusCode: 403,
    });
  });
});

describe('PractitionerSettlementBatchesService.getById', () => {
  const batch = {
    id: 'batch-1',
    insuranceCarrierId: CARRIER,
    providerEntityId: PROVIDER,
    periodStart: new Date('2026-09-01T00:00:00Z'),
    periodEnd: new Date('2026-09-30T00:00:00Z'),
    totalClaimedAmount: '100.00',
    totalApprovedAmount: '80.00',
    currencyConceptId: 'bob',
    statusConceptId: INS.SETTLEMENT_BATCH_ISSUED,
    createdAt: new Date('2026-09-10T00:00:00Z'),
  };

  it('la aseguradora dueña del lote puede leerlo', async () => {
    const { svc } = service({
      repo: { findBatch: fn().mockResolvedValue(batch) },
      emDouble: em(() => []),
    });
    const result = await svc.getById('batch-1', actor);
    expect(result.id).toBe('batch-1');
  });

  it('un prestador ajeno al lote recibe el mismo 403 que un id inexistente', async () => {
    const { svc } = await runWithTenant(TENANT, async () => {
      return service({
        repo: { findBatch: fn().mockResolvedValue(batch) },
        linkedAccess: {
          assertInsurer: fn().mockRejectedValue(
            new ForbiddenException('No hay acceso a esa solicitud de seguro'),
          ),
        },
        practiceLookup: {
          findActivePracticeIdsForTenant: fn().mockResolvedValue([]),
        },
        emDouble: em((entity: unknown) => {
          if (entity === DiagnosticUnits) return [];
          if (entity === Pharmacies) return [];
          return [];
        }),
      });
    });

    const error = await runWithTenant(TENANT, () =>
      svc.getById('batch-1', actor).catch((failure: unknown) => failure),
    );
    const missing = await service({
      repo: { findBatch: fn().mockResolvedValue(null) },
    })
      .svc.getById('missing', actor)
      .catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(missing).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual(
      (missing as ForbiddenException).getResponse(),
    );
  });

  it('el prestador dueño del lote (por unidad diagnóstica activa) puede leerlo', async () => {
    const { svc } = service({
      repo: { findBatch: fn().mockResolvedValue(batch) },
      linkedAccess: {
        assertInsurer: fn().mockRejectedValue(
          new ForbiddenException('No hay acceso a esa solicitud de seguro'),
        ),
      },
      emDouble: em((entity: unknown) => {
        if (entity === DiagnosticUnits)
          return [{ id: PROVIDER, tenantId: TENANT }];
        return [];
      }),
    });

    const result = await runWithTenant(TENANT, () =>
      svc.getById('batch-1', actor),
    );
    expect(result.id).toBe('batch-1');
  });
});
