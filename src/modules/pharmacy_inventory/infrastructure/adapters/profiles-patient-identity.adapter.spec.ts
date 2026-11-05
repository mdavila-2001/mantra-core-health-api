import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { ProfilesPatientIdentityAdapter } from './profiles-patient-identity.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(profile: { profileId: string } | null) {
  const patientProfiles = { findById: mockFn(async () => profile) };
  const persons = {
    findById: mockFn(async () => ({
      id: 'person-1',
      name: 'Ana',
      lastName: 'Prueba',
      birthDate: new Date('1990-01-01'),
    })),
  };
  const identifiers = {
    findCurrentByOwner: mockFn(async () => [
      { typeConceptId: 'tax-id', value: '999999' },
      { typeConceptId: CONCEPTS.ID_TYPE_NATIONAL, value: '7654321 LP' },
    ]),
  };
  const adapter = new ProfilesPatientIdentityAdapter(
    patientProfiles as any,
    persons as any,
    identifiers as any,
  );
  return { adapter, patientProfiles, persons, identifiers };
}

describe('ProfilesPatientIdentityAdapter', () => {
  it('reads the name parts and the current national document of the person behind the patient profile', async () => {
    const d = build({ profileId: 'person-1' });
    const identity = await d.adapter.findByPatientProfile(
      {} as any,
      'patient-1',
    );
    expect(d.persons.findById).toHaveBeenCalledWith(
      expect.anything(),
      'person-1',
    );
    expect(d.identifiers.findCurrentByOwner).toHaveBeenCalledWith(
      expect.anything(),
      'person-1',
    );
    // Solo las partes del nombre y el documento: la fecha de nacimiento no sale.
    expect(identity).toEqual({
      name: 'Ana',
      middleName: null,
      lastName: 'Prueba',
      motherLastName: null,
      displayName: null,
      nationalDocument: '7654321 LP',
    });
  });

  it('returns null for an unknown patient profile', async () => {
    const d = build(null);
    await expect(
      d.adapter.findByPatientProfile({} as any, 'patient-x'),
    ).resolves.toBeNull();
    expect(d.persons.findById).not.toHaveBeenCalled();
  });
});
