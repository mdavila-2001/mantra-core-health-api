import { describe, it, expect, jest } from '@jest/globals';
// Loose alias: avoids the `never` that @jest/globals infers for jest.fn() in ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { DeclaredBranchesService } from './declared-branches.service';
import { TenantOpeningHoursRepository } from '../repositories/tenant-opening-hours.repository';
import { TenantOpeningHours } from '../entities';

function build() {
  let next = 0;
  const order: string[] = [];
  const branchesRepo = {
    create: fn((_tx: unknown, data: { code: string }) => {
      order.push(`branch:${data.code}`);
      next += 1;
      return { id: `branch-${next}` };
    }),
  };
  const tx = {
    flush: fn(async () => {
      order.push('flush');
    }),
    create: fn((_entity: unknown, data: Record<string, unknown>) => {
      order.push(`shift:${String(data.branchId ?? 'hq')}`);
      return data;
    }),
  };
  const service = new DeclaredBranchesService(
    branchesRepo as never,
    new TenantOpeningHoursRepository(),
  );
  return { service, branchesRepo, tx, order };
}

describe('DeclaredBranchesService', () => {
  it('crea cada sucursal y, después de volcarlas, sus turnos con su branchId', async () => {
    const d = build();

    await d.service.register(d.tx as never, {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      branches: [
        { name: 'Casa central' },
        {
          name: 'Sucursal Norte',
          openingHours: [
            { dayOfWeek: 1, opensAt: '14:30', closesAt: '19:00' },
            { dayOfWeek: 1, opensAt: '08:00', closesAt: '12:00' },
          ],
        },
      ],
    });

    expect(d.order).toEqual([
      'branch:CASA-CENTRAL',
      'branch:SUCURSAL-NORTE',
      'flush',
      'shift:branch-2',
      'shift:branch-2',
    ]);
    const shifts = d.tx.create.mock.calls.map(
      ([entity, data]: [unknown, Record<string, unknown>]) => ({
        entity,
        data,
      }),
    );
    expect(shifts[0].entity).toBe(TenantOpeningHours);
    // The ordinal follows the opening time, not the order they came in.
    expect(
      shifts.map(({ data }: any) => [data.opensAt, data.shiftOrdinal]),
    ).toEqual([
      ['08:00', 1],
      ['14:30', 2],
    ]);
    expect(shifts[0].data).toMatchObject({
      tenantId: 'tenant-1',
      branchId: 'branch-2',
      dayOfWeek: 1,
      createdByUserId: 'user-1',
    });
  });

  it('sin turnos no vuelca: el alta sigue como antes', async () => {
    const d = build();

    await d.service.register(d.tx as never, {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      branches: [{ name: 'Norte' }, { name: 'Norte' }],
    });

    expect(d.tx.flush).not.toHaveBeenCalled();
    // Same name twice: the code does not repeat within one sign-up.
    expect(d.order).toEqual(['branch:NORTE', 'branch:NORTE-2']);
  });

  it('registra los turnos de la casa central sin sede', () => {
    const d = build();

    d.service.recordShifts(d.tx as never, { tenantId: 'tenant-1' }, [
      { dayOfWeek: 7, opensAt: '00:00', closesAt: '24:00' },
    ]);

    expect(d.tx.create).toHaveBeenCalledWith(
      TenantOpeningHours,
      expect.objectContaining({
        tenantId: 'tenant-1',
        branchId: undefined,
        medicalFacilitySiteId: undefined,
        shiftOrdinal: 1,
        closesAt: '24:00',
      }),
      { partial: true },
    );
  });
});
