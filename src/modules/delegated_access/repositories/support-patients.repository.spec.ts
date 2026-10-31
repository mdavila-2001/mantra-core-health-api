import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { SupportPatientsRepository } from './support-patients.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Ver `scheduling-support-agenda.repository.spec.ts`: el driver expande `in (?)`
 * a un marcador por elemento y no admite listas vacías ni `= any(?)`.
 */
function build() {
  const execute = mockFn().mockResolvedValue([]);
  const em = { execute } as any;
  return { em, execute, repo: new SupportPatientsRepository() };
}

const U = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('SupportPatientsRepository.findRepresentatives: listas', () => {
  it('sin menores no consulta', async () => {
    const d = build();
    const res = await d.repo.findRepresentatives(d.em, U(9), []);
    expect(res.size).toBe(0);
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('con menores pasa el arreglo a un solo `in (?)` en las dos consultas', async () => {
    const d = build();
    await d.repo.findRepresentatives(d.em, U(9), [U(1), U(2)]);
    expect(d.execute).toHaveBeenCalledTimes(2);
    for (const [sql, params] of d.execute.mock.calls) {
      expect(sql).toContain('patient_profile_id in (?)');
      expect(sql).not.toMatch(/any\(\?/i);
      expect(params[0]).toEqual([U(1), U(2)]);
    }
  });

  it('las representaciones legales se acotan a la organización indicada', async () => {
    const d = build();
    await d.repo.findRepresentatives(d.em, U(9), [U(1)]);
    const [sql, params] = d.execute.mock.calls[1];
    expect(sql).toContain('r.tenant_id = ?');
    expect(params[1]).toBe(U(9));
  });

  it('une las dos fuentes por paciente', async () => {
    const d = build();
    d.execute
      .mockResolvedValueOnce([
        {
          id: 'rel-1',
          patient_profile_id: U(1),
          display_name: 'Sandra Antelo',
          relationship_concept_id: 'x',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'rep-1',
          patient_profile_id: U(1),
          display_name: 'Felipe Rocha',
          representation_type_concept_id: 'y',
        },
      ]);
    const res = await d.repo.findRepresentatives(d.em, U(9), [U(1)]);
    expect(res.get(U(1))?.map((r) => r.name)).toEqual([
      'Sandra Antelo',
      'Felipe Rocha',
    ]);
  });
});

/** Cuántos `?` (marcadores) trae el SQL: debe haber un parámetro por cada uno. */
const placeholders = (sql: string): number => (sql.match(/\?/g) ?? []).length;

const NORMALIZED_ID_SQL =
  "regexp_replace(upper(regexp_replace(i.value, '[\\s.-]+', '', 'g')), '^0+', '')";

describe('SupportPatientsRepository: documento normalizado (N3)', () => {
  const probe = {
    tenantId: U(9),
    nationalId: ' 0.765-4321 ',
    fullName: 'Lucía Mamani Quispe',
    lastName: 'Mamani',
    birthDate: '1990-05-17',
    phone: '+591 71234567',
  };

  it('los parecidos comparan el documento normalizado de las dos partes (SQL y parámetro)', async () => {
    const d = build();
    await d.repo.findDuplicateCandidates(d.em, probe);
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain(NORMALIZED_ID_SQL);
    // Ya no compara el valor guardado «tal cual».
    expect(sql).not.toMatch(/i\.value = \?/);
    expect(params).toContain('7654321');
    expect(params).not.toContain(' 0.765-4321 ');
    expect(params).not.toContain('0.765-4321');
    expect(placeholders(sql)).toBe(params.length);
  });

  it('la búsqueda exacta por documento compara igual', async () => {
    const d = build();
    await d.repo.findExact(d.em, 'NATIONAL_ID', { nationalId: '01.234-567' });
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain(NORMALIZED_ID_SQL);
    expect(params).toContain('1234567');
    expect(placeholders(sql)).toBe(params.length);
  });

  it('N3: la comparación por documento repite los cuatro predicados del índice único (para usarlo) con los ids como literales', async () => {
    const find = build();
    await find.repo.findDuplicateCandidates(find.em, probe);
    const exact = build();
    await exact.repo.findExact(exact.em, 'NATIONAL_ID', {
      nationalId: '01.234-567',
    });
    for (const [sql, params] of [
      ...find.execute.mock.calls,
      ...exact.execute.mock.calls,
    ]) {
      expect(sql).toContain(
        `i.type_concept_id = '${CONCEPTS.ID_TYPE_NATIONAL}'`,
      );
      expect(sql).toContain(`i.state_concept_id = '${CONCEPTS.STATE_ACTIVE}'`);
      expect(sql).toContain(
        `i.owner_type_concept_id = '${CONCEPTS.OWNER_PATIENT}'`,
      );
      expect(sql).toContain('i.valid_to is null');
      // La comparación es una subconsulta sobre el índice, no un `exists`
      // correlacionado con cada paciente.
      expect(sql).toContain(
        'pp.profile_id in (select i.owner_id from common.identifiers i',
      );
      expect(placeholders(sql)).toBe((params as unknown[]).length);
    }
  });

  it('un cerrojo por documento normalizado serializa las altas simultáneas', async () => {
    const d = build();
    await d.repo.lockDocument(d.em, '0.765-4321');
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(params[0]).toContain('7654321');
    expect(params[0]).not.toContain('0.765');
  });
});

describe('SupportPatientsRepository: «es de la organización» (B-d)', () => {
  const probe = {
    tenantId: U(9),
    nationalId: '7654321',
    fullName: 'Lucía Mamani Quispe',
    lastName: 'Mamani',
    birthDate: '1990-05-17',
    phone: '+591 71234567',
  };

  it('la membresía de quien lo registró cuenta solo si está ACTIVA y vigente', async () => {
    const d = build();
    await d.repo.findDuplicateCandidates(d.em, probe);
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('m.status_concept_id = ?');
    expect(sql).toContain('m.start_date <= now()');
    expect(sql).toMatch(/m\.end_date is null or m\.end_date > now\(\)/);
    expect(params).toContain(DIR.MEMBERSHIP_ACTIVE);
    expect(placeholders(sql)).toBe(params.length);
  });

  it('si esa membresía es de apoyo, el vínculo debe estar vivo (activo, vigente y recertificado)', async () => {
    const d = build();
    await d.repo.findDuplicateCandidates(d.em, probe);
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('delegated_access.organization_user_assignments');
    expect(sql).toContain('a.role_template_id is not null');
    expect(sql).toContain('a.status_concept_id = ?');
    expect(sql).toContain('a.next_recertification_at');
    expect(sql).toContain("interval '15 days'");
    expect(params).toContain(CONCEPTS.STATE_ACTIVE);
  });
});
