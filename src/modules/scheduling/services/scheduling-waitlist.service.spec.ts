import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingWaitlistService } from './scheduling-waitlist.service';
import { CONCEPTS } from '../../../common';

const SLOT_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * Tras la migración a puertos, los dobles ya no imitan al `EntityManager` sino
 * a la sesión y a los dos puertos. Es exactamente la ganancia que se buscaba:
 * la prueba describe qué necesita el caso de uso del negocio en vez de cómo lo
 * consulta el ORM.
 *
 * @returns Resultado de build.
 */
function build() {
  const transaction = { __transaction: 'postgres' };
  const session = {
    read: mockFn((_op: string, work: any) => work({})),
    write: mockFn((_op: string, work: any) => work({})),
    transaction: mockFn((_op: string, work: any) => work({}, transaction)),
  };
  const reader = {
    findSlotsWithActiveCandidates: mockFn(),
    findEntriesForPatient: mockFn().mockResolvedValue([]),
  };
  const writer = {
    enroll: mockFn(),
    findSlotCapacity: mockFn(),
    findActiveCandidates: mockFn(),
    markCandidatesFulfilled: mockFn(),
    findBookingScheduleForUpdate: mockFn(),
    scheduleReminders: mockFn(),
    findDueReminders: mockFn(),
    markRemindersSent: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // P8: el colaborador que emite los avisos. Por omisión no avisa a nadie —lo
  // que importa acá es que el caso de uso le pase los ids correctos—; las
  // pruebas del aviso viven en su propio archivo.
  const avisos = {
    avisarCupoLiberado: mockFn().mockResolvedValue(0),
    avisarRecordatorios: mockFn().mockResolvedValue(0),
  };

  const service = new SchedulingWaitlistService(
    session as any,
    reader as any,
    writer as any,
    avisos as any,
    logger as any,
  );
  return { service, session, transaction, reader, writer, avisos, logger };
}

describe('SchedulingWaitlistService', () => {
  describe('findSlotsWithCandidates (UC-41-12, descubrimiento)', () => {
    it('delega en el puerto de lectura con el estado activo y el lote por defecto', async () => {
      const d = build();
      d.reader.findSlotsWithActiveCandidates.mockResolvedValue([SLOT_ID]);

      const res = await d.service.findSlotsWithCandidates();

      expect(d.reader.findSlotsWithActiveCandidates).toHaveBeenCalledWith(
        CONCEPTS.WAITLIST_ACTIVE,
        100,
        expect.any(Date),
      );
      expect(res).toEqual({ slotIds: [SLOT_ID] });
    });

    it('propaga un límite propio y devuelve lista vacía sin candidatos', async () => {
      const d = build();
      d.reader.findSlotsWithActiveCandidates.mockResolvedValue([]);

      const res = await d.service.findSlotsWithCandidates(5);

      expect(d.reader.findSlotsWithActiveCandidates).toHaveBeenCalledWith(
        CONCEPTS.WAITLIST_ACTIVE,
        5,
        expect.any(Date),
      );
      expect(res).toEqual({ slotIds: [] });
    });

    it('no abre transacción: es una lectura pura y debe poder salir por la réplica', async () => {
      const d = build();
      d.reader.findSlotsWithActiveCandidates.mockResolvedValue([]);

      await d.service.findSlotsWithCandidates();

      expect(d.session.transaction).not.toHaveBeenCalled();
    });
  });

  describe('promoteWaitlist (UC-41-12)', () => {
    it('marca como cubiertos los candidatos dentro de la misma transacción', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 3,
      });
      d.writer.findActiveCandidates.mockResolvedValue([
        { id: 'c1', priority: 5 },
        { id: 'c2', priority: 1 },
      ]);
      d.writer.markCandidatesFulfilled.mockResolvedValue(2);

      const res = await d.service.promoteWaitlist(SLOT_ID);

      expect(d.writer.markCandidatesFulfilled).toHaveBeenCalledWith(
        ['c1', 'c2'],
        CONCEPTS.WAITLIST_FULFILLED,
        { transaction: d.transaction },
      );
      expect(res.processed).toBe(2);
    });

    it('no promueve nada cuando el slot se quedó sin cupo', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 0,
      });

      const res = await d.service.promoteWaitlist(SLOT_ID);

      expect(res.processed).toBe(0);
      expect(d.writer.findActiveCandidates).not.toHaveBeenCalled();
    });

    it('nunca pide más candidatos que plazas libres quedan', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 2,
      });
      d.writer.findActiveCandidates.mockResolvedValue([]);
      d.writer.markCandidatesFulfilled.mockResolvedValue(0);

      await d.service.promoteWaitlist(SLOT_ID, 50);

      expect(d.writer.findActiveCandidates).toHaveBeenCalledWith(
        'res-1',
        CONCEPTS.WAITLIST_ACTIVE,
        2,
        { transaction: d.transaction },
      );
    });

    /* P8 · el cupo liberado deja de ser un dato interno --------------------- */

    it('avisa a los candidatos promovidos, fuera de la transacción', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 3,
      });
      d.writer.findActiveCandidates.mockResolvedValue([
        { id: 'c1', priority: 5 },
        { id: 'c2', priority: 1 },
      ]);
      d.writer.markCandidatesFulfilled.mockResolvedValue(2);
      d.avisos.avisarCupoLiberado.mockResolvedValue(2);

      const res = await d.service.promoteWaitlist(SLOT_ID);

      expect(d.avisos.avisarCupoLiberado).toHaveBeenCalledWith(SLOT_ID, [
        'c1',
        'c2',
      ]);
      expect(res.detail).toMatch(/avisados \(2 de 2\)/);
    });

    it('sin promoción no avisa a nadie', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 0,
      });

      await d.service.promoteWaitlist(SLOT_ID);

      expect(d.avisos.avisarCupoLiberado).toHaveBeenCalledWith(SLOT_ID, []);
    });
  });

  describe('enroll (UC-41-11)', () => {
    it('inscribe al paciente con la prioridad indicada', async () => {
      const d = build();
      d.writer.enroll.mockResolvedValue({ id: 'wl-1' });

      const res = await d.service.enroll(
        { tenantId: 'ten-1', patientProfileId: 'pat-1', priority: 5 } as any,
        { id: 'user-1' } as any,
      );

      expect(res).toEqual({
        id: 'wl-1',
        priority: 5,
        statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
      });
    });

    it('aplica prioridad 0 cuando el DTO no la trae', async () => {
      const d = build();
      d.writer.enroll.mockResolvedValue({ id: 'wl-2' });

      const res = await d.service.enroll(
        { tenantId: 'ten-1', patientProfileId: 'pat-1' } as any,
        { id: 'user-1' } as any,
      );

      expect(res.priority).toBe(0);
      expect(d.writer.enroll).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 0 }),
        { transaction: d.transaction, actorUserId: 'user-1' },
      );
    });
  });

  describe('scheduleReminders (UC-41-13)', () => {
    it('programa los recordatorios relativos al inicio del slot', async () => {
      const d = build();
      d.writer.findBookingScheduleForUpdate.mockResolvedValue({
        bookingId: 'booking-1',
        slotStartAt: new Date('2026-06-01T10:00:00Z'),
      });
      d.writer.scheduleReminders.mockResolvedValue(2);

      const res = await d.service.scheduleReminders(
        'booking-1',
        { offsetsMinutes: [1440, 60], channel: 'EMAIL' } as any,
        { id: 'user-1' } as any,
      );

      expect(res).toEqual({ bookingId: 'booking-1', scheduled: 2 });
      expect(d.writer.scheduleReminders).toHaveBeenCalledWith(
        expect.objectContaining({
          channelConceptId: CONCEPTS.REMINDER_CH_EMAIL,
          slotStartAt: new Date('2026-06-01T10:00:00Z'),
        }),
        { transaction: d.transaction, actorUserId: 'user-1' },
      );
    });

    it('falla con «cita no encontrada» si el puerto no la resuelve', async () => {
      const d = build();
      d.writer.findBookingScheduleForUpdate.mockResolvedValue(null);

      await expect(
        d.service.scheduleReminders(
          'booking-x',
          { offsetsMinutes: [60], channel: 'SMS' } as any,
          { id: 'user-1' } as any,
        ),
      ).rejects.toThrow('Cita no encontrada');
      expect(d.writer.scheduleReminders).not.toHaveBeenCalled();
    });
  });

  describe('dispatchReminders (UC-41-14)', () => {
    it('marca como enviados los recordatorios vencidos', async () => {
      const d = build();
      d.writer.findDueReminders.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
      d.writer.markRemindersSent.mockResolvedValue(2);

      const res = await d.service.dispatchReminders();

      expect(d.writer.markRemindersSent).toHaveBeenCalledWith(
        ['r1', 'r2'],
        CONCEPTS.REMINDER_SENT,
        expect.any(Date),
        { transaction: d.transaction },
      );
      expect(res.processed).toBe(2);
    });

    /* P8 · el recordatorio se entrega, no sólo se marca ---------------------- */

    it('entrega por el canal in-app los recordatorios que acaba de despachar', async () => {
      const d = build();
      d.writer.findDueReminders.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
      d.writer.markRemindersSent.mockResolvedValue(2);
      d.avisos.avisarRecordatorios.mockResolvedValue(2);

      const res = await d.service.dispatchReminders();

      expect(d.avisos.avisarRecordatorios).toHaveBeenCalledWith(['r1', 'r2']);
      expect(res.detail).toMatch(/canal in-app \(2 de 2\)/);
    });

    it('un lote vacío no intenta entregar nada', async () => {
      const d = build();
      d.writer.findDueReminders.mockResolvedValue([]);
      d.writer.markRemindersSent.mockResolvedValue(0);

      const res = await d.service.dispatchReminders();

      expect(d.avisos.avisarRecordatorios).toHaveBeenCalledWith([]);
      expect(res.detail).toMatch(/No había recordatorios vencidos/);
    });
  });

  describe('listForPatient (UC-41-11, lectura — P8)', () => {
    it('por omisión trae sólo las esperas activas', async () => {
      const d = build();

      await d.service.listForPatient({ patientProfileId: 'paciente-1' });

      expect(d.reader.findEntriesForPatient).toHaveBeenCalledWith(
        'paciente-1',
        [CONCEPTS.WAITLIST_ACTIVE],
        50,
      );
    });

    it('con includeClosed las trae todas', async () => {
      const d = build();

      await d.service.listForPatient({
        patientProfileId: 'paciente-1',
        includeClosed: 'true',
        limit: 10,
      });

      expect(d.reader.findEntriesForPatient).toHaveBeenCalledWith(
        'paciente-1',
        undefined,
        10,
      );
    });

    it('devuelve el nombre de la agenda, no su uuid', async () => {
      const d = build();
      d.reader.findEntriesForPatient.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId: 'tenant-1',
          patientProfileId: 'paciente-1',
          resourceId: 'res-1',
          resourceLabel: 'Dra. Rivas',
          priority: 0,
          statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
          createdAt: new Date('2026-08-18T10:00:00.000Z'),
        },
      ]);

      const res = await d.service.listForPatient({
        patientProfileId: 'paciente-1',
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].resourceLabel).toBe('Dra. Rivas');
      expect(res.items[0].statusConceptId).toBe(CONCEPTS.WAITLIST_ACTIVE);
    });
  });
});
