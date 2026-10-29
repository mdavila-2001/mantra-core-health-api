import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { runWithTenant } from '../../../../common/tenant/tenant-context';
import { SchedulingErrorReason } from '../../scheduling.error-reasons';
import { DiagnosticEquipmentResourceLinkerAdapter } from './diagnostic-equipment-resource-linker.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const EQ = '22222222-2222-4222-8222-222222222222';
const SPACE = '33333333-3333-4333-8333-333333333333';
const coord = { id: 'u1', roles: ['SCHEDULING_ADMIN'] } as any;
const other = { id: 'u2', roles: [] } as any;

const equipmentRow = (over: Record<string, unknown> = {}) => ({
  id: EQ,
  tenant_id: TENANT,
  care_space_id: SPACE,
  practice_site_id: 'site-1',
  practice_id: 'practice-1',
  schedulable_resource_id: null,
  operational_status_concept_id: 'op',
  label: 'Siemens Somatom',
  ...over,
});

function build(
  opts: { equipment?: Record<string, unknown> | null; active?: boolean } = {},
) {
  const infra = { assertCan: mockFn().mockResolvedValue(undefined) };
  const catalogRepo = {
    createResource: mockFn().mockReturnValue({ id: 'res-1' }),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn(async (sql: string) => {
      if (sql.includes('from diagnostic_units.diagnostic_equipment e')) {
        return opts.equipment === null ? [] : [equipmentRow(opts.equipment)];
      }
      if (sql.includes('from scheduling.schedulable_resources')) {
        return opts.active ? [{ id: 'res-previo' }] : [];
      }
      return [];
    }),
  };
  const linker = new DiagnosticEquipmentResourceLinkerAdapter(
    infra as any,
    catalogRepo as any,
    outbox as any,
  );
  const run = (actor = coord, input = {}) =>
    runWithTenant(TENANT, () => linker.link(tx as any, EQ, input, actor));
  return { linker, infra, catalogRepo, outbox, tx, run };
}

describe('EquipmentResourceLinker', () => {
  it('crea el recurso EQUIPMENT atado al equipo, con el tenant del contexto y la práctica de su sede', async () => {
    const d = build();
    const res = await d.run();
    expect(res).toEqual({
      id: 'res-1',
      name: 'Siemens Somatom',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        practiceId: 'practice-1',
        resourceRefType: 'diagnostic_equipment',
        resourceRefId: EQ,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: 'u1',
      }),
    );
    // El equipo recuerda su recurso y el evento sale en la misma transacción.
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('set schedulable_resource_id = ?'),
      ),
    ).toBe(true);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'scheduling.resource.linked_to_equipment',
        payloadJson: expect.objectContaining({
          equipmentId: EQ,
          careSpaceId: SPACE,
        }),
      }),
    );
  });

  it('busca el equipo en el tenant del contexto y bloquea su fila (la carrera no tiene único en la base)', async () => {
    const d = build();
    await d.run();
    const load = d.tx.execute.mock.calls[0];
    expect(load[0]).toContain('for update of e');
    expect(load[1]).toEqual([EQ, TENANT]);
  });

  it('un equipo inexistente o de otra organización es el mismo 404', async () => {
    const d = build({ equipment: null });
    await expect(d.run()).rejects.toMatchObject({
      status: 404,
      reason: SchedulingErrorReason.RESOURCE_REF_NOT_FOUND,
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('un equipo que no está en una sala es 422 EQUIPMENT_NOT_LOCATED', async () => {
    const d = build({ equipment: { care_space_id: null } });
    await expect(d.run()).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.EQUIPMENT_NOT_LOCATED,
    });
  });

  it('quien no coordina agendas pasa por la política de la sala del equipo', async () => {
    const d = build();
    await d.run(other);
    expect(d.infra.assertCan).toHaveBeenCalledWith(
      other,
      'infra.agenda.assign',
      { careSpaceId: SPACE },
      d.tx,
    );
    const coordinador = build();
    await coordinador.run(coord);
    expect(coordinador.infra.assertCan).not.toHaveBeenCalled();
  });

  it('si ya hay un recurso activo es 409 con el id del existente', async () => {
    const d = build({ active: true });
    await expect(d.run()).rejects.toMatchObject({
      status: 409,
      reason: SchedulingErrorReason.RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT,
      details: { equipmentId: EQ, resourceId: 'res-previo' },
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('el nombre del cliente manda y se recorta a 200', async () => {
    const d = build();
    await d.run(coord, {
      name: 'x'.repeat(300),
      timeZone: 'America/La_Paz',
      capacity: 2,
    });
    const args = d.catalogRepo.createResource.mock.calls[0][1];
    expect(args.name).toHaveLength(200);
    expect(args).toMatchObject({ timeZone: 'America/La_Paz', capacity: 2 });
  });
});
