import { describe, expect, it } from '@jest/globals';
import { actor, build, ORDER_ID, PATIENT } from './center-schedule.testing';

/**
 * An order the performer center cancelled or rejected is not found by the
 * booking gate (`OrderPatientRepository.findDiagnosticOrder` answers null), so
 * the patient can neither list centers for it nor book it; cancelling an
 * appointment that already exists skips that check.
 */
describe('booking of an order the performer ended', () => {
  const ended = (d: ReturnType<typeof build>) =>
    d.patients.findDiagnosticOrder.mockResolvedValue(null as never);

  it('options and booking ask for a bookable order and answer 404 when it is gone', async () => {
    const d = build();
    ended(d);
    await expect(d.options.execute(actor, ORDER_ID)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      d.booker.execute(actor, ORDER_ID, {
        unitId: 'u1',
        startAt: new Date().toISOString(),
      } as never),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.patients.findDiagnosticOrder).toHaveBeenCalledTimes(2);
    for (const call of d.patients.findDiagnosticOrder.mock.calls) {
      expect(call.slice(1)).toEqual([ORDER_ID, PATIENT, true]);
    }
    expect(d.bookingsRepo.takeSlot).not.toHaveBeenCalled();
  });

  it('cancelling an existing appointment does not require a bookable order', async () => {
    const d = build();
    const booking = {
      id: 'b1',
      bookable_slot_id: 'slot-1',
      start_at: new Date(Date.now() + 86_400_000),
      end_at: new Date(Date.now() + 90_000_000),
      snapshot: {} as never,
    };
    d.bookingsRepo.findForOrder.mockResolvedValue(booking as never);
    await d.canceller.execute(actor, ORDER_ID);
    expect(d.patients.findDiagnosticOrder.mock.calls[0].slice(1)).toEqual([
      ORDER_ID,
      PATIENT,
      false,
    ]);
    expect(d.bookingsRepo.cancel).toHaveBeenCalled();
  });
});
