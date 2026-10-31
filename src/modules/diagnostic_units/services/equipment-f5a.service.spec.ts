import { describe, expect, it, jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { EquipmentF5aService } from './equipment-f5a.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const T1 = '11111111-1111-4111-8111-111111111111';
const home = {
  practice_site_id: 'site-1',
  tenant_id: T1,
  practice_id: 'p-1',
  unit_name: 'Imagen',
  time_zone: null,
};

function build(equipment: Record<string, unknown>) {
  const tx = { execute: mockFn().mockResolvedValue([home]) };
  const access = {
    assertCan: mockFn().mockResolvedValue({}),
    assertSiteLevel: mockFn().mockResolvedValue({}),
  };
  const scope = { equipment: mockFn().mockResolvedValue(equipment) };
  const svc = new EquipmentF5aService(
    {} as any,
    scope as any,
    access as any,
    {} as any,
  );
  return { svc, tx, access };
}
const actor = { id: 'u-1', roles: [] } as any;

describe('EquipmentF5aService · alcance de un equipo puntual (revisión F5a)', () => {
  it('equipo ubicado: se autoriza sobre SU sala, nunca sobre la sede con expansión parcial', async () => {
    const { svc, tx, access } = build({ id: 'e1', careSpaceId: 'room-1' });
    await runWithTenant(T1, () =>
      svc.authorize(tx as any, 'e1', actor, 'f5a.equipment.read'),
    );
    expect(access.assertCan).toHaveBeenCalledWith(
      actor,
      'f5a.equipment.read',
      { careSpaceId: 'room-1' },
      tx,
      T1,
    );
    expect(access.assertSiteLevel).not.toHaveBeenCalled();
  });

  it('equipo sin sala: sólo roles de nivel sede (fail-closed para UNIT/SPACE)', async () => {
    const { svc, tx, access } = build({ id: 'e1' });
    await runWithTenant(T1, () =>
      svc.authorize(tx as any, 'e1', actor, 'f5a.equipment.write'),
    );
    expect(access.assertSiteLevel).toHaveBeenCalledWith(
      actor,
      'f5a.equipment.write',
      'site-1',
      tx,
      T1,
    );
    expect(access.assertCan).not.toHaveBeenCalled();
  });

  it('un rechazo del evaluador se propaga (403) y no se devuelve el equipo', async () => {
    const { svc, tx, access } = build({ id: 'e1', careSpaceId: 'room-1' });
    access.assertCan.mockRejectedValue(
      Object.assign(new Error('x'), { getStatus: () => 403 }),
    );
    await expect(
      runWithTenant(T1, () =>
        svc.authorize(tx as any, 'e1', actor, 'f5a.equipment.read'),
      ),
    ).rejects.toThrow('x');
  });

  it('mover a otra sala exige el permiso de escritura sobre el destino', async () => {
    const { svc, tx, access } = build({ id: 'e1' });
    await runWithTenant(T1, () =>
      svc.authorizeDestination(tx as any, actor, 'room-2', 'site-1'),
    );
    expect(access.assertCan).toHaveBeenCalledWith(
      actor,
      'f5a.equipment.write',
      { careSpaceId: 'room-2' },
      tx,
      T1,
    );
  });

  it('desubicar (destino null) exige nivel sede, no alcanza el permiso de la sala', async () => {
    const { svc, tx, access } = build({ id: 'e1', careSpaceId: 'room-1' });
    await runWithTenant(T1, () =>
      svc.authorizeDestination(tx as any, actor, null, 'site-1'),
    );
    expect(access.assertSiteLevel).toHaveBeenCalledWith(
      actor,
      'f5a.equipment.write',
      'site-1',
      tx,
      T1,
    );
    expect(access.assertCan).not.toHaveBeenCalled();
    access.assertSiteLevel.mockRejectedValue(new Error('403'));
    await expect(
      runWithTenant(T1, () =>
        svc.authorizeDestination(tx as any, actor, null, 'site-1'),
      ),
    ).rejects.toThrow('403');
  });
});
