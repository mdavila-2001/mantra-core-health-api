import { jest } from '@jest/globals';
import { PROF } from '../../profiles/profiles.concepts';
import {
  PrescriberIdentityReader,
  nationalLicenseOf,
} from './prescriber-identity.reader';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const national = (overrides: Record<string, unknown> = {}): any => ({
  jurisdictionConceptId: PROF.JURISDICTION_NATIONAL,
  licenseNumber: 'MN-0001',
  regulatoryAuthority: 'Colegio de prueba',
  stateConceptId: PROF.AUTH_ACTIVE,
  ...overrides,
});

describe('nationalLicenseOf', () => {
  it('matrícula nacional verificada → ACTIVE', () => {
    expect(nationalLicenseOf([national()])).toEqual({
      number: 'MN-0001',
      authority: 'Colegio de prueba',
      state: 'ACTIVE',
    });
  });

  it('matrícula nacional declarada → PENDING, sin autoridad → null', () => {
    expect(
      nationalLicenseOf([
        national({
          stateConceptId: 'otro-estado',
          regulatoryAuthority: undefined,
        }),
      ]),
    ).toEqual({ number: 'MN-0001', authority: null, state: 'PENDING' });
  });

  it('sin matrícula nacional → null', () => {
    expect(nationalLicenseOf([])).toBeNull();
    expect(
      nationalLicenseOf([national({ jurisdictionConceptId: 'provincial' })]),
    ).toBeNull();
  });
});

describe('PrescriberIdentityReader', () => {
  function build(person: unknown, profile: unknown = { profileId: 'p1' }) {
    const profiles = { findById: mockFn().mockResolvedValue(profile) };
    const persons = { findById: mockFn().mockResolvedValue(person) };
    const authorizations = {
      findByPractitioner: mockFn().mockResolvedValue([national()]),
    };
    const reader = new PrescriberIdentityReader(
      profiles as any,
      persons as any,
      authorizations as any,
    );
    return { reader, profiles, persons, authorizations };
  }

  it('nombre visible y matrícula del profesional', async () => {
    const { reader, persons } = build({ displayName: 'Dra. Sintética Prueba' });
    await expect(reader.read({} as any, 'p1')).resolves.toEqual({
      name: 'Dra. Sintética Prueba',
      license: {
        number: 'MN-0001',
        authority: 'Colegio de prueba',
        state: 'ACTIVE',
      },
    });
    expect(persons.findById).toHaveBeenCalledWith({}, 'p1');
  });

  it('sin displayName compone el nombre por partes', async () => {
    const { reader } = build({ name: 'Ana', lastName: 'Prueba' });
    expect((await reader.read({} as any, 'p1'))?.name).toBe('Ana Prueba');
  });

  it('sin persona el nombre es null', async () => {
    const { reader } = build(null);
    expect((await reader.read({} as any, 'p1'))?.name).toBeNull();
  });

  it('un perfil inexistente → null', async () => {
    const { reader, authorizations } = build(null, null);
    await expect(reader.read({} as any, 'p1')).resolves.toBeNull();
    expect(authorizations.findByPractitioner).not.toHaveBeenCalled();
  });
});
