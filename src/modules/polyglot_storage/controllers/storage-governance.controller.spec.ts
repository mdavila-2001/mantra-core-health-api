import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageGovernanceController } from './storage-governance.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const governanceService = {
    registerBackend: mockFn(),
    defineCollection: mockFn(),
    defineConsistencyPolicy: mockFn(),
    defineEncryptionProfile: mockFn(),
    defineStoragePolicies: mockFn(),
  };
  const datasetService = {
    defineDataset: mockFn(),
    publishDatasetVersion: mockFn(),
    approvePlacement: mockFn(),
    defineAccessPolicy: mockFn(),
    bindTenantStorage: mockFn(),
  };
  const operationsService = { failoverPlacement: mockFn() };
  return {
    controller: new StorageGovernanceController(
      governanceService as any,
      datasetService as any,
      operationsService as any,
    ),
    governanceService,
    datasetService,
    operationsService,
  };
}

describe('StorageGovernanceController', () => {
  it('delegates registering the backend (UC-54-01)', async () => {
    const d = build();
    const dto = { code: 'mongo-main' } as any;
    d.governanceService.registerBackend.mockResolvedValue({ id: ID });

    await d.controller.registerBackend(dto);

    expect(d.governanceService.registerBackend).toHaveBeenCalledWith(dto);
  });

  it('delegates defining the dataset (UC-54-02)', async () => {
    const d = build();
    const dto = { code: 'clinical-notes' } as any;
    d.datasetService.defineDataset.mockResolvedValue({ id: ID });

    await d.controller.defineDataset(dto);

    expect(d.datasetService.defineDataset).toHaveBeenCalledWith(dto);
  });

  it('delegates publishing the version with the route id (UC-54-03)', async () => {
    const d = build();
    const dto = { version: '2.0.0' } as any;
    d.datasetService.publishDatasetVersion.mockResolvedValue({ id: ID });

    await d.controller.publishDatasetVersion(ID, dto);

    expect(d.datasetService.publishDatasetVersion).toHaveBeenCalledWith(
      ID,
      dto,
    );
  });

  it('delegates defining the collection (UC-54-04)', async () => {
    const d = build();
    const dto = { logicalName: 'notes' } as any;
    d.governanceService.defineCollection.mockResolvedValue({ id: ID });

    await d.controller.defineCollection(dto);

    expect(d.governanceService.defineCollection).toHaveBeenCalledWith(dto);
  });

  it('delegates approving the placement (UC-54-05)', async () => {
    const d = build();
    const dto = { datasetVersionId: ID } as any;
    d.datasetService.approvePlacement.mockResolvedValue({ id: ID });

    await d.controller.approvePlacement(dto);

    expect(d.datasetService.approvePlacement).toHaveBeenCalledWith(dto);
  });

  it('delegates the consistency policy (UC-54-06)', async () => {
    const d = build();
    const dto = { code: 'strong-read' } as any;
    d.governanceService.defineConsistencyPolicy.mockResolvedValue({ id: ID });

    await d.controller.defineConsistencyPolicy(dto);

    expect(d.governanceService.defineConsistencyPolicy).toHaveBeenCalledWith(
      dto,
    );
  });

  it('delegates the access policy with the dataset id (UC-54-07)', async () => {
    const d = build();
    const dto = { purposeOfUseCode: 'TREATMENT' } as any;
    d.datasetService.defineAccessPolicy.mockResolvedValue({ id: ID });

    await d.controller.defineAccessPolicy(ID, dto);

    expect(d.datasetService.defineAccessPolicy).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the tenant binding with the tenant id (UC-54-08)', async () => {
    const d = build();
    const dto = { datasetDefinitionId: ID } as any;
    d.datasetService.bindTenantStorage.mockResolvedValue({ id: ID });

    await d.controller.bindTenantStorage(ID, dto);

    expect(d.datasetService.bindTenantStorage).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the encryption profile (UC-54-09)', async () => {
    const d = build();
    const dto = { code: 'phi-field' } as any;
    d.governanceService.defineEncryptionProfile.mockResolvedValue({ id: ID });

    await d.controller.defineEncryptionProfile(dto);

    expect(d.governanceService.defineEncryptionProfile).toHaveBeenCalledWith(
      dto,
    );
  });

  it('delegates the three storage policies (UC-54-10)', async () => {
    const d = build();
    const dto = { retention: { code: 'ten-years' } } as any;
    d.governanceService.defineStoragePolicies.mockResolvedValue({ created: 1 });

    await d.controller.defineStoragePolicies(dto);

    expect(d.governanceService.defineStoragePolicies).toHaveBeenCalledWith(dto);
  });

  it('delegates the manual failover (UC-54-11)', async () => {
    const d = build();
    const dto = { reason: 'mantenimiento' } as any;
    d.operationsService.failoverPlacement.mockResolvedValue({
      placementId: ID,
    });

    await d.controller.failoverPlacement(ID, dto, actor);

    expect(d.operationsService.failoverPlacement).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
