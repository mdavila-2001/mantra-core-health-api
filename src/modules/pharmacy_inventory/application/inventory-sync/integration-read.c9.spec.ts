import { jest } from '@jest/globals';
import { IntegrationReadService } from './integration-read.service';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';

it('usa el catálogo ERP de la farmacia aunque el proveedor global no esté configurado', async () => {
  const external = {
    isConfigured: jest.fn(() => false),
    listProducts: jest.fn(async () => []),
  };
  const catalog = {
    isConfigured: () => true,
    listProducts: jest.fn(async () => [
      { code: 'ERP-1', name: 'Producto sintético' },
    ]),
  };
  const reads = {
    findConnections: jest.fn(async () => [
      {
        id: 'link',
        pharmacySiteId: null,
        supportsStockQuery: true,
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        createdAt: new Date(),
      },
    ]),
    findSites: jest.fn(async () => []),
    findConnection: jest.fn(async () => ({
      id: 'link',
      pharmacyId: 'pharmacy',
    })),
    findMappings: jest.fn(async () => []),
  };
  const erp = {
    view: jest.fn(async () => ({
      integrationConnectionId: 'link',
      mode: 'CONNECTED',
      encryptionConfigured: true,
    })),
    catalogForConnection: jest.fn(async () => ({ catalog, siteCodes: {} })),
  };
  const service = new IntegrationReadService(
    { fork: () => ({}) } as never,
    allowAllScope(),
    reads as never,
    external as never,
    { serverConfigured: () => false, describe: async () => new Map() } as never,
    erp as never,
  );
  const actor = { id: 'synthetic-user' } as never;
  expect(
    (await service.connections('pharmacy', actor)).items[0].providerConfigured,
  ).toBe(true);
  expect(
    (
      await service.externalProducts(
        { pharmacyId: 'pharmacy', connectionId: 'link' },
        actor,
      )
    ).items[0].code,
  ).toBe('ERP-1');
  expect(external.listProducts).not.toHaveBeenCalled();
});
