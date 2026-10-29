import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../../common';
import { runWithTenant } from '../../../../../common/tenant/tenant-context';
import { PRAC } from '../../../../practice/practice.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  RESOURCE_LINKED_TO_SPACE_EVENT,
  SpaceResourceLinker,
} from './space-resource-linker';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const SPACE = '22222222-2222-4222-8222-222222222222';
const SITE = '33333333-3333-4333-8333-333333333333';
const PRACTICE = '44444444-4444-4444-8444-444444444444';
const actor = { id: 'user-1', roles: [] } as any;

const dto = (over: Record<string, unknown> = {}): any => ({
  tenantId: TENANT,
  resourceType: 'ROOM',
  resourceRefType: 'care_spaces',
  resourceRefId: SPACE,
  name: 'Quirófano 1',
  ...over,
});

function room(over: { fn?: string; status?: string } = {}): any {
  return {
    space: {
      id: SPACE,
      spaceTypeConceptId:
        PRAC[(over.fn ?? 'SPACE_FN_OPERATING_ROOM') as keyof typeof PRAC],
      statusConceptId: over.status ?? PRAC.SPACE_ACTIVE,
    },
    site: { id: SITE, practiceId: PRACTICE },
  };
}

function build(loaded: unknown = room()) {
  const tx = { findOne: mockFn().mockResolvedValue(null) };
  const access = {
    loadRoom: mockFn().mockResolvedValue(loaded),
    assertCan: mockFn().mockResolvedValue(undefined),
  };
  const catalogRepo = {
    createResource: mockFn().mockReturnValue({ id: 'res-1' }),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const linker = new SpaceResourceLinker(
    access as any,
    catalogRepo as any,
    outbox as any,
  );
  const run = (body: any) =>
    runWithTenant(TENANT, () => linker.link(tx as any, body, actor));
  return { run, tx, access, catalogRepo, outbox };
}

describe('SpaceResourceLinker (R0 · F4)', () => {
  it('liga el recurso al quirófano activo: FK real, tipo canónico y evento en la misma transacción', async () => {
    const d = build();
    const res = await d.run(dto());

    expect(res).toEqual({
      id: 'res-1',
      name: 'Quirófano 1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(d.access.assertCan).toHaveBeenCalledWith(
      d.tx,
      actor,
      'OR_RESOURCE_LINK',
      expect.objectContaining({ site: expect.anything() }),
    );
    expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        practiceId: PRACTICE,
        resourceRefType: 'care_spaces',
        resourceRefId: SPACE,
        careSpaceId: SPACE,
      }),
    );
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: RESOURCE_LINKED_TO_SPACE_EVENT,
        aggregateId: 'res-1',
        tenantId: TENANT,
      }),
    );
  });

  it('un espacio que no es quirófano pide la acción de estructura, no la del jefe de quirófano', async () => {
    const d = build(room({ fn: 'SPACE_FN_CONSULTING_ROOM' }));
    await d.run(dto());
    expect(d.access.assertCan).toHaveBeenCalledWith(
      d.tx,
      actor,
      'SPACE_RESOURCE_LINK',
      expect.anything(),
    );
  });

  it('un espacio de otro tenant o inexistente responde el mismo 404 y no escribe nada', async () => {
    const d = build(null);
    await expect(d.run(dto())).rejects.toMatchObject({
      reason: SchedulingErrorReason.SPACE_NOT_FOUND,
    });
    await expect(d.run(dto())).rejects.toMatchObject({ status: 404 });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
  });

  it('un tenant del cuerpo distinto al del contexto es un 404, sin tocar la base', async () => {
    const d = build();
    await expect(
      d.run(dto({ tenantId: '99999999-9999-4999-8999-999999999999' })),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.access.loadRoom).not.toHaveBeenCalled();
  });

  it('sólo un recurso ROOM puede apuntar a un espacio', async () => {
    const d = build();
    await expect(
      d.run(dto({ resourceType: 'EQUIPMENT' })),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.SPACE_RESOURCE_MUST_BE_ROOM,
    });
  });

  it('si la política deniega, se propaga el error de acceso y no se escribe', async () => {
    const d = build();
    d.access.assertCan.mockRejectedValue(
      Object.assign(new Error('403'), { status: 403 }),
    );
    await expect(d.run(dto())).rejects.toMatchObject({ status: 403 });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('un espacio cuya función no admite agenda (sala de espera) responde 422 SPACE_NOT_SCHEDULABLE', async () => {
    const d = build(room({ fn: 'SPACE_FN_WAITING' }));
    await expect(d.run(dto())).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.SPACE_NOT_SCHEDULABLE,
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('un espacio que no está activo responde 422 SPACE_NOT_ACTIVE', async () => {
    const d = build(room({ status: PRAC.SPACE_SUSPENDED }));
    await expect(d.run(dto())).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.SPACE_NOT_ACTIVE,
    });
  });

  it('un segundo recurso activo para el mismo espacio responde 409 RESOURCE_ALREADY_EXISTS_FOR_SPACE', async () => {
    const d = build();
    d.tx.findOne.mockResolvedValue({ id: 'res-previo' });
    await expect(d.run(dto())).rejects.toMatchObject({
      status: 409,
      reason: SchedulingErrorReason.RESOURCE_ALREADY_EXISTS_FOR_SPACE,
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });
});
