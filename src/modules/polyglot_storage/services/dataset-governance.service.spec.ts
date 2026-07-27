import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DatasetGovernanceService } from './dataset-governance.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  BINDING_STATE,
  COMPATIBILITY_MODE,
  DATASET_LIFECYCLE,
  INITIAL_DATASET_VERSION,
  PLACEMENT_ROLE,
  PLACEMENT_STATE,
  POLICY_STATE,
  VERSION_STATE,
} from '../constants';

const DATASET = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const REGION = '33333333-3333-3333-3333-333333333333';
const COLLECTION = '44444444-4444-4444-4444-444444444444';
const RESIDENCY = '55555555-5555-5555-5555-555555555555';
const ENCRYPTION = '66666666-6666-6666-6666-666666666666';
const CLASSIFICATION = '77777777-7777-7777-7777-777777777777';
const TENANT = '88888888-8888-8888-8888-888888888888';
const PLACEMENT = '99999999-9999-9999-9999-999999999999';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const datasetsRepo = {
    createDataset: mockFn(() => ({ id: DATASET })),
    findDatasetById: mockFn(),
    findDatasetForUpdate: mockFn(),
    findDatasetByCode: mockFn(() => Promise.resolve(null)),
    findClassificationById: mockFn(() =>
      Promise.resolve({ id: CLASSIFICATION, containsPhi: false }),
    ),
    createDatasetVersion: mockFn(() => ({ id: VERSION })),
    findDatasetVersionById: mockFn(),
    findDatasetVersion: mockFn(() => Promise.resolve(null)),
    findActiveDatasetVersionForUpdate: mockFn(() => Promise.resolve(null)),
    findCollectionById: mockFn(() => Promise.resolve({ id: COLLECTION })),
    createAccessPolicy: mockFn(() => ({ id: 'access-1' })),
    findAccessPolicy: mockFn(() => Promise.resolve(null)),
  };
  const placementsRepo = {
    createPlacement: mockFn(() => ({ id: PLACEMENT })),
    findPlacement: mockFn(() => Promise.resolve(null)),
    findPlacementById: mockFn(),
    findPlacementForUpdate: mockFn(),
    createBinding: mockFn(() => ({ id: 'binding-1' })),
    findBinding: mockFn(() => Promise.resolve(null)),
  };
  const backendsRepo = {
    findRegionById: mockFn(() =>
      Promise.resolve({
        id: REGION,
        countryCode: 'CL',
        regionCode: 'sa-east-1',
      }),
    ),
  };
  const policiesRepo = {
    findResidencyPolicyById: mockFn(() => Promise.resolve({ id: RESIDENCY })),
    findEncryptionProfileById: mockFn(() =>
      Promise.resolve({ id: ENCRYPTION, fieldLevelEncryption: true }),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DatasetGovernanceService(
    em as any,
    datasetsRepo as any,
    placementsRepo as any,
    backendsRepo as any,
    policiesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    datasetsRepo,
    placementsRepo,
    backendsRepo,
    policiesRepo,
    logger,
  };
}

describe('DatasetGovernanceService', () => {
  describe('defineDataset (UC-54-02)', () => {
    const dto: any = {
      code: 'clinical-notes',
      name: 'Notas clínicas',
      owningModuleCode: 'clinical',
      dataClassificationId: CLASSIFICATION,
      sourceOfTruth: 'postgresql',
      schemaFingerprint: 'fp-1',
    };

    it('creates the dataset with version 1.0.0', async () => {
      const d = build();

      const res = await d.service.defineDataset(dto);

      expect(res).toEqual({
        id: DATASET,
        code: 'clinical-notes',
        lifecycleState: DATASET_LIFECYCLE.DRAFT,
        initialVersionId: VERSION,
        initialVersion: INITIAL_DATASET_VERSION,
      });
      // La primera versión no tiene con qué ser compatible.
      expect(d.datasetsRepo.createDatasetVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ compatibilityMode: COMPATIBILITY_MODE.NONE }),
      );
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.datasetsRepo.findDatasetByCode.mockResolvedValue({ id: 'other' });

      await expect(d.service.defineDataset(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('fails when the classification does not exist', async () => {
      const d = build();
      d.datasetsRepo.findClassificationById.mockResolvedValue(null);

      await expect(d.service.defineDataset(dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('publishDatasetVersion (UC-54-03)', () => {
    const dto: any = {
      version: '2.0.0',
      schemaFingerprint: 'fp-2',
      compatibilityMode: COMPATIBILITY_MODE.BACKWARD,
    };

    function wire(d: ReturnType<typeof build>) {
      d.datasetsRepo.findDatasetForUpdate.mockResolvedValue({
        id: DATASET,
        lifecycleState: DATASET_LIFECYCLE.DRAFT,
      });
    }

    it('publishes and activates the dataset', async () => {
      const d = build();
      wire(d);

      const res = await d.service.publishDatasetVersion(DATASET, dto);

      expect(res).toMatchObject({
        version: '2.0.0',
        state: VERSION_STATE.ACTIVE,
        datasetLifecycleState: DATASET_LIFECYCLE.ACTIVE,
      });
    });

    it('supersedes the previous active version', async () => {
      const d = build();
      wire(d);
      const previous: any = { id: 'version-prev', state: VERSION_STATE.ACTIVE };
      d.datasetsRepo.findActiveDatasetVersionForUpdate.mockResolvedValue(
        previous,
      );

      const res = await d.service.publishDatasetVersion(DATASET, dto);

      expect(res.supersededVersionId).toBe('version-prev');
      expect(previous.state).toBe(VERSION_STATE.SUPERSEDED);
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('refuses a successor that declares no compatibility', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findActiveDatasetVersionForUpdate.mockResolvedValue({
        id: 'version-prev',
      });

      await expect(
        d.service.publishDatasetVersion(DATASET, {
          ...dto,
          compatibilityMode: COMPATIBILITY_MODE.NONE,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a version number already published', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findDatasetVersion.mockResolvedValue({
        id: 'version-prev',
      });

      await expect(
        d.service.publishDatasetVersion(DATASET, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the dataset does not exist', async () => {
      const d = build();
      d.datasetsRepo.findDatasetForUpdate.mockResolvedValue(null);

      await expect(
        d.service.publishDatasetVersion(DATASET, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('approvePlacement (UC-54-05)', () => {
    const dto: any = {
      datasetVersionId: VERSION,
      storageBackendRegionId: REGION,
      collectionDefinitionId: COLLECTION,
      residencyPolicyId: RESIDENCY,
      encryptionProfileId: ENCRYPTION,
    };

    function wire(d: ReturnType<typeof build>) {
      d.datasetsRepo.findDatasetVersionById.mockResolvedValue({
        id: VERSION,
        state: VERSION_STATE.ACTIVE,
        datasetDefinitionId: DATASET,
      });
      d.datasetsRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        dataClassificationId: CLASSIFICATION,
      });
    }

    it('approves the placement when everything is satisfied', async () => {
      const d = build();
      wire(d);

      const res = await d.service.approvePlacement(dto);

      expect(res).toEqual({
        id: PLACEMENT,
        state: PLACEMENT_STATE.APPROVED,
        placementRole: PLACEMENT_ROLE.PRIMARY,
        duplicate: false,
      });
    });

    it('refuses a country explicitly forbidden by the residency policy', async () => {
      const d = build();
      wire(d);
      d.policiesRepo.findResidencyPolicyById.mockResolvedValue({
        id: RESIDENCY,
        forbiddenCountryCodes: ['CL'],
        allowedCountryCodes: ['CL'],
      });

      // Prohibido gana sobre permitido.
      await expect(d.service.approvePlacement(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('refuses a country outside the allowed list', async () => {
      const d = build();
      wire(d);
      d.policiesRepo.findResidencyPolicyById.mockResolvedValue({
        id: RESIDENCY,
        allowedCountryCodes: ['AR'],
      });

      await expect(d.service.approvePlacement(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('refuses a region outside the allowed regions', async () => {
      const d = build();
      wire(d);
      d.policiesRepo.findResidencyPolicyById.mockResolvedValue({
        id: RESIDENCY,
        allowedRegionCodes: ['us-east-1'],
      });

      await expect(d.service.approvePlacement(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('refuses patient data without field-level encryption', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findClassificationById.mockResolvedValue({
        id: CLASSIFICATION,
        containsPhi: true,
      });
      d.policiesRepo.findEncryptionProfileById.mockResolvedValue({
        id: ENCRYPTION,
        fieldLevelEncryption: false,
      });

      await expect(d.service.approvePlacement(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('accepts patient data with field-level encryption', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findClassificationById.mockResolvedValue({
        id: CLASSIFICATION,
        containsPhi: true,
      });

      const res = await d.service.approvePlacement(dto);

      expect(res.state).toBe(PLACEMENT_STATE.APPROVED);
    });

    it('refuses a dataset version that is not active', async () => {
      const d = build();
      wire(d);
      d.datasetsRepo.findDatasetVersionById.mockResolvedValue({
        id: VERSION,
        state: VERSION_STATE.DRAFT,
      });

      await expect(d.service.approvePlacement(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('does not approve the same placement twice', async () => {
      const d = build();
      wire(d);
      d.placementsRepo.findPlacement.mockResolvedValue({
        id: 'placement-prev',
        state: PLACEMENT_STATE.APPROVED,
      });

      const res = await d.service.approvePlacement(dto);

      expect(res).toMatchObject({ id: 'placement-prev', duplicate: true });
      expect(d.placementsRepo.createPlacement).not.toHaveBeenCalled();
    });
  });

  describe('defineAccessPolicy (UC-54-07)', () => {
    const dto: any = {
      purposeOfUseCode: 'TREATMENT',
      principalType: 'CLINICIAN',
    };

    it('defines the policy', async () => {
      const d = build();
      d.datasetsRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        lifecycleState: DATASET_LIFECYCLE.ACTIVE,
      });

      const res = await d.service.defineAccessPolicy(DATASET, dto);

      expect(res).toEqual({
        id: 'access-1',
        datasetDefinitionId: DATASET,
        state: POLICY_STATE.ACTIVE,
      });
    });

    it('rejects a duplicate purpose and principal type', async () => {
      const d = build();
      d.datasetsRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        lifecycleState: DATASET_LIFECYCLE.ACTIVE,
      });
      d.datasetsRepo.findAccessPolicy.mockResolvedValue({ id: 'access-prev' });

      await expect(
        d.service.defineAccessPolicy(DATASET, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a dataset that is not active', async () => {
      const d = build();
      d.datasetsRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        lifecycleState: DATASET_LIFECYCLE.DRAFT,
      });

      await expect(
        d.service.defineAccessPolicy(DATASET, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('bindTenantStorage (UC-54-08)', () => {
    const dto: any = {
      datasetDefinitionId: DATASET,
      primaryPlacementId: PLACEMENT,
    };

    it('binds the tenant and activates the placement', async () => {
      const d = build();
      const placement: any = { id: PLACEMENT, state: PLACEMENT_STATE.APPROVED };
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue(placement);

      const res = await d.service.bindTenantStorage(TENANT, dto);

      expect(res).toEqual({
        id: 'binding-1',
        tenantId: TENANT,
        state: BINDING_STATE.ACTIVE,
        primaryPlacementState: PLACEMENT_STATE.ACTIVATED,
      });
      expect(placement.state).toBe(PLACEMENT_STATE.ACTIVATED);
    });

    it('refuses a placement that is not approved', async () => {
      const d = build();
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue({
        id: PLACEMENT,
        state: PLACEMENT_STATE.QUARANTINED,
      });

      await expect(
        d.service.bindTenantStorage(TENANT, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a secondary placement equal to the primary', async () => {
      const d = build();
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue({
        id: PLACEMENT,
        state: PLACEMENT_STATE.APPROVED,
      });
      d.placementsRepo.findPlacementById.mockResolvedValue({ id: PLACEMENT });

      await expect(
        d.service.bindTenantStorage(TENANT, {
          ...dto,
          secondaryPlacementId: PLACEMENT,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a second binding of the same tenant and dataset', async () => {
      const d = build();
      d.placementsRepo.findBinding.mockResolvedValue({ id: 'binding-prev' });

      await expect(
        d.service.bindTenantStorage(TENANT, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the primary placement does not exist', async () => {
      const d = build();
      d.placementsRepo.findPlacementForUpdate.mockResolvedValue(null);

      await expect(
        d.service.bindTenantStorage(TENANT, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
