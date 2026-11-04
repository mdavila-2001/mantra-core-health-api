import { jest } from '@jest/globals';
import { ClinicalScopeFilterService } from './clinical-scope-filter.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const em: any = {};

function build() {
  const specialtiesRepo = {
    findProfileIdsBySpecialties: mockFn().mockResolvedValue(['hp-1', 'hp-2']),
  };
  const accountLinksRepo = {
    findActiveUserIdsByPersons: mockFn().mockResolvedValue(['u-1']),
  };
  const scopedRepo = { findEncounterIds: mockFn().mockResolvedValue(['e-1']) };
  const service = new ClinicalScopeFilterService(
    specialtiesRepo as any,
    accountLinksRepo as any,
    scopedRepo as any,
  );
  return { service, specialtiesRepo, accountLinksRepo, scopedRepo };
}

describe('ClinicalScopeFilterService', () => {
  it('con la historia completa no hay filtro', async () => {
    const d = build();

    await expect(
      d.service.build(em, 'pat-1', { kind: 'FULL' }),
    ).resolves.toBeNull();
    expect(
      d.specialtiesRepo.findProfileIdsBySpecialties,
    ).not.toHaveBeenCalled();
  });

  it('de las especialidades autorizadas sale quién las ejerce, su cuenta y sus encuentros con el paciente', async () => {
    const d = build();

    const filter = await d.service.build(em, 'pat-1', {
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-cardio'],
    });

    expect(filter).toEqual({
      profileIds: ['hp-1', 'hp-2'],
      userIds: ['u-1'],
      encounterIds: ['e-1'],
    });
    expect(d.specialtiesRepo.findProfileIdsBySpecialties).toHaveBeenCalledWith(
      em,
      ['esp-cardio'],
    );
    expect(d.accountLinksRepo.findActiveUserIdsByPersons).toHaveBeenCalledWith(
      em,
      ['hp-1', 'hp-2'],
    );
    expect(d.scopedRepo.findEncounterIds).toHaveBeenCalledWith(em, 'pat-1', [
      'hp-1',
      'hp-2',
    ]);
  });

  it('si nadie ejerce esas especialidades devuelve un filtro vacío (solo IPS) sin más consultas', async () => {
    const d = build();
    d.specialtiesRepo.findProfileIdsBySpecialties.mockResolvedValue([]);

    const filter = await d.service.build(em, 'pat-1', {
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-cardio'],
    });

    expect(filter).toEqual({ profileIds: [], userIds: [], encounterIds: [] });
    expect(
      d.accountLinksRepo.findActiveUserIdsByPersons,
    ).not.toHaveBeenCalled();
    expect(d.scopedRepo.findEncounterIds).not.toHaveBeenCalled();
  });

  it('un alcance sin especialidades (solo IPS) no es FULL: devuelve un filtro vacío', async () => {
    const d = build();
    d.specialtiesRepo.findProfileIdsBySpecialties.mockResolvedValue([]);

    const filter = await d.service.build(em, 'pat-1', {
      kind: 'SPECIALTIES',
      specialtyConceptIds: [],
    });

    expect(filter).toEqual({ profileIds: [], userIds: [], encounterIds: [] });
  });
});
