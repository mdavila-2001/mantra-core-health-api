import { jest } from '@jest/globals';
import { AUTHZ } from '../../authz/authz.concepts';
import { CONS } from '../../consent/consent.concepts';
import { ClinicalGranularScopeService } from './clinical-granular-scope.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const em: any = {};
const PATIENT = 'pat-1';
const actor = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

const HOUR = 3_600_000;

function grant(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'g-1',
    consentId: 'c-1',
    reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
    accessLevelConceptId: AUTHZ.ACCESS_LEVEL_READ,
    validFrom: new Date(Date.now() - HOUR),
    validTo: new Date(Date.now() + HOUR),
    ...overrides,
  };
}

function consent(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'c-1',
    categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
    statusConceptId: CONS.CONSENT_ACTIVE,
    validTo: new Date(Date.now() + HOUR),
    ...overrides,
  };
}

function provision(action: string, specialty?: string): any {
  return { actionConceptId: action, dataClassConceptId: specialty };
}

function build() {
  const grantsRepo = {
    findActiveForUserPatient: mockFn().mockResolvedValue([grant()]),
  };
  const consentsRepo = { findById: mockFn().mockResolvedValue(consent()) };
  const provisionsRepo = {
    findOpenByConsent: mockFn().mockResolvedValue([
      provision(CONS.ACTION_PERMIT, 'esp-cardio'),
      provision(CONS.ACTION_DENY, 'esp-psiq'),
    ]),
  };
  const careRelationshipsRepo = {
    findActiveForPractitionerPatient: mockFn().mockResolvedValue([]),
  };
  const representation = {
    representsPatient: mockFn().mockResolvedValue(false),
  };
  const service = new ClinicalGranularScopeService(
    grantsRepo as any,
    consentsRepo as any,
    provisionsRepo as any,
    careRelationshipsRepo as any,
    representation as any,
  );
  return {
    service,
    grantsRepo,
    consentsRepo,
    provisionsRepo,
    careRelationshipsRepo,
    representation,
  };
}

describe('ClinicalGranularScopeService.resolve', () => {
  it('un grant ligado a un consentimiento de acceso profesional da solo las especialidades PERMIT', async () => {
    const d = build();

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-cardio'],
    });
    expect(d.grantsRepo.findActiveForUserPatient).toHaveBeenCalledWith(
      em,
      actor.id,
      PATIENT,
    );
  });

  it('une las especialidades de varios consentimientos sin repetirlas', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant(),
      grant({ id: 'g-2', consentId: 'c-2' }),
    ]);
    d.provisionsRepo.findOpenByConsent.mockImplementation(
      async (_em: unknown, consentId: string) =>
        consentId === 'c-1'
          ? [provision(CONS.ACTION_PERMIT, 'esp-cardio')]
          : [
              provision(CONS.ACTION_PERMIT, 'esp-cardio'),
              provision(CONS.ACTION_PERMIT, 'esp-pedia'),
            ],
    );

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-cardio', 'esp-pedia'],
    });
  });

  it('si ninguna provisión se permite, el alcance queda en solo IPS (lista vacía), no en completo', async () => {
    const d = build();
    d.provisionsRepo.findOpenByConsent.mockResolvedValue([
      provision(CONS.ACTION_DENY, 'esp-cardio'),
    ]);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'SPECIALTIES',
      specialtyConceptIds: [],
    });
  });

  it('un grant manual, sin consentimiento, da la historia completa como hoy', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant({ consentId: undefined }),
    ]);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
    expect(d.consentsRepo.findById).not.toHaveBeenCalled();
  });

  it('un grant manual junto a uno granular gana: la historia completa', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant(),
      grant({ id: 'g-2', consentId: undefined }),
    ]);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
  });

  it('un grant cuyo consentimiento no es de acceso profesional no se angosta', async () => {
    const d = build();
    d.consentsRepo.findById.mockResolvedValue(
      consent({ categoryConceptId: 'otra-categoria' }),
    );

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
  });

  it('un grant de otro propósito (emergencia) no es granular', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant({ reasonConceptId: AUTHZ.PURPOSE_EMERGENCY }),
    ]);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
  });

  it('un grant vencido o aún no vigente no cuenta', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant({ validTo: new Date(Date.now() - 1000) }),
      grant({ id: 'g-3', validFrom: new Date(Date.now() + HOUR) }),
    ]);

    // Ningún grant vigente: la puerta la abrió otra base, que sigue dando todo.
    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
  });

  it('un consentimiento retirado o vencido aporta cero especialidades', async () => {
    const d = build();
    d.consentsRepo.findById.mockResolvedValue(
      consent({ statusConceptId: CONS.CONSENT_WITHDRAWN }),
    );

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'SPECIALTIES',
      specialtyConceptIds: [],
    });
    expect(d.provisionsRepo.findOpenByConsent).not.toHaveBeenCalled();

    d.consentsRepo.findById.mockResolvedValue(
      consent({ validTo: new Date(Date.now() - 1000) }),
    );
    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'SPECIALTIES',
      specialtyConceptIds: [],
    });
  });

  it('una relación asistencial, de cualquier tipo, mantiene la historia completa', async () => {
    const d = build();
    d.careRelationshipsRepo.findActiveForPractitionerPatient.mockResolvedValue([
      { id: 'r-1', purposeConceptId: 'algun-proposito' },
    ]);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
    expect(
      d.careRelationshipsRepo.findActiveForPractitionerPatient,
    ).toHaveBeenCalledWith(em, 'hp-1', PATIENT);
  });

  it('una representación legal mantiene la historia completa', async () => {
    const d = build();
    d.representation.representsPatient.mockResolvedValue(true);

    await expect(d.service.resolve(em, PATIENT, actor)).resolves.toEqual({
      kind: 'FULL',
    });
    expect(d.representation.representsPatient).toHaveBeenCalledWith(
      PATIENT,
      actor,
      em,
    );
  });

  it('sin perfil profesional en la sesión no consulta relaciones y sigue mirando la representación', async () => {
    const d = build();

    await d.service.resolve(em, PATIENT, {
      ...actor,
      practitionerProfileId: undefined,
    });

    expect(
      d.careRelationshipsRepo.findActiveForPractitionerPatient,
    ).not.toHaveBeenCalled();
    expect(d.representation.representsPatient).toHaveBeenCalled();
  });
});

describe('ClinicalGranularScopeService.hasWriteLevelGrant', () => {
  it.each([
    ['escritura', AUTHZ.ACCESS_LEVEL_WRITE, true],
    ['acceso total', AUTHZ.ACCESS_LEVEL_FULL, true],
    ['elevado', AUTHZ.ACCESS_LEVEL_ELEVATED, true],
    ['solo lectura', AUTHZ.ACCESS_LEVEL_READ, false],
  ])('un grant de %s -> %s', async (_name, level, expected) => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant({ accessLevelConceptId: level }),
    ]);

    await expect(
      d.service.hasWriteLevelGrant(em, PATIENT, actor),
    ).resolves.toBe(expected);
  });

  it('un grant de escritura vencido no cuenta', async () => {
    const d = build();
    d.grantsRepo.findActiveForUserPatient.mockResolvedValue([
      grant({
        accessLevelConceptId: AUTHZ.ACCESS_LEVEL_WRITE,
        validTo: new Date(Date.now() - 1000),
      }),
    ]);

    await expect(
      d.service.hasWriteLevelGrant(em, PATIENT, actor),
    ).resolves.toBe(false);
  });
});
