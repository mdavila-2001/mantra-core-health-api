import { jest } from '@jest/globals';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { checklistFor } from '../domain';
import { LifecycleRepository } from '../repositories/lifecycle.repository';
import { STATUS } from './concept-maps';
import { memoryEm } from './lifecycle.testing';
import { SupportOnboardingGate } from './support-onboarding-gate';
import { DEFAULT_LIFECYCLE_SETTINGS } from './support-lifecycle-settings';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');
const SINCE = new Date('2026-11-02T04:00:00Z');

const record = (
  id: string,
  createdAt: string,
  over: Record<string, unknown> = {},
): any => ({
  assignment: {
    id,
    statusConceptId: STATUS.ACTIVE,
    createdAt: new Date(createdAt),
    nextRecertificationAt: new Date('2027-11-02'),
    ...over,
  },
  tenantId: 'org-1',
  userId: `user-${id}`,
  membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
});

function build(
  settings = { ...DEFAULT_LIFECYCLE_SETTINGS, onboardingRequiredSince: SINCE },
) {
  const { em, tables } = memoryEm(mockFn);
  const lifecycle = new LifecycleRepository();
  const facts = {
    platformIdentityVerified: mockFn().mockResolvedValue(true),
    mfaEnrolled: mockFn().mockResolvedValue(true),
    doctorAcceptances: mockFn().mockResolvedValue({ pending: 0, total: 0 }),
  };
  const reader = { forTenant: mockFn().mockResolvedValue(settings) };
  const gate = new SupportOnboardingGate(
    lifecycle,
    reader as any,
    facts as any,
  );
  /** Caso JOINER abierto con la lista indicada. */
  const joiner = (
    engagementId: string,
    patch: Record<string, 'DONE' | 'PENDING'> = {},
  ) => {
    const items = checklistFor('JOINER').map((i) => ({
      ...i,
      status: patch[i.code] ?? i.status,
    }));
    return lifecycle.createCase(em, {
      tenantId: 'org-1',
      organizationUserAssignmentId: engagementId,
      subjectUserId: `user-${engagementId}`,
      kindConceptId: DELEG.LIFECYCLE_JOINER,
      openedAt: NOW,
      checklist: items,
    });
  };
  return { em, tables, gate, facts, reader, joiner };
}

describe('SupportOnboardingGate (D-03, caso L-06)', () => {
  it('vínculo nuevo con dueño sin asignar: ONBOARDING_INCOMPLETE con lo que falta', async () => {
    const t = build();
    t.joiner('nora', { CONFIDENTIALITY_ACK: 'DONE' });
    const out = await t.gate.gatesFor(
      t.em,
      [record('nora', '2026-11-03T09:00:00Z')],
      NOW,
    );
    expect(out.get('nora')).toEqual({
      incomplete: true,
      pending: ['SUPERVISOR_ASSIGNED'],
    });
  });

  it('con el dueño asignado ya no bloquea', async () => {
    const t = build();
    t.joiner('nora', { CONFIDENTIALITY_ACK: 'DONE' });
    const rec = record('nora', '2026-11-03T09:00:00Z', {
      supervisorUserId: 'mendez',
    });
    const out = await t.gate.gatesFor(t.em, [rec], NOW);
    expect(out.get('nora')).toEqual({ incomplete: false, pending: [] });
  });

  it('Ana, creada antes de la compuerta, nunca pasó por ella', async () => {
    const t = build();
    const out = await t.gate.gatesFor(
      t.em,
      [record('ana', '2026-06-01T09:00:00Z')],
      NOW,
    );
    expect(out.get('ana')).toEqual({ incomplete: false, pending: [] });
  });

  it('un vínculo con onboarding_completed_at no gasta consultas: 0 consultas más que hoy en el camino caliente', async () => {
    const t = build();
    const done = record('mario', '2026-11-03T09:00:00Z', {
      onboardingCompletedAt: NOW,
    });
    const out = await t.gate.gatesFor(t.em, [done], NOW);
    expect(out.get('mario')).toEqual({ incomplete: false, pending: [] });
    expect(t.reader.forTenant).not.toHaveBeenCalled();
    expect(t.em.findOne).not.toHaveBeenCalled();
  });

  it('con la compuerta apagada (onboardingRequired = false) la lista no bloquea', async () => {
    const t = build({
      ...DEFAULT_LIFECYCLE_SETTINGS,
      onboardingRequired: false,
      onboardingRequiredSince: SINCE,
    });
    t.joiner('nora');
    const out = await t.gate.gatesFor(
      t.em,
      [record('nora', '2026-11-03T09:00:00Z')],
      NOW,
    );
    expect(out.get('nora')?.incomplete).toBe(false);
  });

  it('sin caso JOINER (vínculo que nunca lo abrió) se deduce de los hechos, sin inventar el compromiso', async () => {
    const t = build();
    const out = await t.gate.gatesFor(
      t.em,
      [record('nuevo', '2026-11-03T09:00:00Z')],
      NOW,
    );
    expect(out.get('nuevo')?.incomplete).toBe(true);
    expect(out.get('nuevo')?.pending).toEqual([
      'CONFIDENTIALITY_ACK',
      'SUPERVISOR_ASSIGNED',
    ]);
  });

  it('un vínculo suspendido o terminado no se evalúa (la política ya lo corta antes)', async () => {
    const t = build();
    const rec = record('nora', '2026-11-03T09:00:00Z', {
      statusConceptId: STATUS.SUSPENDED,
    });
    const out = await t.gate.gatesFor(t.em, [rec], NOW);
    expect(out.get('nora')?.incomplete).toBe(false);
  });
});
