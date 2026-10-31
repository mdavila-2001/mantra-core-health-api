import {
  canSetStatus,
  canTransition,
  defaultSlaDueAt,
  hasOpenClinical,
  heldByOther,
  planReply,
  planTake,
  reopensOnMessage,
  slaHoursFromEnv,
  type AssignmentState,
} from './support-inbox.rules';

describe('transiciones de la bandeja (NEW → TAKEN → WAITING_DOCTOR → RESOLVED)', () => {
  it.each<[AssignmentState, AssignmentState, boolean]>([
    ['NEW', 'TAKEN', true],
    ['TAKEN', 'WAITING_DOCTOR', true],
    ['TAKEN', 'RESOLVED', true],
    ['WAITING_DOCTOR', 'TAKEN', true],
    ['WAITING_DOCTOR', 'RESOLVED', true],
    ['RESOLVED', 'TAKEN', true],
    ['NEW', 'RESOLVED', false],
    ['NEW', 'WAITING_DOCTOR', true],
    ['RESOLVED', 'WAITING_DOCTOR', false],
    ['TAKEN', 'NEW', false],
    ['TAKEN', 'TAKEN', false],
  ])('%s → %s: %s', (from, to, allowed) => {
    expect(canTransition(from, to)).toBe(allowed);
  });
});

describe('plazo (SLA)', () => {
  it('por defecto 24 horas', () => {
    const now = new Date('2026-10-30T12:00:00Z');
    expect(defaultSlaDueAt(now, 24).toISOString()).toBe(
      '2026-10-31T12:00:00.000Z',
    );
  });

  it('se configura con SUPPORT_INBOX_SLA_HOURS y un valor inválido no lo anula', () => {
    expect(slaHoursFromEnv({})).toBe(24);
    expect(slaHoursFromEnv({ SUPPORT_INBOX_SLA_HOURS: '8' })).toBe(8);
    expect(slaHoursFromEnv({ SUPPORT_INBOX_SLA_HOURS: '0' })).toBe(24);
    expect(slaHoursFromEnv({ SUPPORT_INBOX_SLA_HOURS: 'x' })).toBe(24);
  });
});

describe('planTake (tomar una conversación)', () => {
  it('una conversación nueva se toma y queda a nombre de quien la toma', () => {
    expect(
      planTake({ status: 'NEW' }, 'user-ana', { clinicalSuspected: false }),
    ).toEqual({ ok: true, status: 'TAKEN', referredToDoctor: false });
  });

  it('si el último mensaje del paciente parece clínico se deriva al doctor en vez de quedar tomada', () => {
    expect(
      planTake({ status: 'NEW' }, 'user-ana', { clinicalSuspected: true }),
    ).toEqual({ ok: true, status: 'WAITING_DOCTOR', referredToDoctor: true });
  });

  it('una conversación tomada por otra persona no se toma', () => {
    expect(
      planTake({ status: 'TAKEN', assignedUserId: 'otra' }, 'user-ana', {
        clinicalSuspected: false,
      }),
    ).toEqual({ ok: false, reason: 'ALREADY_TAKEN' });
  });

  it('tomarla de nuevo quien ya la tiene es idempotente', () => {
    expect(
      planTake({ status: 'TAKEN', assignedUserId: 'user-ana' }, 'user-ana', {
        clinicalSuspected: false,
      }),
    ).toEqual({ ok: true, status: 'TAKEN', referredToDoctor: false });
  });

  it('una resuelta se reabre al tomarla', () => {
    expect(
      planTake({ status: 'RESOLVED', assignedUserId: 'otra' }, 'user-ana', {
        clinicalSuspected: false,
      }),
    ).toEqual({ ok: true, status: 'TAKEN', referredToDoctor: false });
  });
});

describe('canSetStatus (el estado final que piden las pantallas)', () => {
  it.each<[AssignmentState, AssignmentState, boolean]>([
    ['NEW', 'TAKEN', true],
    ['NEW', 'WAITING_DOCTOR', true],
    ['NEW', 'RESOLVED', true],
    ['TAKEN', 'NEW', true],
    ['WAITING_DOCTOR', 'NEW', true],
    ['TAKEN', 'RESOLVED', true],
    ['RESOLVED', 'TAKEN', true],
    ['RESOLVED', 'NEW', false],
    ['RESOLVED', 'WAITING_DOCTOR', false],
  ])('%s → %s: %s', (from, to, allowed) => {
    expect(canSetStatus(from, to)).toBe(allowed);
  });

  it('no relaja lo que canTransition prohíbe para quien pide una acción', () => {
    expect(canTransition('TAKEN', 'NEW')).toBe(false);
    expect(canTransition('NEW', 'RESOLVED')).toBe(false);
  });
});

describe('heldByOther', () => {
  it('la tiene otra persona si está tomada o derivada a nombre de alguien más', () => {
    expect(
      heldByOther({ status: 'TAKEN', assignedUserId: 'otra' }, 'ana'),
    ).toBe(true);
    expect(
      heldByOther({ status: 'WAITING_DOCTOR', assignedUserId: 'otra' }, 'ana'),
    ).toBe(true);
  });

  it('no retiene nadie si es nueva o resuelta, ni quien la tiene a su propio nombre', () => {
    expect(heldByOther({ status: 'NEW', assignedUserId: 'otra' }, 'ana')).toBe(
      false,
    );
    expect(
      heldByOther({ status: 'RESOLVED', assignedUserId: 'otra' }, 'ana'),
    ).toBe(false);
    expect(heldByOther({ status: 'TAKEN', assignedUserId: 'ana' }, 'ana')).toBe(
      false,
    );
    expect(heldByOther({ status: 'TAKEN' }, 'ana')).toBe(false);
  });
});

describe('planReply (responder en nombre del doctor)', () => {
  it('quien responde una conversación libre se hace cargo de ella', () => {
    expect(
      planReply({ status: 'NEW' }, 'ana', { openClinical: false }),
    ).toEqual({
      ok: true,
      status: 'TAKEN',
      assignedUserId: 'ana',
    });
  });

  it('otra persona la tiene: no responde', () => {
    expect(
      planReply({ status: 'TAKEN', assignedUserId: 'otra' }, 'ana', {
        openClinical: false,
      }),
    ).toEqual({ ok: false, reason: 'HELD_BY_OTHER' });
  });

  it('un mensaje clínico sin derivar no se responde, lo clínico es del doctor', () => {
    expect(
      planReply({ status: 'TAKEN', assignedUserId: 'ana' }, 'ana', {
        openClinical: true,
      }),
    ).toEqual({ ok: false, reason: 'CLINICAL_REQUIRES_DERIVATION' });
    expect(planReply({ status: 'NEW' }, 'ana', { openClinical: true })).toEqual(
      {
        ok: false,
        reason: 'CLINICAL_REQUIRES_DERIVATION',
      },
    );
  });

  it('la dueña tiene prioridad: con otra dueña y clínico, es 409', () => {
    expect(
      planReply({ status: 'TAKEN', assignedUserId: 'otra' }, 'ana', {
        openClinical: true,
      }),
    ).toEqual({ ok: false, reason: 'HELD_BY_OTHER' });
  });

  it('una conversación ya derivada sigue derivada y conserva a quien la derivó', () => {
    expect(
      planReply({ status: 'WAITING_DOCTOR', assignedUserId: 'ana' }, 'ana', {
        openClinical: true,
      }),
    ).toEqual({ ok: true, status: 'WAITING_DOCTOR', assignedUserId: 'ana' });
  });

  it('una resuelta se retoma a nombre de quien responde', () => {
    expect(
      planReply({ status: 'RESOLVED', assignedUserId: 'otra' }, 'ana', {
        openClinical: false,
      }),
    ).toEqual({ ok: true, status: 'TAKEN', assignedUserId: 'ana' });
  });
});

describe('reopensOnMessage (reapertura automática)', () => {
  it('una resuelta se reabre solo cuando escribe el paciente', () => {
    expect(reopensOnMessage('RESOLVED', true)).toBe(true);
    expect(reopensOnMessage('RESOLVED', false)).toBe(false);
  });

  it('las demás no cambian de estado por un mensaje', () => {
    for (const status of ['NEW', 'TAKEN', 'WAITING_DOCTOR'] as const) {
      expect(reopensOnMessage(status, true)).toBe(false);
    }
  });
});

describe('hasOpenClinical', () => {
  const clinical = (text: string): boolean => /dolor/.test(text);
  it('hay uno clínico entre los sin responder', () => {
    expect(hasOpenClinical(['hola', 'tengo dolor'], clinical)).toBe(true);
  });
  it('sin textos, o con textos vacíos, no hay nada abierto', () => {
    expect(hasOpenClinical([], clinical)).toBe(false);
    expect(hasOpenClinical([null, undefined, ''], clinical)).toBe(false);
  });
});
