import { CONCEPTS } from '../../../../common/constants/concepts';
import { CLIN } from '../../../clinical/clinical.concepts';
import { SCHED } from '../scheduling.concepts';
import { DEFAULT_REMINDER_OFFSETS } from './booking-defaults';
import { planForService, type BookingPlan } from './service-booking-plan';

/** El plan con el que el paciente solicita: pendiente, sin compromiso ni recordatorios. */
const request: BookingPlan = {
  statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
  appointmentStatusConceptId: CLIN.APPOINTMENT_PENDING,
  reminderOffsetsMinutes: [],
};

/** El plan del mostrador: ya viene confirmado. */
const desk: BookingPlan = {
  statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
  appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
  confirmedAt: new Date('2026-11-05T12:00:00.000Z'),
  reminderOffsetsMinutes: [60],
};

describe('planForService — quién acepta una solicitud (oferta o agenda, v4.2.88)', () => {
  it('con aprobación requerida la solicitud sigue pendiente, tal cual', () => {
    expect(planForService(request, true)).toBe(request);
  });

  it('sin aprobación requerida nace confirmada, con cita reservada y recordatorios', () => {
    const plan = planForService(request, false);

    expect(plan.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
    expect(plan.appointmentStatusConceptId).toBe(CLIN.APPOINTMENT_BOOKED);
    expect(plan.confirmedAt).toBeInstanceOf(Date);
    expect(plan.reminderOffsetsMinutes).toEqual(DEFAULT_REMINDER_OFFSETS);
  });

  it('el mostrador no cambia: ya traía su compromiso y sus recordatorios', () => {
    expect(planForService(desk, false)).toBe(desk);
    expect(planForService(desk, true)).toBe(desk);
  });
});
