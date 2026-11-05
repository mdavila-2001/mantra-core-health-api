import { jest } from '@jest/globals';
import { ParseUUIDPipe, RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { AUDITED_KEY } from '../../../../common/audit-trail';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { PharmacySiteAvailabilityController } from './pharmacy-site-availability.controller';

const handler = Object.getOwnPropertyDescriptor(
  PharmacySiteAvailabilityController.prototype,
  'setSiteAvailability',
)!.value as object;

describe('PharmacySiteAvailabilityController', () => {
  it('hangs the PUT from /pharmacies with the route of the contract', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, PharmacySiteAvailabilityController),
    ).toBe('pharmacies');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      ':pharmacyId/sites/:siteId/products/:productId/availability',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.PUT,
    );
  });

  it('is open to the pharmacy staff and the platform only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'SECURITY_ADMIN',
      'PHARMACY_STAFF',
    ]);
  });

  it('parses the three ids as UUIDs', () => {
    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      PharmacySiteAvailabilityController,
      'setSiteAvailability',
    ) as Record<string, { data?: string; pipes?: unknown[] }>;
    const params = Object.values(args).filter((arg) =>
      ['pharmacyId', 'siteId', 'productId'].includes(arg.data ?? ''),
    );
    expect(params).toHaveLength(3);
    for (const param of params) {
      expect(param.pipes).toContain(ParseUUIDPipe);
    }
  });

  it('passes the body as is to the use case', async () => {
    const response = {
      siteId: 's',
      productId: 'p',
      available: true,
      quantity: 2,
      stockUpdatedAt: '2026-10-30T00:00:00.000Z',
    };
    const useCase = { execute: jest.fn(async () => response) };
    const controller = new PharmacySiteAvailabilityController(
      useCase as any,
      {} as any,
    );
    const body = { available: true, quantity: 2 };
    const actor = { id: 'user-1' } as any;
    await expect(
      controller.setSiteAvailability('f', 's', 'p', body, actor),
    ).resolves.toBe(response);
    expect(useCase.execute).toHaveBeenCalledWith(
      { pharmacyId: 'f', siteId: 's', productId: 'p' },
      body,
      actor,
    );
  });

  it('loads a whole site with the bulk contract, audited apart from its preview', async () => {
    const bulk = Object.getOwnPropertyDescriptor(
      PharmacySiteAvailabilityController.prototype,
      'bulkSiteAvailability',
    )!.value as object;
    expect(Reflect.getMetadata(PATH_METADATA, bulk)).toBe(
      ':pharmacyId/sites/:siteId/availability/bulk',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, bulk)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(ROLES_KEY, bulk)).toEqual([
      'SECURITY_ADMIN',
      'PHARMACY_STAFF',
    ]);
    expect(Reflect.getMetadata(AUDITED_KEY, bulk)).toMatchObject({
      action: 'PHARMACY_SITE_AVAILABILITY_BULK_LOADED',
      dryRunAction: 'PHARMACY_SITE_AVAILABILITY_BULK_PREVIEWED',
    });
    const useCase = {
      execute: jest.fn(async () => ({ dryRun: true, results: [] })),
    };
    const controller = new PharmacySiteAvailabilityController(
      {} as any,
      useCase as any,
    );
    const body = { mode: 'UPSERT' as const, dryRun: true, rows: [{}] };
    const actor = { id: 'user-1' } as any;
    await controller.bulkSiteAvailability('f', 's', body, actor);
    expect(useCase.execute).toHaveBeenCalledWith(
      { pharmacyId: 'f', siteId: 's' },
      body,
      actor,
    );
  });
});
