import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/core';

import { CONCEPTS, ConflictException } from '../../../../common';
import {
  DOCUMENT_ALREADY_REGISTERED,
  assertDocumentAvailable,
  rethrowDocumentRace,
} from './document-uniqueness';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const LA_PAZ = '11111111-1111-5111-8111-111111111111';

function repo(holder: unknown) {
  return { findDocumentHolder: fn(async () => holder) };
}

describe('document-uniqueness (C-10 / MD-01)', () => {
  it('deja pasar un documento que ese tipo de usuario no tiene', async () => {
    const identifiers = repo(null);
    await expect(
      assertDocumentAvailable(identifiers as never, {} as never, {
        value: '1234567',
        issuerAdministrativeAreaConceptId: LA_PAZ,
        kind: 'PRACTITIONER',
      }),
    ).resolves.toBeUndefined();
  });

  it('busca por número, departamento y tipo de titular, sólo activos', async () => {
    const identifiers = repo(null);
    await assertDocumentAvailable(identifiers as never, {} as never, {
      value: '1234567',
      issuerAdministrativeAreaConceptId: LA_PAZ,
      kind: 'PATIENT',
    });
    expect(identifiers.findDocumentHolder).toHaveBeenCalledWith(
      {},
      {
        typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        value: '1234567',
        issuerAdministrativeAreaConceptId: LA_PAZ,
        ownerKindConceptId: CONCEPTS.DOC_HOLDER_PATIENT,
      },
    );
  });

  it('responde 409 con un motivo estable y sin decir a quién pertenece', async () => {
    const identifiers = repo({ id: 'x', ownerId: 'persona-ajena' });
    const error = await assertDocumentAvailable(
      identifiers as never,
      {} as never,
      {
        value: '1234567',
        issuerAdministrativeAreaConceptId: LA_PAZ,
        kind: 'PRACTITIONER',
      },
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    const conflict = error as ConflictException;
    expect(conflict.getStatus()).toBe(409);
    expect(conflict.details).toEqual({
      reason: DOCUMENT_ALREADY_REGISTERED,
      field: 'nationalId',
    });
    expect(conflict.message).not.toContain('persona-ajena');
  });

  it('la carrera contra el índice único se traduce al mismo 409', () => {
    const race = new UniqueConstraintViolationException(
      new Error(
        'duplicate key value violates unique constraint "ux_identifiers_document_owner_kind"',
      ),
    );
    expect(() => rethrowDocumentRace(race)).toThrow(ConflictException);
  });

  it('otra violación de unicidad no se disfraza de documento repetido', () => {
    const other = new UniqueConstraintViolationException(
      new Error(
        'duplicate key value violates unique constraint "ux_users_email"',
      ),
    );
    expect(() => rethrowDocumentRace(other)).toThrow(other);
  });

  it('un error que no es de unicidad sale tal cual', () => {
    const boom = new Error('se cayó la base');
    expect(() => rethrowDocumentRace(boom)).toThrow(boom);
  });
});
