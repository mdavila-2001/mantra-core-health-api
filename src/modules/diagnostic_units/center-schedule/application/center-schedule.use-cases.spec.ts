import { describe, expect, it } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import {
  actor,
  build,
  OTHER_TENANT,
  RESOURCE_ID,
  TENANT,
  UNIT_ID,
  unitRow,
} from './center-schedule.testing';

const OUT_OF_SCOPE =
  DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

const week = (start: string, end: string, slot: number, days = [2]) => ({
  windows: days.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: start,
    endTime: end,
  })),
  slotMinutes: slot,
});

describe('GetCenterScheduleUseCase', () => {
  it('`me` resolves the unit of the active tenant, never one from the client', async () => {
    const d = build();
    const view = await runWithTenant(TENANT, () => d.reader.forMe());
    expect(d.scheduleRepo.findUnitOfTenant).toHaveBeenCalledWith(d.em, TENANT);
    expect(view).toMatchObject({
      unitId: UNIT_ID,
      kind: 'IMAGING',
      updatedAt: null,
      bookingsWithoutEquipment: 0,
      studies: [
        {
          code: 'STUDY-ECO-ABD',
          modalityCode: 'ECO',
          price: 250,
          currency: 'BOB',
          preparation: 'Ayuno de 6 a 8 horas.',
        },
      ],
    });
    // Never configured: the imaging default (Mon–Fri 08–17, 30 min).
    expect(view.schedule.general.windows).toHaveLength(5);
  });

  it('`me` without a diagnostic unit in the organization is 404', async () => {
    const d = build();
    d.scheduleRepo.findUnitOfTenant.mockResolvedValue(null);
    await expect(
      runWithTenant(TENANT, () => d.reader.forMe()),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('a unit of another tenant answers like a missing one (tenant isolation)', async () => {
    const d = build();
    d.scheduleRepo.findUnit.mockResolvedValue(
      unitRow({ tenant_id: OTHER_TENANT }),
    );
    await expect(
      runWithTenant(TENANT, () => d.reader.forUnit(UNIT_ID)),
    ).rejects.toMatchObject({ status: 404, reason: OUT_OF_SCOPE });
  });

  it('reads published templates by level, newest first, and maps equipment', async () => {
    const d = build();
    const at = new Date('2026-11-01T10:00:00Z');
    const rule = (template_id: string, name: string, day: number) => ({
      template_id,
      name,
      slot_minutes: 20,
      updated_at: at,
      day_of_week: day,
      start_time: '14:00:00',
      end_time: '18:00:00',
      capacity_per_slot: null,
    });
    d.scheduleRepo.findTemplateRules.mockResolvedValue([
      rule('t1', 'GENERAL', 1),
      rule('t2', 'MODALITY:ECO', 0),
    ]);
    d.scheduleRepo.findEquipment.mockResolvedValue([
      {
        id: 'eq-1',
        type_concept_id: DUNIT.EQUIPMENT_TYPE_ANALYZER,
        type_display: 'Analizador',
        manufacturer: null,
        model: null,
        modality_concept_id: DUNIT.MODALITY_LABORATORY,
        status_concept_id: DUNIT.EQUIPMENT_OPERATIONAL,
      },
      {
        id: 'eq-2',
        type_concept_id: DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
        type_display: 'Ecógrafo',
        manufacturer: 'GE',
        model: 'Logiq',
        modality_concept_id: DUNIT.MODALITY_ULTRASOUND,
        status_concept_id: DUNIT.EQUIPMENT_OUT_OF_SERVICE,
      },
    ]);
    const view = await runWithTenant(TENANT, () => d.reader.forUnit(UNIT_ID));
    expect(view.updatedAt).toBe(at.toISOString());
    expect(view.schedule.general.windows[0]).toEqual({
      dayOfWeek: 1,
      startTime: '14:00',
      endTime: '18:00',
    });
    // Sunday is stored as 0 by `scheduling` and goes out as ISO 7.
    expect(view.schedule.modalities).toEqual([
      { modalityCode: 'ECO', schedule: week('14:00', '18:00', 20, [7]) },
    ]);
    expect(view.equipment.map((e) => [e.modalityCode, e.status])).toEqual([
      [null, 'OPERATIONAL'],
      ['ECO', 'OUT_OF_SERVICE'],
    ]);
  });
});

describe('SaveCenterScheduleUseCase', () => {
  const body = (general = week('08:00', '12:00', 30, [1, 2, 3, 4, 5])) => ({
    general,
    modalities: [
      { modalityCode: 'ECO' as const, schedule: week('14:00', '18:00', 20) },
    ],
    studies: [
      { studyCode: 'STUDY-ECO-ABD', schedule: week('09:00', '11:00', 45, [6]) },
      { studyCode: 'NOT-OFFERED', schedule: week('09:00', '11:00', 45, [6]) },
    ],
  });

  it('retires the published templates and writes one per level', async () => {
    const d = build();
    await runWithTenant(TENANT, () => d.saver.execute(UNIT_ID, body(), actor));
    expect(d.bookingsRepo.lockResource).toHaveBeenCalledWith(d.em, RESOURCE_ID);
    expect(d.scheduleRepo.retireTemplates).toHaveBeenCalledWith(
      d.em,
      RESOURCE_ID,
      actor.id,
    );
    const names = d.scheduleRepo.insertTemplate.mock.calls.map((c: any[]) => [
      c[1].name,
      c[1].serviceConceptId,
    ]);
    // A block for a study the center does not offer is dropped.
    expect(names).toEqual([
      ['GENERAL', null],
      ['MODALITY:ECO', DUNIT.MODALITY_ULTRASOUND],
      ['STUDY:STUDY-ECO-ABD', expect.any(String)],
    ]);
  });

  it('422 with the problems when a window is inverted; nothing is written', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.saver.execute(UNIT_ID, body(week('12:00', '08:00', 30)), actor),
      ),
    ).rejects.toMatchObject({
      status: 422,
      details: { problems: [{ field: 'general' }] },
    });
    expect(d.scheduleRepo.retireTemplates).not.toHaveBeenCalled();
  });

  it('409 `affectedBookings` when a booked appointment would fall outside', async () => {
    const d = build();
    const start = new Date(Date.now() + 7 * 86_400_000);
    start.setUTCMinutes(7); // never a slot start of the new schedule
    d.bookingsRepo.findOccupying.mockResolvedValue([
      {
        id: 'b1',
        start_at: start,
        end_at: new Date(start.getTime() + 1_800_000),
        modality_code: 'RX',
        study_code: 'STUDY-RX-TORAX',
      },
    ]);
    await expect(
      runWithTenant(TENANT, () => d.saver.execute(UNIT_ID, body(), actor)),
    ).rejects.toMatchObject({ status: 409, details: { affectedBookings: 1 } });
    expect(d.scheduleRepo.insertTemplate).not.toHaveBeenCalled();
  });

  it('creates the scheduling resource of a center that never had one', async () => {
    const d = build();
    d.scheduleRepo.findResource.mockResolvedValue(null);
    await runWithTenant(TENANT, () => d.saver.execute(UNIT_ID, body(), actor));
    expect(d.scheduleRepo.createResource).toHaveBeenCalledWith(
      d.em,
      expect.objectContaining({ id: UNIT_ID }),
      'America/La_Paz',
      actor.id,
    );
  });
});

describe('SetEquipmentStatusUseCase', () => {
  const equipment = () => ({
    id: 'eq-1',
    diagnosticUnitSiteId: 'site-1',
    operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
  });

  it('stores the status concept and announces the change', async () => {
    const d = build();
    const eq: any = equipment();
    d.em.findOne
      .mockResolvedValueOnce(eq)
      .mockResolvedValueOnce({ id: 'site-1', diagnosticUnitId: UNIT_ID });
    await runWithTenant(TENANT, () =>
      d.equipment.execute(UNIT_ID, 'eq-1', 'MAINTENANCE', actor),
    );
    expect(eq.operationalStatusConceptId).toBe(DUNIT.EQUIPMENT_MAINTENANCE);
    expect(d.f5a.announceChanges).toHaveBeenCalledWith(
      d.em,
      eq,
      { careSpaceId: null, status: DUNIT.EQUIPMENT_OPERATIONAL },
      actor.id,
    );
  });

  it('a device of another unit is 404 and is not touched', async () => {
    const d = build();
    const eq: any = equipment();
    d.em.findOne
      .mockResolvedValueOnce(eq)
      .mockResolvedValueOnce({ id: 'site-1', diagnosticUnitId: 'other-unit' });
    await expect(
      runWithTenant(TENANT, () =>
        d.equipment.execute(UNIT_ID, 'eq-1', 'OUT_OF_SERVICE', actor),
      ),
    ).rejects.toMatchObject({ status: 404, reason: OUT_OF_SCOPE });
    expect(eq.operationalStatusConceptId).toBe(DUNIT.EQUIPMENT_OPERATIONAL);
  });
});

describe('ListCenterBookingsUseCase', () => {
  it('maps the bookings of my center, by start, with order and site', async () => {
    const d = build();
    d.bookingsRepo.listForResource.mockResolvedValue([
      {
        id: 'b1',
        start_at: new Date('2026-11-04T12:00:00Z'),
        end_at: new Date('2026-11-04T12:30:00Z'),
        status_concept_id: CONCEPTS.BOOKING_CONFIRMED,
        patient_name: 'Ana Pérez',
        snapshot: {
          serviceRequestId: 'order-1',
          studyName: 'Ecografía abdominal',
          siteName: 'Sede norte',
        },
      },
      {
        id: 'b2',
        start_at: new Date('2026-11-04T13:00:00Z'),
        end_at: new Date('2026-11-04T13:30:00Z'),
        status_concept_id: CONCEPTS.BOOKING_CHECKED_IN,
        patient_name: null,
        snapshot: null,
      },
    ]);
    const res = await runWithTenant(TENANT, () =>
      d.bookings.execute({
        from: '2026-11-04T04:00:00Z',
        to: '2026-11-05T04:00:00Z',
      }),
    );
    expect(res).toEqual({
      count: 2,
      items: [
        {
          bookingId: 'b1',
          orderId: 'order-1',
          patientName: 'Ana Pérez',
          studyName: 'Ecografía abdominal',
          startsAt: '2026-11-04T12:00:00.000Z',
          endsAt: '2026-11-04T12:30:00.000Z',
          siteName: 'Sede norte',
          status: 'CONFIRMED',
        },
        {
          bookingId: 'b2',
          orderId: null,
          patientName: null,
          studyName: null,
          startsAt: '2026-11-04T13:00:00.000Z',
          endsAt: '2026-11-04T13:30:00.000Z',
          siteName: 'Sede central',
          status: 'CHECKED_IN',
        },
      ],
    });
    expect(d.bookingsRepo.listForResource).toHaveBeenCalledWith(
      d.em,
      RESOURCE_ID,
      new Date('2026-11-04T04:00:00Z'),
      new Date('2026-11-05T04:00:00Z'),
    );
  });

  it('rejects an inverted or too wide window', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.bookings.execute({
          from: '2026-11-05T00:00:00Z',
          to: '2026-11-04T00:00:00Z',
        }),
      ),
    ).rejects.toMatchObject({ status: 422 });
  });
});
