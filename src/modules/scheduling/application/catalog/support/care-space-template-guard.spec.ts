import { jest } from '@jest/globals';
import { CONCEPTS, ResourceNotFoundException } from '../../../../../common';
import { runWithTenant } from '../../../../../common/tenant/tenant-context';
import { PRAC } from '../../../../practice/practice.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { CareSpaceTemplateGuard } from './care-space-template-guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT = '99999999-9999-4999-8999-999999999999';
const SPACE = '22222222-2222-4222-8222-222222222222';
const SITE = '33333333-3333-4333-8333-333333333333';
const PRACTICE = '44444444-4444-4444-8444-444444444444';
const RESOURCE = 'r1';
const admin = { id: 'u1', roles: ['SCHEDULING_ADMIN'] } as any;
const nobody = { id: 'u2', roles: ['PRACTITIONER'] } as any;

const space = (over: Record<string, unknown> = {}): any => ({
  id: SPACE,
  tenantId: TENANT,
  practiceSiteId: SITE,
  spaceTypeConceptId: PRAC.SPACE_FN_CONSULTING_ROOM,
  statusConceptId: PRAC.SPACE_ACTIVE,
  code: 'CON-1',
  ...over,
});

const resource = (over: Record<string, unknown> = {}): any => ({
  id: RESOURCE,
  tenantId: TENANT,
  practiceId: PRACTICE,
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: 'hp-1',
  timeZone: 'America/La_Paz',
  name: 'Agenda Dr. Uno',
  ...over,
});

function build(
  opts: { space?: any; others?: any[]; practiceOfSite?: string } = {},
) {
  const state = {
    loadSpace: mockFn().mockResolvedValue(opts.space ?? space()),
  };
  const infra = { assertCan: mockFn().mockResolvedValue(undefined) };
  const catalogRepo = {
    findPublishedTemplatesOfCareSpace: mockFn().mockResolvedValue(
      opts.others ?? [],
    ),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const tx = {
    execute: mockFn(async (sql: string) => {
      if (sql.includes('practice.practice_sites')) {
        return [{ practice_id: opts.practiceOfSite ?? PRACTICE }];
      }
      if (sql.includes('diagnostic_equipment'))
        return [{ care_space_id: SPACE }];
      return [];
    }),
  };
  const guard = new CareSpaceTemplateGuard(
    state as any,
    infra as any,
    catalogRepo as any,
    outbox as any,
  );
  const inTenant = <T>(fn: () => T, tenant = TENANT) =>
    runWithTenant(tenant, fn);
  return { guard, state, infra, catalogRepo, outbox, tx, inTenant };
}

describe('CareSpaceTemplateGuard · el recurso es del tenant del contexto', () => {
  it('sin tenant en el contexto no hay contra qué comparar y no se exige', () => {
    const { guard } = build();
    expect(() =>
      guard.assertResourceInActiveTenant({ tenantId: OTHER_TENANT }),
    ).not.toThrow();
  });
  it('un recurso de otra organización es 404 uniforme', () => {
    const { guard, inTenant } = build();
    expect(() =>
      inTenant(() =>
        guard.assertResourceInActiveTenant({ tenantId: OTHER_TENANT }),
      ),
    ).toThrow(
      expect.objectContaining({
        status: 404,
        reason: SchedulingErrorReason.RESOURCE_NOT_AVAILABLE,
      }),
    );
    expect(() =>
      inTenant(() => guard.assertResourceInActiveTenant({ tenantId: TENANT })),
    ).not.toThrow();
  });
});

describe('CareSpaceTemplateGuard.assertMayManageBound · editar un horario que ya ocupa un espacio', () => {
  const OTHER_SPACE = '77777777-7777-4777-8777-777777777777';

  it('SCHEDULING_ADMIN del tenant puede, sin pasar por la política del espacio', async () => {
    const d = build();
    await d.inTenant(() =>
      d.guard.assertMayManageBound(d.tx as any, resource(), [SPACE], admin),
    );
    expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, TENANT, SPACE);
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  it('un SCHEDULING_ADMIN de OTRA organización no vale aquí: sale por la política y, sobre su propio horario, es 403', async () => {
    const d = build();
    d.infra.assertCan.mockRejectedValue(
      new ResourceNotFoundException('sin alcance'),
    );
    const foreignAdmin = {
      id: 'u3',
      roles: ['SCHEDULING_ADMIN'],
      scopedRoles: { [OTHER_TENANT]: ['SCHEDULING_ADMIN'] },
    } as any;
    await expect(
      d.inTenant(() =>
        d.guard.assertMayManageBound(
          d.tx as any,
          resource(),
          [SPACE],
          foreignAdmin,
        ),
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
    });
    expect(d.infra.assertCan).toHaveBeenCalledWith(
      foreignAdmin,
      'infra.agenda.assign',
      { careSpaceId: SPACE },
      d.tx,
    );
  });

  it('al ATAR un espacio ajeno la política sigue respondiendo 404 (no confirma ids que no son suyos)', async () => {
    const d = build();
    d.infra.assertCan.mockRejectedValue(
      new ResourceNotFoundException('sin alcance'),
    );
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, nobody)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('quien no tiene la autoridad del espacio recibe 403 de la política', async () => {
    const d = build();
    d.infra.assertCan.mockRejectedValue(
      Object.assign(new Error('x'), { status: 403 }),
    );
    await expect(
      d.inTenant(() =>
        d.guard.assertMayManageBound(d.tx as any, resource(), [SPACE], nobody),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('exige la autoridad sobre cada espacio distinto (el actual y el nuevo), sin repetir ni contar los ausentes', async () => {
    const d = build();
    await d.inTenant(() =>
      d.guard.assertMayManageBound(
        d.tx as any,
        resource(),
        [SPACE, null, undefined, SPACE, OTHER_SPACE],
        nobody,
      ),
    );
    expect(d.infra.assertCan.mock.calls.map((c: any[]) => c[2])).toEqual([
      { careSpaceId: SPACE },
      { careSpaceId: OTHER_SPACE },
    ]);
  });

  it('si el segundo espacio no se puede, falla (no basta con el primero)', async () => {
    const d = build();
    d.infra.assertCan
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Object.assign(new Error('x'), { status: 403 }));
    await expect(
      d.inTenant(() =>
        d.guard.assertMayManageBound(
          d.tx as any,
          resource(),
          [SPACE, OTHER_SPACE],
          nobody,
        ),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('sin espacio no consulta nada (un horario sin espacio sigue como siempre)', async () => {
    const d = build();
    await d.inTenant(() =>
      d.guard.assertMayManageBound(
        d.tx as any,
        resource(),
        [null, undefined],
        nobody,
      ),
    );
    expect(d.state.loadSpace).not.toHaveBeenCalled();
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  it('un recurso de otra organización es 404 antes de leer el espacio', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.guard.assertMayManageBound(
          d.tx as any,
          resource({ tenantId: OTHER_TENANT }),
          [SPACE],
          admin,
        ),
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });

  it('un espacio ajeno o inexistente es 404 uniforme antes de evaluar el alcance', async () => {
    const d = build();
    d.state.loadSpace.mockRejectedValue(
      Object.assign(new Error('Espacio no encontrado'), { status: 404 }),
    );
    await expect(
      d.inTenant(() =>
        d.guard.assertMayManageBound(d.tx as any, resource(), [SPACE], nobody),
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });
});

describe('CareSpaceTemplateGuard.attach', () => {
  it('el coordinador de agendas del tenant ata un consultorio activo de la misma práctica', async () => {
    const d = build();
    const res = await d.inTenant(() =>
      d.guard.attach(d.tx as any, resource(), SPACE, {
        ...admin,
        scopedRoles: undefined,
      }),
    );
    expect(res.id).toBe(SPACE);
    // El espacio se carga en el tenant del contexto (nunca del cuerpo).
    expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, TENANT, SPACE);
    // El coordinador no pasa por la política del espacio: ya tiene su rol en el tenant.
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  it('quien no coordina agendas pasa por la política del espacio (organización o sucursal)', async () => {
    const d = build();
    await d.inTenant(() =>
      d.guard.attach(d.tx as any, resource(), SPACE, nobody),
    );
    expect(d.infra.assertCan).toHaveBeenCalledWith(
      nobody,
      'infra.agenda.assign',
      { careSpaceId: SPACE },
      d.tx,
    );
  });

  it('si la política lo niega (403/404) no se escribe nada: el error sube tal cual', async () => {
    const d = build();
    d.infra.assertCan.mockRejectedValue(
      Object.assign(new Error('x'), { status: 403 }),
    );
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, nobody)),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('un espacio inexistente o de otro tenant sale del 404 uniforme de la carga', async () => {
    const d = build();
    d.state.loadSpace.mockRejectedValue(
      Object.assign(new Error('Espacio no encontrado'), { status: 404 }),
    );
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, admin)),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  it('un recurso de otra organización es 404 antes de mirar el espacio', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.guard.attach(
          d.tx as any,
          resource({ tenantId: OTHER_TENANT }),
          SPACE,
          admin,
        ),
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });

  it.each([
    'SPACE_FN_STORAGE',
    'SPACE_FN_WAITING',
    'SPACE_FN_OPERATING_ROOM',
    'SPACE_FN_SAMPLE_COLLECTION',
    'SPACE_FN_INPATIENT_ROOM',
  ])('la función %s no admite horario propio (422)', async (fn) => {
    const d = build({
      space: space({ spaceTypeConceptId: (PRAC as any)[fn] }),
    });
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, admin)),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.TEMPLATE_CARE_SPACE_INVALID_FUNCTION,
    });
  });

  it.each([
    'SPACE_FN_CONSULTING_ROOM',
    'SPACE_FN_PROCEDURE_ROOM',
    'SPACE_FN_IMAGING_ROOM',
  ])('la función %s sí lo admite', async (fn) => {
    const d = build({
      space: space({ spaceTypeConceptId: (PRAC as any)[fn] }),
    });
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, admin)),
    ).resolves.toBeDefined();
  });

  it('un espacio que no está activo es 422 SPACE_NOT_ACTIVE', async () => {
    const d = build({
      space: space({ statusConceptId: PRAC.SPACE_SUSPENDED }),
    });
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, admin)),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.SPACE_NOT_ACTIVE,
    });
  });

  it('un recurso de otra práctica es 422 TEMPLATE_CARE_SPACE_SITE_MISMATCH', async () => {
    const d = build({ practiceOfSite: 'otra-practica' });
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, resource(), SPACE, admin)),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.TEMPLATE_CARE_SPACE_SITE_MISMATCH,
    });
  });

  it('una sala ya atada a otro espacio no admite horario en un tercero', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.guard.attach(
          d.tx as any,
          resource({ careSpaceId: 'otra-sala' }),
          SPACE,
          admin,
        ),
      ),
    ).rejects.toMatchObject({
      reason: SchedulingErrorReason.TEMPLATE_CARE_SPACE_SITE_MISMATCH,
    });
  });

  it('un recurso de equipo sólo admite horario en la sala donde está el equipo', async () => {
    const d = build();
    const equipo = resource({
      resourceRefType: 'diagnostic_equipment',
      resourceRefId: 'eq-1',
    });
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, equipo, SPACE, admin)),
    ).resolves.toBeDefined();
    d.tx.execute.mockImplementation(async (sql: string) =>
      sql.includes('diagnostic_equipment')
        ? [{ care_space_id: 'otra' }]
        : [{ practice_id: PRACTICE }],
    );
    await expect(
      d.inTenant(() => d.guard.attach(d.tx as any, equipo, SPACE, admin)),
    ).rejects.toMatchObject({
      reason: SchedulingErrorReason.TEMPLATE_CARE_SPACE_SITE_MISMATCH,
    });
  });
});

describe('CareSpaceTemplateGuard.assertNoOverlap', () => {
  const NOW = new Date('2026-11-02T12:00:00.000Z');
  const other = (
    from: string,
    to: string,
    over: Record<string, unknown> = {},
  ) => ({
    template: { id: 'tpl-otro', validFrom: null, validTo: null, ...over },
    resource: { name: 'Agenda Dra. Dos', timeZone: 'America/La_Paz' },
    rules: [{ dayOfWeek: 1, startTime: from, endTime: to }],
  });
  const proposal = (from: string, to: string) => ({
    resource: resource(),
    careSpaceId: SPACE,
    bands: [{ dayOfWeek: 1, startTime: from, endTime: to }],
  });

  it('serializa las publicaciones del espacio con un candado y busca en el tenant del contexto', async () => {
    const d = build({ others: [] });
    await d.inTenant(() =>
      d.guard.assertNoOverlap(
        d.tx as any,
        proposal('14:00:00', '14:30:00'),
        NOW,
      ),
    );
    expect(d.tx.execute.mock.calls[0][0]).toContain('pg_advisory_xact_lock');
    expect(d.tx.execute.mock.calls[0][1]).toEqual([
      `care-space-agenda:${SPACE}`,
    ]);
    expect(
      d.catalogRepo.findPublishedTemplatesOfCareSpace,
    ).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      SPACE,
      CONCEPTS.TEMPLATE_PUBLISHED,
      undefined,
    );
  });

  it('otra plantilla en el mismo espacio y hora es 422 con la agenda y las franjas', async () => {
    const d = build({ others: [other('14:00:00', '14:30:00')] });
    await expect(
      d.inTenant(() =>
        d.guard.assertNoOverlap(
          d.tx as any,
          proposal('14:15:00', '14:45:00'),
          NOW,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
      details: expect.objectContaining({
        careSpaceId: SPACE,
        existingTemplateId: 'tpl-otro',
      }),
    });
  });

  it('contigua no choca', async () => {
    const d = build({ others: [other('14:00:00', '14:30:00')] });
    await expect(
      d.inTenant(() =>
        d.guard.assertNoOverlap(
          d.tx as any,
          proposal('14:30:00', '15:00:00'),
          NOW,
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it('la plantilla que se edita no se compara consigo misma', async () => {
    const d = build({ others: [] });
    await d.inTenant(() =>
      d.guard.assertNoOverlap(
        d.tx as any,
        { ...proposal('14:00:00', '14:30:00'), templateId: 'tpl-yo' },
        NOW,
      ),
    );
    expect(
      d.catalogRepo.findPublishedTemplatesOfCareSpace.mock.calls[0][4],
    ).toBe('tpl-yo');
  });
});

describe('CareSpaceTemplateGuard.assertReactivable y announce', () => {
  it('una plantilla sin espacio no se vuelve a comprobar', async () => {
    const d = build();
    await d.inTenant(() =>
      d.guard.assertReactivable(
        d.tx as any,
        resource(),
        { id: 't', careSpaceId: null },
        [],
      ),
    );
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });

  it('con espacio: debe seguir activo y no pisar a nadie', async () => {
    const d = build({ space: space({ statusConceptId: PRAC.SPACE_RETIRED }) });
    await expect(
      d.inTenant(() =>
        d.guard.assertReactivable(
          d.tx as any,
          resource(),
          { id: 't', careSpaceId: SPACE },
          [],
        ),
      ),
    ).rejects.toMatchObject({ reason: SchedulingErrorReason.SPACE_NOT_ACTIVE });
  });

  it('publica scheduling.template.care_space_set con el espacio anterior y la hora', async () => {
    const d = build();
    await d.guard.announce(d.tx as any, {
      tenantId: TENANT,
      templateId: 'tpl-1',
      resourceId: RESOURCE,
      careSpaceId: SPACE,
      previousCareSpaceId: null,
      siteId: SITE,
      actorUserId: 'u1',
    });
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        eventType: 'scheduling.template.care_space_set',
        aggregateId: 'tpl-1',
        payloadJson: expect.objectContaining({
          careSpaceId: SPACE,
          previousCareSpaceId: null,
          occurredAt: expect.any(String),
        }),
      }),
    );
  });
});
