import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingAgendaNoticesService } from './scheduling-agenda-notices.service';

const SLOT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const slot = {
  slotId: SLOT,
  resourceId: 'recurso-1',
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  endAt: new Date('2026-08-20T14:30:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

const booking = {
  bookingId: 'booking-1',
  tenantId: 'tenant-1',
  patientProfileId: 'paciente-1',
  resourceId: 'recurso-1',
  slotId: SLOT,
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);

  const noticeRepo = {
    describeSlot: mockFn().mockResolvedValue(slot),
    describeBooking: mockFn().mockResolvedValue(booking),
    findWaitlistPatients: mockFn().mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'paciente-1', tenantId: 'tenant-1' },
      { id: 'entry-2', patientProfileId: 'paciente-2', tenantId: 'tenant-1' },
    ]),
    findBookingIdsForReminders: mockFn().mockResolvedValue([
      { reminderId: 'rem-1', bookingId: 'booking-1', offsetMinutes: 1440 },
    ]),
  };
  const notices = {
    emit: mockFn().mockResolvedValue({ delivered: true }),
    emitMany: mockFn(async (noticeList: any[]) =>
      noticeList.map(() => ({ delivered: true })),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingAgendaNoticesService(
    em as any,
    noticeRepo as any,
    notices as any,
    logger as any,
  );
  return { service, noticeRepo, notices, logger };
}

describe('SchedulingAgendaNoticesService (P8 · avisos del worker)', () => {
  describe('cupo liberado', () => {
    it('avisa a cada candidato promovido, con el nombre de la agenda', async () => {
      const d = build();

      const delivered = await d.service.notifySlotReleased(SLOT, [
        'entry-1',
        'entry-2',
      ]);

      const notices = d.notices.emitMany.mock.calls[0][0];
      expect(notices).toHaveLength(2);
      expect(notices[0].kind).toBe('SLOT_RELEASED');
      expect(notices[0].recipient.patientProfileId).toBe('paciente-1');
      expect(notices[1].recipient.patientProfileId).toBe('paciente-2');
      expect(notices[0].bodyText).toContain('Dra. Rivas');
      expect(delivered).toBe(2);
    });

    it('sin candidatos no molesta a nadie ni consulta el cupo', async () => {
      const d = build();
      expect(await d.service.notifySlotReleased(SLOT, [])).toBe(0);
      expect(d.noticeRepo.describeSlot).not.toHaveBeenCalled();
    });

    it('un cupo que ya no existe se registra y no se avisa', async () => {
      const d = build();
      d.noticeRepo.describeSlot.mockResolvedValue(null);

      expect(await d.service.notifySlotReleased(SLOT, ['entry-1'])).toBe(0);
      expect(d.notices.emitMany).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });
  });

  describe('recordatorios', () => {
    it('entrega por el canal in-app el recordatorio de cada cita', async () => {
      const d = build();

      const delivered = await d.service.notifyReminders(['rem-1']);

      const notices = d.notices.emitMany.mock.calls[0][0];
      expect(notices[0].kind).toBe('APPOINTMENT_REMINDER');
      expect(notices[0].payload.offsetMinutes).toBe(1440);
      expect(notices[0].bodyText).toContain('Dra. Rivas');
      expect(delivered).toBe(1);
    });

    it('un recordatorio cuya cita ya no está no rompe el lote', async () => {
      const d = build();
      d.noticeRepo.findBookingIdsForReminders.mockResolvedValue([
        { reminderId: 'rem-1', bookingId: 'booking-1', offsetMinutes: 120 },
        { reminderId: 'rem-2', bookingId: 'borrada', offsetMinutes: 120 },
      ]);
      d.noticeRepo.describeBooking
        .mockResolvedValueOnce(booking)
        .mockResolvedValueOnce(null);

      const delivered = await d.service.notifyReminders([
        'rem-1',
        'rem-2',
      ]);

      expect(d.notices.emitMany.mock.calls[0][0]).toHaveLength(1);
      expect(delivered).toBe(1);
    });

    it('sin recordatorios no consulta nada', async () => {
      const d = build();
      expect(await d.service.notifyReminders([])).toBe(0);
      expect(d.noticeRepo.findBookingIdsForReminders).not.toHaveBeenCalled();
    });
  });
});
