import { CONCEPTS } from '../../../common';
import { SCHED } from '../scheduling.concepts';
import { isValidBookingTransition } from './booking-state-machine';

describe('booking state machine (C-10)', () => {
  it('allows the happy-path lifecycle', () => {
    expect(
      isValidBookingTransition(
        SCHED.BOOKING_REQUESTED,
        SCHED.BOOKING_PENDING_CONFIRMATION,
      ),
    ).toBe(true);
    expect(
      isValidBookingTransition(
        SCHED.BOOKING_PENDING_CONFIRMATION,
        CONCEPTS.BOOKING_CONFIRMED,
      ),
    ).toBe(true);
    expect(
      isValidBookingTransition(
        CONCEPTS.BOOKING_CONFIRMED,
        CONCEPTS.BOOKING_CHECKED_IN,
      ),
    ).toBe(true);
    expect(
      isValidBookingTransition(
        CONCEPTS.BOOKING_CHECKED_IN,
        SCHED.BOOKING_IN_PROGRESS,
      ),
    ).toBe(true);
    expect(
      isValidBookingTransition(
        SCHED.BOOKING_IN_PROGRESS,
        SCHED.BOOKING_COMPLETED,
      ),
    ).toBe(true);
  });

  it('allows cancellation from every non-terminal active state', () => {
    for (const from of [
      SCHED.BOOKING_REQUESTED,
      SCHED.BOOKING_PENDING_CONFIRMATION,
      CONCEPTS.BOOKING_CONFIRMED,
      CONCEPTS.BOOKING_CHECKED_IN,
    ]) {
      expect(isValidBookingTransition(from, CONCEPTS.BOOKING_CANCELLED)).toBe(
        true,
      );
    }
  });

  it('rejects invalid transitions', () => {
    // Check-in de una cita cancelada.
    expect(
      isValidBookingTransition(
        CONCEPTS.BOOKING_CANCELLED,
        CONCEPTS.BOOKING_CHECKED_IN,
      ),
    ).toBe(false);
    // Completar sin haber empezado.
    expect(
      isValidBookingTransition(
        CONCEPTS.BOOKING_CONFIRMED,
        SCHED.BOOKING_COMPLETED,
      ),
    ).toBe(false);
    // Saltar de REQUESTED directo a CHECKED_IN.
    expect(
      isValidBookingTransition(
        SCHED.BOOKING_REQUESTED,
        CONCEPTS.BOOKING_CHECKED_IN,
      ),
    ).toBe(false);
  });

  it('treats terminal states as having no outgoing transitions', () => {
    for (const terminal of [
      SCHED.BOOKING_COMPLETED,
      CONCEPTS.BOOKING_CANCELLED,
      SCHED.BOOKING_NO_SHOW,
    ]) {
      expect(
        isValidBookingTransition(terminal, CONCEPTS.BOOKING_CONFIRMED),
      ).toBe(false);
    }
  });

  it('rejects a self-transition', () => {
    expect(
      isValidBookingTransition(
        CONCEPTS.BOOKING_CONFIRMED,
        CONCEPTS.BOOKING_CONFIRMED,
      ),
    ).toBe(false);
  });
});
