import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import { SCHED } from '../../../domain/scheduling.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { BookingAccess } from '../support/booking-access';
import { RescheduleBookingUseCase } from './reschedule-booking.use-case';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ANA = {
  id: 'user-ana',
  roles: ['SUPPORT_STAFF'],
  tenantIds: [TENANT],
} as any;
const AGENTE = {
  id: 'user-agente',
  roles: ['SCHEDULING_AGENT'],
  tenantIds: [TENANT],
} as any;

const FUTURO = new Date(Date.now() + 5 * 24 * 3600 * 1000);

/** Cita confirmada de Pérez, consulta, sala 103. */
const booking = (): any => ({
  id: 'b1',
  tenantId: TENANT,
  patientProfileId: 'pat-1',
  bookableSlotId: 'slot-origen',
  resourceId: 'res-perez',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
});

/** Un cupo libre y futuro de Pérez, en la sala 103, del mismo servicio. */
const slot = (id: string, overrides: Record<string, unknown> = {}): any => ({
  id,
  resourceId: 'res-perez',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  startAt: FUTURO,
  endAt: new Date(FUTURO.getTime() + 30 * 60_000),
  remainingCapacity: 1,
  statusConceptId: CONCEPTS.SLOT_OPEN,
  ...overrides,
});

const resource = (id: string, tenantId = TENANT) => ({
  id,
  tenantId,
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: `prof-${id}`,
});

function build(
  slots: Record<string, any>,
  resources: Record<string, any> = { 'res-perez': resource('res-perez') },
  decide: (q: any) => boolean = () => true,
) {
  const tx = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: () => ({ transactional: (cb: any) => cb(tx) }),
  };
  const b = booking();
  const bookingsRepo = {
    findBookingByIdForUpdate: mockFn().mockResolvedValue(b),
    findSlotForUpdate: mockFn().mockImplementation(
      async (_tx: unknown, id: string) => slots[id] ?? null,
    ),
    findPatientBookingsOverlapping: mockFn().mockResolvedValue([]),
    recordReschedule: mockFn(),
  };
  const catalogRepo = {
    findResourceById: mockFn().mockImplementation(
      async (_tx: unknown, id: string) => resources[id] ?? null,
    ),
  };
  const policy = {
    decide: mockFn().mockImplementation(async (q: any) => ({
      allowed: decide(q),
      reason: decide(q) ? 'ALLOWED' : 'NO_COVERING_GRANT',
      grantId: 'g1',
    })),
  };
  const access = new BookingAccess(
    bookingsRepo as any,
    catalogRepo as any,
    {} as any,
    {} as any,
    policy as any,
    em as any,
    { record: mockFn().mockResolvedValue(undefined) } as any,
  );
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const notifier = { notifyChange: mockFn().mockResolvedValue(undefined) };
  const useCase = new RescheduleBookingUseCase(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    { assertRangeFree: mockFn().mockResolvedValue(undefined) } as any,
    access,
    { assertNotAService: mockFn().mockResolvedValue(undefined) } as any,
    history as any,
    notifier as any,
    { setContext: mockFn(), info: mockFn() } as any,
  );
  return { useCase, bookingsRepo, policy, history, b };
}

const dto = (toSlotId = 'slot-destino') => ({
  toSlotId,
  reasonText: 'El paciente pidió otro horario',
});

describe('RescheduleBookingUseCase: persona de apoyo', () => {
  it('mueve la cita con schedule.reschedule sobre el origen Y sobre el destino', async () => {
    const origen = slot('slot-origen', { remainingCapacity: 0 });
    const destino = slot('slot-destino');
    const d = build({ 'slot-origen': origen, 'slot-destino': destino });
    const res = await d.useCase.execute('b1', dto(), ANA);
    expect(res).toEqual({
      bookingId: 'b1',
      fromSlotId: 'slot-origen',
      toSlotId: 'slot-destino',
    });
    // Dos preguntas a la política: la cita (origen) y el cupo destino.
    expect(d.policy.decide).toHaveBeenCalledTimes(2);
    for (const [question] of d.policy.decide.mock.calls) {
      expect(question).toMatchObject({
        action: 'schedule.reschedule',
        tenantId: TENANT,
        practitionerProfileId: 'prof-res-perez',
      });
    }
    expect(origen.remainingCapacity).toBe(1);
    expect(destino.remainingCapacity).toBe(0);
    expect(d.b.bookableSlotId).toBe('slot-destino');
  });

  it('el origen no cubierto se niega (403) y no toca ningún cupo', async () => {
    const destino = slot('slot-destino');
    const d = build(
      { 'slot-origen': slot('slot-origen'), 'slot-destino': destino },
      undefined,
      (q) =>
        q.careSpaceId !== 'sala-103' ||
        q.healthcareServiceId !== 'svc-consulta',
    );
    await expect(d.useCase.execute('b1', dto(), ANA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(destino.remainingCapacity).toBe(1);
  });

  it('el destino no cubierto se niega (403) aunque el origen sí lo esté', async () => {
    const destino = slot('slot-destino', { careSpaceId: 'sala-201' });
    const origen = slot('slot-origen', { remainingCapacity: 0 });
    const d = build(
      { 'slot-origen': origen, 'slot-destino': destino },
      undefined,
      (q) => q.careSpaceId !== 'sala-201',
    );
    await expect(d.useCase.execute('b1', dto(), ANA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(origen.remainingCapacity).toBe(0);
    expect(destino.remainingCapacity).toBe(1);
    expect(d.b.bookableSlotId).toBe('slot-origen');
  });

  it('un destino de OTRA organización se responde como inexistente (404), sin decir que es ajeno', async () => {
    const destino = slot('slot-destino', { resourceId: 'res-ajena' });
    const d = build(
      { 'slot-origen': slot('slot-origen'), 'slot-destino': destino },
      {
        'res-perez': resource('res-perez'),
        'res-ajena': resource('res-ajena', 'tenant-2'),
      },
    );
    const error = await d.useCase.execute('b1', dto(), ANA).catch((e) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(destino.remainingCapacity).toBe(1);
  });

  it.each([
    [
      'bloqueado',
      { statusConceptId: CONCEPTS.SLOT_BLOCKED },
      SchedulingErrorReason.RESCHEDULE_TARGET_NOT_FREE,
    ],
    [
      'retraído',
      { statusConceptId: SCHED.SLOT_RETRACTED },
      SchedulingErrorReason.RESCHEDULE_TARGET_NOT_FREE,
    ],
    [
      'ya pasó',
      { startAt: new Date(Date.now() - 3600_000) },
      SchedulingErrorReason.RESCHEDULE_TARGET_NOT_FUTURE,
    ],
    [
      'de otro servicio',
      { healthcareServiceId: 'svc-eco' },
      SchedulingErrorReason.RESCHEDULE_TARGET_OTHER_SERVICE,
    ],
  ])(
    'un destino %s se rechaza con 422 y su código',
    async (_n, overrides, reason) => {
      const destino = slot('slot-destino', overrides);
      const d = build({
        'slot-origen': slot('slot-origen'),
        'slot-destino': destino,
      });
      const error = await d.useCase.execute('b1', dto(), ANA).catch((e) => e);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(reason);
      expect(destino.remainingCapacity).toBe(1);
    },
  );

  it('quien opera la agenda por oficio no recibe las exigencias de apoyo (puede mover a un horario pasado)', async () => {
    const destino = slot('slot-destino', {
      startAt: new Date(Date.now() - 3600_000),
    });
    const d = build({
      'slot-origen': slot('slot-origen'),
      'slot-destino': destino,
    });
    await expect(d.useCase.execute('b1', dto(), AGENTE)).resolves.toMatchObject(
      {
        toSlotId: 'slot-destino',
      },
    );
    expect(d.policy.decide).not.toHaveBeenCalled();
  });
});
