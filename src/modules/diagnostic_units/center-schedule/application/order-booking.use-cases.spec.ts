import { describe, expect, it } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import { DUNIT } from '../../diagnostic_units.concepts';
import { CLIN } from '../../../clinical/clinical.concepts';
import {
  actor,
  build,
  ORDER_ID,
  OTHER_TENANT,
  PATIENT,
  RESOURCE_ID,
  TENANT,
  UNIT_ID,
  unitRow,
} from './center-schedule.testing';

/** The next Tuesday 08:00 in La Paz (12:00 UTC), at least two days ahead. */
function nextTuesdaySlot(): Date {
  const d = new Date(Date.now() + 2 * 86_400_000);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

/** One ultrasound slot per Tuesday 08:00–08:30 La Paz. */
const TUESDAY_RULE = {
  template_id: 't1',
  name: 'MODALITY:ECO',
  slot_minutes: 30,
  updated_at: new Date('2026-10-01T00:00:00Z'),
  day_of_week: 2,
  start_time: '08:00:00',
  end_time: '08:30:00',
  capacity_per_slot: 1,
};

describe('GetStudyAvailabilityUseCase', () => {
  it('lists the free starts of the study with the block that applied', async () => {
    const d = build();
    d.scheduleRepo.findTemplateRules.mockResolvedValue([TUESDAY_RULE]);
    const start = nextTuesdaySlot();
    const res = await runWithTenant(OTHER_TENANT, () =>
      d.availability.execute(UNIT_ID, {
        studyCode: 'STUDY-ECO-ABD',
        from: new Date(start.getTime() - 3_600_000).toISOString(),
        to: new Date(start.getTime() + 3_600_000).toISOString(),
      }),
    );
    expect(res).toEqual({
      unitId: UNIT_ID,
      studyCode: 'STUDY-ECO-ABD',
      origin: 'MODALITY',
      items: [
        {
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + 1_800_000).toISOString(),
          remaining: 1,
          capacity: 1,
        },
      ],
    });
  });

  it('an unpublished center is visible only to its own organization', async () => {
    const d = build();
    d.scheduleRepo.findUnit.mockResolvedValue(
      unitRow({ verification_status_concept_id: DUNIT.VERIFICATION_PENDING }),
    );
    const query = { studyCode: 'STUDY-ECO-ABD' };
    await expect(
      runWithTenant(OTHER_TENANT, () => d.availability.execute(UNIT_ID, query)),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      runWithTenant(TENANT, () => d.availability.execute(UNIT_ID, query)),
    ).resolves.toMatchObject({ unitId: UNIT_ID });
  });

  it('a study the center does not offer is 404', async () => {
    const d = build();
    await expect(
      d.availability.execute(UNIT_ID, { studyCode: 'STUDY-RX-TORAX' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('GetBookingOptionsUseCase', () => {
  it('offers the published centers of the order study with price, distance and next start', async () => {
    const d = build();
    d.patients.homeOf.mockResolvedValue({ lat: -17.79, lng: -63.18 });
    const res = await d.options.execute(actor, ORDER_ID);
    expect(d.studiesRepo.findPublishedByConcept).toHaveBeenCalledWith(
      d.em,
      expect.any(String),
    );
    expect(res).toMatchObject({
      orderId: ORDER_ID,
      studyCode: 'STUDY-ECO-ABD',
      modalityCode: 'ECO',
      modalityLabel: 'Ecografía',
      options: [
        {
          unitId: UNIT_ID,
          price: 250,
          currency: 'BOB',
          distanceKm: 1.1,
          operationalEquipment: 1,
        },
      ],
    });
  });

  it('prices only the panel components the order asks for (4.2.d)', async () => {
    const d = build();
    d.patients.orderedComponents.mockResolvedValue(['HB', 'HTO']);
    d.studiesRepo.findParts.mockResolvedValue([
      { study_concept_id: 'HB', amount: '20.00' },
      { study_concept_id: 'HTO', amount: '15.50' },
      { study_concept_id: 'PLT', amount: '18.00' },
    ]);
    const res = await d.options.execute(actor, ORDER_ID);
    expect(d.studiesRepo.findParts).toHaveBeenCalledWith(d.em, 'offering-1');
    expect(res.options[0]).toMatchObject({ unitId: UNIT_ID, price: 35.5 });
  });

  it('an order routed to another center offers no option here', async () => {
    const d = build();
    const order = await d.patients.findDiagnosticOrder(d.em as never, ORDER_ID);
    d.patients.findDiagnosticOrder.mockResolvedValue({
      ...order!,
      category_concept_id: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      performer_tenant_id: OTHER_TENANT,
    });
    const res = await d.options.execute(actor, ORDER_ID);
    expect(res.options).toEqual([]);
  });

  it("another person's order answers like a missing one", async () => {
    const d = build();
    d.patients.ownPatientProfileId.mockResolvedValue('someone-else');
    await expect(d.options.execute(actor, ORDER_ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('an order with its result released is not booked (409)', async () => {
    const d = build();
    d.patients.hasReleasedResult.mockResolvedValue(true);
    await expect(d.options.execute(actor, ORDER_ID)).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('BookOrderUseCase', () => {
  const setup = () => {
    const d = build();
    d.scheduleRepo.findTemplateRules.mockResolvedValue([TUESDAY_RULE]);
    return d;
  };

  it('books a free start under the center lock and freezes what the patient accepted', async () => {
    const d = setup();
    const start = nextTuesdaySlot();
    const res = await d.booker.execute(actor, ORDER_ID, {
      unitId: UNIT_ID,
      startAt: start.toISOString(),
    });
    expect(d.patients.lockOrder).toHaveBeenCalledWith(d.em, ORDER_ID);
    expect(d.bookingsRepo.lockResource).toHaveBeenCalledWith(d.em, RESOURCE_ID);
    expect(d.bookingsRepo.takeSlot).toHaveBeenCalledWith(
      d.em,
      RESOURCE_ID,
      start,
      new Date(start.getTime() + 1_800_000),
      actor.id,
    );
    const [, data] = d.bookingsRepo.insertBooking.mock.calls[0];
    expect(data).toMatchObject({
      tenantId: unitRow().tenant_id,
      patientProfileId: PATIENT,
      slotId: 'slot-1',
      snapshot: {
        kind: 'DIAGNOSTIC_ORDER',
        serviceRequestId: ORDER_ID,
        modalityCode: 'ECO',
        studyCode: 'STUDY-ECO-ABD',
        price: 250,
      },
    });
    expect(res).toMatchObject({
      bookingId: 'booking-1',
      unitId: UNIT_ID,
      startAt: start.toISOString(),
      studyName: 'Ecografía abdominal',
      preparation: 'Ayuno de 6 a 8 horas.',
    });
  });

  it('409 `slotTaken` when the start filled up meanwhile', async () => {
    const d = setup();
    const start = nextTuesdaySlot();
    d.bookingsRepo.findOccupying.mockResolvedValue([
      {
        id: 'other',
        start_at: start,
        end_at: new Date(start.getTime() + 1_800_000),
        modality_code: 'ECO',
        study_code: 'STUDY-ECO-ABD',
      },
    ]);
    await expect(
      d.booker.execute(actor, ORDER_ID, {
        unitId: UNIT_ID,
        startAt: start.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 409, details: { slotTaken: true } });
    expect(d.bookingsRepo.insertBooking).not.toHaveBeenCalled();
  });

  it('409 without `slotTaken` when the order already has an appointment', async () => {
    const d = setup();
    d.bookingsRepo.findForOrder.mockResolvedValue({ id: 'b0' });
    const error: any = await d.booker
      .execute(actor, ORDER_ID, {
        unitId: UNIT_ID,
        startAt: nextTuesdaySlot().toISOString(),
      })
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 409 });
    expect(error.details?.slotTaken).toBeUndefined();
  });

  it('a center the order was not routed to cannot be booked', async () => {
    const d = setup();
    const order = await d.patients.findDiagnosticOrder(d.em as never, ORDER_ID);
    d.patients.findDiagnosticOrder.mockResolvedValue({
      ...order!,
      performer_tenant_id: OTHER_TENANT,
    });
    await expect(
      d.booker.execute(actor, ORDER_ID, {
        unitId: UNIT_ID,
        startAt: nextTuesdaySlot().toISOString(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('an unpublished center cannot be booked', async () => {
    const d = setup();
    d.scheduleRepo.findUnit.mockResolvedValue(
      unitRow({ status_concept_id: DUNIT.UNIT_RETIRED }),
    );
    await expect(
      d.booker.execute(actor, ORDER_ID, {
        unitId: UNIT_ID,
        startAt: nextTuesdaySlot().toISOString(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('CancelOrderBookingUseCase', () => {
  const future = (offsetMs: number) => ({
    id: 'b1',
    bookable_slot_id: 'slot-1',
    start_at: new Date(Date.now() + offsetMs),
    end_at: new Date(Date.now() + offsetMs + 1_800_000),
    snapshot: {} as any,
  });

  it('cancels the order appointment', async () => {
    const d = build();
    const booking = future(86_400_000);
    d.bookingsRepo.findForOrder.mockResolvedValue(booking);
    await d.canceller.execute(actor, ORDER_ID);
    expect(d.bookingsRepo.cancel).toHaveBeenCalledWith(d.em, booking, actor.id);
  });

  it('404 when the order has no appointment; 422 when it already started', async () => {
    const d = build();
    await expect(d.canceller.execute(actor, ORDER_ID)).rejects.toMatchObject({
      status: 404,
    });
    d.bookingsRepo.findForOrder.mockResolvedValue(future(-60_000));
    await expect(d.canceller.execute(actor, ORDER_ID)).rejects.toMatchObject({
      status: 422,
    });
    expect(d.bookingsRepo.cancel).not.toHaveBeenCalled();
  });
});
