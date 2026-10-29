import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  runWithTenant,
} from '../../../../common';
import { RowVersionMismatchException } from '../../../practice/http/row-version';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason as R } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { CreateInventoryLocationUseCase } from './create-inventory-location.use-case';
import { RelocateInventoryLocationUseCase } from './relocate-inventory-location.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'user-1', roles: [] } as any;
const TENANT = 'tenant-1';

function buildCreate(taken: unknown[] = []) {
  const tx = { flush: mockFn(), execute: mockFn(async () => taken) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const created: any = { id: 'loc-1', rowVersion: 1 };
  const locations = { create: mockFn(() => created) };
  const access = {
    practiceSiteOf: mockFn(async () => 'practice-site-1'),
    assertCanManage: mockFn(async () => undefined),
    resolve: mockFn(
      async (_tx: unknown, _t: string, _s: string, input: any) => ({
        careSpaceId: input.careSpaceId ?? null,
        clinicalUnitId: input.clinicalUnitId ?? null,
      }),
    ),
  };
  const events = { located: mockFn(async () => undefined) };
  const useCase = new CreateInventoryLocationUseCase(
    em as any,
    locations as any,
    allowAllScope(),
    { info: mockFn() } as any,
    access as any,
    events as any,
  );
  return { useCase, tx, locations, access, events };
}

const run = <T>(work: () => T): T => runWithTenant(TENANT, work);

describe('CreateInventoryLocationUseCase · F5c', () => {
  it('autoriza contra la sede de práctica de la farmacia antes de resolver espacio o unidad', async () => {
    const d = buildCreate();
    await run(() =>
      d.useCase.execute(
        'site-1',
        { code: 'D1', name: 'Depósito', careSpaceId: 'space-1' } as any,
        actor,
      ),
    );
    const order = [
      d.access.assertCanManage.mock.invocationCallOrder[0],
      d.access.resolve.mock.invocationCallOrder[0],
    ];
    expect(order[0]).toBeLessThan(order[1]);
    expect(d.access.assertCanManage).toHaveBeenCalledWith(
      d.tx,
      actor,
      TENANT,
      'practice-site-1',
    );
  });

  it('un depósito en un espacio queda ligado y publica located', async () => {
    const d = buildCreate();
    const res = await run(() =>
      d.useCase.execute(
        'site-1',
        { code: 'D1', name: 'Depósito', careSpaceId: 'space-1' } as any,
        actor,
      ),
    );
    expect(d.locations.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        careSpaceId: 'space-1',
        locationTypeConceptId: PINV.LOCATION_TYPE_SHELF,
      }),
    );
    expect(d.events.located).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        locationId: 'loc-1',
        careSpaceId: 'space-1',
        practiceSiteId: 'practice-site-1',
      }),
    );
    expect(res).toMatchObject({ id: 'loc-1', careSpaceId: 'space-1' });
  });

  it('el botiquín exige la unidad (422 WARD_STOCK_UNIT_REQUIRED) y no escribe', async () => {
    const d = buildCreate();
    await expect(
      run(() =>
        d.useCase.execute(
          'site-1',
          {
            code: 'B1',
            name: 'Botiquín',
            locationTypeCode: 'WARD_STOCK',
          } as any,
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ reason: R.WARD_STOCK_UNIT_REQUIRED }),
    });
    expect(d.locations.create).not.toHaveBeenCalled();
  });

  it('un segundo botiquín vigente en la unidad: 409 WARD_STOCK_ALREADY_EXISTS', async () => {
    const d = buildCreate([{ id: 'otro' }]);
    const failure = await run(() =>
      d.useCase.execute(
        'site-1',
        {
          code: 'B2',
          name: 'Botiquín 2',
          locationTypeCode: 'WARD_STOCK',
          clinicalUnitId: 'unit-1',
        } as any,
        actor,
      ),
    ).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ConflictException);
    expect((failure as any).response.reason).toBe(R.WARD_STOCK_ALREADY_EXISTS);
    expect(d.locations.create).not.toHaveBeenCalled();
  });

  it('el botiquín se crea con el tipo WARD_STOCK y la unidad', async () => {
    const d = buildCreate([]);
    await run(() =>
      d.useCase.execute(
        'site-1',
        {
          code: 'B1',
          name: 'Botiquín',
          locationTypeCode: 'WARD_STOCK',
          clinicalUnitId: 'unit-1',
          careSpaceId: 'space-1',
        } as any,
        actor,
      ),
    );
    expect(d.locations.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        locationTypeConceptId: PINV.LOCATION_TYPE_WARD_STOCK,
        clinicalUnitId: 'unit-1',
        careSpaceId: 'space-1',
      }),
    );
  });

  it('si la estructura niega la autoridad no se resuelve ni se escribe nada', async () => {
    const d = buildCreate();
    d.access.assertCanManage.mockRejectedValue(new Error('denegado'));
    await expect(
      run(() =>
        d.useCase.execute('site-1', { code: 'x', name: 'y' } as any, actor),
      ),
    ).rejects.toThrow('denegado');
    expect(d.access.resolve).not.toHaveBeenCalled();
    expect(d.locations.create).not.toHaveBeenCalled();
  });
});

function buildRelocate(location: any) {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const locations = { findById: mockFn(async () => location) };
  const access = {
    practiceSiteOf: mockFn(async () => 'practice-site-1'),
    assertCanManage: mockFn(async () => undefined),
    resolve: mockFn(
      async (_tx: unknown, _t: string, _s: string, input: any) => ({
        careSpaceId: input.careSpaceId,
        clinicalUnitId: input.clinicalUnitId ?? null,
      }),
    ),
  };
  const events = { relocated: mockFn(async () => undefined) };
  const scope = allowAllScope();
  const useCase = new RelocateInventoryLocationUseCase(
    em as any,
    locations as any,
    scope,
    { info: mockFn() } as any,
    access as any,
    events as any,
  );
  return { useCase, tx, locations, access, events, scope };
}

const activeLocation = () => ({
  id: 'loc-1',
  pharmacySiteId: 'site-1',
  statusConceptId: PINV.LOCATION_ACTIVE,
  locationTypeConceptId: PINV.LOCATION_TYPE_WARD_STOCK,
  careSpaceId: 'old-space',
  clinicalUnitId: 'unit-1',
  rowVersion: 3,
  updatedAt: new Date(),
});

describe('RelocateInventoryLocationUseCase', () => {
  it('cambia sólo el espacio, publica relocated y no toca el ledger', async () => {
    const location = activeLocation();
    const d = buildRelocate(location);
    const res = await run(() =>
      d.useCase.execute('loc-1', { careSpaceId: 'new-space' }, 3, actor),
    );
    expect(location.careSpaceId).toBe('new-space');
    expect(d.access.resolve).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      'practice-site-1',
      { careSpaceId: 'new-space', clinicalUnitId: 'unit-1' },
    );
    expect(d.events.relocated).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        fromCareSpaceId: 'old-space',
        toCareSpaceId: 'new-space',
        locationType: 'WARD_STOCK',
      }),
    );
    expect(res).toMatchObject({ id: 'loc-1', careSpaceId: 'new-space' });
  });

  it('el mismo espacio no publica nada (idempotente)', async () => {
    const d = buildRelocate(activeLocation());
    await run(() =>
      d.useCase.execute('loc-1', { careSpaceId: 'old-space' }, 3, actor),
    );
    expect(d.events.relocated).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('If-Match viejo: 412 y no escribe', async () => {
    const location = activeLocation();
    const d = buildRelocate(location);
    await expect(
      run(() => d.useCase.execute('loc-1', { careSpaceId: 'new' }, 2, actor)),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
    expect(location.careSpaceId).toBe('old-space');
  });

  it('una ubicación que no está vigente no se reubica (422)', async () => {
    const d = buildRelocate({
      ...activeLocation(),
      statusConceptId: 'cerrada',
    });
    await expect(
      run(() => d.useCase.execute('loc-1', { careSpaceId: 'new' }, 3, actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('una ubicación inexistente o de otro tenant responde el 404 del módulo', async () => {
    const d = buildRelocate(null);
    await expect(
      run(() => d.useCase.execute('loc-x', { careSpaceId: 'new' }, 1, actor)),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.access.assertCanManage).not.toHaveBeenCalled();
  });

  it('la autoridad se decide antes de leer el estado o la versión de la ubicación', async () => {
    const d = buildRelocate(activeLocation());
    d.access.assertCanManage.mockRejectedValue(new Error('denegado'));
    await expect(
      run(() => d.useCase.execute('loc-1', { careSpaceId: 'new' }, 99, actor)),
    ).rejects.toThrow('denegado');
  });
});
