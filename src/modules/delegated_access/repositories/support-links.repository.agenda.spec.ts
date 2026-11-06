import { jest } from '@jest/globals';
import { SupportLinksRepository } from './support-links.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Un `EntityManager` que solo responde la consulta cruda de la agenda. */
function emReturning(rows: unknown[]) {
  const execute = mockFn().mockResolvedValue(rows);
  return { em: { execute }, execute };
}

/**
 * La agenda lee con un tope que decide el servicio (que pide uno de más para
 * saber si hubo truncado). El repositorio no lo fija: un `LIMIT 500` escrito en
 * la consulta truncaba sin que nadie pudiera enterarse.
 */
describe('SupportLinksRepository.findPractitionerAgenda', () => {
  const repo = new SupportLinksRepository();
  const from = new Date('2026-11-01T00:00:00Z');
  const to = new Date('2026-11-08T00:00:00Z');

  it('el tope es un parámetro de la consulta, no un literal', async () => {
    const { em, execute } = emReturning([]);
    await repo.findPractitionerAgenda(em as never, 't1', 'p1', from, to, 501);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql.replace(/\s+/g, ' ')).toMatch(/ORDER BY s\.start_at LIMIT \?$/);
    expect(sql).not.toMatch(/LIMIT\s+\d/);
    expect(params).toEqual(['t1', 'p1', from, to, 501]);
  });

  it('mapea las filas sin tocar el nombre del paciente', async () => {
    const { em } = emReturning([
      {
        id: 'b1',
        start_at: '2026-11-02T10:00:00Z',
        end_at: '2026-11-02T10:30:00Z',
        status_code: 'BOOKED',
        patient_profile_id: 'pp1',
        patient_name: 'Ana Pérez',
      },
    ]);
    await expect(
      repo.findPractitionerAgenda(em as never, 't1', 'p1', from, to, 10),
    ).resolves.toEqual([
      {
        bookingId: 'b1',
        startAt: new Date('2026-11-02T10:00:00Z'),
        endAt: new Date('2026-11-02T10:30:00Z'),
        statusCode: 'BOOKED',
        patientProfileId: 'pp1',
        patientName: 'Ana Pérez',
      },
    ]);
  });
});
