import { randomUUID } from 'node:crypto';
import {
  AgendaNoticeCapabilityLab,
  AgendaNoticeLabUnconsumedFailuresError,
} from '../lab/agenda-notice-capability.lab';
import type { AgendaNotice } from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * H2 (carril de Pablo) · el laboratorio de la capacidad del piloto,
 * ejercitado contra PostgreSQL real.
 *
 * Corre con `yarn test:integration --config ./test/jest-integration.json
 * --testPathPatterns=agenda-notice-capability.lab`.
 */
describe('H2 · laboratorio de la capacidad de avisos de agenda', () => {
  const runId = `h2-lab-${randomUUID()}`;
  let lab: AgendaNoticeCapabilityLab;

  const noticeBase: Omit<AgendaNotice, 'kind'> = {
    recipient: { patientProfileId: '00000000-0000-0000-0000-000000000001' },
    subject: 'Aviso de prueba del laboratorio',
    bodyText: 'cuerpo de prueba',
    relatedResourceType: 'scheduling.bookings',
    relatedResourceId: '00000000-0000-0000-0000-0000000000b1',
  };

  beforeAll(async () => {
    lab = await AgendaNoticeCapabilityLab.start({
      runId,
      registeredKinds: ['SLOT_RELEASED', 'PRACTITIONER_DELAY'],
      clock: () => new Date('2026-09-20T00:00:00.000Z'),
    });
  });

  afterEach(async () => {
    await lab.reset();
  });

  afterAll(async () => {
    // limpieza final: sólo la del run de esta suite, no el esquema entero,
    // para no chocar con otra corrida del lab que esté activa a la vez.
    await lab.reset();
    await lab.disconnect();
  });

  it('H2.S1.M1/M2 — corre un caso de punta a punta contra Postgres y lo registra', async () => {
    const result = await lab.emit({ ...noticeBase, kind: 'SLOT_RELEASED' });

    expect(result.delivered).toBe(true);
    expect(result.notificationRequestId).toBeTruthy();

    const registradas = await lab.listRequests();
    expect(registradas).toHaveLength(1);
    expect(registradas[0]).toMatchObject({
      kind: 'SLOT_RELEASED',
      registered: true,
      relatedResourceType: 'scheduling.bookings',
    });

    await lab.close();
  });

  it('H2.S2.M1/M2 — el mismo caso corrido dos veces da el mismo resultado (reset + reloj fijo)', async () => {
    const correr = async () => {
      await lab.emit({ ...noticeBase, kind: 'PRACTITIONER_DELAY' });
      const filas = await lab.listRequests();
      await lab.close();
      // se excluye `seq`, que es el correlativo de la tabla y crece entre
      // corridas: lo comparable es la forma del aviso, no su posición física.
      return filas.map(({ seq: _seq, ...resto }) => resto);
    };

    const primera = await correr();
    await lab.reset();
    const segunda = await correr();

    expect(segunda).toEqual(primera);
  });

  it('H2.S1.M3 — ADV-02: una operación no registrada, atrapada por la "aplicación", igual hace fallar el cierre', async () => {
    // Simula código de aplicación que llama al puerto y atrapa TODO: es
    // exactamente lo que el puerto real permite, porque `emit()` no lanza.
    let excepcionEnLaLlamada: unknown = null;
    let resultado;
    try {
      resultado = await lab.emit({
        ...noticeBase,
        kind: 'APPOINTMENT_REMINDER', // no está en registeredKinds de este lab
      });
    } catch (err) {
      excepcionEnLaLlamada = err;
    }

    // El puerto no lanzó — igual que el real. Si esto fallara, el double
    // dejaría de ser sustituible por `MessagingAgendaNoticeAdapter`.
    expect(excepcionEnLaLlamada).toBeNull();
    expect(resultado?.delivered).toBe(true);

    // Pero el laboratorio SÍ tiene que fallar al cierre: es la única manera
    // de detectar la operación no prevista sin violar el contrato del puerto.
    await expect(lab.close()).rejects.toThrow(
      AgendaNoticeLabUnconsumedFailuresError,
    );
  });

  it('H2.S1.M4 — un fallo no consumido se conserva hasta el cierre, no se pierde entre llamadas', async () => {
    await lab.emit({ ...noticeBase, kind: 'BOOKING_STATE_CHANGED' }); // no registrado: 1er fallo pendiente
    await lab.emit({ ...noticeBase, kind: 'SLOT_RELEASED' }); // registrado: no agrega fallo

    let error: unknown = null;
    try {
      await lab.close();
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(AgendaNoticeLabUnconsumedFailuresError);
    expect(
      (error as AgendaNoticeLabUnconsumedFailuresError).failures,
    ).toHaveLength(1);
  });

  it('H2.S2.M3 — la limpieza destructiva rechaza una base con nombre arbitrario', async () => {
    await expect(
      lab.dropSchema('una_base_que_no_es_la_del_run'),
    ).rejects.toThrow(/Limpieza rechazada/);
  });
});
