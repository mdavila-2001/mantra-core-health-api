import { jest } from '@jest/globals';
import { SchedulingSupportAgendaService } from './scheduling-support-agenda.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const ORG = 'tenant-hospital';
const row = (id: string, over: Record<string, unknown> = {}) => ({
  bookingId: id,
  resourceId: 'res-rojas',
  practitionerProfileId: 'prof-rojas',
  startAt: new Date('2026-11-03T16:00:00Z'),
  endAt: new Date('2026-11-03T16:30:00Z'),
  statusConceptId: 'st',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  patientProfileId: `pat-${id}`,
  patientName: 'María Pérez Rojas',
  ...over,
});

function build(evaluate: any, rows: any[]) {
  const tx = { __tx: true };
  const prime = mockFn().mockResolvedValue(undefined);
  const evaluator: any = (q: any) => evaluate(q);
  evaluator.prime = prime;
  const repo = {
    findRows: mockFn().mockResolvedValue(rows),
    findActiveWaits: mockFn().mockResolvedValue([]),
    namesOf: mockFn().mockResolvedValue({
      doctors: new Map(),
      services: new Map(),
      spaces: new Map(),
    }),
  };
  const policy = {
    evaluator: mockFn().mockResolvedValue(evaluator),
    inTenantScope: mockFn((_e: any, _o: string, work: any) => work(tx)),
    orderDoctors: mockFn((d: any[]) => d),
  };
  const access = {
    sealSupportAgendaView: mockFn().mockResolvedValue(undefined),
  };
  const service = new SchedulingSupportAgendaService(
    {} as any,
    repo as any,
    policy as any,
    access as any,
  );
  return { service, prime, access };
}
const query = {
  org: ORG,
  from: '2026-11-02T00:00:00Z',
  to: '2026-11-09T00:00:00Z',
} as any;
const permit = (extra: Record<string, unknown> = {}) => ({
  allowed: true,
  reason: 'ALLOWED',
  grantId: 'g1',
  effect: 'PERMIT',
  ...extra,
});

describe('SchedulingSupportAgendaService: gobierno de accesos', () => {
  it('carga los pacientes de la lista EN LOTE (una sola vez, sin repetir) antes de decidir las filas', async () => {
    const d = build(
      () => permit(),
      [row('a'), row('b'), row('a2', { patientProfileId: 'pat-a' })],
    );
    await d.service.list(query, ANA);
    expect(d.prime).toHaveBeenCalledTimes(1);
    expect(d.prime.mock.calls[0][0].sort()).toEqual(['pat-a', 'pat-b']);
  });

  it('cada pregunta lleva el paciente y la hora de ESA cita (de ahí salen las condiciones)', async () => {
    const seen: any[] = [];
    const d = build(
      (q: any) => {
        seen.push(q);
        return permit();
      },
      [row('a')],
    );
    await d.service.list(query, ANA);
    expect(seen.find((q) => q.context)?.context).toEqual({
      patientProfileId: 'pat-a',
      appointmentStartAt: new Date('2026-11-03T16:00:00Z'),
    });
  });

  it('C-05: la cita de un paciente excluido sale como bloque «Reservado»: se ve ocupada, sin paciente ni motivo del rechazo', async () => {
    const d = build(
      (q: any) =>
        q.context?.patientProfileId === 'pat-res'
          ? { allowed: false, effect: 'DENY', reason: 'PATIENT_EXCLUDED' }
          : permit(),
      [row('ok'), row('res', { patientProfileId: 'pat-res' })],
    );
    const out = await d.service.list(query, ANA);
    const blocked = out.items.find((i: any) => i.bookingId === undefined);
    expect(out.items).toHaveLength(2);
    expect(blocked).toMatchObject({
      allowedActions: [],
      denialReason: 'RESERVED',
    });
    expect((blocked as any).patientName).toBeUndefined();
    expect((blocked as any).patientProfileId).toBeUndefined();
  });

  it('una acción que pide desafío (motivo, paso extra, aprobación) se OFRECE en allowedActions', async () => {
    const d = build(
      (q: any) =>
        q.action === 'schedule.cancel'
          ? { allowed: false, effect: 'CHALLENGE', reason: 'APPROVAL_REQUIRED' }
          : q.action === 'schedule.view'
            ? permit()
            : { allowed: false, reason: 'ACTION_NOT_GRANTED' },
      [row('a')],
    );
    const out = await d.service.list(query, ANA);
    expect(out.items[0].allowedActions).toEqual([
      'schedule.view',
      'schedule.cancel',
    ]);
  });

  it('G-05/D-01: visibleFields enmascara el nombre del paciente (PARTIAL) y NULLIFY lo quita; el original no llega', async () => {
    const partial = build(
      () =>
        permit({
          visibleFields: { 'agenda.appointment.view.patient_name': 'PARTIAL' },
        }),
      [row('a')],
    );
    const out = await partial.service.list(query, ANA);
    expect(out.items[0].patientName).not.toBe('María Pérez Rojas');
    expect(out.items[0].patientName).toMatch(/^M/);
    expect(JSON.stringify(out)).not.toContain('Pérez Rojas');

    const nullified = build(() => permit({ visibleFields: {} }), [row('a')]);
    expect(
      (await nullified.service.list(query, ANA)).items[0].patientName,
    ).toBeUndefined();

    const full = build(
      () =>
        permit({
          visibleFields: { 'agenda.appointment.view.patient_name': 'FULL' },
        }),
      [row('a')],
    );
    expect((await full.service.list(query, ANA)).items[0].patientName).toBe(
      'María Pérez Rojas',
    );
  });

  it('una política sin gobierno de campos (sin visibleFields) no cambia nada: el nombre sale como siempre', async () => {
    const d = build(() => ({ allowed: true, reason: 'ALLOWED' }), [row('a')]);
    expect((await d.service.list(query, ANA)).items[0].patientName).toBe(
      'María Pérez Rojas',
    );
  });
});
