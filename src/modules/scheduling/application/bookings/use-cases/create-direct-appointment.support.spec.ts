import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS, PreconditionFailedException } from '../../../../../common';
import { CHANNEL_CONCEPT } from '../../../domain/booking/booking-channels';
import { BookingAccess } from '../support/booking-access';
import { CreateDirectAppointmentUseCase } from './create-direct-appointment.use-case';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = {
  id: 'user-ana',
  roles: ['SUPPORT_STAFF'],
  tenantIds: ['tenant-1'],
} as any;
const DOCTOR = {
  id: 'user-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-perez',
  tenantIds: ['tenant-1'],
} as any;

const resource = {
  id: 'res-1',
  tenantId: 'tenant-1',
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: 'prof-perez',
  practiceId: 'practice-1',
  timeZone: 'America/La_Paz',
};

const dto: any = {
  patientProfileId: 'pat-1',
  resourceId: 'res-1',
  startAt: '2030-09-10T14:00:00.000Z',
  durationMinutes: 30,
  careSpaceId: 'sala-105',
  healthcareServiceId: 'svc-consulta',
};

/** Arma el caso de uso con la política de apoyo y la resolución de espacio en doble. */
function build(answer: { allowed: boolean; grantId?: string }) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const created: any[] = [];
  const bookingsRepo = {
    findPatientNames: mockFn().mockResolvedValue(new Map([['pat-1', 'Ana']])),
    findPatientBookingsOverlapping: mockFn().mockResolvedValue([]),
    createBooking: mockFn((_: any, data: any) => {
      created.push(data);
      return { id: 'bk-1', ...data };
    }),
    createReminder: mockFn(),
  };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue(resource),
    findOpenSlotsOfProfessionalInWindow: mockFn().mockResolvedValue([]),
    createSlot: mockFn((_: any, data: any) => ({ id: 'slot-1', ...data })),
  };
  const policy = {
    decide: mockFn().mockResolvedValue({ reason: 'X', ...answer }),
  };
  const access = new BookingAccess(
    {} as any,
    catalogRepo as any,
    {} as any,
    { assertCurrent: mockFn().mockResolvedValue(undefined) } as any,
    policy as any,
  );
  jest.spyOn(access, 'assertAffiliationCurrent').mockResolvedValue(undefined);
  // Lo que el doctor realmente tiene: dos espacios y un solo servicio.
  const places = {
    placementsOf: mockFn().mockResolvedValue({
      spaceIds: ['sala-105', 'sala-201'],
      serviceIds: ['svc-consulta'],
    }),
  };
  const transitions = {
    recordTransition: mockFn().mockResolvedValue(undefined),
  };
  const useCase = new CreateDirectAppointmentUseCase(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    { assertRangeFree: mockFn().mockResolvedValue(undefined) } as any,
    access,
    {
      createClinicalAppointment: mockFn().mockReturnValue({ id: 'appt-1' }),
    } as any,
    transitions as any,
    { notifyChange: mockFn().mockResolvedValue(undefined) } as any,
    {} as any,
    {} as any,
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
    places as any,
  );
  return {
    useCase,
    tx,
    policy,
    places,
    created,
    catalogRepo,
    bookingsRepo,
    transitions,
  };
}

describe('CreateDirectAppointmentUseCase: personal de apoyo', () => {
  it('agenda con schedule.create, sella el permiso en la cita y guarda espacio y servicio', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    const { booking, slot } = await d.useCase.executeInTransaction(
      d.tx as any,
      dto,
      ANA,
    );
    expect(d.policy.decide).toHaveBeenCalledWith({
      userId: 'user-ana',
      tenantId: 'tenant-1',
      action: 'schedule.create',
      practitionerProfileId: 'prof-perez',
      healthcareServiceId: 'svc-consulta',
      careSpaceId: 'sala-105',
    });
    expect(booking.bookedViaGrantId).toBe('grant-7');
    expect(booking.careSpaceId).toBe('sala-105');
    expect(booking.healthcareServiceId).toBe('svc-consulta');
    expect(slot.careSpaceId).toBe('sala-105');
  });

  it('una cita de mostrador (walkIn) se autoriza con schedule.walk_in y no con schedule.create', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    await d.useCase.executeInTransaction(
      d.tx as any,
      { ...dto, walkIn: true },
      ANA,
    );
    expect(d.policy.decide).toHaveBeenCalledTimes(1);
    expect(d.policy.decide.mock.calls[0][0].action).toBe('schedule.walk_in');
  });

  it('una cita de mostrador (walkIn) nace con la llegada registrada, por el canal WALK_IN y con su asiento de llegada', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    const { booking } = await d.useCase.executeInTransaction(
      d.tx as any,
      { ...dto, walkIn: true },
      ANA,
    );
    expect(booking.statusConceptId).toBe(CONCEPTS.BOOKING_CHECKED_IN);
    expect(booking.checkedInAt).toBeInstanceOf(Date);
    expect(booking.bookingChannelConceptId).toBe(CHANNEL_CONCEPT.WALK_IN);
    // Confirmada (como toda cita puntual) y, en la misma transacción, llegada.
    const transiciones = d.transitions.recordTransition.mock.calls.map(
      ([, , , snapshot]: any[]) => [
        snapshot.fromStateConceptId,
        snapshot.toStateConceptId,
      ],
    );
    expect(transiciones).toEqual([
      [CONCEPTS.BOOKING_CONFIRMED, CONCEPTS.BOOKING_CONFIRMED],
      [CONCEPTS.BOOKING_CONFIRMED, CONCEPTS.BOOKING_CHECKED_IN],
    ]);
  });

  it('una cita puntual sin walkIn queda confirmada y sin llegada', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    const { booking } = await d.useCase.executeInTransaction(
      d.tx as any,
      dto,
      ANA,
    );
    expect(booking.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
    expect(booking.checkedInAt).toBeUndefined();
    expect(booking.bookingChannelConceptId).toBe(CHANNEL_CONCEPT.DESK);
  });

  it('si la política niega, 403 y no se crea ni cupo ni cita', async () => {
    const d = build({ allowed: false });
    await expect(
      d.useCase.executeInTransaction(d.tx as any, dto, ANA),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    expect(d.created).toHaveLength(0);
  });

  it('sin declarar, con un único espacio y servicio, los toma de la agenda del doctor', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    d.places.placementsOf.mockResolvedValue({
      spaceIds: ['sala-unica'],
      serviceIds: ['svc-unico'],
    });
    await d.useCase.executeInTransaction(
      d.tx as any,
      { ...dto, careSpaceId: undefined, healthcareServiceId: undefined },
      ANA,
    );
    expect(d.created[0].careSpaceId).toBe('sala-unica');
    expect(d.created[0].healthcareServiceId).toBe('svc-unico');
  });

  it('A3 · caso 08: un espacio declarado donde el doctor NO atiende se rechaza antes de preguntar a la política', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    await expect(
      d.useCase.executeInTransaction(
        d.tx as any,
        { ...dto, careSpaceId: 'edificio-b-b102' },
        ANA,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.policy.decide).not.toHaveBeenCalled();
    expect(d.created).toHaveLength(0);
  });

  it('A3 · caso 07: un servicio declarado que el doctor no presta se rechaza', async () => {
    const d = build({ allowed: true, grantId: 'grant-7' });
    await expect(
      d.useCase.executeInTransaction(
        d.tx as any,
        { ...dto, healthcareServiceId: 'svc-eco' },
        ANA,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.created).toHaveLength(0);
  });

  it('N9: un CALL_CENTER con permiso solo «Ecografía» no agenda con un doctor sin servicios declarando Ecografía', async () => {
    const d = build({ allowed: true, grantId: 'grant-eco' });
    d.places.placementsOf.mockResolvedValue({
      spaceIds: ['sala-105'],
      serviceIds: [],
    });
    await expect(
      d.useCase.executeInTransaction(
        d.tx as any,
        { ...dto, healthcareServiceId: 'svc-eco' },
        ANA,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.policy.decide).not.toHaveBeenCalled();
    expect(d.created).toHaveLength(0);
  });

  it('A3: con varios espacios y sin declarar, la cita queda sin espacio y un permiso por ubicación no la cubre', async () => {
    const d = build({ allowed: false });
    await expect(
      d.useCase.executeInTransaction(
        d.tx as any,
        { ...dto, careSpaceId: undefined, healthcareServiceId: undefined },
        ANA,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const [[question]] = d.policy.decide.mock.calls;
    expect(question.careSpaceId).toBeUndefined();
  });

  it('el doctor en su agenda no pasa por la política ni sella permiso', async () => {
    const d = build({ allowed: false });
    await d.useCase.executeInTransaction(d.tx as any, dto, DOCTOR);
    expect(d.policy.decide).not.toHaveBeenCalled();
    expect(d.created[0].bookedViaGrantId).toBeUndefined();
  });

  it('A3: lo que declara el cuerpo no cuenta para quien no es persona de apoyo: la cita toma lo de la agenda', async () => {
    const d = build({ allowed: false });
    await d.useCase.executeInTransaction(
      d.tx as any,
      { ...dto, careSpaceId: 'sala-ajena', healthcareServiceId: 'svc-ajeno' },
      DOCTOR,
    );
    expect(d.created[0].careSpaceId).toBeUndefined();
    expect(d.created[0].healthcareServiceId).toBe('svc-consulta');
  });

  describe('M4: el choque de horario no revela citas de otra organización', () => {
    const clash = (tenantId: string) => [
      {
        id: 'bk-ajena',
        startAt: new Date('2030-09-10T14:00:00Z'),
        resourceName: 'Dr. X (otra clínica)',
        tenantId,
      },
    ];

    it('un choque con una cita de OTRA organización responde genérico, sin cita, horario ni agenda', async () => {
      const d = build({ allowed: true, grantId: 'grant-7' });
      d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue(
        clash('otra-org'),
      );
      const failure: any = await d.useCase
        .executeInTransaction(d.tx as any, dto, ANA)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(PreconditionFailedException);
      const text = JSON.stringify(failure.getResponse());
      expect(text).not.toContain('bk-ajena');
      expect(text).not.toContain('otra clínica');
      expect(text).not.toContain('2030-09-10T14:00');
      expect(failure.message).toMatch(/no está disponible/);
    });

    it('SEG A-M4: un choque con una cita de la MISMA organización tampoco da detalle (agenda, hora, id)', async () => {
      const d = build({ allowed: true, grantId: 'grant-7' });
      d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue(
        clash('tenant-1'),
      );
      const failure: any = await d.useCase
        .executeInTransaction(d.tx as any, dto, ANA)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(PreconditionFailedException);
      expect(failure.message).toMatch(/no está disponible/);
      expect(failure.message).not.toContain('otra clínica');
      expect(JSON.stringify(failure.details ?? {})).not.toMatch(
        /bookingId|startAt/,
      );
    });
  });
});
