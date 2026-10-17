import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CredentialsRepository } from './credentials.repository';
import { AuthenticationCredentials } from '../../entities';
import { ContactPoints } from '../../../common/entities';
import { PersonAccountLinks } from '../../../profiles/entities';
import { CONCEPTS } from '../../../../common';

type Rows = {
  exact?: unknown;
  bySubject?: unknown[];
  contacts?: unknown[];
  links?: unknown[];
  byUser?: unknown;
};

function build(rows: Rows = {}) {
  const findOne = fn((entity: unknown, where: Record<string, unknown>) => {
    if (entity !== AuthenticationCredentials) return Promise.resolve(null);
    return Promise.resolve(
      'userId' in where ? (rows.byUser ?? null) : (rows.exact ?? null),
    );
  });
  const find = fn((entity: unknown) => {
    if (entity === AuthenticationCredentials) {
      return Promise.resolve(rows.bySubject ?? []);
    }
    if (entity === ContactPoints) return Promise.resolve(rows.contacts ?? []);
    if (entity === PersonAccountLinks) return Promise.resolve(rows.links ?? []);
    return Promise.resolve([]);
  });
  const repo = new CredentialsRepository();
  return { repo, em: { findOne, find } as never, findOne, find };
}

/**
 * Login por correo: la pantalla de ingreso acepta «documento o correo», y quien
 * acaba de crear su cuenta no siempre escribe el correo con las mismas
 * mayúsculas con que lo dio de alta.
 */
describe('CredentialsRepository.findActivePasswordByLoginIdentifier', () => {
  it('devuelve la credencial cuyo sujeto coincide exacto, sin más consultas', async () => {
    const cred = { id: 'c1', userId: 'u1' };
    const d = build({ exact: cred });

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, 'Juan@Example.com'),
    ).resolves.toBe(cred);
    expect(d.find).not.toHaveBeenCalled();
  });

  it('un documento sin coincidencia exacta no se busca por correo', async () => {
    const d = build();

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, '1234567'),
    ).resolves.toBeNull();
    expect(d.find).not.toHaveBeenCalled();
  });

  it('encuentra el correo de alta escrito con otras mayúsculas', async () => {
    const cred = { id: 'c1', userId: 'u1' };
    const d = build({ bySubject: [cred] });

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, 'juan@example.com'),
    ).resolves.toBe(cred);
    expect(d.find).toHaveBeenCalledWith(AuthenticationCredentials, {
      methodConceptId: CONCEPTS.CRED_PASSWORD,
      externalSubject: { $ilike: 'juan@example.com' },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });

  it('si el correo sin mayúsculas es de más de una cuenta, no adivina', async () => {
    const d = build({
      bySubject: [
        { id: 'c1', userId: 'u1' },
        { id: 'c2', userId: 'u2' },
      ],
    });

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, 'juan@example.com'),
    ).resolves.toBeNull();
  });

  it('busca `_` y `%` literales, no como comodines', async () => {
    const d = build();

    await d.repo.findActivePasswordByLoginIdentifier(d.em, ' a_b%c@x.com ');

    expect(d.find).toHaveBeenCalledWith(
      AuthenticationCredentials,
      expect.objectContaining({
        externalSubject: { $ilike: 'a\\_b\\%c@x.com' },
      }),
    );
    expect(d.find).toHaveBeenCalledWith(
      ContactPoints,
      expect.objectContaining({ value: { $ilike: 'a\\_b\\%c@x.com' } }),
    );
  });

  it('el paciente entra con el correo de contacto de su alta', async () => {
    const cred = { id: 'c1', userId: 'u1' };
    const d = build({
      contacts: [{ ownerId: 'p1' }],
      links: [{ userId: 'u1' }],
      byUser: cred,
    });

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, 'Paciente@Example.com'),
    ).resolves.toBe(cred);
  });

  it('un correo de contacto compartido por dos cuentas no entra', async () => {
    const d = build({
      contacts: [{ ownerId: 'p1' }, { ownerId: 'p2' }],
      links: [{ userId: 'u1' }, { userId: 'u2' }],
      byUser: { id: 'c1' },
    });

    await expect(
      d.repo.findActivePasswordByLoginIdentifier(d.em, 'familia@example.com'),
    ).resolves.toBeNull();
  });
});
