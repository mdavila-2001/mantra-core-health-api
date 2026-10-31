import { jest } from '@jest/globals';
import { SchedulingSupportAgendaRepository } from './scheduling-support-agenda.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El driver NO convierte un arreglo de JS en un arreglo de Postgres: solo expande
 * `in (?)` a un marcador por elemento, y una lista vacía deja `in ()` (error de
 * sintaxis; comprobado contra Postgres 16). Estas pruebas fijan que cada consulta
 * con lista (a) no consulta si la lista está vacía y (b) usa `in (?)`, nunca
 * `= any(?)`.
 */
function build() {
  const execute = mockFn().mockResolvedValue([]);
  const em = { execute } as any;
  return { em, execute, repo: new SchedulingSupportAgendaRepository() };
}

const U = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const FROM = new Date('2026-11-01T00:00:00Z');
const TO = new Date('2026-11-08T00:00:00Z');

describe('SchedulingSupportAgendaRepository: listas en las consultas', () => {
  it('findActiveWaits: sin agendas no consulta; con agendas pasa el arreglo a un solo `in (?)`', async () => {
    const d = build();
    await expect(d.repo.findActiveWaits(d.em, U(9), [])).resolves.toEqual([]);
    expect(d.execute).not.toHaveBeenCalled();
    await d.repo.findActiveWaits(d.em, U(9), [U(1), U(2)]);
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('resource_id in (?)');
    expect(sql).not.toMatch(/any\(/i);
    expect(params[2]).toEqual([U(1), U(2)]);
  });

  it('namesOf: cada lista vacía se salta su consulta', async () => {
    const d = build();
    const names = await d.repo.namesOf(d.em, {
      doctors: [],
      services: [],
      spaces: [],
    });
    expect(d.execute).not.toHaveBeenCalled();
    expect(names.doctors.size + names.services.size + names.spaces.size).toBe(
      0,
    );
    await d.repo.namesOf(d.em, { doctors: [U(1)], services: [], spaces: [] });
    expect(d.execute).toHaveBeenCalledTimes(1);
  });

  it('findRows: sin estados no consulta (`in ()` no es SQL válido)', async () => {
    const d = build();
    await expect(
      d.repo.findRows(d.em, U(9), FROM, TO, [], {}, 10),
    ).resolves.toEqual([]);
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('findRows: los filtros vacíos no agregan cláusulas; los llenos usan `in (?)`', async () => {
    const d = build();
    await d.repo.findRows(
      d.em,
      U(9),
      FROM,
      TO,
      [U(1)],
      { doctors: [], services: [], locations: [] },
      10,
    );
    const sinFiltros = d.execute.mock.calls[0][0] as string;
    expect(sinFiltros).not.toContain('resource_ref_id in');
    expect(sinFiltros).not.toContain('healthcare_service_id in');
    expect(sinFiltros).not.toContain('location_path');

    await d.repo.findRows(
      d.em,
      U(9),
      FROM,
      TO,
      [U(1), U(2)],
      { doctors: [U(3), U(4)], services: [U(5)], locations: [U(6), U(7)] },
      10,
    );
    const [sql, params] = d.execute.mock.calls[1];
    expect(sql).toContain('r.resource_ref_id in (?)');
    expect(sql).toContain('b.healthcare_service_id in (?)');
    expect(sql).toContain('cs.practice_site_id in (?)');
    expect(sql).not.toMatch(/any\(\?/i);
    expect(params).toEqual(
      expect.arrayContaining([
        [U(1), U(2)],
        [U(3), U(4)],
        [U(5)],
        [U(6), U(7)],
        `{${U(6)},${U(7)}}`,
      ]),
    );
  });

  it('los instantes que el driver entrega como texto salen como Date (la agenda los compara con getTime)', async () => {
    const d = build();
    d.execute.mockResolvedValueOnce([
      {
        id: U(1),
        resource_id: U(2),
        practitioner_profile_id: U(3),
        start_at: '2031-02-17T12:00:00.000Z',
        end_at: new Date('2031-02-17T12:30:00.000Z'),
        status_concept_id: U(4),
        care_space_id: null,
        healthcare_service_id: null,
        patient_profile_id: U(5),
        display_name: null,
      },
    ]);
    const [row] = await d.repo.findRows(d.em, U(9), FROM, TO, [U(4)], {}, 10);
    expect(row.startAt).toBeInstanceOf(Date);
    expect(row.startAt.toISOString()).toBe('2031-02-17T12:00:00.000Z');
    expect(row.endAt).toBeInstanceOf(Date);

    d.execute.mockResolvedValueOnce([
      {
        resource_id: U(2),
        desired_from: '2031-02-17T00:00:00.000Z',
        desired_to: null,
      },
    ]);
    const [wait] = await d.repo.findActiveWaits(d.em, U(9), [U(2)]);
    expect(wait.desiredFrom).toBeInstanceOf(Date);
    expect(wait.desiredTo).toBeUndefined();
  });
});
