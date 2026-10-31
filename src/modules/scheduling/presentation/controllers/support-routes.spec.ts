import 'reflect-metadata';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../../common/tenant/tenant-agnostic.decorator';
import {
  ACCESS_LOGGED_KEY,
  AUDITED_KEY,
} from '../../../../common/audit-trail/audit-trail.decorators';
import { SchedulingBookingsController } from './scheduling-bookings.controller';
import { SchedulingController } from './scheduling.controller';
import { SupportAgendaController } from './support-agenda.controller';

/** Metadata de un handler: roles, tenant-agnóstico, lectura registrada y sello. */
function meta(controller: new (...a: any[]) => any, handler: string) {
  const fn = controller.prototype[handler];
  return {
    roles: Reflect.getMetadata(ROLES_KEY, fn) as string[] | undefined,
    agnostic: Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, fn) as
      boolean | undefined,
    accessLogged: Reflect.getMetadata(ACCESS_LOGGED_KEY, fn) as
      { resourceType: string } | undefined,
    audited: Reflect.getMetadata(AUDITED_KEY, fn) as
      { action: string } | undefined,
  };
}

describe('rutas de agenda que opera el personal de apoyo', () => {
  it.each([
    [SchedulingController, 'createDirectAppointment'],
    [SchedulingController, 'placeHold'],
    [SchedulingController, 'confirmBooking'],
    [SchedulingController, 'enrollWaitlist'],
    [SchedulingBookingsController, 'searchBookings'],
    [SchedulingBookingsController, 'getBooking'],
    [SchedulingBookingsController, 'accept'],
    [SchedulingBookingsController, 'cancel'],
    [SchedulingBookingsController, 'reschedule'],
    [SchedulingBookingsController, 'checkIn'],
  ])(
    '%p.%s admite SUPPORT_STAFF (la política decide por cita, no el rol)',
    (C, handler) => {
      expect(meta(C, handler).roles).toContain('SUPPORT_STAFF');
    },
  );

  it('la solicitud de cita (`request`) sigue siendo del paciente y de la agenda: no admite apoyo', () => {
    expect(meta(SchedulingController, 'requestBooking').roles).not.toContain(
      'SUPPORT_STAFF',
    );
  });

  it('M7: la agenda combinada es de la persona (sin tenant activo) y cada lectura queda registrada', () => {
    const m = meta(SupportAgendaController, 'list');
    expect(m.agnostic).toBe(true);
    expect(m.roles).toBeUndefined();
    expect(m.accessLogged?.resourceType).toBe('SUPPORT_AGENDA');
  });

  it('M7: los GET compartidos con pacientes y doctores no llevan @AccessLogged (los sella el servicio para el apoyo)', () => {
    expect(
      meta(SchedulingBookingsController, 'searchBookings').accessLogged,
    ).toBeUndefined();
    expect(
      meta(SchedulingBookingsController, 'getBooking').accessLogged,
    ).toBeUndefined();
  });
});
