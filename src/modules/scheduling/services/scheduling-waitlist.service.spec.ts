import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

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
 * Cuándo empieza el cupo que se libera.
 *
 * Deja de ser un detalle desde que la promoción compara la ventana deseada del
 * candidato contra la hora del turno: un doble sin `startAt` haría pasar la
 * prueba con `undefined` viajando hasta la consulta.
 */
const INICIO_DEL_CUPO = new Date('2026-10-15T14:00:00.000Z');

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
    findEntriesForResource: mockFn().mockResolvedValue([]),
    // Por omisión la agenda es de otro: así, una prueba que olvide declarar de
    // quién es falla con el 403 en vez de pasar por accidente.
    findResourcePractitioner: mockFn().mockResolvedValue('otro-profesional'),
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

  // B.1 — quién puede actuar por un paciente. Por omisión no representa a
  // nadie: el permiso sale entonces del rol o de ser el titular, que es lo que
  // estas pruebas miran. Las del apoderamiento lo pisan a propósito.
  const representation = {
    representsPatient: mockFn().mockResolvedValue(false),
    assertMayActForPatient: mockFn().mockResolvedValue(undefined),
    findActiveProxiedPatientIds: mockFn().mockResolvedValue(new Set<string>()),
  };

  const service = new SchedulingWaitlistService(
    session as any,
    reader as any,
    writer as any,
    avisos as any,
    logger as any,
    representation as any,
  );
  return {
    service,
    session,
    transaction,
    reader,
    writer,
    avisos,
    logger,
    representation,
  };
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
        startAt: INICIO_DEL_CUPO,
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
        startAt: INICIO_DEL_CUPO,
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
        startAt: INICIO_DEL_CUPO,
      });
      d.writer.findActiveCandidates.mockResolvedValue([]);
      d.writer.markCandidatesFulfilled.mockResolvedValue(0);

      await d.service.promoteWaitlist(SLOT_ID, 50);

      expect(d.writer.findActiveCandidates).toHaveBeenCalledWith(
        'res-1',
        CONCEPTS.WAITLIST_ACTIVE,
        INICIO_DEL_CUPO,
        2,
        { transaction: d.transaction },
      );
    });

    /**
     * El defecto que este parámetro corrige.
     *
     * `waitlist_entries` guarda `desired_from` y `desired_to` desde que existe,
     * y la promoción no los miraba: acotaba por recurso y estado y nada más.
     * El que esperaba un turno para octubre recibía el aviso de un cupo que se
     * liberaba mañana **y su entrada quedaba marcada como cubierta**, así que
     * perdía el lugar sin haber conseguido la cita.
     *
     * La prueba no puede mirar el `WHERE` —eso vive en el repositorio— pero sí
     * que la hora del cupo llegue hasta el puerto: sin ese dato, la consulta no
     * puede filtrar por más que quiera.
     */
    it('le pasa al puerto la hora del cupo, que es lo que acota a quién le sirve', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 1,
        startAt: INICIO_DEL_CUPO,
      });
      d.writer.findActiveCandidates.mockResolvedValue([]);
      d.writer.markCandidatesFulfilled.mockResolvedValue(0);

      await d.service.promoteWaitlist(SLOT_ID);

      const [, , horaDelCupo] = d.writer.findActiveCandidates.mock.calls[0];
      expect(horaDelCupo).toEqual(INICIO_DEL_CUPO);
    });

    /* P8 · el cupo liberado deja de ser un dato interno --------------------- */

    it('avisa a los candidatos promovidos, fuera de la transacción', async () => {
      const d = build();
      d.writer.findSlotCapacity.mockResolvedValue({
        id: SLOT_ID,
        resourceId: 'res-1',
        remainingCapacity: 3,
        startAt: INICIO_DEL_CUPO,
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
        startAt: INICIO_DEL_CUPO,
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
        { id: 'user-1', roles: ['PATIENT'], patientProfileId: 'pat-1' } as any,
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
        { id: 'user-1', roles: ['PATIENT'], patientProfileId: 'pat-1' } as any,
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
    /** El titular de la lista: mira la suya. */
    const titular = {
      id: 'user-1',
      roles: [] as string[],
      patientProfileId: 'paciente-1',
    } as any;

    it('por omisión trae sólo las esperas activas', async () => {
      const d = build();

      await d.service.listForPatient(
        { patientProfileId: 'paciente-1' },
        titular,
      );

      expect(d.reader.findEntriesForPatient).toHaveBeenCalledWith(
        'paciente-1',
        [CONCEPTS.WAITLIST_ACTIVE],
        50,
      );
    });

    it('con includeClosed las trae todas', async () => {
      const d = build();

      await d.service.listForPatient(
        { patientProfileId: 'paciente-1', includeClosed: 'true', limit: 10 },
        titular,
      );

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

      const res = await d.service.listForPatient(
        { patientProfileId: 'paciente-1' },
        titular,
      );

      expect(res.items).toHaveLength(1);
      expect(res.items[0].resourceLabel).toBe('Dra. Rivas');
      expect(res.items[0].statusConceptId).toBe(CONCEPTS.WAITLIST_ACTIVE);
    });

    /**
     * El IDOR que esta lectura tenía abierto.
     *
     * El endpoint recibía `patientProfileId` por query, admitía el rol
     * `PATIENT` y no miraba de quién era el perfil: cambiando un uuid en la URL
     * cualquiera leía con qué profesional espera otra persona y para qué
     * fechas. La comprobación vive en el servidor porque es la única que no se
     * saltea con `curl`.
     */
    it('un paciente no puede leer la lista de espera de otro', async () => {
      const d = build();
      const otro = {
        id: 'user-2',
        roles: [],
        patientProfileId: 'paciente-2',
      } as any;

      await expect(
        d.service.listForPatient({ patientProfileId: 'paciente-1' }, otro),
      ).rejects.toThrow(/titular/i);

      expect(d.reader.findEntriesForPatient).not.toHaveBeenCalled();
    });

    it('el personal de agenda sí puede leer la de cualquiera', async () => {
      // Es su trabajo: quien atiende el mostrador reacomoda turnos ajenos.
      const d = build();
      const agente = {
        id: 'user-3',
        roles: ['SCHEDULING_AGENT'],
      } as any;

      await d.service.listForPatient(
        { patientProfileId: 'paciente-1' },
        agente,
      );

      expect(d.reader.findEntriesForPatient).toHaveBeenCalled();
    });
  });

  /**
   * La pregunta del profesional, que el módulo no sabía responder: la lista de
   * espera promovía sola y avisaba sola, y el dueño de la agenda no tenía forma
   * de ver la cola.
   */
  describe('listForResource — quiénes esperan mi agenda (P8)', () => {
    /** La profesional que atiende en `res-1`. */
    const suya = {
      id: 'user-9',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'prof-1',
    } as any;

    it('trae la cola de la agenda con el nombre de quien espera', async () => {
      const d = build();
      d.reader.findResourcePractitioner.mockResolvedValue('prof-1');
      d.reader.findEntriesForResource.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId: 'tenant-1',
          patientProfileId: 'paciente-1',
          resourceId: 'res-1',
          resourceLabel: 'Dra. Rivas',
          priority: 0,
          statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
          createdAt: new Date('2026-08-18T10:00:00.000Z'),
          patientName: 'Ana Paz',
        },
      ]);

      const res = await d.service.listForResource('res-1', {}, suya);

      expect(res.items[0].patientName).toBe('Ana Paz');
      expect(d.reader.findEntriesForResource).toHaveBeenCalledWith(
        'res-1',
        [CONCEPTS.WAITLIST_ACTIVE],
        50,
      );
    });

    it('un profesional no puede ver quién espera la agenda de otro', async () => {
      const d = build();
      d.reader.findResourcePractitioner.mockResolvedValue('prof-2');

      await expect(
        d.service.listForResource('res-1', {}, suya),
      ).rejects.toThrow(/otro profesional/i);

      expect(d.reader.findEntriesForResource).not.toHaveBeenCalled();
    });

    it('una agenda que no cuelga de un profesional no es de nadie', async () => {
      // Una sala o un equipo: `findResourcePractitioner` devuelve `null` y la
      // respuesta a «¿es tu agenda?» es que no, para todos menos el personal.
      const d = build();
      d.reader.findResourcePractitioner.mockResolvedValue(null);

      await expect(
        d.service.listForResource('res-1', {}, suya),
      ).rejects.toThrow(/otro profesional/i);
    });

    it('con includeClosed trae también las cubiertas', async () => {
      const d = build();
      d.reader.findResourcePractitioner.mockResolvedValue('prof-1');

      await d.service.listForResource(
        'res-1',
        { includeClosed: 'true', limit: 10 },
        suya,
      );

      expect(d.reader.findEntriesForResource).toHaveBeenCalledWith(
        'res-1',
        undefined,
        10,
      );
    });
  });

  describe('quién puede anotar y ver la cola (B.1)', () => {
    /** Una cuenta de paciente que no es el titular ni lo representa. */
    const intruso = {
      id: 'user-intruso',
      roles: ['PATIENT'],
      patientProfileId: 'pat-otro',
    } as any;

    it('un paciente no puede anotar a otro en la cola', async () => {
      // Antes no había comprobación ninguna: con el uuid de un perfil ajeno
      // cualquiera lo metía en la cola de una agenda y le disparaba avisos.
      const d = build();

      await expect(
        d.service.enroll(
          { tenantId: 'ten-1', patientProfileId: 'pat-1' } as any,
          intruso,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.writer.enroll).not.toHaveBeenCalled();
    });

    it('quien lo representa sí puede anotarlo', async () => {
      const d = build();
      d.representation.representsPatient.mockResolvedValue(true);
      d.writer.enroll.mockResolvedValue({ id: 'wl-3' });

      const res = await d.service.enroll(
        { tenantId: 'ten-1', patientProfileId: 'pat-hijo' } as any,
        { id: 'user-madre', roles: ['PATIENT'], patientProfileId: 'pat-madre' } as any,
      );

      expect(res.id).toBe('wl-3');
      expect(d.representation.representsPatient).toHaveBeenCalledWith(
        'pat-hijo',
        expect.objectContaining({ id: 'user-madre' }),
      );
    });

    it('el personal de agenda anota a cualquiera sin preguntar por apoderamientos', async () => {
      // Es su oficio: repartir turnos entre pacientes que no son ellos.
      const d = build();
      d.writer.enroll.mockResolvedValue({ id: 'wl-4' });

      await d.service.enroll(
        { tenantId: 'ten-1', patientProfileId: 'pat-1' } as any,
        { id: 'user-mostrador', roles: ['SCHEDULING_AGENT'] } as any,
      );

      expect(d.representation.representsPatient).not.toHaveBeenCalled();
    });

    it('quien representa al paciente también ve su cola', async () => {
      const d = build();
      d.representation.representsPatient.mockResolvedValue(true);
      d.reader.findEntriesForPatient.mockResolvedValue([]);

      await expect(
        d.service.listForPatient(
          { patientProfileId: 'pat-hijo' } as any,
          { id: 'user-madre', roles: ['PATIENT'], patientProfileId: 'pat-madre' } as any,
        ),
      ).resolves.toEqual({ items: [] });
    });

    it('sin apoderamiento, la cola ajena se rechaza', async () => {
      const d = build();

      await expect(
        d.service.listForPatient(
          { patientProfileId: 'pat-1' } as any,
          intruso,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
