import { jest } from '@jest/globals';

// Fábrica de dobles laxa, igual que en los specs de servicio del módulo.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingBookingsRepository } from './scheduling-bookings.repository';

/**
 * La consulta de la regla madre — M4 · H1.S1.M4.
 *
 * Se aserta sobre el SQL que sale hacia la base y no sobre filas, porque el
 * defecto está en la consulta: une el recurso por `b.resource_id`, que es
 * NULLable y que la reprogramación dejaba apuntando al recurso viejo. Una cita
 * con esa columna vacía o desactualizada quedaba **invisible** (o atribuida a
 * otro profesional) para el guardia que impide estar en dos lugares a la vez.
 * El horario sale del cupo, así que el recurso tiene que salir del mismo cupo:
 * `bookable_slots.resource_id` es NOT NULL.
 *
 * No reemplaza correr la consulta contra Postgres: eso queda para M1 (el
 * techo de este carril sin base es `TESTED`).
 */
describe('SchedulingBookingsRepository · findProfessionalCommitmentsOverlapping', () => {
  const DESDE = new Date('2026-10-01T13:00:00.000Z');
  const HASTA = new Date('2026-10-01T13:30:00.000Z');

  function conConexion(filas: unknown[] = []) {
    const execute = mockFn().mockResolvedValue(filas);
    const em = { getConnection: mockFn(() => ({ execute })) };
    return { em, execute, repo: new SchedulingBookingsRepository() };
  }

  /** El SQL con el que se llamó a la base, sin saltos de línea de más. */
  function sqlDe(execute: any): string {
    return String(execute.mock.calls[0][0]).replace(/\s+/g, ' ');
  }

  it('atribuye cada cita al recurso de SU CUPO, no a la columna nulable de la cita', async () => {
    const { em, execute, repo } = conConexion();

    await repo.findProfessionalCommitmentsOverlapping(
      em as any,
      'hp-1',
      DESDE,
      HASTA,
      ['BOOKING_CONFIRMED'],
    );

    const sql = sqlDe(execute);
    expect(sql).toContain(
      'JOIN scheduling.schedulable_resources r ON r.id = s.resource_id',
    );
    expect(sql).not.toContain('r.id = b.resource_id');
  });

  it('sigue comparando rangos por el cupo, con bordes estrictos (tocarse no es pisarse)', async () => {
    const { em, execute, repo } = conConexion();

    await repo.findProfessionalCommitmentsOverlapping(
      em as any,
      'hp-1',
      DESDE,
      HASTA,
      ['BOOKING_CONFIRMED'],
      'booking-propia',
    );

    const sql = sqlDe(execute);
    expect(sql).toContain('s.start_at < ?');
    expect(sql).toContain('s.end_at > ?');
    expect(execute.mock.calls[0][1]).toEqual([
      'hp-1',
      ['BOOKING_CONFIRMED'],
      HASTA,
      DESDE,
      'booking-propia',
      'booking-propia',
    ]);
  });

  it('sin estados que comprometan no consulta la base', async () => {
    const { em, execute, repo } = conConexion();

    const filas = await repo.findProfessionalCommitmentsOverlapping(
      em as any,
      'hp-1',
      DESDE,
      HASTA,
      [],
    );

    expect(filas).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });
});
