import { describe, expect, it, jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { PRAC } from '../practice.concepts';
import { ClinicalUnitsAdminService } from './clinical-units-admin.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-a';
const actor = { id: 'o1', roles: ['USER'] } as any;

function build() {
  const units: any[] = [
    { id: 'u1', practiceSiteId: 's1', tenantId: TENANT, code: 'DIR', name: 'Dirección', statusConceptId: PRAC.UNIT_ACTIVE, rowVersion: 2 },
    { id: 'u2', practiceSiteId: 's1', tenantId: TENANT, parentUnitId: 'u1', code: 'LAB', name: 'Laboratorio', statusConceptId: PRAC.UNIT_ACTIVE, rowVersion: 1 },
  ];
  const spaces: any[] = [];
  const staff: any[] = [];
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn(async () => staff),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)), find: tx.find };
  const access = {
    requireUnit: mockFn(async (_t: any, id: string, tenant: string) => {
      const u = units.find((x) => x.id === id);
      if (!u || u.tenantId !== tenant) throw new ResourceNotFoundException('Unidad clínica no encontrada');
      return u;
    }),
    requireSite: mockFn(async () => ({ id: 's1', tenantId: TENANT })),
    assertCanWriteSite: mockFn().mockResolvedValue(undefined),
    assertCanRead: mockFn().mockResolvedValue(undefined),
  };
  const unitsRepo = { findBySite: mockFn(async () => units) };
  const spacesRepo = { findBySite: mockFn(async () => spaces) };
  const assignmentsRepo = { findCurrentByUnit: mockFn().mockResolvedValue([]) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const service = new ClinicalUnitsAdminService(em, access as any, unitsRepo as any, spacesRepo as any, assignmentsRepo as any, historyRepo as any, outbox as any);
  return { service, units, spaces, staff, historyRepo, outbox, tx };
}

describe('ClinicalUnitsAdminService', () => {
  it('unidad de otro tenant: 404 en ficha y escritura', async () => {
    const d = build();
    await expect(d.service.detail('u1', actor, 'tenant-b')).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(d.service.update('u1', { name: 'x' }, '2', actor, 'tenant-b')).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('PATCH exige If-Match', async () => {
    const d = build();
    await expect(d.service.update('u1', { name: 'x' }, undefined, actor, TENANT)).rejects.toMatchObject({ reason: 'IF_MATCH_REQUIRED' });
  });

  it('PATCH: padre que cierra ciclo → 422 UNIT_CYCLE', async () => {
    const d = build();
    await expect(d.service.update('u1', { parentUnitId: 'u2' }, '2', actor, TENANT)).rejects.toMatchObject({ reason: 'UNIT_CYCLE' });
  });

  it('PATCH: código de una unidad activa es inmutable', async () => {
    const d = build();
    await expect(d.service.update('u1', { code: 'OTRO' }, '2', actor, TENANT)).rejects.toMatchObject({ reason: 'SPACE_IMMUTABLE_FIELD' });
  });

  it('PATCH permitido: versiona con tenant y publica', async () => {
    const d = build();
    const res = await d.service.update('u2', { name: 'Laboratorio clínico' }, '1', actor, TENANT);
    expect(res.name).toBe('Laboratorio clínico');
    expect(d.historyRepo.append).toHaveBeenCalledWith(d.tx, 'clinical_units', 'u2', expect.objectContaining({ tenantId: TENANT }));
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(d.tx, expect.objectContaining({ eventType: 'practice.clinical_unit.updated' }));
  });

  it('retirar con hijas, espacios y personal: 409 UNIT_RETIRE_BLOCKED', async () => {
    const d = build();
    d.spaces.push({ id: 'c1', clinicalUnitId: 'u1', statusConceptId: PRAC.SPACE_ACTIVE });
    d.staff.push({ id: 'r1' });
    const err: any = await d.service.changeLifecycle('u1', { action: 'retire', reason: 'cierre' }, '2', actor, TENANT).catch((e) => e);
    expect(err.reason).toBe('UNIT_RETIRE_BLOCKED');
    expect(err.details.blockers.map((b: any) => b.kind)).toEqual(['ACTIVE_CHILD_UNITS', 'ACTIVE_SPACES', 'ACTIVE_STAFF']);
  });

  it('retirar una hoja sin bloqueos: RETIRED con vigencia cerrada', async () => {
    const d = build();
    const res = await d.service.changeLifecycle('u2', { action: 'retire', reason: 'fusión' }, '1', actor, TENANT);
    expect(res.status?.code).toBe('UNIT_RETIRED');
    expect(res.validTo).toBeInstanceOf(Date);
  });

  it('suspender con hijas activas: 409 UNIT_SUSPEND_BLOCKED', async () => {
    const d = build();
    await expect(d.service.changeLifecycle('u1', { action: 'suspend', reason: 'x' }, '2', actor, TENANT)).rejects.toMatchObject({ reason: 'UNIT_SUSPEND_BLOCKED' });
  });
});
