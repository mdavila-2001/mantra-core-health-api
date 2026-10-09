import { jest } from '@jest/globals';

// Fábrica de dobles laxa, igual que en los specs de servicio del módulo.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingAgendaRepository } from './scheduling-agenda.repository';

/**
 * El corte temporal de la disponibilidad — A-03.
 *
 * Se aserta sobre el `where` que sale hacia la base y no sobre las filas que
 * vuelven, porque el defecto era exactamente ése: la consulta pedía cupos
 * vencidos y después nadie los descartaba. Filtrar en memoria habría dado el
 * mismo resultado en una prueba y habría seguido trayendo cien filas muertas
 * de Postgres (la regla del #156).
 */
describe('SchedulingAgendaRepository · findSlots', () => {
  const AHORA = new Date('2026-08-20T10:00:00.000Z');
  const AYER = new Date('2026-08-19T00:00:00.000Z');
  const EN_UNA_SEMANA = new Date('2026-08-27T00:00:00.000Z');

  function conFind() {
    const em = { find: mockFn().mockResolvedValue([]) };
    return { em, repo: new SchedulingAgendaRepository() };
  }

  /** El `where` con el que se llamó a `em.find`. */
  function whereDe(em: any) {
    return em.find.mock.calls[0][1];
  }

  it('con «sólo disponibles» la ventana arranca ahora, no ayer', async () => {
    const { em, repo } = conFind();

    await repo.findSlots(
      em as any,
      { from: AYER, to: EN_UNA_SEMANA, onlyAvailable: true, ahora: AHORA },
      50,
    );

    expect(whereDe(em).startAt.$gte).toBe(AHORA);
    expect(whereDe(em).startAt.$lt).toBe(EN_UNA_SEMANA);
  });

  it('sin «sólo disponibles» respeta la ventana pedida, vencidos incluidos', async () => {
    // Consultar el pasado es legítimo: es lo que hace la vista del día del
    // médico para mirar lo que ya atendió. Lo que no se puede es ofrecerlo
    // como reservable.
    const { em, repo } = conFind();

    await repo.findSlots(
      em as any,
      { from: AYER, to: EN_UNA_SEMANA, onlyAvailable: false, ahora: AHORA },
      50,
    );

    expect(whereDe(em).startAt.$gte).toBe(AYER);
  });

  it('no adelanta una ventana que ya empieza en el futuro', async () => {
    const { em, repo } = conFind();
    const manana = new Date('2026-08-21T00:00:00.000Z');

    await repo.findSlots(
      em as any,
      { from: manana, to: EN_UNA_SEMANA, onlyAvailable: true, ahora: AHORA },
      50,
    );

    expect(whereDe(em).startAt.$gte).toBe(manana);
  });

  it('sigue exigiendo capacidad libre: el corte se suma, no reemplaza', async () => {
    const { em, repo } = conFind();

    await repo.findSlots(
      em as any,
      { from: AYER, to: EN_UNA_SEMANA, onlyAvailable: true, ahora: AHORA },
      50,
    );

    expect(whereDe(em).remainingCapacity).toEqual({ $gt: 0 });
  });
});
