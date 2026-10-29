import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import { PreconditionFailedException } from '../../../common';
import { PeriopRoomEventsService } from './periop-room-events.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const CASE = '55555555-5555-5555-5555-555555555555';
const ROOM = '44444444-4444-4444-4444-444444444444';
const BLOCK = '66666666-6666-6666-6666-666666666666';
const actor = { id: 'user-1', roles: ['PERIOP_NURSE'] } as any;
const NOW = new Date('2026-11-02T12:00:00Z');
const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00Z`);

const EV = {
  IN: PERIOP.OR_EVENT_PATIENT_IN_ROOM,
  ANES: PERIOP.OR_EVENT_ANESTHESIA_START,
  INCISION: PERIOP.OR_EVENT_INCISION,
  CLOSURE: PERIOP.OR_EVENT_CLOSURE,
  OUT: PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
};

function build(
  recorded: { eventTypeConceptId: string; occurredAt: Date }[] = [],
  caseOver = {},
) {
  const tx = { find: mockFn().mockResolvedValue(recorded), flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const surgicalCase = {
    id: CASE,
    custodianTenantId: TENANT,
    operatingRoomId: ROOM,
    operatingRoomBlockId: BLOCK,
    statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
    ...caseOver,
  };
  const casesRepo = {
    findCaseForUpdate: mockFn().mockResolvedValue(surgicalCase),
    createUtilizationEvent: mockFn().mockReturnValue({ id: 'ue-1' }),
    findMilestone: mockFn().mockResolvedValue(null),
    createMilestone: mockFn().mockReturnValue({ id: 'ms-1' }),
  };
  const gate = { assertPhase: mockFn().mockResolvedValue(undefined) };
  const careSpaceOps = {
    markDirtyFromSource: mockFn().mockResolvedValue({
      cleaningOrderId: 'co-1',
    }),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PeriopRoomEventsService(
    em as any,
    casesRepo as any,
    gate as any,
    careSpaceOps as any,
    outbox as any,
    logger as any,
  );
  const record = (eventCode: any, hhmm: string, now = NOW) =>
    runWithTenant(TENANT, () =>
      service.record(
        CASE,
        { eventCode, occurredAt: at(hhmm).toISOString() },
        actor,
        'req-1',
        now,
      ),
    );
  return { record, tx, casesRepo, gate, careSpaceOps, outbox, surgicalCase };
}

describe('PeriopRoomEventsService (F4.3)', () => {
  it('registra la entrada a sala: evento de utilización con tenant y bloque, hito, y outbox en la misma transacción', async () => {
    const d = build();
    const res = await d.record('PATIENT_IN_ROOM', '08:05');

    expect(res).toEqual({
      utilizationEventId: 'ue-1',
      milestoneId: 'ms-1',
      cleaningOrderId: null,
    });
    expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        operatingRoomId: ROOM,
        procedureCaseId: CASE,
        eventTypeConceptId: EV.IN,
        tenantId: TENANT,
        operatingRoomBlockId: BLOCK,
        occurredAt: at('08:05'),
      }),
    );
    expect(d.casesRepo.createMilestone).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        milestoneTypeConceptId: PERIOP.MILESTONE_PATIENT_IN_ROOM,
      }),
    );
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'periop.case.room_event_recorded',
        tenantId: TENANT,
        payloadJson: expect.objectContaining({
          eventCode: 'PATIENT_IN_ROOM',
          requestId: 'req-1',
        }),
      }),
    );
    expect(d.gate.assertPhase).not.toHaveBeenCalled();
  });

  it('un hecho en el futuro → 422 OCCURRED_AT_IN_FUTURE sin tocar la base', async () => {
    const d = build();
    await expect(d.record('PATIENT_IN_ROOM', '12:30')).rejects.toMatchObject({
      status: 422,
      reason: Reason.OCCURRED_AT_IN_FUTURE,
    });
    expect(d.casesRepo.findCaseForUpdate).not.toHaveBeenCalled();
  });

  it('el orden es obligatorio: no se salta a la incisión sin pasar por la entrada', async () => {
    const d = build();
    await expect(d.record('INCISION', '09:00')).rejects.toMatchObject({
      status: 422,
      reason: Reason.ROOM_EVENT_OUT_OF_ORDER,
      details: { expected: 'PATIENT_IN_ROOM', received: 'INCISION' },
    });
    expect(d.casesRepo.createUtilizationEvent).not.toHaveBeenCalled();
  });

  it('repetir un hecho → 409 ROOM_EVENT_ALREADY_RECORDED', async () => {
    const d = build([{ eventTypeConceptId: EV.IN, occurredAt: at('08:05') }]);
    await expect(d.record('PATIENT_IN_ROOM', '08:10')).rejects.toMatchObject({
      status: 409,
      reason: Reason.ROOM_EVENT_ALREADY_RECORDED,
    });
  });

  it('un hecho anterior al previo se rechaza como fuera de orden', async () => {
    const d = build([{ eventTypeConceptId: EV.IN, occurredAt: at('08:05') }]);
    await expect(d.record('ANESTHESIA_START', '08:00')).rejects.toMatchObject({
      reason: Reason.ROOM_EVENT_OUT_OF_ORDER,
    });
  });

  it.each([
    ['ANESTHESIA_START', 'SIGN_IN', [EV.IN]],
    ['INCISION', 'TIME_OUT', [EV.IN, EV.ANES]],
    [
      'PATIENT_OUT_OF_ROOM',
      'SIGN_OUT',
      [EV.IN, EV.ANES, EV.INCISION, EV.CLOSURE],
    ],
  ] as const)(
    '%s exige la fase %s del check-list y, si falta, no registra nada',
    async (code, phase, previous) => {
      const d = build(
        previous.map((c, i) => ({
          eventTypeConceptId: c,
          occurredAt: at(`08:0${i}`),
        })),
      );
      d.gate.assertPhase.mockRejectedValue(
        new PreconditionFailedException(
          'falta',
          { phase },
          Reason.CHECKLIST_SIGN_IN_REQUIRED,
        ),
      );
      await expect(d.record(code, '09:30')).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.gate.assertPhase).toHaveBeenCalledWith(d.tx, CASE, phase);
      expect(d.casesRepo.createUtilizationEvent).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    },
  );

  it('el inicio de anestesia reutiliza el hito que dejó la inducción: no lo duplica', async () => {
    const d = build([{ eventTypeConceptId: EV.IN, occurredAt: at('08:05') }]);
    d.casesRepo.findMilestone.mockResolvedValue({ id: 'ms-induccion' });
    const res = await d.record('ANESTHESIA_START', '08:20');
    expect(res.milestoneId).toBe('ms-induccion');
    expect(d.casesRepo.createMilestone).not.toHaveBeenCalled();
  });

  it('el cierre no tiene hito propio', async () => {
    const d = build([
      { eventTypeConceptId: EV.IN, occurredAt: at('08:00') },
      { eventTypeConceptId: EV.ANES, occurredAt: at('08:10') },
      { eventTypeConceptId: EV.INCISION, occurredAt: at('08:30') },
    ]);
    const res = await d.record('CLOSURE', '09:30');
    expect(res.milestoneId).toBeNull();
  });

  it('la salida del paciente ensucia el quirófano por el puerto (OR_TURNOVER, no terminal) y publica la orden', async () => {
    const d = build([
      { eventTypeConceptId: EV.IN, occurredAt: at('08:00') },
      { eventTypeConceptId: EV.ANES, occurredAt: at('08:10') },
      { eventTypeConceptId: EV.INCISION, occurredAt: at('08:30') },
      { eventTypeConceptId: EV.CLOSURE, occurredAt: at('09:30') },
    ]);
    const res = await d.record('PATIENT_OUT_OF_ROOM', '09:40');

    expect(d.careSpaceOps.markDirtyFromSource).toHaveBeenCalledWith(
      d.tx,
      ROOM,
      expect.objectContaining({
        trigger: 'OR_TURNOVER',
        sourceRefId: CASE,
        terminal: false,
        requestId: 'req-1',
      }),
    );
    expect(res.cleaningOrderId).toBe('co-1');
    expect(
      d.outbox.publishDomainEvent.mock.calls[0][1].payloadJson,
    ).toMatchObject({
      cleaningOrderId: 'co-1',
    });
  });

  it('un caso cancelado → 409; uno terminado → 422; sin quirófano → 422', async () => {
    await expect(
      build([], { statusConceptId: CONCEPTS.CASE_CANCELLED }).record(
        'PATIENT_IN_ROOM',
        '08:00',
      ),
    ).rejects.toMatchObject({ status: 409, reason: Reason.CASE_CANCELLED });
    await expect(
      build([], { statusConceptId: CONCEPTS.CASE_COMPLETED }).record(
        'PATIENT_IN_ROOM',
        '08:00',
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.CASE_NOT_ACTIVE_FOR_ROOM_EVENTS,
    });
    await expect(
      build([], { operatingRoomId: undefined }).record(
        'PATIENT_IN_ROOM',
        '08:00',
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.CASE_WITHOUT_OPERATING_ROOM,
    });
  });

  it('un caso de otro tenant responde el 404 uniforme', async () => {
    const d = build([], { custodianTenantId: 'otro-tenant' });
    await expect(d.record('PATIENT_IN_ROOM', '08:00')).rejects.toMatchObject({
      status: 404,
    });
    expect(d.casesRepo.createUtilizationEvent).not.toHaveBeenCalled();
  });
});
