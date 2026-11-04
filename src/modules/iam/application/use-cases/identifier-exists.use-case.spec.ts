import { describe, expect, it, jest } from '@jest/globals';
import { CredentialsRepository } from '../../infrastructure/repositories';
import { DirectoryRegistrationAdapter } from '../../infrastructure/adapters/directory-registration.adapter';
import { IdentifierExistsUseCase } from './identifier-exists.use-case';

// Loose-typed mock factory, same pattern as the controller specs.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Fake transaction that records every query the lookup issues. */
function build(rows: { find?: unknown[]; findOne?: unknown } = {}) {
  const tx = {
    execute: mockFn(async () => []),
    find: mockFn(async () => rows.find ?? []),
    findOne: mockFn(async () => rows.findOne ?? null),
  };
  const em = {
    fork: () => ({ transactional: async (cb: any) => cb(tx) }),
  };
  const directory = new DirectoryRegistrationAdapter(
    ...([
      null,
      null,
      null,
      null,
      null,
      null,
    ] as unknown as ConstructorParameters<typeof DirectoryRegistrationAdapter>),
  );
  const useCase = new IdentifierExistsUseCase(
    em as any,
    new CredentialsRepository(),
    directory,
  );
  return { useCase, tx };
}

describe('IdentifierExistsUseCase', () => {
  it('NATIONAL_ID: exact live password subject, trimmed, in the auth boundary context', async () => {
    const { useCase, tx } = build({ findOne: { id: 'cred' } });
    await expect(
      useCase.execute('NATIONAL_ID', '  1234567-LP '),
    ).resolves.toEqual({ exists: true });
    expect(tx.execute).toHaveBeenCalledWith(
      "select set_config('app.system_context', 'true', true)",
    );
    const [, where] = tx.findOne.mock.calls[0];
    expect(where).toMatchObject({ externalSubject: '1234567-LP' });
  });

  it('NATIONAL_ID: no credential means false', async () => {
    const { useCase } = build();
    await expect(useCase.execute('NATIONAL_ID', '999')).resolves.toEqual({
      exists: false,
    });
  });

  it('EMAIL: case-insensitive ILIKE with wildcards escaped, like registration', async () => {
    const { useCase, tx } = build({ find: [{ id: 'cred' }] });
    await expect(
      useCase.execute('EMAIL', ' Ana_Lab@Mail.com '),
    ).resolves.toEqual({ exists: true });
    const [, where] = tx.find.mock.calls[0];
    expect(where).toMatchObject({
      externalSubject: { $ilike: 'Ana\\_Lab@Mail.com' },
    });
  });

  it('EMAIL: unknown address means false', async () => {
    const { useCase } = build();
    await expect(useCase.execute('EMAIL', 'nadie@x.com')).resolves.toEqual({
      exists: false,
    });
  });

  it('ORG_NAME: legal or trade name, case-insensitive', async () => {
    const { useCase, tx } = build({ findOne: { id: 'tenant' } });
    await expect(
      useCase.execute('ORG_NAME', '  Laboratorio 100% '),
    ).resolves.toEqual({ exists: true });
    const [, where] = tx.findOne.mock.calls[0];
    const exact = { $ilike: 'Laboratorio 100\\%' };
    expect(where).toEqual({
      $or: [{ legalName: exact }, { tradeName: exact }],
    });
  });

  it('ORG_NAME: no tenant means false', async () => {
    const { useCase } = build();
    await expect(useCase.execute('ORG_NAME', 'Nueva')).resolves.toEqual({
      exists: false,
    });
  });

  it('a blank value answers false without touching the database', async () => {
    const { useCase, tx } = build({ findOne: { id: 'x' } });
    await expect(useCase.execute('EMAIL', '   ')).resolves.toEqual({
      exists: false,
    });
    expect(tx.execute).not.toHaveBeenCalled();
  });
});
