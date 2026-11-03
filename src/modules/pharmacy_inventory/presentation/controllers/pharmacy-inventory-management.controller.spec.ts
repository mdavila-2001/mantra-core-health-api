import { jest } from '@jest/globals';
import { ParseUUIDPipe, RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { PharmacyInventoryManagementController } from './pharmacy-inventory-management.controller';

const proto = PharmacyInventoryManagementController.prototype;
const handler = (name: string): object =>
  Object.getOwnPropertyDescriptor(proto, name)!.value as object;

describe('PharmacyInventoryManagementController', () => {
  it('opens the whole class to the pharmacy staff and the platform only', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, PharmacyInventoryManagementController),
    ).toEqual(['SECURITY_ADMIN', 'PHARMACY_STAFF']);
  });

  it.each([
    ['locations', ':pharmacyId/inventory/locations'],
    ['positions', ':pharmacyId/inventory/positions'],
    ['ledger', ':pharmacyId/inventory/ledger'],
    ['lots', ':pharmacyId/inventory/lots'],
  ])('serves %s as a GET of %s under /pharmacy', (name, path) => {
    expect(
      Reflect.getMetadata(PATH_METADATA, PharmacyInventoryManagementController),
    ).toBe('pharmacy');
    expect(Reflect.getMetadata(PATH_METADATA, handler(name))).toBe(path);
    expect(Reflect.getMetadata(METHOD_METADATA, handler(name))).toBe(
      RequestMethod.GET,
    );
  });

  it.each(['locations', 'positions', 'ledger', 'lots'])(
    'parses the pharmacy id of %s as a UUID',
    (name) => {
      const args = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        PharmacyInventoryManagementController,
        name,
      ) as Record<string, { data?: string; pipes?: unknown[] }>;
      const pharmacy = Object.values(args).find(
        (arg) => arg.data === 'pharmacyId',
      );
      expect(pharmacy?.pipes).toContain(ParseUUIDPipe);
    },
  );

  it('hands the route, the query and the actor to the use case as they come', async () => {
    const response = { items: [] };
    const reads = {
      locations: jest.fn(async () => response),
      positions: jest.fn(async () => response),
      ledger: jest.fn(async () => response),
      lots: jest.fn(async () => response),
    };
    const controller = new PharmacyInventoryManagementController(reads as any);
    const actor = { id: 'user-1' } as any;
    const query = { page: 1, pageSize: 20 } as any;

    await expect(controller.locations('f', query, actor)).resolves.toBe(
      response,
    );
    await controller.positions('f', query, actor);
    await controller.ledger('f', query, actor);
    await controller.lots('f', query, actor);

    for (const read of Object.values(reads)) {
      expect(read).toHaveBeenCalledWith('f', query, actor);
    }
  });
});
