import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { HandoverItems, LifecycleCases } from '../entities';
import { LifecycleRepository } from './lifecycle.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    count: mockFn().mockResolvedValue(rows.length),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new LifecycleRepository(), em };
}

describe('LifecycleRepository: casos', () => {
  it('abre un caso con su lista de verificación, abierto y a nombre del actor', () => {
    const { repo, em } = build();

    const row: any = repo.createCase(em, {
      tenantId: 't1',
      organizationUserAssignmentId: 'v1',
      subjectUserId: 'u1',
      kindConceptId: DELEG.LIFECYCLE_JOINER,
      openedByUserId: 'admin-1',
      openedAt: NOW,
      checklist: [{ key: 'identity', done: false }],
      reasonText: 'Ingreso',
      actorUserId: 'admin-1',
    });

    expect(em.create.mock.calls[0][0]).toBe(LifecycleCases);
    expect(row).toMatchObject({
      statusConceptId: DELEG.LIFECYCLE_OPEN,
      checklistJson: [{ key: 'identity', done: false }],
      openedByUserId: 'admin-1',
      openedAt: NOW,
    });
  });

  it('un caso abierto por el sistema no lleva opened_by_user_id', () => {
    const { repo, em } = build();
    const row: any = repo.createCase(em, {
      tenantId: 't1',
      organizationUserAssignmentId: 'v1',
      subjectUserId: 'u1',
      kindConceptId: DELEG.LIFECYCLE_SUSPENSION,
      openedAt: NOW,
      checklist: [],
    });
    expect(row.openedByUserId).toBeUndefined();
  });

  it('busca el caso abierto de un tipo para un vínculo (la llave del único parcial)', async () => {
    const { repo, em } = build([{ id: 'k1' }]);
    const row = await repo.findOpenCase(em, 'v1', DELEG.LIFECYCLE_JOINER);
    expect(row).toEqual({ id: 'k1' });
    expect(em.findOne.mock.calls[0][0]).toBe(LifecycleCases);
    expect(em.findOne.mock.calls[0][1]).toEqual({
      organizationUserAssignmentId: 'v1',
      kindConceptId: DELEG.LIFECYCLE_JOINER,
      statusConceptId: DELEG.LIFECYCLE_OPEN,
    });
  });

  it('lista casos por organización con filtros opcionales y los más recientes primero', async () => {
    const { repo, em } = build([]);
    await repo.findCases(em, 't1', {
      kindConceptId: DELEG.LIFECYCLE_LEAVER,
      statusConceptId: DELEG.LIFECYCLE_OPEN,
    });
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      tenantId: 't1',
      kindConceptId: DELEG.LIFECYCLE_LEAVER,
      statusConceptId: DELEG.LIFECYCLE_OPEN,
    });
    expect(opts.orderBy).toEqual({ openedAt: 'desc', id: 'asc' });
  });

  it('completa el caso con la marca de tiempo', () => {
    const { repo } = build();
    const row: any = { statusConceptId: DELEG.LIFECYCLE_OPEN };
    repo.complete(row, NOW, 'admin-1');
    expect(row).toMatchObject({
      statusConceptId: DELEG.LIFECYCLE_COMPLETED,
      completedAt: NOW,
      updatedByUserId: 'admin-1',
    });
  });
});

describe('LifecycleRepository: traspaso', () => {
  it('registra cada ítem a traspasar como pendiente, sin datos del paciente', () => {
    const { repo, em } = build();

    const [row]: any[] = repo.createHandoverItems(em, [
      {
        tenantId: 't1',
        lifecycleCaseId: 'k1',
        itemKindConceptId: DELEG.HANDOVER_CONVERSATION,
        sourceId: 'conv-1',
        fromUserId: 'u1',
        summaryText: 'Conversación sin responder (2 días)',
        actorUserId: 'admin-1',
      },
    ]);

    expect(em.create.mock.calls[0][0]).toBe(HandoverItems);
    expect(row).toMatchObject({
      statusConceptId: DELEG.HANDOVER_PENDING,
      sourceId: 'conv-1',
      fromUserId: 'u1',
      summaryText: 'Conversación sin responder (2 días)',
    });
    expect(row.toUserId).toBeUndefined();
  });

  it('reasigna dejando destino, autor y marca de tiempo', () => {
    const { repo } = build();
    const row: any = { statusConceptId: DELEG.HANDOVER_PENDING };
    repo.reassign(row, {
      toUserId: 'u2',
      byUserId: 'admin-1',
      now: NOW,
      note: 'Pasa a recepción',
    });
    expect(row).toMatchObject({
      statusConceptId: DELEG.HANDOVER_REASSIGNED,
      toUserId: 'u2',
      reassignedAt: NOW,
      reassignedByUserId: 'admin-1',
      noteText: 'Pasa a recepción',
    });
  });

  it('devolver al pool no exige destino', () => {
    const { repo } = build();
    const row: any = { statusConceptId: DELEG.HANDOVER_PENDING };
    repo.returnToPool(row, 'admin-1', NOW);
    expect(row.statusConceptId).toBe(DELEG.HANDOVER_RETURNED_TO_POOL);
    expect(row.toUserId).toBeUndefined();
  });

  it('cuenta los ítems pendientes de un caso', async () => {
    const { repo, em } = build([{}, {}]);
    expect(await repo.countPendingHandover(em, 'k1')).toBe(2);
    expect(em.count.mock.calls[0][1]).toEqual({
      lifecycleCaseId: 'k1',
      statusConceptId: DELEG.HANDOVER_PENDING,
    });
  });

  it('el estado «activo» de otras filas no se confunde con el del caso', () => {
    expect(CONCEPTS.STATE_ACTIVE).not.toBe(DELEG.LIFECYCLE_OPEN);
  });
});
