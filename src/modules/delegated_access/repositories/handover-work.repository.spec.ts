import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { HandoverWorkRepository } from './handover-work.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** `em` que responde por nombre de entidad y recuerda cada consulta. */
function emWith(byEntity: Record<string, any[]>) {
  const finds: Array<{ entity: string; where: any }> = [];
  const em = {
    find: mockFn(async (entity: { name: string }, where: any) => {
      finds.push({ entity: entity.name, where });
      return byEntity[entity.name] ?? [];
    }),
    findOne: mockFn(async (entity: { name: string }, where: any) => {
      return (
        (byEntity[entity.name] ?? []).find((r) => r.id === where.id) ?? null
      );
    }),
  };
  return { em, finds };
}

describe('HandoverWorkRepository', () => {
  const repo = new HandoverWorkRepository();
  const now = new Date('2026-11-03T14:30:00Z');

  it('conversaciones: solo las asignadas a la persona en la organización y no resueltas', async () => {
    const { em, finds } = emWith({
      ConversationAssignments: [
        { id: 'c1', practitionerProfileId: 'perez' },
        { id: 'c2', practitionerProfileId: 'mendez' },
      ],
    });
    const out = await repo.findOpenConversations(em as any, 't1', 'pablo');
    expect(out).toEqual([
      { id: 'c1', practitionerProfileId: 'perez' },
      { id: 'c2', practitionerProfileId: 'mendez' },
    ]);
    expect(finds[0].where).toMatchObject({
      tenantId: 't1',
      assignedUserId: 'pablo',
      statusConceptId: { $ne: COMM.CONVERSATION_ASSIGNMENT_RESOLVED },
    });
  });

  it('perfil del doctor de cada conversación, para saber quién puede responder', async () => {
    const { em } = emWith({
      ConversationAssignments: [
        { id: 'c1', practitionerProfileId: 'perez' },
        { id: 'c2', practitionerProfileId: 'mendez' },
      ],
    });
    expect(await repo.conversationProfiles(em as any, [])).toEqual(new Map());
    expect(await repo.conversationProfiles(em as any, ['c1', 'c2'])).toEqual(
      new Map([
        ['c1', 'perez'],
        ['c2', 'mendez'],
      ]),
    );
  });

  it('tareas: abiertas o en curso y de instancias de la organización (la tarea no guarda organización)', async () => {
    const { em, finds } = emWith({
      WorkflowTasks: [
        { id: 'k1', workflowInstanceId: 'i1' },
        { id: 'k2', workflowInstanceId: 'i2' },
        { id: 'k3', workflowInstanceId: 'ajena' },
      ],
      WorkflowInstances: [{ id: 'i1' }, { id: 'i2' }],
    });
    expect(await repo.findOpenTaskIds(em as any, 't1', 'pablo')).toEqual([
      'k1',
      'k2',
    ]);
    expect(finds[0].where.statusConceptId.$in).toEqual([
      CONCEPTS.WF_TASK_OPEN,
      CONCEPTS.WF_TASK_IN_PROGRESS,
    ]);
    expect(finds[1].where.tenantId).toBe('t1');
  });

  it('citas: pendientes de confirmación y con horario futuro, las más próximas primero', async () => {
    const { em, finds } = emWith({
      AppointmentBookings: [
        { id: 'b-tarde', bookableSlotId: 's2' },
        { id: 'b-pronto', bookableSlotId: 's1' },
        { id: 'b-pasada', bookableSlotId: 's0' },
      ],
      BookableSlots: [
        { id: 's2', startAt: new Date('2026-11-05T09:00:00Z') },
        { id: 's1', startAt: new Date('2026-11-04T09:00:00Z') },
      ],
    });
    const out = await repo.findPendingBookings(em as any, 't1', 'pablo', now);
    expect(out.map((b) => b.id)).toEqual(['b-pronto', 'b-tarde']);
    expect(finds[0].where).toMatchObject({
      tenantId: 't1',
      bookedByUserId: 'pablo',
      statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
    });
    expect(finds[1].where.startAt).toEqual({ $gt: now });
  });

  /** `em` que aplica el `where` de verdad (tenant, dueño actual, estado) sobre filas en memoria. */
  function filteringEm(rows: Record<string, any[]>) {
    const finds: Array<{ entity: string; where: any }> = [];
    const matches = (row: any, where: any): boolean =>
      Object.entries(where).every(([k, v]: [string, any]) => {
        if (v && typeof v === 'object' && '$ne' in v) return row[k] !== v.$ne;
        if (v && typeof v === 'object' && '$in' in v)
          return v.$in.includes(row[k]);
        return row[k] === v;
      });
    const em = {
      findOne: mockFn(async (entity: { name: string }, where: any) => {
        finds.push({ entity: entity.name, where });
        return (rows[entity.name] ?? []).find((r) => matches(r, where)) ?? null;
      }),
      find: mockFn(async (entity: { name: string }, where: any) =>
        (rows[entity.name] ?? []).filter((r) => matches(r, where)),
      ),
    };
    return { em, finds };
  }
  const owner = { tenantId: 't1', fromUserId: 'pablo' };

  it('reasignar una conversación conserva el estado; a la bandeja común la deja NEW y sin responsable', async () => {
    const row: any = {
      id: 'c1',
      tenantId: 't1',
      assignedUserId: 'pablo',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
    };
    const { em } = filteringEm({ ConversationAssignments: [row] });
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        'ana',
        'admin',
        now,
        owner,
      ),
    ).toBe(true);
    expect(row.assignedUserId).toBe('ana');
    expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_TAKEN);
    // Ya no es de Pablo (ahora es de Ana): reasignar «lo de Pablo» no la toca otra vez.
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        null,
        'admin',
        now,
        owner,
      ),
    ).toBe(false);
    expect(row.assignedUserId).toBe('ana');
    expect(
      await repo.reassignConversation(
        em as any,
        'nada',
        'ana',
        'admin',
        now,
        owner,
      ),
    ).toBe(false);
  });

  it('B-B6: a la bandeja común la deja NEW y sin responsable (solo si sigue siendo del que se fue)', async () => {
    const row: any = {
      id: 'c1',
      tenantId: 't1',
      assignedUserId: 'pablo',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
    };
    const { em } = filteringEm({ ConversationAssignments: [row] });
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        null,
        'admin',
        now,
        owner,
      ),
    ).toBe(true);
    expect(row.assignedUserId).toBeUndefined();
    expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_NEW);
  });

  it('B-B6: una conversación de OTRA organización no se reasigna aunque el id coincida', async () => {
    const row: any = {
      id: 'c1',
      tenantId: 'otra',
      assignedUserId: 'pablo',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
    };
    const { em, finds } = filteringEm({ ConversationAssignments: [row] });
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        'ana',
        'admin',
        now,
        owner,
      ),
    ).toBe(false);
    expect(row.assignedUserId).toBe('pablo');
    expect(finds[0].where).toMatchObject({ id: 'c1', tenantId: 't1' });
  });

  it('B-B6: no pisa una asignación NUEVA: si ya es de otra persona, no se toca', async () => {
    const row: any = {
      id: 'c1',
      tenantId: 't1',
      assignedUserId: 'lucia', // se la dieron a Lucía después de la baja de Pablo
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
    };
    const { em } = filteringEm({ ConversationAssignments: [row] });
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        'ana',
        'admin',
        now,
        owner,
      ),
    ).toBe(false);
    expect(row.assignedUserId).toBe('lucia');
  });

  it('B-B6: una conversación RESUELTA no se reabre al devolverla a la bandeja común', async () => {
    const row: any = {
      id: 'c1',
      tenantId: 't1',
      assignedUserId: 'pablo',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
    };
    const { em } = filteringEm({ ConversationAssignments: [row] });
    expect(
      await repo.reassignConversation(
        em as any,
        'c1',
        null,
        'admin',
        now,
        owner,
      ),
    ).toBe(false);
    expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_RESOLVED);
    expect(row.assignedUserId).toBe('pablo');
  });

  it('reasignar una tarea la pasa a la persona o la deja por rol; cambiar el dueño de una cuenta', async () => {
    const task: any = {
      id: 'k1',
      assignedUserId: 'pablo',
      workflowInstanceId: 'i1',
      statusConceptId: CONCEPTS.WF_TASK_OPEN,
    };
    const eng: any = {
      id: 'e1',
      tenantId: 't1',
      supervisorUserId: 'pablo',
    };
    const { em } = filteringEm({
      WorkflowTasks: [task],
      WorkflowInstances: [{ id: 'i1', tenantId: 't1' }],
      OrganizationUserAssignments: [eng],
    });
    expect(
      await repo.reassignTask(em as any, 'k1', 'ana', 'admin', now, owner),
    ).toBe(true);
    expect(task.assignedUserId).toBe('ana');
    task.assignedUserId = 'pablo';
    await repo.reassignTask(em as any, 'k1', null, 'admin', now, owner);
    expect(task.assignedUserId).toBeUndefined();
    expect(
      await repo.setSupervisor(em as any, 'e1', 'sofia', 'admin', now, owner),
    ).toBe(true);
    expect(eng.supervisorUserId).toBe('sofia');
    expect(eng.updatedByUserId).toBe('admin');
  });

  it('B-B6: una tarea de otra organización, de otra persona o ya cerrada no se reasigna', async () => {
    const mk = (over: Record<string, unknown>): any => ({
      id: 'k1',
      assignedUserId: 'pablo',
      workflowInstanceId: 'i1',
      statusConceptId: CONCEPTS.WF_TASK_OPEN,
      ...over,
    });
    for (const [task, instance] of [
      [mk({}), { id: 'i1', tenantId: 'otra' }],
      [mk({ assignedUserId: 'lucia' }), { id: 'i1', tenantId: 't1' }],
      [
        mk({ statusConceptId: CONCEPTS.WF_TASK_COMPLETED }),
        { id: 'i1', tenantId: 't1' },
      ],
    ] as Array<[any, any]>) {
      const before = task.assignedUserId;
      const { em } = filteringEm({
        WorkflowTasks: [task],
        WorkflowInstances: [instance],
      });
      expect(
        await repo.reassignTask(em as any, 'k1', 'ana', 'admin', now, owner),
      ).toBe(false);
      expect(task.assignedUserId).toBe(before);
    }
  });

  it('B-B6: una cuenta de otra organización o con otro dueño no cambia de dueño', async () => {
    for (const eng of [
      { id: 'e1', tenantId: 'otra', supervisorUserId: 'pablo' },
      { id: 'e1', tenantId: 't1', supervisorUserId: 'ricardo' },
    ] as any[]) {
      const { em } = filteringEm({ OrganizationUserAssignments: [eng] });
      expect(
        await repo.setSupervisor(em as any, 'e1', 'sofia', 'admin', now, owner),
      ).toBe(false);
      expect(eng.supervisorUserId).not.toBe('sofia');
    }
  });

  it('supervisados: solo los vínculos de la organización cuyo dueño es la persona', async () => {
    const { em, finds } = emWith({
      OrganizationUserAssignments: [{ id: 'e1' }],
    });
    expect(await repo.findSupervised(em as any, [], 'ricardo')).toEqual([]);
    expect(
      await repo.findSupervised(em as any, ['e1', 'e2'], 'ricardo'),
    ).toEqual([{ id: 'e1' }]);
    expect(finds[0].where).toMatchObject({
      id: { $in: ['e1', 'e2'] },
      supervisorUserId: 'ricardo',
    });
  });
});
