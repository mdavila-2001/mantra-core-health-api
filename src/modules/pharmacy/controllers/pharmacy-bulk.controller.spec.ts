import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AUDITED_KEY } from '../../../common/audit-trail';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { BulkRequestDto } from '../dto';
import { PharmacyBulkController } from './pharmacy-bulk.controller';
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';

const ROUTES = {
  bulkCategories: ':pharmacyId/categories/bulk',
  bulkProducts: ':pharmacyId/products/bulk',
  bulkPrices: ':pharmacyId/prices/bulk',
  bulkSites: ':pharmacyId/sites/bulk',
} as const;

function handlerOf(name: keyof typeof ROUTES): object {
  return Object.getOwnPropertyDescriptor(
    PharmacyBulkController.prototype,
    name,
  )!.value as object;
}

async function errorsFor(body: Record<string, unknown>) {
  return validate(plainToInstance(BulkRequestDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('PharmacyBulkController', () => {
  it('has the four POST …/bulk routes under /pharmacies', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PharmacyBulkController)).toBe(
      'pharmacies',
    );
    for (const [name, path] of Object.entries(ROUTES)) {
      const handler = handlerOf(name as keyof typeof ROUTES);
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
        RequestMethod.POST,
      );
    }
  });

  it('is for the platform and the staff of that pharmacy, behind the scope guard', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PharmacyBulkController)).toEqual([
      'SECURITY_ADMIN',
      'PHARMACY_STAFF',
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PharmacyBulkController),
    ).toEqual([PharmacyTenantScopeGuard]);
  });

  it('a preview is audited as a preview, not as the load it simulates', () => {
    for (const name of Object.keys(ROUTES)) {
      const audited = Reflect.getMetadata(
        AUDITED_KEY,
        handlerOf(name as keyof typeof ROUTES),
      ) as { action: string; dryRunAction?: string };
      expect(audited.action).toMatch(/^PHARMACY_[A-Z]+_BULK_LOADED$/);
      expect(audited.dryRunAction).toBe(
        audited.action.replace('_LOADED', '_PREVIEWED'),
      );
    }
  });

  it('each route runs the common service with its own table handler', async () => {
    const bulk = { run: jest.fn(async () => ({ dryRun: false, results: [] })) };
    const handlers = { categories: {}, products: {}, prices: {}, sites: {} };
    const controller = new PharmacyBulkController(
      bulk as any,
      handlers.categories as any,
      handlers.products as any,
      handlers.prices as any,
      handlers.sites as any,
    );
    const body = { mode: 'UPSERT' as const, rows: [{ name: 'x' }] };
    const actor = { id: 'user-1' } as any;
    await controller.bulkCategories('f', body, actor);
    await controller.bulkProducts('f', body, actor);
    await controller.bulkPrices('f', body, actor);
    await controller.bulkSites('f', body, actor);
    expect(
      bulk.run.mock.calls.map((call: any[]) => [call[0], call[3]]),
    ).toEqual([
      ['categories', handlers.categories],
      ['products', handlers.products],
      ['prices', handlers.prices],
      ['sites', handlers.sites],
    ]);
  });

  it('accepts between 1 and 1000 rows: 0 and 1001 are a 400', async () => {
    const row = { name: 'x' };
    expect(await errorsFor({ mode: 'UPSERT', rows: [row] })).toHaveLength(0);
    expect(
      await errorsFor({
        mode: 'UPSERT',
        rows: Array.from({ length: 1000 }, () => row),
      }),
    ).toHaveLength(0);
    expect(await errorsFor({ mode: 'UPSERT', rows: [] })).not.toHaveLength(0);
    expect(
      await errorsFor({
        mode: 'UPSERT',
        rows: Array.from({ length: 1001 }, () => row),
      }),
    ).not.toHaveLength(0);
  });

  it('rejects an unknown mode, but not the content of a row', async () => {
    expect(
      await errorsFor({ mode: 'DELETE', rows: [{ name: 'x' }] }),
    ).not.toHaveLength(0);
    expect(
      await errorsFor({
        mode: 'CREATE',
        dryRun: true,
        rows: [{ whatever: 1, name: '' }],
      }),
    ).toHaveLength(0);
  });

  it('dryRun is a strict boolean or absent: 0, "", null, strings, [] and {} are a 400 through the global pipe', async () => {
    const pipe = createGlobalValidationPipe();
    const send = (extra: Record<string, unknown>) =>
      pipe.transform(
        { mode: 'UPSERT', rows: [{ name: 'x' }], ...extra },
        { type: 'body', metatype: BulkRequestDto },
      ) as Promise<BulkRequestDto>;
    for (const bad of [0, 1, null, 'true', 'false', '0', '1', '', [], {}]) {
      await expect(send({ dryRun: bad })).rejects.toMatchObject({
        status: 400,
      });
    }
    await expect(send({ dryRun: true })).resolves.toMatchObject({
      dryRun: true,
    });
    await expect(send({ dryRun: false })).resolves.toMatchObject({
      dryRun: false,
    });
    const absent = await send({});
    expect(absent.dryRun).toBeUndefined();
  });

  it('the global validation pipe lets the rows through as plain objects', async () => {
    const pipe = createGlobalValidationPipe();
    const body = (await pipe.transform(
      {
        mode: 'UPSERT',
        dryRun: true,
        rows: [
          { name: 'Vitaminas', extra: 1 },
          { productCode: 'P1', unitPrice: '3' },
        ],
      },
      { type: 'body', metatype: BulkRequestDto },
    )) as BulkRequestDto;
    expect(body.rows).toEqual([
      { name: 'Vitaminas', extra: 1 },
      { productCode: 'P1', unitPrice: '3' },
    ]);
    expect(Array.isArray(body.rows[0])).toBe(false);
  });
});
