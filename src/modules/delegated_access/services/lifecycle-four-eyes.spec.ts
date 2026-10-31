import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { hashPayload } from '../domain';
import { LifecycleApprovalExecutors } from './lifecycle-approval-executors';
import { LifecycleFourEyes } from './lifecycle-four-eyes';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('LifecycleFourEyes.request', () => {
  const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
  const payload = {
    engagementId: 'eng-nora',
    effectiveAt: '2026-11-03T14:30:00.000Z',
    grants: [
      {
        targetKind: 'PRACTITIONER',
        actions: ['patients.profile.view.document_full'],
      },
    ],
  };

  function build() {
    const row = { id: 'ap-1', expiresAt: new Date('2026-11-10T14:30:00Z') };
    const service = { requestAdministrative: mockFn().mockResolvedValue(row) };
    return {
      service,
      lifecycleFourEyes: new LifecycleFourEyes(service as any),
    };
  }

  it('pide una solicitud administrativa de segundo aprobador, con el cuerpo canónico y el vínculo afectado', async () => {
    const t = build();
    const tx = {} as any;
    const out = await t.lifecycleFourEyes.request(tx, {
      tenantId: 'org-1',
      kind: 'ENGAGEMENT_MOVE',
      actor: ADMIN,
      subjectUserId: 'nora',
      engagementId: 'eng-nora',
      payload,
      reasonText: 'Pasa a coordinar enfermería',
    });
    expect(out).toEqual({
      approvalId: 'ap-1',
      expiresAt: new Date('2026-11-10T14:30:00Z'),
      approverKind: 'SECOND_APPROVER',
    });
    expect(t.service.requestAdministrative).toHaveBeenCalledWith(tx, {
      tenantId: 'org-1',
      kind: 'ENGAGEMENT_MOVE',
      actor: ADMIN,
      subjectUserId: 'nora',
      organizationUserAssignmentId: 'eng-nora',
      approverKind: 'SECOND_APPROVER',
      payload,
      reasonText: 'Pasa a coordinar enfermería',
    });
    // El hash del cuerpo lo calcula el servicio con el mismo dominio.
    expect(hashPayload(payload)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('una solicitud igual ya pendiente (409 FOUR_EYES_DUPLICATE_PENDING) se propaga tal cual', async () => {
    const t = build();
    const dup = Object.assign(new Error('duplicada'), {
      reason: Reason.FOUR_EYES_DUPLICATE_PENDING,
    });
    t.service.requestAdministrative.mockRejectedValue(dup);
    await expect(
      t.lifecycleFourEyes.request({} as any, {
        tenantId: 'org-1',
        kind: 'REACTIVATION',
        actor: ADMIN,
        subjectUserId: 'ana',
        engagementId: 'eng-ana',
        payload: { engagementId: 'eng-ana' },
      }),
    ).rejects.toBe(dup);
  });
});

describe('LifecycleApprovalExecutors', () => {
  function build() {
    const move = {
      executeApproved: mockFn().mockResolvedValue({ grantsCreated: 2 }),
    };
    const suspension = {
      executeReactivation: mockFn().mockResolvedValue({ reactivated: true }),
    };
    const executors = new LifecycleApprovalExecutors(
      move as any,
      suspension as any,
    );
    return { move, suspension, executors };
  }
  const requestOf = (kind: string, payload: unknown, hash?: string): any => ({
    id: 'ap-1',
    tenantId: 'org-1',
    kindConceptId: kind,
    requesterUserId: 'admin-1',
    payloadJson: payload,
    payloadHash: hash ?? hashPayload(payload),
  });

  it('al arrancar registra el cambio de rol y la reactivación en el registro de cuatro ojos', async () => {
    const move = {
      executeApproved: mockFn().mockResolvedValue({ grantsCreated: 1 }),
    };
    const registry = { register: mockFn() };
    const executors = new LifecycleApprovalExecutors(
      move as any,
      {} as any,
      registry as any,
    );
    executors.onModuleInit();
    expect(
      registry.register.mock.calls.map((c: any[]) => c[0].kind).sort(),
    ).toEqual(['ENGAGEMENT_MOVE', 'REACTIVATION']);
    const mover = registry.register.mock.calls.find(
      (c: any[]) => c[0].kind === 'ENGAGEMENT_MOVE',
    )[0];
    const payload = { engagementId: 'e1' };
    const row = {
      tenantId: 'org-1',
      kindConceptId: DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE,
      requesterUserId: 'admin-1',
      payloadJson: payload,
      payloadHash: hashPayload(payload),
    };
    await mover.execute({}, row, { approverUserId: 'gonzalo' });
    expect(move.executeApproved).toHaveBeenCalledWith(
      {},
      'org-1',
      payload,
      'admin-1',
      'gonzalo',
    );
  });

  it('reconoce solo los tipos del ciclo de vida', () => {
    const { executors } = build();
    expect(executors.handles(DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE)).toBe(true);
    expect(executors.handles(DELEG.FOUR_EYES_KIND_REACTIVATION)).toBe(true);
    expect(executors.handles(DELEG.FOUR_EYES_KIND_ACTION)).toBe(false);
  });

  it('ejecuta el cambio de rol aprobado con el cuerpo firmado y devuelve el resultado', async () => {
    const { executors, move } = build();
    const payload = { engagementId: 'e1', grants: [] };
    const out = await executors.execute(
      {} as any,
      requestOf(DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE, payload),
      'gonzalo',
    );
    expect(out).toEqual({ grantsCreated: 2 });
    expect(move.executeApproved).toHaveBeenCalledWith(
      {},
      'org-1',
      payload,
      'admin-1',
      'gonzalo',
    );
  });

  it('ejecuta la reactivación aprobada', async () => {
    const { executors, suspension } = build();
    const payload = { engagementId: 'e1', suspensionReason: 'MANUAL' };
    await executors.execute(
      {} as any,
      requestOf(DELEG.FOUR_EYES_KIND_REACTIVATION, payload),
      'gonzalo',
    );
    expect(suspension.executeReactivation).toHaveBeenCalledWith(
      {},
      'org-1',
      payload,
      'admin-1',
      'gonzalo',
    );
  });

  it('un cuerpo que ya no coincide con su hash: 409 FOUR_EYES_PAYLOAD_CHANGED y no ejecuta nada', async () => {
    const { executors, move } = build();
    const req = requestOf(
      DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE,
      { engagementId: 'e1' },
      'a'.repeat(64),
    );
    await expect(
      executors.execute({} as any, req, 'gonzalo'),
    ).rejects.toMatchObject({
      reason: Reason.FOUR_EYES_PAYLOAD_CHANGED,
    });
    expect(move.executeApproved).not.toHaveBeenCalled();
  });

  it('un tipo que no es suyo no se ejecuta', async () => {
    const { executors } = build();
    await expect(
      executors.execute(
        {} as any,
        requestOf(DELEG.FOUR_EYES_KIND_ACTION, {}),
        'gonzalo',
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
  });
});
