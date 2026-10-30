import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { PharmacyIntegrationSyncController } from './pharmacy-integration-sync.controller';

const ROUTES: Record<string, [RequestMethod, string]> = {
  syncNow: [
    RequestMethod.POST,
    ':pharmacyId/integration-connections/:connectionId/sync',
  ],
  listConnections: [RequestMethod.GET, ':pharmacyId/integration-connections'],
  listMappings: [
    RequestMethod.GET,
    ':pharmacyId/integration-connections/:connectionId/product-mappings',
  ],
  listExternalProducts: [
    RequestMethod.GET,
    ':pharmacyId/integration-connections/:connectionId/external-products',
  ],
  listSyncBatches: [
    RequestMethod.GET,
    ':pharmacyId/integration-connections/:connectionId/sync-batches',
  ],
};

describe('PharmacyIntegrationSyncController', () => {
  it('has the five routes under /pharmacies', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, PharmacyIntegrationSyncController),
    ).toBe('pharmacies');
    for (const [name, [method, path]] of Object.entries(ROUTES)) {
      const handler = Object.getOwnPropertyDescriptor(
        PharmacyIntegrationSyncController.prototype,
        name,
      )!.value as object;
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method);
    }
  });

  it('is for the platform and the pharmacy staff', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, PharmacyIntegrationSyncController),
    ).toEqual(['SECURITY_ADMIN', 'PHARMACY_STAFF']);
  });

  it('sync answers exactly the keys of the contract', async () => {
    const result = {
      batchId: 'b',
      received: 12,
      mapped: 2,
      unmapped: [],
      applied: 2,
    };
    const sync = { execute: jest.fn(async () => result) };
    const controller = new PharmacyIntegrationSyncController(
      sync as any,
      {} as any,
    );
    const response = await controller.syncNow('f', 'c', { id: 'u' } as any);
    expect(Object.keys(response).sort()).toEqual([
      'applied',
      'batchId',
      'mapped',
      'received',
      'unmapped',
    ]);
    expect(sync.execute).toHaveBeenCalledWith(
      { pharmacyId: 'f', connectionId: 'c' },
      { id: 'u' },
    );
  });

  it('the reads go to the read service with the connection of the route', async () => {
    const reads = {
      connections: jest.fn(async () => ({})),
      mappings: jest.fn(async () => ({})),
      externalProducts: jest.fn(async () => ({})),
      syncBatches: jest.fn(async () => ({})),
    };
    const controller = new PharmacyIntegrationSyncController(
      {} as any,
      reads as any,
    );
    const actor = { id: 'u' } as any;
    await controller.listConnections('f', actor);
    await controller.listMappings('f', 'c', actor);
    await controller.listExternalProducts('f', 'c', actor);
    await controller.listSyncBatches('f', 'c', 5, actor);
    expect(reads.connections).toHaveBeenCalledWith('f', actor);
    expect(reads.mappings).toHaveBeenCalledWith(
      { pharmacyId: 'f', connectionId: 'c' },
      actor,
    );
    expect(reads.externalProducts).toHaveBeenCalledWith(
      { pharmacyId: 'f', connectionId: 'c' },
      actor,
    );
    expect(reads.syncBatches).toHaveBeenCalledWith(
      { pharmacyId: 'f', connectionId: 'c' },
      5,
      actor,
    );
  });
});
