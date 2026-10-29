import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../../common';
import { CLIN } from '../../../../clinical/clinical.concepts';
import { InsufficientRoleException } from '../../../../../common/errors/domain.exception';
import { ResourceNotFoundException } from '../../../../../common';
import { PRAC } from '../../../../practice/practice.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { CareSpaceAppointmentResolver } from './care-space-appointment-resolver';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const SPACE = '22222222-2222-4222-8222-222222222222';
const OTHER_SPACE = '55555555-5555-4555-8555-555555555555';
const START = new Date('2026-11-09T18:00:00.000Z');
const END = new Date('2026-11-09T18:30:00.000Z');
const operator = { id: 'u1', roles: ['SCHEDULING_ADMIN'] } as any;
const practitioner = {
  id: 'u2',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

const resource = (over: Record<string, unknown> = {}): any => ({
  id: 'res-1',
  tenantId: TENANT,
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: 'hp-1',
  timeZone: 'America/La_Paz',
  ...over,
});
const spaceRow = (fn = 'SPACE_FN_CONSULTING_ROOM'): any => ({
  id: SPACE,
  tenantId: TENANT,
  spaceTypeConceptId: (PRAC as any)[fn],
  statusConceptId: PRAC.SPACE_ACTIVE,
});

function build(
  over: {
    fn?: string;
    templates?: any[];
    rules?: any[];
    busy?: Date | null;
  } = {},
) {
  const state = { loadSpace: mockFn().mockResolvedValue(spaceRow(over.fn)) };
  const ops = { assertBookable: mockFn().mockResolvedValue(undefined) };
  const catalogRepo = {
    findTemplateById: mockFn().mockResolvedValue({
      id: 'tpl-1',
      careSpaceId: SPACE,
    }),
    findTemplatesByResource: mockFn().mockResolvedValue(over.templates ?? []),
    findRulesByTemplates: mockFn().mockResolvedValue(over.rules ?? []),
    findResourceById: mockFn().mockResolvedValue(resource()),
  };
  const tx = {
    execute: mockFn(async (sql: string) => {
      if (sql.includes('from clinical.appointments')) {
        return over.busy ? [{ end_at: over.busy }] : [];
      }
      if (sql.includes('diagnostic_equipment'))
        return [{ care_space_id: SPACE }];
      return [];
    }),
  };
  const infra = { assertCan: mockFn().mockResolvedValue(undefined) };
  const resolver = new CareSpaceAppointmentResolver(
    state as any,
    ops as any,
    catalogRepo as any,
    infra as any,
  );
  const ask = (req: Record<string, unknown> = {}) =>
    resolver.resolve(
      tx as any,
      {
        resource: resource(),
        scheduleTemplateId: 'tpl-1',
        startAt: START,
        endAt: END,
        commits: true,
        actor: operator,
        ...req,
      } as any,
    );
  return { resolver, state, ops, catalogRepo, infra, tx, ask };
}

describe('CareSpaceAppointmentResolver · de dónde sale el espacio', () => {
  it('el de la plantilla del cupo', async () => {
    const d = build();
    await expect(d.ask()).resolves.toBe(SPACE);
    expect(d.catalogRepo.findTemplateById).toHaveBeenCalledWith(d.tx, 'tpl-1');
  });

  it('una sala (ROOM) lleva su espacio sin mirar la plantilla', async () => {
    const d = build();
    await expect(
      d.ask({
        resource: resource({ careSpaceId: SPACE }),
        scheduleTemplateId: null,
      }),
    ).resolves.toBe(SPACE);
    expect(d.catalogRepo.findTemplateById).not.toHaveBeenCalled();
  });

  it('un estudio de imagen ocurre en la sala del equipo', async () => {
    const d = build();
    await expect(
      d.ask({
        resource: resource({
          resourceRefType: 'diagnostic_equipment',
          resourceRefId: 'eq-1',
        }),
        scheduleTemplateId: null,
      }),
    ).resolves.toBe(SPACE);
  });

  it('sin plantilla con espacio ni franja que lo fije, la cita no lleva espacio y no se consulta nada más', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue({
      id: 'tpl-1',
      careSpaceId: null,
    });
    await expect(d.ask()).resolves.toBeNull();
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });

  it('una cita puntual (sin plantilla) toma el espacio de la franja que contiene el inicio', async () => {
    // 2026-11-09 es lunes; 18:00Z son las 14:00 de La Paz.
    const d = build({
      templates: [
        {
          id: 'tpl-9',
          careSpaceId: SPACE,
          statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
          validFrom: null,
          validTo: null,
        },
      ],
      rules: [
        {
          scheduleTemplateId: 'tpl-9',
          dayOfWeek: 1,
          startTime: '13:00:00',
          endTime: '16:00:00',
        },
      ],
    });
    await expect(
      d.ask({ scheduleTemplateId: null, inferFromBands: true }),
    ).resolves.toBe(SPACE);
    // Fuera de la franja: sin espacio.
    await expect(
      d.ask({
        scheduleTemplateId: null,
        inferFromBands: true,
        startAt: new Date('2026-11-09T22:00:00Z'),
        endAt: new Date('2026-11-09T22:30:00Z'),
      }),
    ).resolves.toBeNull();
  });

  it('una plantilla retirada o sin espacio no fija nada', async () => {
    const d = build({
      templates: [
        { id: 'tpl-9', careSpaceId: SPACE, statusConceptId: 'retirada' },
        {
          id: 'tpl-8',
          careSpaceId: null,
          statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        },
      ],
    });
    await expect(
      d.ask({ scheduleTemplateId: null, inferFromBands: true }),
    ).resolves.toBeNull();
    expect(d.catalogRepo.findRulesByTemplates).not.toHaveBeenCalled();
  });
});

describe('CareSpaceAppointmentResolver · el consultorio que nombra quien agenda', () => {
  it('si la agenda ya lo fija y es otro: 422 APPOINTMENT_CARE_SPACE_MISMATCH', async () => {
    const d = build();
    await expect(
      d.ask({ requestedCareSpaceId: OTHER_SPACE }),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.APPOINTMENT_CARE_SPACE_MISMATCH,
    });
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
  });

  it('si coincide con el que fija la agenda, pasa', async () => {
    const d = build();
    await expect(d.ask({ requestedCareSpaceId: SPACE })).resolves.toBe(SPACE);
  });

  it('si la agenda no lo fija, quien opera agendas lo elige', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue(null);
    await expect(
      d.ask({ requestedCareSpaceId: SPACE, scheduleTemplateId: 'tpl-x' }),
    ).resolves.toBe(SPACE);
    // El coordinador del tenant ve todos los espacios: no pasa por el alcance por espacio.
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  describe('el rol de agenda vale en el tenant del recurso, no en cualquiera', () => {
    const scopedTo = (tenant: string, role = 'SCHEDULING_AGENT') =>
      ({
        id: 'u9',
        roles: [role],
        scopedRoles: { [tenant]: [role] },
      }) as any;
    const OTHER_TENANT = '99999999-9999-4999-8999-999999999999';
    const ask = (d: ReturnType<typeof build>, actor: any) => {
      d.catalogRepo.findTemplateById.mockResolvedValue(null);
      return d.ask({
        requestedCareSpaceId: SPACE,
        scheduleTemplateId: 'tpl-x',
        actor,
      });
    };

    it('un agente de agenda de OTRO tenant recibe 404 uniforme y no se evalúa nada del espacio', async () => {
      const d = build();
      const error: any = await ask(d, scopedTo(OTHER_TENANT)).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(SchedulingErrorReason.RESOURCE_NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.state.loadSpace).not.toHaveBeenCalled();
      expect(d.infra.assertCan).not.toHaveBeenCalled();
      expect(d.ops.assertBookable).not.toHaveBeenCalled();
    });

    it('un agente del tenant pero SIN alcance sobre el espacio: 403 y no se reserva nada', async () => {
      const d = build();
      d.infra.assertCan.mockRejectedValue(
        new InsufficientRoleException(
          'x',
          undefined,
          'INFRA_ACTION_NOT_ALLOWED',
        ),
      );
      await expect(ask(d, scopedTo(TENANT))).rejects.toMatchObject({
        status: 403,
      });
      expect(d.ops.assertBookable).not.toHaveBeenCalled();
    });

    it('un agente del tenant al que el espacio no le es visible (otra sede) recibe el 404 de la política', async () => {
      const d = build();
      d.infra.assertCan.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(ask(d, scopedTo(TENANT))).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.ops.assertBookable).not.toHaveBeenCalled();
    });

    it('un espacio de otra organización es 404 aunque el rol sea del tenant (se carga en el tenant del recurso)', async () => {
      const d = build();
      d.state.loadSpace.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(ask(d, scopedTo(TENANT))).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, TENANT, SPACE);
      expect(d.infra.assertCan).not.toHaveBeenCalled();
    });

    it('con el rol y el alcance del tenant, la cita puntual elige el consultorio', async () => {
      const d = build();
      await expect(ask(d, scopedTo(TENANT))).resolves.toBe(SPACE);
      expect(d.infra.assertCan).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u9' }),
        'infra.agenda.book',
        { careSpaceId: SPACE },
        d.tx,
      );
    });

    it('un SCHEDULING_ADMIN del tenant (coordinador) no necesita alcance por espacio; el de otro tenant sí es 404', async () => {
      const d = build();
      await expect(ask(d, scopedTo(TENANT, 'SCHEDULING_ADMIN'))).resolves.toBe(
        SPACE,
      );
      expect(d.infra.assertCan).not.toHaveBeenCalled();
      const e = build();
      await expect(
        ask(e, scopedTo(OTHER_TENANT, 'SCHEDULING_ADMIN')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('si la agenda ya fija el consultorio y el pedido coincide, no hace falta rol ni alcance', async () => {
      const d = build();
      await expect(
        d.ask({ requestedCareSpaceId: SPACE, actor: practitioner }),
      ).resolves.toBe(SPACE);
      expect(d.infra.assertCan).not.toHaveBeenCalled();
    });
  });

  it('y un profesional sobre su agenda no: 403', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue(null);
    await expect(
      d.ask({
        requestedCareSpaceId: SPACE,
        scheduleTemplateId: 'tpl-x',
        actor: practitioner,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });
});

describe('CareSpaceAppointmentResolver · el espacio se puede reservar', () => {
  it('lo carga en el tenant del recurso (404 uniforme del espacio ajeno) y pide a F2 que lo confirme', async () => {
    const d = build();
    await d.ask();
    expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, TENANT, SPACE);
    expect(d.ops.assertBookable).toHaveBeenCalledWith(d.tx, SPACE, {
      start: START,
      end: END,
    });
  });

  it('un espacio de otra organización es 404 y no se escribe nada', async () => {
    const d = build();
    d.state.loadSpace.mockRejectedValue(
      Object.assign(new Error('x'), { status: 404 }),
    );
    await expect(d.ask()).rejects.toMatchObject({ status: 404 });
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
  });

  it('el tenant que declaró quien reserva tiene que ser el del recurso (404 uniforme)', async () => {
    const d = build();
    await expect(
      d.ask({ bookingTenantId: '99999999-9999-4999-8999-999999999999' }),
    ).rejects.toMatchObject({
      status: 404,
      reason: SchedulingErrorReason.RESOURCE_NOT_AVAILABLE,
    });
    expect(d.state.loadSpace).not.toHaveBeenCalled();
  });

  it('bloquea la fila del espacio FOR SHARE antes de comprobar (serializa con el bloqueo de F2)', async () => {
    const d = build();
    await d.ask();
    const share = d.tx.execute.mock.calls.find((c: any[]) =>
      /for share/i.test(c[0]),
    );
    expect(share).toBeDefined();
    expect(share[1]).toEqual([SPACE, TENANT]);
    expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      d.ops.assertBookable.mock.invocationCallOrder[0],
    );
  });

  it('si F2 lo rechaza (bloqueado, en mantenimiento), el 422 sube y no queda nada', async () => {
    const d = build();
    d.ops.assertBookable.mockRejectedValue(
      Object.assign(new Error('no'), {
        status: 422,
        reason: 'SPACE_NOT_BOOKABLE',
      }),
    );
    await expect(d.ask()).rejects.toMatchObject({
      reason: 'SPACE_NOT_BOOKABLE',
    });
  });

  it('una sala que admite solapes (espera) no recibe espacio', async () => {
    const d = build({ fn: 'SPACE_FN_WAITING' });
    await expect(
      d.ask({ requestedCareSpaceId: SPACE, scheduleTemplateId: null }),
    ).resolves.toBeNull();
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
  });

  it('un espacio que no admite agenda (depósito) es 422 SPACE_NOT_SCHEDULABLE', async () => {
    const d = build({ fn: 'SPACE_FN_STORAGE' });
    await expect(
      d.ask({ requestedCareSpaceId: SPACE, scheduleTemplateId: null }),
    ).rejects.toMatchObject({
      status: 422,
      reason: SchedulingErrorReason.SPACE_NOT_SCHEDULABLE,
    });
  });
});

describe('CareSpaceAppointmentResolver · doble reserva', () => {
  it('otra cita reservada en el espacio y rato es 409 CARE_SPACE_DOUBLE_BOOKED con el primer momento libre', async () => {
    const busyUntil = new Date('2026-11-09T18:45:00.000Z');
    const d = build({ busy: busyUntil });
    await expect(d.ask()).rejects.toMatchObject({
      status: 409,
      reason: SchedulingErrorReason.CARE_SPACE_DOUBLE_BOOKED,
      details: { careSpaceId: SPACE, nextAvailableAt: busyUntil.toISOString() },
    });
  });

  it('compara sólo las citas comprometidas del tenant, con el rango [inicio, fin)', async () => {
    const d = build();
    await d.ask({ exceptAppointmentId: 'apt-propia' });
    const call = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from clinical.appointments'),
    );
    expect(call[0]).toContain("tstzrange(a.start_at, a.end_at, '[)')");
    expect(call[1]).toEqual([
      TENANT,
      SPACE,
      CLIN.APPOINTMENT_BOOKED,
      CLIN.APPOINTMENT_CHECKED_IN,
      START,
      END,
      'apt-propia',
      'apt-propia',
    ]);
  });

  it('una solicitud pendiente todavía no ocupa el espacio: no se compara con las demás', async () => {
    const d = build({ busy: new Date('2026-11-09T18:45:00.000Z') });
    await expect(d.ask({ commits: false })).resolves.toBe(SPACE);
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('from clinical.appointments'),
      ),
    ).toBe(false);
  });
});

describe('CareSpaceAppointmentResolver.assertSlotHoldable', () => {
  it('retener un cupo comprueba el espacio sin comprometerlo', async () => {
    const d = build();
    await d.resolver.assertSlotHoldable(
      d.tx as any,
      {
        resourceId: 'res-1',
        scheduleTemplateId: 'tpl-1',
        startAt: START,
        endAt: END,
      },
      operator,
    );
    expect(d.ops.assertBookable).toHaveBeenCalledTimes(1);
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('from clinical.appointments'),
      ),
    ).toBe(false);
  });

  it('un cupo de un recurso que ya no existe no se bloquea acá', async () => {
    const d = build();
    d.catalogRepo.findResourceById.mockResolvedValue(null);
    await expect(
      d.resolver.assertSlotHoldable(
        d.tx as any,
        { resourceId: 'res-x', startAt: START },
        operator,
      ),
    ).resolves.toBeUndefined();
  });
});
