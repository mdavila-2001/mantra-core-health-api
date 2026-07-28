import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageGovernanceService } from './storage-governance.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  BACKEND_STATE,
  CAPABILITY_VERIFICATION,
  COLLECTION_LIFECYCLE,
  DATASET_LIFECYCLE,
  POLICY_STATE,
} from '../constants';

const BACKEND = '11111111-1111-1111-1111-111111111111';
const DATASET = '22222222-2222-2222-2222-222222222222';
const VERSION = '33333333-3333-3333-3333-333333333333';
const COLLECTION = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  let regionSeq = 0;
  const backendsRepo = {
    createBackend: mockFn(() => ({ id: BACKEND })),
    findBackendById: mockFn(() => Promise.resolve({ id: BACKEND })),
    findBackendByCode: mockFn(() => Promise.resolve(null)),
    createRegion: mockFn(() => ({ id: `region-${++regionSeq}` })),
    createCapability: mockFn(() => ({ id: 'capability-1' })),
  };
  const datasetsRepo = {
    findDatasetById: mockFn(),
    findDatasetVersionById: mockFn(),
    createCollection: mockFn(() => ({ id: COLLECTION })),
    findCollectionByName: mockFn(() => Promise.resolve(null)),
    createSchemaVersion: mockFn(() => ({ id: 'schema-1' })),
  };
  const policiesRepo = {
    createConsistencyPolicy: mockFn(() => ({ id: 'consistency-1' })),
    findConsistencyPolicyByCode: mockFn(() => Promise.resolve(null)),
    createResidencyPolicy: mockFn(() => ({ id: 'residency-1' })),
    findResidencyPolicyByCode: mockFn(() => Promise.resolve(null)),
    createReplicationPolicy: mockFn(() => ({ id: 'replication-1' })),
    findReplicationPolicyByCode: mockFn(() => Promise.resolve(null)),
    createRetentionPolicy: mockFn(() => ({ id: 'retention-1' })),
    findRetentionPolicyByCode: mockFn(() => Promise.resolve(null)),
    createRotationPolicy: mockFn(() => ({ id: 'rotation-1' })),
    findRotationPolicyByCode: mockFn(() => Promise.resolve(null)),
    createEncryptionProfile: mockFn(() => ({ id: 'encryption-1' })),
    findEncryptionProfileByCode: mockFn(() => Promise.resolve(null)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new StorageGovernanceService(
    em as any,
    backendsRepo as any,
    datasetsRepo as any,
    policiesRepo as any,
    logger as any,
  );
  return { service, tx, backendsRepo, datasetsRepo, policiesRepo, logger };
}

describe('StorageGovernanceService', () => {
  describe('registerBackend (UC-54-01)', () => {
    const dto: any = {
      code: 'mongo-main',
      name: 'MongoDB principal',
      backendType: 'document',
      providerCode: 'atlas',
      regions: [
        { regionCode: 'sa-east-1', countryCode: 'CL', isPrimary: true },
      ],
    };

    it('registers the backend as registered, not active', async () => {
      const d = build();

      const res = await d.service.registerBackend(dto);

      expect(res).toMatchObject({
        id: BACKEND,
        code: 'mongo-main',
        state: BACKEND_STATE.REGISTERED,
        capabilityCount: 0,
      });
      expect(res.regionIds).toHaveLength(1);
    });

    it('registers capabilities as pending verification', async () => {
      const d = build();

      const res = await d.service.registerBackend({
        ...dto,
        capabilities: [
          { capabilityCode: 'vector-search', capabilityVersion: '1' },
        ],
      });

      expect(res.capabilityCount).toBe(1);
      expect(d.backendsRepo.createCapability).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          verificationStatus: CAPABILITY_VERIFICATION.PENDING,
        }),
      );
    });

    it('refuses two primary regions', async () => {
      const d = build();

      await expect(
        d.service.registerBackend({
          ...dto,
          regions: [
            { regionCode: 'sa-east-1', countryCode: 'CL', isPrimary: true },
            { regionCode: 'us-east-1', countryCode: 'US', isPrimary: true },
          ],
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a repeated region code', async () => {
      const d = build();

      await expect(
        d.service.registerBackend({
          ...dto,
          regions: [
            { regionCode: 'sa-east-1', countryCode: 'CL' },
            { regionCode: 'sa-east-1', countryCode: 'AR' },
          ],
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate backend code', async () => {
      const d = build();
      d.backendsRepo.findBackendByCode.mockResolvedValue({ id: 'other' });

      await expect(d.service.registerBackend(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('defineCollection (UC-54-04)', () => {
    const dto: any = {
      storageBackendId: BACKEND,
      datasetDefinitionId: DATASET,
      logicalName: 'clinical-notes',
      datasetVersionId: VERSION,
      schemaVersion: '1',
      validationMode: 'STRICT',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param lifecycleState - Valor de lifecycle state requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      lifecycleState = DATASET_LIFECYCLE.ACTIVE,
    ) {
      d.datasetsRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        lifecycleState,
      });
      d.datasetsRepo.findDatasetVersionById.mockResolvedValue({
        id: VERSION,
        datasetDefinitionId: DATASET,
      });
    }

    it('defines the collection with its schema version', async () => {
      const d = build();
      wire(d);

      const res = await d.service.defineCollection(dto);

      expect(res).toEqual({
        id: COLLECTION,
        logicalName: 'clinical-notes',
        lifecycleState: COLLECTION_LIFECYCLE.DRAFT,
        schemaVersionId: 'schema-1',
      });
    });

    it('refuses a dataset that is still a draft', async () => {
      const d = build();
      wire(d, DATASET_LIFECYCLE.DRAFT);

      await expect(d.service.defineCollection(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('refuses a version that belongs to another dataset', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findDatasetVersionById.mockResolvedValue({
        id: VERSION,
        datasetDefinitionId: 'otro-dataset',
      });

      await expect(d.service.defineCollection(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('rejects a logical name already used in the backend', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findCollectionByName.mockResolvedValue({
        id: 'collection-prev',
      });

      await expect(d.service.defineCollection(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('fails when the dataset does not exist', async () => {
      const d = build();
      d.datasetsRepo.findDatasetById.mockResolvedValue(null);

      await expect(d.service.defineCollection(dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('defineConsistencyPolicy (UC-54-06)', () => {
    const dto: any = {
      code: 'strong-read',
      readConsistency: 'STRONG',
      writeConsistency: 'MAJORITY',
    };

    it('defines the policy as active', async () => {
      const d = build();

      const res = await d.service.defineConsistencyPolicy(dto);

      expect(res).toEqual({
        id: 'consistency-1',
        code: 'strong-read',
        state: POLICY_STATE.ACTIVE,
      });
    });

    it('refuses read-your-writes with a non-zero stale tolerance', async () => {
      const d = build();

      await expect(
        d.service.defineConsistencyPolicy({
          ...dto,
          requiresReadYourWrites: true,
          staleReadToleranceSeconds: 5,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts read-your-writes with zero tolerance', async () => {
      const d = build();

      const res = await d.service.defineConsistencyPolicy({
        ...dto,
        requiresReadYourWrites: true,
        staleReadToleranceSeconds: 0,
      });

      expect(res.id).toBe('consistency-1');
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.policiesRepo.findConsistencyPolicyByCode.mockResolvedValue({
        id: 'other',
      });

      await expect(
        d.service.defineConsistencyPolicy(dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('defineEncryptionProfile (UC-54-09)', () => {
    const dto: any = {
      code: 'phi-field',
      algorithm: 'AES256-GCM',
      keyManagementProvider: 'kms',
      keyReference: 'arn:kms:key/1',
    };

    it('defines the profile without a rotation policy', async () => {
      const d = build();

      const res = await d.service.defineEncryptionProfile(dto);

      expect(res).toMatchObject({ id: 'encryption-1', code: 'phi-field' });
      expect(res.rotationPolicyId).toBeUndefined();
    });

    it('creates the rotation policy when it is new', async () => {
      const d = build();

      const res = await d.service.defineEncryptionProfile({
        ...dto,
        rotationPolicy: { code: 'yearly', rotationIntervalDays: 365 },
      });

      expect(res.rotationPolicyId).toBe('rotation-1');
      expect(d.policiesRepo.createRotationPolicy).toHaveBeenCalled();
    });

    it('reuses a rotation policy that already exists', async () => {
      const d = build();
      d.policiesRepo.findRotationPolicyByCode.mockResolvedValue({
        id: 'rotation-prev',
      });

      const res = await d.service.defineEncryptionProfile({
        ...dto,
        rotationPolicy: { code: 'yearly', rotationIntervalDays: 365 },
      });

      expect(res.rotationPolicyId).toBe('rotation-prev');
      expect(d.policiesRepo.createRotationPolicy).not.toHaveBeenCalled();
    });

    it('rejects a duplicate profile code', async () => {
      const d = build();
      d.policiesRepo.findEncryptionProfileByCode.mockResolvedValue({
        id: 'other',
      });

      await expect(
        d.service.defineEncryptionProfile(dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('defineStoragePolicies (UC-54-10)', () => {
    it('creates the three policies at once', async () => {
      const d = build();

      const res = await d.service.defineStoragePolicies({
        residency: { code: 'cl-only', allowedCountryCodes: ['CL'] },
        replication: {
          code: 'triple',
          replicaCount: 3,
          replicationMode: 'SYNC',
          failoverMode: 'AUTOMATIC',
        },
        retention: {
          code: 'ten-years',
          retentionDays: 3650,
          deletionMode: 'SOFT',
        },
      });

      expect(res).toMatchObject({
        residencyPolicyId: 'residency-1',
        replicationPolicyId: 'replication-1',
        retentionPolicyId: 'retention-1',
        created: 3,
      });
    });

    it('creates only what is declared', async () => {
      const d = build();

      const res = await d.service.defineStoragePolicies({
        retention: {
          code: 'ten-years',
          retentionDays: 3650,
          deletionMode: 'SOFT',
        },
      });

      expect(res).toMatchObject({
        created: 1,
        retentionPolicyId: 'retention-1',
      });
      expect(res.residencyPolicyId).toBeUndefined();
    });

    it('refuses a call that declares nothing', async () => {
      const d = build();

      await expect(
        d.service.defineStoragePolicies({} as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses forbidding cross-region replication without declaring allowed countries', async () => {
      const d = build();

      await expect(
        d.service.defineStoragePolicies({
          residency: { code: 'open', allowedCountryCodes: [] },
          replication: {
            code: 'local',
            replicaCount: 2,
            replicationMode: 'SYNC',
            failoverMode: 'MANUAL',
            crossRegionEnabled: false,
          },
        } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate residency code', async () => {
      const d = build();
      d.policiesRepo.findResidencyPolicyByCode.mockResolvedValue({
        id: 'other',
      });

      await expect(
        d.service.defineStoragePolicies({
          residency: { code: 'cl-only', allowedCountryCodes: ['CL'] },
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
