import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { AUTHZ } from '../../authz/authz.concepts';
import { actionPayload, hashPayload } from '../domain';
import { FourEyesExecutors, FourEyesService } from './four-eyes.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const MARCOS = { id: 'marcos', roles: ['SUPPORT_STAFF'] } as any;
const PEREZ = { id: 'dr-perez', roles: ['PRACTITIONER'] } as any;
const SUAREZ = { id: 'dr-suarez', roles: ['PRACTITIONER'] } as any;
const GONZALO = {
  id: 'gonzalo',
  roles: ['SECURITY_ADMIN'],
  sessionId: 's',
} as any;
const SOFIA = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;

const actionRow = (over: Record<string, unknown> = {}): any => {
  const payload = actionPayload({
    atom: 'agenda.appointment.cancel',
    practitionerRoleAssignmentId: 'role-suarez',
    patientProfileId: 'pat-1',
    appointmentStartAt: new Date('2026-11-04T13:00:00Z'),
  });
  return {
    id: 'fe-1',
    tenantId: TENANT,
    kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
    requesterUserId: 'marcos',
    subjectUserId: undefined,
    permissionCode: 'agenda.appointment.cancel',
    approverKindConceptId: AUTHZ.APPROVAL_DOCTOR,
    payloadJson: payload,
    payloadHash: hashPayload(payload),
    payloadSchemaVersion: 1,
    reasonText: 'Paciente avisó que no viene',
    statusConceptId: DELEG.FOUR_EYES_PENDING,
    expiresAt: new Date(NOW.getTime() + 3_600_000),
    createdAt: new Date(NOW.getTime() - 60_000),
    ...over,
  };
};

function build(
  opts: {
    rows?: any[];
    directory?: any;
    decision?: any;
    engagements?: any[];
    settingsTtl?: number;
    flushError?: unknown;
    /** N-6: ¿el paciente tiene relación con la organización? Por defecto sí. */
    patientLinked?: boolean;
  } = {},
) {
  const rows = opts.rows ?? [];
  const tx: any = {
    flush: mockFn(async () => {
      if (opts.flushError) throw opts.flushError;
    }),
    // N-6: `isPatientLinkedToTenant` consulta con SQL crudo.
    execute: mockFn().mockResolvedValue(
      opts.patientLinked === false ? [] : [{ ok: 1 }],
    ),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const repo = {
    findById: mockFn(
      async (_e: any, _t: string, id: string) =>
        rows.find((r) => r.id === id) ?? null,
    ),
    findPendingByTenant: mockFn(async () =>
      rows.filter((r) => r.statusConceptId === DELEG.FOUR_EYES_PENDING),
    ),
    findPendingDuplicate: mockFn().mockResolvedValue(null),
    lockRequesterQueue: mockFn().mockResolvedValue(undefined),
    countPendingByRequester: mockFn(
      async (_e: any, _t: string, u: string, now: Date = new Date()) =>
        rows.filter(
          (r) =>
            r.requesterUserId === u &&
            r.statusConceptId === DELEG.FOUR_EYES_PENDING &&
            r.kindConceptId === DELEG.FOUR_EYES_KIND_ACTION &&
            r.expiresAt.getTime() > now.getTime(),
        ).length,
    ),
    findByRequester: mockFn(async (_e: any, userId: string) =>
      rows.filter((r) => r.requesterUserId === userId),
    ),
    create: mockFn((_e: any, data: any) => {
      const row = {
        id: 'fe-new',
        createdAt: NOW,
        statusConceptId: DELEG.FOUR_EYES_PENDING,
        kindConceptId: data.kindConceptId,
        requesterUserId: data.requesterUserId,
        subjectUserId: data.subjectUserId,
        permissionCode: data.permissionCode,
        approverKindConceptId: data.approverKindConceptId,
        payloadJson: data.payload,
        payloadHash: data.payloadHash,
        payloadSchemaVersion: data.payloadSchemaVersion,
        reasonText: data.reasonText,
        expiresAt: data.expiresAt,
        tenantId: data.tenantId,
      };
      rows.push(row);
      return row;
    }),
    consume: mockFn().mockResolvedValue(true),
    expireApproved: mockFn().mockResolvedValue(true),
    markExpired: mockFn((row: any) => {
      row.statusConceptId = DELEG.FOUR_EYES_EXPIRED;
    }),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue(
      opts.engagements ?? [
        {
          assignment: { id: 'eng-marcos' },
          tenantId: TENANT,
          userId: 'marcos',
        },
      ],
    ),
  };
  const directory = {
    build: mockFn().mockResolvedValue(
      opts.directory ?? {
        securityAdminUserIds: ['gonzalo', 'otro-admin'],
        doctorUserIds: ['dr-suarez'],
        serviceHeadScopes: [],
      },
    ),
  };
  const executors = new FourEyesExecutors();
  const policy = {
    can: mockFn().mockResolvedValue(
      opts.decision ?? {
        allowed: false,
        effect: 'CHALLENGE',
        reason: 'APPROVAL_REQUIRED',
        challenge: {
          kind: 'APPROVAL',
          details: {
            approverKind: 'DOCTOR',
            atom: 'agenda.appointment.cancel',
          },
        },
      },
    ),
  };
  const settings = {
    read: mockFn().mockResolvedValue({
      settings: { fourEyesActionTtlMinutes: opts.settingsTtl ?? 60 },
    }),
  };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FourEyesService(
    em,
    repo as any,
    access as any,
    directory as any,
    executors,
    policy as any,
    settings as any,
    stepUp as any,
    audit as any,
    outbox as any,
    scope as any,
    logger as any,
  );
  jest.useFakeTimers({ now: NOW });
  return {
    service,
    repo,
    access,
    directory,
    executors,
    policy,
    settings,
    stepUp,
    audit,
    outbox,
    tx,
    rows,
  };
}

afterEach(() => jest.useRealTimers());

const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as any;
  }
  return undefined;
};

describe('FourEyesService.createAction (pedir)', () => {
  const dto = {
    tenantId: TENANT,
    atom: 'agenda.appointment.cancel',
    practitionerRoleAssignmentId: 'role-suarez',
    patientProfileId: 'pat-1',
    appointmentStartAt: '2026-11-04T13:00:00.000Z',
    reasonText: 'Paciente avisó que no viene',
  };

  it('crea una solicitud ACTION con el cuerpo canónico y su hash, a 24 horas', async () => {
    const d = build();
    const out = await d.service.createAction(dto as any, MARCOS);
    const expectedPayload = actionPayload({
      atom: 'agenda.appointment.cancel',
      practitionerRoleAssignmentId: 'role-suarez',
      patientProfileId: 'pat-1',
      appointmentStartAt: new Date('2026-11-04T13:00:00Z'),
    });
    expect(d.repo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
        requesterUserId: 'marcos',
        permissionCode: 'agenda.appointment.cancel',
        approverKindConceptId: AUTHZ.APPROVAL_DOCTOR,
        payload: expectedPayload,
        payloadHash: hashPayload(expectedPayload),
        reasonText: 'Paciente avisó que no viene',
        expiresAt: new Date(NOW.getTime() + 24 * 3_600_000),
      }),
    );
    expect(out).toMatchObject({
      id: 'fe-new',
      kind: 'ACTION',
      status: 'PENDING',
      approverKind: 'DOCTOR',
    });
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'delegated_access.four_eyes.requested',
      }),
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      MARCOS,
      expect.objectContaining({
        action: 'FOUR_EYES_REQUESTED',
        tenantId: TENANT,
      }),
    );
  });

  it('pregunta a la política real (sin consumir nada): peek con el motivo y la hora de la cita', async () => {
    const d = build();
    await d.service.createAction(dto as any, MARCOS);
    expect(d.policy.can).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'marcos',
        tenantId: TENANT,
        action: 'agenda.appointment.cancel',
        practitionerRoleAssignmentId: 'role-suarez',
        context: expect.objectContaining({
          peek: true,
          patientProfileId: 'pat-1',
        }),
      }),
      d.tx,
    );
  });

  it('quien no tiene vínculo vivo en esa organización: 404 uniforme', async () => {
    const d = build({ engagements: [] });
    const err = await failure(d.service.createAction(dto as any, MARCOS));
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe('SUPPORT_ENGAGEMENT_NOT_FOUND');
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('N-6: un paciente sin relación con la organización responde el mismo 404 que un vínculo inexistente, sin consultar la política', async () => {
    // Antes la política (peek) leía edad, cobertura y banderas de CUALQUIER
    // paciente y la respuesta distinguía existente/inexistente (oráculo).
    const d = build({ patientLinked: false });
    const err = await failure(d.service.createAction(dto as any, MARCOS));
    const missingEngagement = await failure(
      build({ engagements: [] }).service.createAction(dto as any, MARCOS),
    );
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe('SUPPORT_ENGAGEMENT_NOT_FOUND');
    expect(err.getResponse()).toEqual(missingEngagement.getResponse());
    expect(d.policy.can).not.toHaveBeenCalled();
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('N-6: un paciente vinculado a la organización sigue pasando por la política', async () => {
    const d = build({ patientLinked: true });
    await d.service.createAction(dto as any, MARCOS);
    expect(d.policy.can).toHaveBeenCalled();
    const sql = String(d.tx.execute.mock.calls[0][0]);
    expect(sql).toContain('patient_tenant_link');
    expect(d.tx.execute.mock.calls[0][1]).toContain(TENANT);
    expect(d.tx.execute.mock.calls[0][1]).toContain('pat-1');
  });

  it('N-6: sin paciente en la solicitud no se consulta el vínculo', async () => {
    const d = build();
    const { patientProfileId: _omit, ...withoutPatient } = dto;
    await d.service.createAction(withoutPatient as any, MARCOS);
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('si la acción ya se puede hacer (PERMIT) no hay nada que aprobar: 422', async () => {
    const d = build({
      decision: { allowed: true, effect: 'PERMIT', reason: 'ALLOWED' },
    });
    const err = await failure(d.service.createAction(dto as any, MARCOS));
    expect(err.reason).toBe('FOUR_EYES_REQUEST_INVALID');
  });

  it('si ni con aprobación podría (DENY): 422 y no se pide', async () => {
    const d = build({
      decision: { allowed: false, effect: 'DENY', reason: 'NO_COVERING_GRANT' },
    });
    const err = await failure(d.service.createAction(dto as any, MARCOS));
    expect(err.reason).toBe('FOUR_EYES_REQUEST_INVALID');
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('una solicitud pendiente idéntica: 409 FOUR_EYES_DUPLICATE_PENDING', async () => {
    const d = build();
    d.repo.findPendingDuplicate.mockResolvedValue(actionRow());
    const err = await failure(d.service.createAction(dto as any, MARCOS));
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('FOUR_EYES_DUPLICATE_PENDING');
  });

  it('un átomo desconocido: 422 sin consultar nada', async () => {
    const d = build();
    const err = await failure(
      d.service.createAction(
        { ...dto, atom: 'inventado.algo.mas' } as any,
        MARCOS,
      ),
    );
    expect(err.reason).toBe('FOUR_EYES_REQUEST_INVALID');
    expect(d.policy.can).not.toHaveBeenCalled();
  });
});

describe('FourEyesService.decide (caso F-01)', () => {
  it('el doctor que no es el titular no puede aprobar: 403 FOUR_EYES_NOT_ELIGIBLE', async () => {
    const d = build({ rows: [actionRow()] });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, PEREZ),
      ),
    );
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe('FOUR_EYES_NOT_ELIGIBLE');
  });

  it('quien pidió no se aprueba a sí mismo: 403 FOUR_EYES_SELF_APPROVAL', async () => {
    const d = build({
      rows: [actionRow()],
      directory: {
        securityAdminUserIds: ['marcos'],
        doctorUserIds: ['marcos'],
        serviceHeadScopes: [],
      },
    });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, MARCOS),
      ),
    );
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe('FOUR_EYES_SELF_APPROVAL');
  });

  it('el titular aprueba: queda APPROVED con vigencia de 60 minutos (ajuste) y avisa', async () => {
    const row = actionRow();
    const d = build({ rows: [row] });
    const out = await run(() =>
      d.service.decide(
        'fe-1',
        { decision: 'APPROVE', comment: 'ok' } as any,
        SUAREZ,
      ),
    );
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_APPROVED);
    expect(row.decidedByUserId).toBe('dr-suarez');
    expect(row.approvedUntil).toEqual(new Date(NOW.getTime() + 60 * 60_000));
    expect(row.expiresAt).toEqual(row.approvedUntil);
    expect(out.approval.status).toBe('APPROVED');
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'delegated_access.four_eyes.approved',
      }),
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      SUAREZ,
      expect.objectContaining({ action: 'FOUR_EYES_APPROVED' }),
    );
  });

  it('respeta el ajuste fourEyesActionTtlMinutes', async () => {
    const row = actionRow();
    const d = build({ rows: [row], settingsTtl: 15 });
    await run(() =>
      d.service.decide('fe-1', { decision: 'APPROVE' } as any, SUAREZ),
    );
    expect(row.approvedUntil).toEqual(new Date(NOW.getTime() + 15 * 60_000));
  });

  it('rechazar exige comentario; con comentario queda REJECTED', async () => {
    const row = actionRow();
    const d = build({ rows: [row] });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'REJECT' } as any, SUAREZ),
      ),
    );
    expect(err.reason).toBe('COMMENT_REQUIRED');
    await run(() =>
      d.service.decide(
        'fe-1',
        { decision: 'REJECT', comment: 'No procede' } as any,
        SUAREZ,
      ),
    );
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_REJECTED);
    expect(row.decisionCommentText).toBe('No procede');
  });

  it('una solicitud ya decidida: 409 FOUR_EYES_NOT_PENDING', async () => {
    const d = build({
      rows: [actionRow({ statusConceptId: DELEG.FOUR_EYES_APPROVED })],
    });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, SUAREZ),
      ),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('FOUR_EYES_NOT_PENDING');
  });

  it('vencida: 409 FOUR_EYES_EXPIRED y queda EXPIRED guardada (no se deshace con el error)', async () => {
    const row = actionRow({ expiresAt: new Date(NOW.getTime() - 1000) });
    const d = build({ rows: [row] });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, SUAREZ),
      ),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('FOUR_EYES_EXPIRED');
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_EXPIRED);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('ajena o inexistente: 404 uniforme', async () => {
    const d = build({ rows: [] });
    const err = await failure(
      run(() =>
        d.service.decide('nadie', { decision: 'APPROVE' } as any, SUAREZ),
      ),
    );
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe('FOUR_EYES_NOT_FOUND');
  });

  it('el cuerpo guardado no coincide con su hash: 409 FOUR_EYES_PAYLOAD_CHANGED', async () => {
    const row = actionRow({ payloadHash: 'a'.repeat(64) });
    const d = build({ rows: [row] });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, SUAREZ),
      ),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('FOUR_EYES_PAYLOAD_CHANGED');
  });

  it('el CHECK de la base (23514) contra la autoaprobación sale como 403 FOUR_EYES_SELF_APPROVAL', async () => {
    const row = actionRow();
    const d = build({
      rows: [row],
      flushError: Object.assign(new Error('violates check constraint'), {
        code: '23514',
        constraint: 'ck_four_eyes_requests_not_self',
      }),
    });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, SUAREZ),
      ),
    );
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe('FOUR_EYES_SELF_APPROVAL');
  });

  it('cambio administrativo: ejecuta DENTRO de la transacción y queda EXECUTED', async () => {
    const payload = { engagementId: 'eng-1', ruleCode: 'SOD-BILL-03' };
    const row = actionRow({
      kindConceptId: DELEG.FOUR_EYES_KIND_SOD_EXCEPTION,
      permissionCode: undefined,
      subjectUserId: 'lucia',
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
      payloadJson: payload,
      payloadHash: hashPayload(payload),
    });
    const d = build({ rows: [row] });
    const execute = mockFn().mockResolvedValue({ exceptionId: 'exc-1' });
    d.executors.register({ kind: 'SOD_EXCEPTION', execute });
    const out = await run(() =>
      d.service.decide('fe-1', { decision: 'APPROVE' } as any, GONZALO),
    );
    expect(execute).toHaveBeenCalledWith(
      d.tx,
      row,
      expect.objectContaining({ approverUserId: 'gonzalo', tenantId: TENANT }),
    );
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_EXECUTED);
    expect(row.executionResultJson).toEqual({ exceptionId: 'exc-1' });
    expect(out.execution).toEqual({ exceptionId: 'exc-1' });
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      GONZALO,
      expect.objectContaining({ action: 'FOUR_EYES_EXECUTED' }),
    );
  });

  it('si lo aprobado ya no es válido el ejecutor falla y la solicitud sigue PENDING', async () => {
    const payload = { engagementId: 'eng-1' };
    const row = actionRow({
      kindConceptId: DELEG.FOUR_EYES_KIND_GRANT_CHANGE,
      permissionCode: undefined,
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
      payloadJson: payload,
      payloadHash: hashPayload(payload),
    });
    const d = build({ rows: [row] });
    d.executors.register({
      kind: 'GRANT_CHANGE',
      execute: mockFn().mockRejectedValue(
        Object.assign(new Error('x'), { reason: 'FOUR_EYES_PAYLOAD_INVALID' }),
      ),
    });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, GONZALO),
      ),
    );
    expect(err.reason).toBe('FOUR_EYES_PAYLOAD_INVALID');
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_PENDING);
  });

  it('un tipo administrativo sin ejecutor registrado no se aprueba: 422', async () => {
    const payload = { a: 1 };
    const row = actionRow({
      kindConceptId: DELEG.FOUR_EYES_KIND_REACTIVATION,
      permissionCode: undefined,
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
      payloadJson: payload,
      payloadHash: hashPayload(payload),
    });
    const d = build({ rows: [row] });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, GONZALO),
      ),
    );
    expect(err.reason).toBe('FOUR_EYES_KIND_UNSUPPORTED');
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_PENDING);
  });

  it('sensibilidad CRÍTICA: el aprobador necesita su paso extra', async () => {
    const row = actionRow({
      permissionCode: 'billing.receipt.void',
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
    });
    const d = build({ rows: [row] });
    d.stepUp.assertFresh.mockRejectedValue(
      Object.assign(new Error('paso'), { reason: 'STEP_UP_REQUIRED' }),
    );
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, GONZALO),
      ),
    );
    expect(err.reason).toBe('STEP_UP_REQUIRED');
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_PENDING);
  });

  it('REACTIVATION de una investigación: solo un administrador de seguridad (caso L-05)', async () => {
    const payload = {
      engagementId: 'eng-ana',
      suspensionReason: 'INVESTIGATION',
    };
    const row = actionRow({
      kindConceptId: DELEG.FOUR_EYES_KIND_REACTIVATION,
      permissionCode: undefined,
      subjectUserId: 'ana',
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
      payloadJson: payload,
      payloadHash: hashPayload(payload),
    });
    const d = build({
      rows: [row],
      directory: {
        securityAdminUserIds: ['gonzalo'],
        doctorUserIds: [],
        serviceHeadScopes: [
          { adminUserId: 'sofia', target: { targetKind: 'ALL' } },
        ],
      },
    });
    d.executors.register({
      kind: 'REACTIVATION',
      execute: mockFn().mockResolvedValue({ reactivated: true }),
    });
    const err = await failure(
      run(() =>
        d.service.decide('fe-1', { decision: 'APPROVE' } as any, SOFIA),
      ),
    );
    expect(err.reason).toBe('FOUR_EYES_NOT_ELIGIBLE');
    await run(() =>
      d.service.decide('fe-1', { decision: 'APPROVE' } as any, GONZALO),
    );
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_EXECUTED);
  });
});

describe('FourEyesService.consume (una sola vez)', () => {
  it('la primera ejecución gana; las demás reciben FOUR_EYES_ALREADY_CONSUMED', async () => {
    const d = build();
    let spent = false;
    d.repo.consume.mockImplementation(async () => {
      if (spent) return false;
      spent = true;
      return true;
    });
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => d.service.consume(d.tx, 'fe-1', NOW)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter(
      (r) => r.status === 'rejected',
    ) as PromiseRejectedResult[];
    expect(rejected).toHaveLength(9);
    expect(rejected[0].reason.reason).toBe('FOUR_EYES_ALREADY_CONSUMED');
  });
});

describe('FourEyesService.cancel / pending / listMine', () => {
  it('cancelar: solo quien pidió y solo si sigue pendiente', async () => {
    const row = actionRow();
    const d = build({ rows: [row] });
    const err = await failure(d.service.cancel('fe-1', PEREZ));
    expect(err.getStatus()).toBe(404);
    const out = await d.service.cancel('fe-1', MARCOS);
    expect(out.status).toBe('CANCELLED');
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      MARCOS,
      expect.objectContaining({ action: 'FOUR_EYES_CANCELLED' }),
    );
    const again = await failure(d.service.cancel('fe-1', MARCOS));
    expect(again.reason).toBe('FOUR_EYES_NOT_PENDING');
  });

  it('pendientes: solo lo que YO puedo decidir', async () => {
    const mine = actionRow({ id: 'fe-a' });
    const yours = actionRow({
      id: 'fe-b',
      approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
    });
    const d = build({ rows: [mine, yours] });
    const forDoctor = await run(() => d.service.pending(SUAREZ));
    expect(forDoctor.items.map((i) => i.id)).toEqual(['fe-a']);
    const forAdmin = await run(() => d.service.pending(GONZALO));
    expect(forAdmin.items.map((i) => i.id)).toEqual(['fe-b']);
  });

  it('B-M7: una persona no llena la cola: con 10 pendientes la siguiente es 409 FOUR_EYES_TOO_MANY_PENDING', async () => {
    const base = {
      tenantId: TENANT,
      atom: 'agenda.appointment.cancel',
      practitionerRoleAssignmentId: 'role-suarez',
      patientProfileId: 'pat-1',
      reasonText: 'Paciente avisó que no viene',
    };
    const d = build();
    for (let i = 0; i < 10; i++) {
      await d.service.createAction(
        {
          ...base,
          appointmentStartAt: `2026-11-04T1${i % 10}:00:00.000Z`,
        } as any,
        MARCOS,
      );
    }
    expect(d.rows.filter((r) => r.requesterUserId === 'marcos')).toHaveLength(
      10,
    );
    const err = await failure(
      d.service.createAction(
        { ...base, appointmentStartAt: '2026-11-05T09:00:00.000Z' } as any,
        MARCOS,
      ),
    );
    expect(err.reason).toBe('FOUR_EYES_TOO_MANY_PENDING');
    expect(err.getStatus()).toBe(409);
    expect(d.rows.filter((r) => r.requesterUserId === 'marcos')).toHaveLength(
      10,
    );
    // Otra persona no queda bloqueada por Marcos.
    await d.service
      .createAction(
        { ...base, appointmentStartAt: '2026-11-05T09:00:00.000Z' } as any,
        { id: 'otra', roles: ['SUPPORT_STAFF'] } as any,
      )
      .catch(() => undefined);
  });

  it('N-3: toma el cerrojo del solicitante ANTES de contar y de crear (la comprobación es atómica)', async () => {
    const d = build();
    const order: string[] = [];
    d.repo.lockRequesterQueue.mockImplementation(async () => {
      order.push('lock');
    });
    const count = d.repo.countPendingByRequester;
    d.repo.countPendingByRequester = mockFn(async (...a: any[]) => {
      order.push('count');
      return count(...a);
    });
    d.repo.create.mockImplementation(((_e: any, data: any) => {
      order.push('create');
      return {
        id: 'fe-new',
        createdAt: NOW,
        statusConceptId: DELEG.FOUR_EYES_PENDING,
        kindConceptId: data.kindConceptId,
        requesterUserId: data.requesterUserId,
        payloadJson: data.payload,
        payloadHash: data.payloadHash,
        approverKindConceptId: data.approverKindConceptId,
        expiresAt: data.expiresAt,
        tenantId: data.tenantId,
      };
    }) as any);
    await d.service.createAction(
      {
        tenantId: TENANT,
        atom: 'agenda.appointment.cancel',
        practitionerRoleAssignmentId: 'role-suarez',
        patientProfileId: 'pat-1',
        appointmentStartAt: '2026-11-04T13:00:00.000Z',
        reasonText: 'Paciente avisó que no viene',
      } as any,
      MARCOS,
    );
    expect(order).toEqual(['lock', 'count', 'create']);
    expect(d.repo.lockRequesterQueue).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      'marcos',
    );
  });

  it('N-3: lo vencido (aún PENDING hasta el barrido) y las solicitudes administrativas no cuentan para el tope', async () => {
    const base = {
      tenantId: TENANT,
      atom: 'agenda.appointment.cancel',
      practitionerRoleAssignmentId: 'role-suarez',
      patientProfileId: 'pat-1',
      reasonText: 'Paciente avisó que no viene',
    };
    const stale = Array.from({ length: 10 }, (_, i) =>
      actionRow({
        id: `fe-old-${i}`,
        requesterUserId: 'marcos',
        expiresAt: new Date(NOW.getTime() - 60_000 * (i + 1)),
      }),
    );
    const admin = Array.from({ length: 10 }, (_, i) =>
      actionRow({
        id: `fe-adm-${i}`,
        requesterUserId: 'marcos',
        kindConceptId: DELEG.FOUR_EYES_KIND_GRANT_CHANGE,
      }),
    );
    const d = build({ rows: [...stale, ...admin] });
    const out = await d.service.createAction(
      { ...base, appointmentStartAt: '2026-11-05T09:00:00.000Z' } as any,
      MARCOS,
    );
    expect(out.status).toBe('PENDING');
    expect(d.repo.countPendingByRequester).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      'marcos',
      NOW,
    );
  });

  it('B-M7: pendientes pagina y pide a SQL solo lo vigente y ajeno; el directorio se arma una vez por agenda, no por fila', async () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      actionRow({
        id: `fe-${String(i).padStart(2, '0')}`,
        requesterUserId: 'basura',
        expiresAt: new Date(NOW.getTime() + (i + 1) * 60_000),
      }),
    );
    const d = build({ rows });
    d.repo.findPendingByTenant.mockImplementation(
      async (_e: any, _t: string, limit: number, o: any = {}) =>
        rows
          .filter((r) => !o.after || r.id > o.after.id)
          .filter((r) => r.requesterUserId !== o.excludeRequesterUserId)
          .slice(0, limit),
    );
    const first = await run(() =>
      d.service.pending(SUAREZ, { limit: 10 } as any),
    );
    expect(first.items).toHaveLength(10);
    expect((first as any).nextCursor).toEqual(expect.any(String));
    // Las 30 filas son de la MISMA agenda: un solo directorio, no 10.
    expect(d.directory.build).toHaveBeenCalledTimes(1);
    const second = await run(() =>
      d.service.pending(SUAREZ, {
        limit: 10,
        cursor: (first as any).nextCursor,
      } as any),
    );
    expect(second.items).toHaveLength(10);
    expect(second.items[0].id).toBe('fe-10');
    const args = d.repo.findPendingByTenant.mock.calls[0];
    expect(args[3]).toMatchObject({ excludeRequesterUserId: 'dr-suarez' });
  });

  describe('N-1: el aprobador de un GRANT_CHANGE ve lo que se ejecutará', () => {
    const payload = {
      op: 'ADD',
      engagementId: 'eng-1',
      assignmentRowVersion: 0,
      reasons: ['SCOPE_WIDENED'],
      criticalAtoms: ['billing.payment.refund', 'billing.receipt.void'],
      grant: { targetKind: 'ALL', actions: ['billing.receipt.void'] },
    };
    const changeRow = (): any =>
      actionRow({
        id: 'fe-gc',
        kindConceptId: DELEG.FOUR_EYES_KIND_GRANT_CHANGE,
        approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
        permissionCode: 'billing.receipt.void',
        subjectUserId: 'user-ana',
        payloadJson: payload,
        payloadHash: hashPayload(payload),
      });
    const details = { op: 'ADD', criticalAtoms: [{ code: 'x' }] };

    it('pending trae el detalle del ejecutor y un resumen con los NOMBRES de todos los átomos críticos', async () => {
      const d = build({ rows: [changeRow()] });
      const describe = mockFn(
        async (_tx: any, rows: any[]) =>
          new Map(rows.map((r: any) => [r.id, details])),
      );
      d.executors.register({
        kind: 'GRANT_CHANGE',
        execute: mockFn(),
        describe,
      } as any);
      const out = await run(() => d.service.pending(GONZALO));
      expect(out.items).toHaveLength(1);
      expect(out.items[0].details).toBe(details);
      expect(out.items[0].summary).toBe(
        'Cambio de permisos con permisos críticos: Devolver pagos, Anular comprobantes.',
      );
      expect(describe).toHaveBeenCalledTimes(1);
      expect(describe.mock.calls[0][1].map((r: any) => r.id)).toEqual([
        'fe-gc',
      ]);
    });

    it('una solicitud de acción no pide detalle; un fallo al detallar deja el listado con su resumen', async () => {
      const d = build({
        rows: [
          changeRow(),
          actionRow({
            id: 'fe-a',
            approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
          }),
        ],
      });
      d.executors.register({
        kind: 'GRANT_CHANGE',
        execute: mockFn(),
        describe: mockFn().mockRejectedValue(new Error('base lenta')),
      } as any);
      const out = await run(() => d.service.pending(GONZALO));
      expect(out.items.map((i) => i.id).sort()).toEqual(['fe-a', 'fe-gc']);
      expect(out.items.every((i) => i.details === undefined)).toBe(true);
    });
  });

  it('los míos: lista las que yo pedí', async () => {
    const d = build({
      rows: [actionRow(), actionRow({ id: 'fe-2', requesterUserId: 'otra' })],
    });
    const out = await d.service.listMine(MARCOS);
    expect(out.items.map((i) => i.id)).toEqual(['fe-1']);
  });
});

describe('FourEyesService.requestGrantChange (B-M3, D-11)', () => {
  const input = (over: Record<string, unknown> = {}) => ({
    tenantId: TENANT,
    actor: GONZALO,
    subjectUserId: 'ana',
    engagementId: 'eng-ana',
    permissionCode: 'billing.receipt.void',
    payload: {
      op: 'ADD',
      engagementId: 'eng-ana',
      grant: { actions: ['billing.receipt.void'] },
    },
    reasonText: 'Cierre de caja de fin de mes',
    ...over,
  });

  it('crea un GRANT_CHANGE (segundo aprobador, 7 días) con el átomo y la persona afectada', async () => {
    const d = build();
    const row = await d.service.requestGrantChange(d.tx, input() as any);
    expect(row.id).toBe('fe-new');
    expect(d.repo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        kindConceptId: DELEG.FOUR_EYES_KIND_GRANT_CHANGE,
        requesterUserId: 'gonzalo',
        subjectUserId: 'ana',
        organizationUserAssignmentId: 'eng-ana',
        permissionCode: 'billing.receipt.void',
        approverKindConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
        expiresAt: new Date(NOW.getTime() + 7 * 24 * 3_600_000),
      }),
    );
  });

  it('un solo administrador de seguridad (o el otro es la persona afectada): 422 FOUR_EYES_NO_APPROVER y no se crea nada', async () => {
    const one = build({
      directory: {
        securityAdminUserIds: ['gonzalo'],
        doctorUserIds: [],
        serviceHeadScopes: [],
      },
    });
    const err = await failure(
      one.service.requestGrantChange(one.tx, input() as any),
    );
    expect(err.reason).toBe('FOUR_EYES_NO_APPROVER');
    expect(err.getStatus()).toBe(422);
    expect(one.repo.create).not.toHaveBeenCalled();
    const subject = build();
    const err2 = await failure(
      subject.service.requestGrantChange(
        subject.tx,
        input({ subjectUserId: 'otro-admin' }) as any,
      ),
    );
    expect(err2.reason).toBe('FOUR_EYES_NO_APPROVER');
  });
});
