import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingController } from './scheduling.controller';
import { SchedulingBookingsController } from './scheduling-bookings.controller';
import { SchedulingInternalController } from './scheduling-internal.controller';

const actor = { id: 'user-1', roles: ['SCHEDULING_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

describe('SchedulingController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const catalogService = {
      createResource: mockFn(),
      createPolicy: mockFn(),
      createTemplate: mockFn(),
      generateSlots: mockFn(),
      createException: mockFn(),
    };
    const bookingsService = { placeHold: mockFn(), confirmBooking: mockFn() };
    const waitlistService = { enroll: mockFn(), listForPatient: mockFn() };
    // P8: los avisos de demora cuelgan del recurso, así que el controlador de
    // configuración también los expone.
    const delayService = { delayResource: mockFn() };
    const controller = new SchedulingController(
      catalogService as any,
      bookingsService as any,
      waitlistService as any,
      delayService as any,
    );
    return {
      controller,
      catalogService,
      bookingsService,
      waitlistService,
      delayService,
    };
  }

  it('expone la lectura de la lista de espera de un paciente (P8)', async () => {
    const d = build();
    d.waitlistService.listForPatient.mockResolvedValue({ items: [] });

    const res = await d.controller.listWaitlist({
      patientProfileId: 'paciente-1',
    } as any);

    expect(d.waitlistService.listForPatient).toHaveBeenCalledWith({
      patientProfileId: 'paciente-1',
    });
    expect(res).toEqual({ items: [] });
  });

  it('delega la demora que alcanza a toda la agenda del recurso (P8)', async () => {
    const d = build();
    d.delayService.delayResource.mockResolvedValue({
      notified: 3,
      affected: 3,
      bookingIds: [],
      detail: 'ok',
    });

    const res = await d.controller.delayResource(
      'res-1',
      { delayMinutes: 20 },
      actor as any,
    );

    expect(d.delayService.delayResource).toHaveBeenCalledWith(
      'res-1',
      { delayMinutes: 20 },
      actor,
    );
    expect(res.affected).toBe(3);
  });

  it('delegates resource creation (UC-41-01)', async () => {
    const d = build();
    const dto = { name: 'Dr. Roca' } as any;
    d.catalogService.createResource.mockResolvedValue({ id: 'res-1' });

    await d.controller.createResource(dto, actor);

    expect(d.catalogService.createResource).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates policy creation (UC-41-01)', async () => {
    const d = build();
    const dto = { code: 'STD' } as any;
    d.catalogService.createPolicy.mockResolvedValue({ id: 'pol-1' });

    await d.controller.createPolicy(dto, actor);

    expect(d.catalogService.createPolicy).toHaveBeenCalledWith(dto, actor);
  });

  it('passes the resource id to the template service (UC-41-02)', async () => {
    const d = build();
    const dto = { name: 'Mañanas', rules: [] } as any;
    d.catalogService.createTemplate.mockResolvedValue({ id: 'tpl-1' });

    await d.controller.createTemplate(ID, dto, actor);

    expect(d.catalogService.createTemplate).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates slot generation (UC-41-03)', async () => {
    const d = build();
    const dto = {
      from: '2026-06-01T00:00:00Z',
      to: '2026-06-02T00:00:00Z',
    } as any;
    d.catalogService.generateSlots.mockResolvedValue({ created: 4 });

    await d.controller.generateSlots(ID, dto, actor);

    expect(d.catalogService.generateSlots).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates hold placement (UC-41-05)', async () => {
    const d = build();
    const dto = { patientProfileId: 'pat-1' } as any;
    d.bookingsService.placeHold.mockResolvedValue({ holdToken: 'tok' });

    await d.controller.placeHold(ID, dto, actor);

    expect(d.bookingsService.placeHold).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates booking confirmation using the hold token (UC-41-06)', async () => {
    const d = build();
    const dto = {
      tenantId: ID,
      patientProfileId: 'pat-1',
      channel: 'PORTAL',
    } as any;
    d.bookingsService.confirmBooking.mockResolvedValue({ id: 'booking-1' });

    await d.controller.confirmBooking(ID, dto, actor);

    expect(d.bookingsService.confirmBooking).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors (UC-41-11)', async () => {
    const d = build();
    d.waitlistService.enroll.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.enrollWaitlist({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});

describe('SchedulingBookingsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const bookingsService = {
      reschedule: mockFn(),
      cancel: mockFn(),
      checkIn: mockFn(),
    };
    const waitlistService = { scheduleReminders: mockFn() };
    const delayService = { delayBooking: mockFn() };
    const controller = new SchedulingBookingsController(
      bookingsService as any,
      waitlistService as any,
      delayService as any,
    );
    return { controller, bookingsService, waitlistService, delayService };
  }

  it('delega el aviso de demora sobre una cita (P8)', async () => {
    const d = build();
    d.delayService.delayBooking.mockResolvedValue({
      notified: 1,
      affected: 1,
      bookingIds: [ID],
      detail: 'ok',
    });

    const res = await d.controller.delay(ID, { delayMinutes: 20 }, actor);

    expect(d.delayService.delayBooking).toHaveBeenCalledWith(
      ID,
      { delayMinutes: 20 },
      actor,
    );
    expect(res.notified).toBe(1);
  });

  it('delegates reschedule (UC-41-08)', async () => {
    const d = build();
    const dto = { toSlotId: ID } as any;
    d.bookingsService.reschedule.mockResolvedValue({ bookingId: 'b1' });

    await d.controller.reschedule(ID, dto, actor);

    expect(d.bookingsService.reschedule).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates cancellation (UC-41-09)', async () => {
    const d = build();
    const dto = { cancelledBy: 'PATIENT' } as any;
    d.bookingsService.cancel.mockResolvedValue({ bookingId: 'b1' });

    await d.controller.cancel(ID, dto, actor);

    expect(d.bookingsService.cancel).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates check-in (UC-41-10)', async () => {
    const d = build();
    d.bookingsService.checkIn.mockResolvedValue({ bookingId: 'b1' });

    await d.controller.checkIn(ID, actor);

    expect(d.bookingsService.checkIn).toHaveBeenCalledWith(ID, actor);
  });

  it('delegates reminder scheduling (UC-41-13)', async () => {
    const d = build();
    const dto = { offsetsMinutes: [60] } as any;
    d.waitlistService.scheduleReminders.mockResolvedValue({ scheduled: 1 });

    await d.controller.scheduleReminders(ID, dto, actor);

    expect(d.waitlistService.scheduleReminders).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});

describe('SchedulingInternalController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const bookingsService = { expireHolds: mockFn() };
    const waitlistService = {
      promoteWaitlist: mockFn(),
      dispatchReminders: mockFn(),
      findSlotsWithCandidates: mockFn(),
    };
    const controller = new SchedulingInternalController(
      bookingsService as any,
      waitlistService as any,
    );
    return { controller, bookingsService, waitlistService };
  }

  it('forwards the batch limit to the hold expiry worker (UC-41-07)', async () => {
    const d = build();
    d.bookingsService.expireHolds.mockResolvedValue({ processed: 3 });

    await d.controller.expireHolds({ limit: 50 });

    expect(d.bookingsService.expireHolds).toHaveBeenCalledWith(50);
  });

  it('forwards slot and limit to the waitlist worker (UC-41-12)', async () => {
    const d = build();
    d.waitlistService.promoteWaitlist.mockResolvedValue({ processed: 1 });

    await d.controller.promoteWaitlist(ID, { limit: 10 });

    expect(d.waitlistService.promoteWaitlist).toHaveBeenCalledWith(ID, 10);
  });

  it('runs the reminder dispatcher with the default batch when unset (UC-41-14)', async () => {
    const d = build();
    d.waitlistService.dispatchReminders.mockResolvedValue({ processed: 0 });

    await d.controller.dispatchReminders({});

    expect(d.waitlistService.dispatchReminders).toHaveBeenCalledWith(undefined);
  });

  it('forwards the limit to the waitlist-candidate discovery query (UC-41-12)', async () => {
    const d = build();
    d.waitlistService.findSlotsWithCandidates.mockResolvedValue({
      slotIds: [ID],
    });

    const res = await d.controller.listWaitlistCandidates({ limit: 25 });

    expect(d.waitlistService.findSlotsWithCandidates).toHaveBeenCalledWith(25);
    expect(res).toEqual({ slotIds: [ID] });
  });
});
