import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageOperationsService } from './storage-operations.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  FAILOVER_MODE,
  HEALTH_STATUS,
  PLACEMENT_STATE,
  POLICY_STATE,
} from '../constants';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const REGION = '11111111-1111-1111-1111-111111111111';
const PLACEMENT = '22222222-2222-2222-2222-222222222222';
const SECONDARY = '33333333-3333-3333-3333-333333333333';
const DATASET = '44444444-4444-4444-4444-444444444444';

function past(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const backendsRepo = {
    findRegionForUpdate: mockFn(() => Promise.resolve({ id: REGION })),
    findRegionById: mockFn(() => Promise.resolve({ id: REGION })),
    createHealthCheck: mockFn(() => ({ id: 'check-1' })),
  };
  const placementsRepo = {
    findPlacementsByRegionForUpdate: mockFn(() => Promise.resolve([])),
    findPlacementForUpdate: mockFn(),
    findBindingsByPrimaryForUpdate: mockFn(() => Promise.resolve([])),
    findCostSnapshotForUpdate: mockFn(() => Promise.resolve(null)),
    createCostSnapshot: mockFn(() => ({ id: 'snapshot-1' })),
    findIntegrityPolicyForUpdate: mockFn(() => Promise.resolve(null)),
    findIntegrityPolicy: mockFn(),
    createIntegrityPolicy: mockFn(() => ({ id: 'policy-1' })),
  };
  const policiesRepo = { findReplicationPolicyById: mockFn() };
  const datasetsRepo = {
    findDatasetById: mockFn(() => Promise.resolve({ id: DATASET })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new StorageOperationsService(
    em as any,
    backendsRepo as any,
    placementsRepo as any,
    policiesRepo as any,
    datasetsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    backendsRepo,
    placementsRepo,
    policiesRepo,
    datasetsRepo,
    logger,
  };
}

describe('StorageOperationsService', () => {
  describe('recordHealthCheck (UC-54-11)', () => {
    const dto: any = {
      storageBackendRegionId: REGION,
      checkType: 'ping',
      status: HEALTH_STATUS.HEALTHY,
    };

    it('records a healthy check without touching placements', async () => {
      const d = build();

      const res = await d.service.recordHealthCheck(dto);

      expect(res).toEqual({
        id: 'check-1',
        status: HEALTH_STATUS.HEALTHY,
        degradedPlacements: 0,
        swappedBindings: 0,
      });
      expect(
        d.placementsRepo.findPlacementsByRegionForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('degrades placements and swaps bindings on automatic failover', async () => {
      const d = build();
      const placement: any = {
        id: PLACEMENT,
        state: PLACEMENT_STATE.ACTIVATED,
        replicationPolicyId: 'rp-1',
      };
      const binding: any = {
        primaryPlacementId: PLACEMENT,
        secondaryPlacementId: SECONDARY,
      };
      d.placementsRepo.findPlacementsByRegionForUpdate.mockResolvedValue([
        placement,
      ]);
      d.policiesRepo.findReplicationPolicyById.mockResolvedValue({
        failoverMode: FAILOVER_MODE.AUTOMATIC,
      });
      d.placementsRepo.findBindingsByPrimaryForUpdate.mockResolvedValue([
        binding,
      ]);

      const res = await d.service.recordHealthCheck({
        ...dto,
        status: HEALTH_STATUS.UNHEALTHY,
      });

      expect(res).toMatchObject({ degradedPlacements: 1, swappedBindings: 1 });
      expect(placement.state).toBe(PLACEMENT_STATE.DEGRADED);
      expect(binding.primaryPlacementId).toBe(SECONDARY);
      expect(binding.secondaryPlacementId).toBe(PLACEMENT);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not fail over when the policy is manual', async () => {
      const d = build();
      const placement: any = {
        id: PLACEMENT,
        state: PLACEMENT_STATE.ACTIVATED,
        replicationPolicyId: 'rp-1',
      };
      d.placementsRepo.findPlacementsByRegionForUpdate.mockResolvedValue([
        placement,
      ]);
      d.policiesRepo.findReplicationPolicyById.mockResolvedValue({
        failoverMode: FAILOVER_MODE.MANUAL,
      });

      const res = await d.service.recordHealthCheck({
        ...dto,
        status: HEALTH_STATUS.UNHEALTHY,
      });

      expect(res.degradedPlacements).toBe(0);
      expect(placement.state).toBe(PLACEMENT_STATE.ACTIVATED);
    });

    it('leaves a binding without a secondary as it is', async () => {
      const d = build();
      const placement: any = {
        id: PLACEMENT,
        state: PLACEMENT_STATE.ACTIVATED,
        replicationPolicyId: 'rp-1',
      };
      const binding: any = { primaryPlacementId: PLACEMENT };
      d.placementsRepo.findPlacementsByRegionForUpdate.mockResolvedValue([
        placement,
      ]);
      d.policiesRepo.findReplicationPolicyById.mockResolvedValue({
        failoverMode: FAILOVER_MODE.AUTOMATIC,
      });
      d.placementsRepo.findBindingsByPrimaryForUpdate.mockResolvedValue([
        binding,
      ]);

      const res = await d.service.recordHealthCheck({
        ...dto,
        status: HEALTH_STATUS.UNHEALTHY,
      });

      // Dejarlo sin primario sería peor que dejarlo en algo degradado.
      expect(res.swappedBindings).toBe(0);
      expect(binding.primaryPlacementId).toBe(PLACEMENT);
    });

    it('fails when the region does not exist', async () => {
      const d = build();
      d.backendsRepo.findRegionForUpdate.mockResolvedValue(null);

      await expect(d.service.recordHealthCheck(dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('failoverPlacement (UC-54-11)', () => {
    const dto: any = { reason: 'mantenimiento no planificado de la región' };

    it('degrades the placement and swaps its bindings', async () => {
      const d = build();
      const placement: any = {
        id: PLACEMENT,
        state: PLACEMENT_STATE.ACTIVATED,
      };
      const binding: any = {
        primaryPlacementId: PLACEMENT,
        secondaryPlacementId: SECONDARY,
      };
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue(placement);
      d.placementsRepo.findBindingsByPrimaryForUpdate.mockResolvedValue([
        binding,
      ]);

      const res = await d.service.failoverPlacement(PLACEMENT, dto, actor);

      expect(res).toEqual({
        placementId: PLACEMENT,
        state: PLACEMENT_STATE.DEGRADED,
        swappedBindings: 1,
      });
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses failing over a placement that is not serving traffic', async () => {
      const d = build();
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue({
        id: PLACEMENT,
        state: PLACEMENT_STATE.QUARANTINED,
      });

      await expect(
        d.service.failoverPlacement(PLACEMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the placement does not exist', async () => {
      const d = build();
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue(null);

      await expect(
        d.service.failoverPlacement(PLACEMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('consolidateCostSnapshot (UC-54-12)', () => {
    const dto: any = {
      storageBackendRegionId: REGION,
      periodStart: past(60),
      periodEnd: past(30),
      storageBytes: '1000',
      readUnits: '10',
      writeUnits: '5',
      egressBytes: '20',
      estimatedCost: '123.450000',
      currencyCode: 'USD',
    };

    it('creates the snapshot for a closed period', async () => {
      const d = build();

      const res = await d.service.consolidateCostSnapshot(dto);

      expect(res).toEqual({
        id: 'snapshot-1',
        estimatedCost: '123.450000',
        updated: false,
      });
    });

    it('updates instead of duplicating when the period was already consolidated', async () => {
      const d = build();
      const existing: any = { id: 'snapshot-prev' };
      d.placementsRepo.findCostSnapshotForUpdate.mockResolvedValue(existing);

      const res = await d.service.consolidateCostSnapshot(dto);

      expect(res).toMatchObject({ id: 'snapshot-prev', updated: true });
      expect(existing.estimatedCost).toBe('123.450000');
      expect(d.placementsRepo.createCostSnapshot).not.toHaveBeenCalled();
    });

    it('rejects an inverted period', async () => {
      const d = build();

      await expect(
        d.service.consolidateCostSnapshot({
          ...dto,
          periodStart: past(10),
          periodEnd: past(40),
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a period that has not closed yet', async () => {
      const d = build();

      await expect(
        d.service.consolidateCostSnapshot({
          ...dto,
          periodEnd: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the region does not exist', async () => {
      const d = build();
      d.backendsRepo.findRegionById.mockResolvedValue(null);

      await expect(
        d.service.consolidateCostSnapshot(dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('defineIntegrityPolicy (UC-54-13)', () => {
    const dto: any = {
      datasetDefinitionId: DATASET,
      hashAlgorithm: 'SHA256',
      verificationIntervalHours: 24,
      samplePercentage: '10.00',
    };

    it('creates the policy', async () => {
      const d = build();

      const res = await d.service.defineIntegrityPolicy(dto);

      expect(res).toMatchObject({
        id: 'policy-1',
        state: POLICY_STATE.ACTIVE,
        updated: false,
      });
    });

    it('updates the policy that already exists', async () => {
      const d = build();
      const existing: any = { id: 'policy-prev' };
      d.placementsRepo.findIntegrityPolicyForUpdate.mockResolvedValue(existing);

      const res = await d.service.defineIntegrityPolicy(dto);

      expect(res).toMatchObject({ id: 'policy-prev', updated: true });
      expect(existing.hashAlgorithm).toBe('SHA256');
      expect(d.placementsRepo.createIntegrityPolicy).not.toHaveBeenCalled();
    });

    it('rejects a sample percentage out of range', async () => {
      const d = build();

      await expect(
        d.service.defineIntegrityPolicy({ ...dto, samplePercentage: '150' }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the dataset does not exist', async () => {
      const d = build();
      d.datasetsRepo.findDatasetById.mockResolvedValue(null);

      await expect(d.service.defineIntegrityPolicy(dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('verifyIntegrity (UC-54-13)', () => {
    const dto: any = {
      placementId: PLACEMENT,
      canonicalHash: 'abc123',
      projectionHash: 'abc123',
    };

    function wire(d: ReturnType<typeof build>, quarantineOnMismatch = true) {
      d.placementsRepo.findIntegrityPolicy.mockResolvedValue({
        id: 'policy-1',
        quarantineOnMismatch,
      });
      const placement: any = {
        id: PLACEMENT,
        state: PLACEMENT_STATE.ACTIVATED,
      };
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue(placement);
      return placement;
    }

    it('passes when the hashes match', async () => {
      const d = build();
      const placement = wire(d);

      const res = await d.service.verifyIntegrity(DATASET, dto);

      expect(res).toMatchObject({ matched: true, quarantined: false });
      expect(placement.state).toBe(PLACEMENT_STATE.ACTIVATED);
    });

    it('quarantines the placement when the hashes diverge', async () => {
      const d = build();
      const placement = wire(d);

      const res = await d.service.verifyIntegrity(DATASET, {
        ...dto,
        projectionHash: 'otro',
      });

      expect(res).toMatchObject({ matched: false, quarantined: true });
      expect(placement.state).toBe(PLACEMENT_STATE.QUARANTINED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('reports the mismatch without quarantining when the policy says so', async () => {
      const d = build();
      const placement = wire(d, false);

      const res = await d.service.verifyIntegrity(DATASET, {
        ...dto,
        projectionHash: 'otro',
      });

      expect(res).toMatchObject({ matched: false, quarantined: false });
      expect(placement.state).toBe(PLACEMENT_STATE.ACTIVATED);
    });

    it('compares hashes case-insensitively', async () => {
      const d = build();
      wire(d);

      const res = await d.service.verifyIntegrity(DATASET, {
        ...dto,
        projectionHash: 'ABC123',
      });

      expect(res.matched).toBe(true);
    });

    it('fails when the dataset has no integrity policy', async () => {
      const d = build();
      d.placementsRepo.findIntegrityPolicy.mockResolvedValue(null);

      await expect(
        d.service.verifyIntegrity(DATASET, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
