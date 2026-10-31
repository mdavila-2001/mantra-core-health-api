import { jest } from '@jest/globals';
import { CONCEPTS, ConflictException } from '../../../../common';
import { PROF } from '../../profiles.concepts';
import {
  PatientDocumentRegisteredException,
  registerPatientRecords,
  type PatientIntakeRepos,
} from './patient-intake';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Repos dobles con el camino feliz por defecto. */
function build() {
  const tx: any = { flush: mockFn() };
  let persons = 0;
  const repos = {
    persons: {
      create: mockFn((_: any, data: any) => ({
        id: `person-${++persons}`,
        ...data,
      })),
    },
    personProfiles: { create: mockFn() },
    patientProfiles: { create: mockFn((_: any, data: any) => ({ ...data })) },
    identifiers: {
      findActiveNationalIdDuplicate: mockFn().mockResolvedValue(null),
      create: mockFn(),
    },
    contactPoints: { create: mockFn() },
    relatedPersons: {
      create: mockFn((_: any, data: any) => ({ id: 'related-1', ...data })),
    },
  };
  return { tx, repos, typed: repos as unknown as PatientIntakeRepos };
}

const DATA = {
  name: 'Martín',
  lastName: 'Rocha',
  motherLastName: 'Antelo',
  nationalId: '8888888',
  birthDate: '2018-03-02',
  phone: '+591 70000001',
  actorUserId: 'actor-1',
};

describe('registerPatientRecords (el alta compartida por el mostrador y el personal de apoyo)', () => {
  it('escribe persona, perfil, paciente, documento y teléfono, con la fecha de nacimiento', async () => {
    const d = build();
    const res = await registerPatientRecords(d.typed, d.tx, DATA);
    expect(res).toEqual({
      personId: 'person-1',
      patientProfileId: 'person-1',
      patientCode: expect.stringMatching(/^PAT-/),
    });
    expect(d.repos.persons.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        displayName: 'Martín Rocha Antelo',
        birthDate: new Date('2018-03-02'),
        actorUserId: 'actor-1',
      }),
    );
    expect(d.repos.identifiers.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ ownerId: 'person-1', value: '8888888' }),
    );
    expect(d.repos.contactPoints.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ ownerId: 'person-1', value: '+591 70000001' }),
    );
  });

  it('devuelve quién quedó como tutor: su persona y la fila de persona relacionada', async () => {
    const d = build();
    const res = await registerPatientRecords(d.typed, d.tx, {
      ...DATA,
      guardianName: 'Sandra Antelo Vaca',
      guardianPhone: '+591 70000002',
    });
    expect(res.guardian).toEqual({
      personId: 'person-2',
      relatedPersonId: 'related-1',
    });
  });

  it('sin tutor declarado no devuelve tutor', async () => {
    const d = build();
    const res = await registerPatientRecords(d.typed, d.tx, DATA);
    expect(res.guardian).toBeUndefined();
    expect(d.repos.relatedPersons.create).not.toHaveBeenCalled();
  });

  it('un documento ya registrado se rechaza con 409 y no escribe nada', async () => {
    const d = build();
    d.repos.identifiers.findActiveNationalIdDuplicate.mockResolvedValue({
      id: 'x',
      ownerId: 'person-otro',
    });
    await expect(
      registerPatientRecords(d.typed, d.tx, DATA),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.repos.persons.create).not.toHaveBeenCalled();
  });

  describe('N3: documento normalizado e identidad sin verificar', () => {
    it('guarda el documento en su forma canónica (mayúsculas, sin puntos, guiones, espacios ni ceros de relleno)', async () => {
      const d = build();
      await registerPatientRecords(d.typed, d.tx, {
        ...DATA,
        nationalId: ' 0.888-888 ',
      });
      expect(d.repos.identifiers.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ value: '888888' }),
      );
    });

    it('compara la forma canónica para decidir si el documento ya existe (y es la consulta del índice la que decide)', async () => {
      const d = build();
      d.repos.identifiers.findActiveNationalIdDuplicate.mockResolvedValue({
        id: 'x',
        ownerId: 'person-otro',
      });
      await expect(
        registerPatientRecords(d.typed, d.tx, {
          ...DATA,
          nationalId: '08.888.888',
        }),
      ).rejects.toBeInstanceOf(PatientDocumentRegisteredException);
      expect(
        d.repos.identifiers.findActiveNationalIdDuplicate,
      ).toHaveBeenCalledWith(d.tx, '8888888');
      expect(d.repos.persons.create).not.toHaveBeenCalled();
    });

    it('si dos altas pasan la comprobación, el 23505 del índice único se contesta con el mismo 409', async () => {
      const d = build();
      // El tercer volcado (persona, paciente, identificador) es el del documento.
      let flushes = 0;
      d.tx.flush = mockFn(async () => {
        flushes += 1;
        if (flushes === 3) {
          throw Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'uq_identifiers_national_id_normalized',
          });
        }
      });
      await expect(
        registerPatientRecords(d.typed, d.tx, DATA),
      ).rejects.toBeInstanceOf(PatientDocumentRegisteredException);
      expect(d.repos.contactPoints.create).not.toHaveBeenCalled();
    });

    it('el 23505 llega envuelto (cause), como lo deja MikroORM', async () => {
      const d = build();
      let flushes = 0;
      d.tx.flush = mockFn(async () => {
        flushes += 1;
        if (flushes === 3) {
          throw Object.assign(new Error('wrapped'), {
            cause: {
              code: '23505',
              constraint: 'uq_identifiers_national_id_normalized',
            },
          });
        }
      });
      await expect(
        registerPatientRecords(d.typed, d.tx, DATA),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('cualquier otro fallo del volcado sale tal cual, sin disfrazarlo de documento repetido', async () => {
      const d = build();
      let flushes = 0;
      const other = Object.assign(new Error('otra unicidad'), {
        code: '23505',
        constraint: 'uq_otra_cosa',
      });
      d.tx.flush = mockFn(async () => {
        flushes += 1;
        if (flushes === 3) throw other;
      });
      await expect(registerPatientRecords(d.typed, d.tx, DATA)).rejects.toBe(
        other,
      );
    });

    it('el documento declarado en el mostrador queda como secundario (no oficial) hasta que el titular lo verifique', async () => {
      const d = build();
      await registerPatientRecords(d.typed, d.tx, DATA);
      expect(d.repos.identifiers.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
          useConceptId: CONCEPTS.USE_SECONDARY,
        }),
      );
      expect(d.repos.identifiers.create).not.toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ useConceptId: CONCEPTS.USE_OFFICIAL }),
      );
    });

    it('el perfil nace sin vincular (sin cuenta, sin aserción de identidad) y sin código verificado', async () => {
      const d = build();
      await registerPatientRecords(d.typed, d.tx, DATA);
      expect(d.repos.patientProfiles.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
        }),
      );
      // Los repositorios que recibe no incluyen nada de cuentas ni de aserciones.
      expect(Object.keys(d.repos).sort()).toEqual([
        'contactPoints',
        'identifiers',
        'patientProfiles',
        'personProfiles',
        'persons',
        'relatedPersons',
      ]);
    });
  });
});
