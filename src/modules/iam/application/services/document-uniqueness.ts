import type { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { CONCEPTS, ConflictException } from '../../../../common';
import type { IdentifiersRepository } from '../../../common/repositories';

/**
 * C-10 / MD-01 · Un mismo CI (número + departamento emisor) no puede
 * registrarse dos veces para el mismo tipo de usuario.
 *
 * Código estable para el cliente: `details.reason = DOCUMENT_ALREADY_REGISTERED`
 * y `details.field = nationalId`, para que el formulario marque el campo sin
 * depender del texto del mensaje. El mensaje no dice a quién pertenece.
 */
export const DOCUMENT_ALREADY_REGISTERED = 'DOCUMENT_ALREADY_REGISTERED';

/** El índice de la base que respalda la regla aunque el chequeo previo pierda una carrera. */
const DOCUMENT_INDEX = 'ux_identifiers_document_owner_kind';

export type DocumentHolderKind = 'PATIENT' | 'PRACTITIONER';

export const DOCUMENT_HOLDER_CONCEPT: Readonly<
  Record<DocumentHolderKind, string>
> = {
  PATIENT: CONCEPTS.DOC_HOLDER_PATIENT,
  PRACTITIONER: CONCEPTS.DOC_HOLDER_PRACTITIONER,
};

export function documentAlreadyRegistered(): ConflictException {
  return new ConflictException(
    'Ese documento de identidad ya está registrado para otra cuenta de este tipo',
    { reason: DOCUMENT_ALREADY_REGISTERED, field: 'nationalId' },
  );
}

/** 409 si el documento ya está tomado por ese tipo de usuario. */
export async function assertDocumentAvailable(
  identifiers: IdentifiersRepository,
  tx: EntityManager,
  params: {
    value: string;
    issuerAdministrativeAreaConceptId: string | null;
    kind: DocumentHolderKind;
  },
): Promise<void> {
  const holder = await identifiers.findDocumentHolder(tx, {
    typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    value: params.value,
    issuerAdministrativeAreaConceptId: params.issuerAdministrativeAreaConceptId,
    ownerKindConceptId: DOCUMENT_HOLDER_CONCEPT[params.kind],
  });
  if (holder !== null) throw documentAlreadyRegistered();
}

/**
 * Si dos altas simultáneas pasan el chequeo, la segunda choca con el índice
 * único: se traduce al mismo 409 en vez de un 500.
 */
export function rethrowDocumentRace(error: unknown): never {
  if (
    error instanceof UniqueConstraintViolationException &&
    error.message.includes(DOCUMENT_INDEX)
  ) {
    throw documentAlreadyRegistered();
  }
  throw error;
}
