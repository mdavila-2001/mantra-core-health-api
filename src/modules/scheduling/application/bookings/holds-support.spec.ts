import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../../common';
import { runWithTenant } from '../../../../common/tenant/tenant-context';
import {
  BookingAccess,
  SUPPORT_DENIED_MESSAGE,
} from './support/booking-access';
import { BookingMaterializer } from './support/booking-materializer';
import { PlaceHoldUseCase } from './use-cases/place-hold.use-case';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ANA = {
  id: 'user-ana',
  roles: ['SUPPORT_STAFF'],
  tenantIds: [TENANT],
} as any;
const PACIENTE = {
  id: 'user-pat',
  roles: ['PATIENT'],
  tenantIds: [TENANT],
} as any;

const FUTURO = new Date(Date.now() + 3 * 24 * 3600 * 1000);

/** Cupo libre de Pérez en la sala 103, servicio consulta. */
const slot = (overrides: Record<string, unknown> = {}): any => ({
  id: 'slot-1',
  resourceId: 'res-perez',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  startAt: FUTURO,
  endAt: new Date(FUTURO.getTime() + 30 * 60_000),
  remainingCapacity: 1,
  statusConceptId: CONCEPTS.SLOT_OPEN,
  ...overrides,
});

const perez = (tenantId = TENANT) => ({
  id: 'res-perez',
  tenantId,
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: 'prof-perez',
  timeZone: 'America/La_Paz',
});

/** Arma el acceso con una política que responde lo que se le indique. */
function buildAccess(allowed: boolean, resourceTenant = TENANT) {
  const tx = {};
  const em = { fork: () => ({ transactional: (cb: any) => cb(tx) }) };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue(perez(resourceTenant)),
  };
  const policy = {
    decide: mockFn().mockResolvedValue({
      allowed,
      reason: allowed ? 'ALLOWED' : 'NO_COVERING_GRANT',
      grantId: allowed ? 'g-9' : undefined,
    }),
  };
  const access = new BookingAccess(
    {} as any,
    catalogRepo as any,
    {} as any,
    {} as any,
    policy as any,
    em as any,
    { record: mockFn().mockResolvedValue(undefined) } as any,
  );
  return { access, policy, catalogRepo };
}

describe('PlaceHoldUseCase: persona de apoyo', () => {
  function build(allowed: boolean, resourceTenant = TENANT) {
    const a = buildAccess(allowed, resourceTenant);
    const s = slot();
    const tx = {};
    const bookingsRepo = {
      findSlotForUpdate: mockFn().mockResolvedValue(s),
      createHold: mockFn((_: any, data: any) => ({
        id: 'hold-1',
        expiresAt: new Date(Date.now() + 300_000),
        ...data,
      })),
    };
    const useCase = new PlaceHoldUseCase(
      { transactional: mockFn((cb: any) => cb(tx)) } as any,
      bookingsRepo as any,
      { resolvePolicy: mockFn() } as any,
      a.access,
      { setContext: mockFn(), info: mockFn() } as any,
    );
    return { ...a, useCase, slot: s, bookingsRepo };
  }

  it('retiene con schedule.create sobre el doctor, servicio y espacio del cupo', async () => {
    const d = build(true);
    const res = await d.useCase.execute(
      'slot-1',
      { patientProfileId: 'pat-1' },
      ANA,
    );
    expect(res.holdToken).toBeDefined();
    expect(d.policy.decide).toHaveBeenCalledWith({
      userId: 'user-ana',
      tenantId: TENANT,
      action: 'schedule.create',
      practitionerProfileId: 'prof-perez',
      healthcareServiceId: 'svc-consulta',
      careSpaceId: 'sala-103',
    });
    expect(d.slot.remainingCapacity).toBe(0);
  });

  it('si la política niega, 403 y el cupo queda intacto', async () => {
    const d = build(false);
    await expect(
      d.useCase.execute('slot-1', { patientProfileId: 'pat-1' }, ANA),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.slot.remainingCapacity).toBe(1);
    expect(d.bookingsRepo.createHold).not.toHaveBeenCalled();
  });

  it('un cupo de otra organización que la activa se niega con el mismo rechazo', async () => {
    const d = build(true, 'tenant-2');
    const error = await runAs('tenant-1', () =>
      d.useCase.execute('slot-1', { patientProfileId: 'pat-1' }, ANA),
    ).catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.message).toBe(SUPPORT_DENIED_MESSAGE);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('un paciente retiene como siempre, sin pasar por la política de apoyo', async () => {
    const d = build(false);
    await d.useCase.execute('slot-1', {}, PACIENTE).catch(() => undefined);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });
});

describe('BookingMaterializer (confirmar una retención): persona de apoyo', () => {
  function build(allowed: boolean, resourceTenant = TENANT) {
    const a = buildAccess(allowed, resourceTenant);
    const s = slot({ remainingCapacity: 0 });
    const tx = { flush: mockFn().mockResolvedValue(undefined) };
    const created: any[] = [];
    const bookingsRepo = {
      findHoldByTokenForUpdate: mockFn().mockResolvedValue({
        id: 'hold-1',
        bookableSlotId: 'slot-1',
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + 300_000),
      }),
      findSlotForUpdate: mockFn().mockResolvedValue(s),
      findPatientBookingsOverlapping: mockFn().mockResolvedValue([]),
      createBooking: mockFn((_: any, data: any) => {
        created.push(data);
        return { id: 'bk-1', ...data };
      }),
      createReminder: mockFn(),
    };
    const materializer = new BookingMaterializer(
      { transactional: mockFn((cb: any) => cb(tx)) } as any,
      bookingsRepo as any,
      a.catalogRepo as any,
      { assertRangeFree: mockFn().mockResolvedValue(undefined) } as any,
      { offeringOfSlot: mockFn() } as any,
      a.access,
      {
        createClinicalAppointment: mockFn().mockReturnValue({ id: 'appt-1' }),
      } as any,
      { resolvePolicy: mockFn() } as any,
    );
    return { ...a, materializer, created, bookingsRepo };
  }

  const plan = (tenantId = TENANT): any => ({
    tenantId,
    patientProfileId: 'pat-1',
    channel: 'DESK',
    statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
    appointmentStatusConceptId: 'appt-booked',
    confirmedAt: new Date(),
    reminderOffsetsMinutes: [],
  });

  it('confirma con schedule.create sobre el cupo y sella el permiso en la cita', async () => {
    const d = build(true);
    await d.materializer.materializeBooking('hold-token', plan(), ANA);
    expect(d.policy.decide).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'schedule.create',
        healthcareServiceId: 'svc-consulta',
        careSpaceId: 'sala-103',
      }),
    );
    expect(d.created[0].bookedViaGrantId).toBe('g-9');
    expect(d.created[0].tenantId).toBe(TENANT);
  });

  it('el tenantId del cuerpo tiene que ser el de la agenda del cupo: otro se niega y no se crea la cita', async () => {
    const d = build(true);
    await expect(
      d.materializer.materializeBooking('hold-token', plan('tenant-2'), ANA),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.created).toHaveLength(0);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('si la política niega, 403 y no se crea la cita', async () => {
    const d = build(false);
    await expect(
      d.materializer.materializeBooking('hold-token', plan(), ANA),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.created).toHaveLength(0);
  });

  it('un paciente confirma como siempre: sin política y sin permiso sellado', async () => {
    const d = build(false);
    await d.materializer
      .materializeBooking('hold-token', plan(), {
        ...PACIENTE,
        patientProfileId: 'pat-1',
      })
      .catch(() => undefined);
    expect(d.policy.decide).not.toHaveBeenCalled();
    expect(d.created[0]?.bookedViaGrantId).toBeUndefined();
  });
});

/** Corre `fn` con la organización activa del request (`X-Tenant-Id`) dada. */
function runAs<T>(tenantId: string, fn: () => T): T {
  return runWithTenant(tenantId, fn);
}
