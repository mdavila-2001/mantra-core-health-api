import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ConflictException } from '../../../common';
import {
  createWalkInPatient,
  type WalkInPatientRepos,
} from './walk-in-patient';

const ACTOR_ID = 'actor-1';

/** Construye repos dobles con el camino feliz por defecto. */
function build() {
  const tx: any = { flush: mockFn() };

  const persons = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'person-1', ...datos })),
  };
  const personProfiles = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'profile-1', ...datos })),
  };
  const patientProfiles = {
    create: mockFn((_tx: any, datos: any) => ({
      id: 'patient-1',
      ...datos,
    })),
  };
  const identifiers = {
    findActiveDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn((_tx: any, datos: any) => ({ id: 'ident-1', ...datos })),
  };
  const contactPoints = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'contact-1', ...datos })),
  };
  const relatedPersons = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'related-1', ...datos })),
  };

  const repos: WalkInPatientRepos = {
    persons,
    personProfiles,
    patientProfiles,
    identifiers,
    contactPoints,
    relatedPersons,
  } as any;

  return {
    tx,
    repos,
    persons,
    personProfiles,
    patientProfiles,
    identifiers,
    contactPoints,
    relatedPersons,
  };
}

const DATA_BASE = {
  name: 'Lucía',
  lastName: 'Mamani',
  nationalId: '1234567',
  phone: '+591 70000000',
  actorUserId: ACTOR_ID,
};

describe('createWalkInPatient', () => {
  it('escribe en orden — persona, flush, perfil, paciente, flush, identificador y contacto — y devuelve sus ids', async () => {
    const {
      tx,
      repos,
      persons,
      personProfiles,
      patientProfiles,
      identifiers,
      contactPoints,
    } = build();

    const resultado = await createWalkInPatient(repos, tx, DATA_BASE);

    const ordenDeEscritura = [
      ...persons.create.mock.invocationCallOrder,
      ...tx.flush.mock.invocationCallOrder,
      ...personProfiles.create.mock.invocationCallOrder,
      ...patientProfiles.create.mock.invocationCallOrder,
      ...identifiers.create.mock.invocationCallOrder,
      ...contactPoints.create.mock.invocationCallOrder,
    ];
    // `flush` se llama dos veces: una tras la persona (antes de su perfil e
    // hijo), otra tras el paciente (antes de identificador y contacto).
    expect(tx.flush.mock.calls).toHaveLength(2);
    expect(persons.create.mock.invocationCallOrder[0]).toBeLessThan(
      tx.flush.mock.invocationCallOrder[0],
    );
    expect(tx.flush.mock.invocationCallOrder[0]).toBeLessThan(
      personProfiles.create.mock.invocationCallOrder[0],
    );
    expect(patientProfiles.create.mock.invocationCallOrder[0]).toBeLessThan(
      tx.flush.mock.invocationCallOrder[1],
    );
    expect(tx.flush.mock.invocationCallOrder[1]).toBeLessThan(
      identifiers.create.mock.invocationCallOrder[0],
    );
    expect(ordenDeEscritura.length).toBeGreaterThan(0);

    expect(resultado).toEqual({
      personId: 'person-1',
      patientProfileId: 'person-1',
      patientCode: expect.stringMatching(/^PAT-/),
    });

    // `patient_profiles.profile_id` ES `persons.id`: nunca un id propio, y por
    // eso el identificador y el contacto cuelgan del MISMO valor.
    expect(patientProfiles.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ profileId: 'person-1' }),
    );
    expect(identifiers.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ ownerId: 'person-1', value: '1234567' }),
    );
    expect(contactPoints.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ ownerId: 'person-1', value: '+591 70000000' }),
    );
  });

  it('compone displayName a partir de las partes del nombre', async () => {
    const { tx, repos, persons } = build();

    await createWalkInPatient(repos, tx, {
      ...DATA_BASE,
      name: 'Lucía',
      middleName: 'Andrea',
      lastName: 'Mamani',
      motherLastName: 'Quispe',
    });

    expect(persons.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ displayName: 'Lucía Andrea Mamani Quispe' }),
    );
  });

  it('rechaza el documento ya registrado y no crea ninguna fila', async () => {
    const {
      tx,
      repos,
      identifiers,
      persons,
      personProfiles,
      patientProfiles,
      contactPoints,
    } = build();
    identifiers.findActiveDuplicate.mockResolvedValue({
      id: 'ident-existente',
    });

    await expect(
      createWalkInPatient(repos, tx, DATA_BASE),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(persons.create).not.toHaveBeenCalled();
    expect(personProfiles.create).not.toHaveBeenCalled();
    expect(patientProfiles.create).not.toHaveBeenCalled();
    expect(identifiers.create).not.toHaveBeenCalled();
    expect(contactPoints.create).not.toHaveBeenCalled();
  });

  it('sólo registra al tutor cuando declara su nombre', async () => {
    const { tx, repos, relatedPersons } = build();

    await createWalkInPatient(repos, tx, DATA_BASE);
    expect(relatedPersons.create).not.toHaveBeenCalled();

    const { tx: tx2, repos: repos2, relatedPersons: relatedPersons2 } = build();
    await createWalkInPatient(repos2, tx2, {
      ...DATA_BASE,
      guardianName: 'Rosa Mamani',
      guardianPhone: '+591 71111111',
    });
    expect(relatedPersons2.create).toHaveBeenCalledWith(
      tx2,
      expect.objectContaining({ patientProfileId: 'person-1' }),
    );
  });
});
