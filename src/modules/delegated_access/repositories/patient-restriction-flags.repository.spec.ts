import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { PatientRestrictionFlags } from '../entities';
import { PatientRestrictionFlagsRepository } from './patient-restriction-flags.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new PatientRestrictionFlagsRepository(), em };
}

describe('PatientRestrictionFlagsRepository', () => {
  it('lee las banderas VIGENTES de varios pacientes en una sola consulta', async () => {
    const { repo, em } = build([{ patientProfileId: 'p1' }]);

    const out = await repo.findActiveForPatients(em, 't1', ['p1', 'p2'], NOW);

    expect(out).toEqual([{ patientProfileId: 'p1' }]);
    expect(em.find).toHaveBeenCalledTimes(1);
    const [entity, where] = em.find.mock.calls[0];
    expect(entity).toBe(PatientRestrictionFlags);
    expect(where).toMatchObject({
      tenantId: 't1',
      patientProfileId: { $in: ['p1', 'p2'] },
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: { $lte: NOW },
    });
    expect(JSON.stringify(where.$or)).toContain(NOW.toISOString());
  });

  it('sin pacientes no consulta', async () => {
    const { repo, em } = build();
    expect(await repo.findActiveForPatients(em, 't1', [], NOW)).toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });

  it('pone una bandera activa con motivo y autor; no es un dato clínico', () => {
    const { repo, em } = build();

    const row: any = repo.create(em, {
      tenantId: 't1',
      patientProfileId: 'p1',
      flagConceptId: DELEG.PATIENT_FLAG_VIP,
      reasonText: 'Paciente de alto perfil, acceso restringido',
      validFrom: NOW,
      actorUserId: 'doc-1',
    });

    expect(row).toMatchObject({
      patientProfileId: 'p1',
      flagConceptId: DELEG.PATIENT_FLAG_VIP,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: NOW,
      createdByUserId: 'doc-1',
    });
    expect(row.validTo).toBeUndefined();
  });

  it('busca la bandera activa de un tipo para un paciente (la llave del único parcial)', async () => {
    const { repo, em } = build([{ id: 'b1' }]);
    await repo.findActive(em, 't1', 'p1', DELEG.PATIENT_FLAG_CONFIDENTIAL);
    expect(em.findOne.mock.calls[0][1]).toEqual({
      tenantId: 't1',
      patientProfileId: 'p1',
      flagConceptId: DELEG.PATIENT_FLAG_CONFIDENTIAL,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });

  it('quitar una bandera la revoca y la cierra, no la borra', () => {
    const { repo } = build();
    const row: any = { statusConceptId: CONCEPTS.STATE_ACTIVE };
    repo.revoke(row, 'doc-1', NOW);
    expect(row).toMatchObject({
      statusConceptId: CONCEPTS.STATE_REVOKED,
      validTo: NOW,
      updatedByUserId: 'doc-1',
    });
  });
});
