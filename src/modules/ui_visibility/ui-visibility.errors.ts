import { BadRequestException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../common';
import { ErrorCode } from '../../common/errors/error-codes';
import {
  badRequestWithReason,
  forbiddenWithReason,
} from '../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../common/errors/system-error-reasons';
import { decodeKeysetCursor } from '../../common/pagination/keyset-cursor';
import { UiVisibilityErrorReason as R } from './ui-visibility.error-reasons';
import type { KeysetPosition } from './repositories/ui-visibility.store';

/**
 * Fábricas de los errores estables del módulo. Los mensajes no interpolan identificadores
 * ajenos: un recurso de otra organización responde exactamente igual que uno inexistente.
 */
export const elementNotFound = (): ResourceNotFoundException =>
  new ResourceNotFoundException(
    'Elemento no encontrado',
    undefined,
    R.UI_ELEMENT_NOT_FOUND,
  );

export const elementRetired = (): ConflictException =>
  new ConflictException(
    'El elemento está retirado del catálogo y no admite reglas nuevas',
    undefined,
    R.UI_ELEMENT_RETIRED,
  );

export const ruleNotFound = (): ResourceNotFoundException =>
  new ResourceNotFoundException(
    'Regla no encontrada',
    undefined,
    R.UI_RULE_NOT_FOUND,
  );

export const ruleEnded = (): ConflictException =>
  new ConflictException(
    'La regla ya está terminada',
    undefined,
    R.UI_RULE_ENDED,
  );

export const ruleVersionMismatch = (
  expected: number,
  actual?: number,
): ConflictException =>
  new ConflictException(
    'Otra persona modificó esta regla mientras la editaba',
    { expected, ...(actual === undefined ? {} : { actual }) },
    R.UI_RULE_VERSION_MISMATCH,
  );

export const ruleDuplicate = (): ConflictException =>
  new ConflictException(
    'Ya hay una regla vigente para ese elemento y ese sujeto',
    undefined,
    R.UI_RULE_DUPLICATE,
  );

export const invalidSubject = (message: string): PreconditionFailedException =>
  new PreconditionFailedException(
    message,
    undefined,
    R.UI_RULE_INVALID_SUBJECT,
  );

export const invalidValidity = (message: string): PreconditionFailedException =>
  new PreconditionFailedException(
    message,
    undefined,
    R.UI_RULE_INVALID_VALIDITY,
  );

export const emptyUpdate = (): PreconditionFailedException =>
  new PreconditionFailedException(
    'La edición no trae ningún campo para cambiar',
    undefined,
    R.UI_RULE_EMPTY_UPDATE,
  );

export const ifMatchRequired = (): BadRequestException =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Falta la cabecera If-Match con la versión de la regla',
    reason: R.UI_RULE_IF_MATCH_REQUIRED,
  });

export const keyExists = (): ConflictException =>
  new ConflictException(
    'Ya existe un elemento con esa clave',
    undefined,
    R.UI_ELEMENT_KEY_EXISTS,
  );

export const parentNotFound = (): PreconditionFailedException =>
  new PreconditionFailedException(
    'El elemento padre no existe en el catálogo',
    undefined,
    R.UI_ELEMENT_PARENT_NOT_FOUND,
  );

export const hierarchyCycle = (): PreconditionFailedException =>
  new PreconditionFailedException(
    'La jerarquía de elementos tiene un ciclo',
    undefined,
    R.UI_ELEMENT_HIERARCHY_CYCLE,
  );

export const syncInvalid = (message: string): PreconditionFailedException =>
  new PreconditionFailedException(
    message,
    undefined,
    R.UI_ELEMENT_SYNC_INVALID,
  );

export const previewSubjectNotFound = (): ResourceNotFoundException =>
  new ResourceNotFoundException(
    'Sujeto de la vista previa no encontrado',
    undefined,
    R.UI_PREVIEW_SUBJECT_NOT_FOUND,
  );

export const previewSubjectRequired = (): BadRequestException =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Indique exactamente uno de userId o roleCode',
    reason: R.UI_PREVIEW_SUBJECT_REQUIRED,
  });

/**
 * Decodifica el cursor de una lista de este módulo; uno de otra forma es un 400 `INVALID_CURSOR`,
 * no un 500.
 */
export function readKeyset(cursor: string | undefined): KeysetPosition | null {
  if (!cursor) return null;
  const k = decodeKeysetCursor(cursor);
  if (typeof k['c'] !== 'string' || typeof k['i'] !== 'string') {
    throw badRequestWithReason(
      'El cursor de paginación no es válido',
      SystemErrorReason.INVALID_CURSOR,
      { parameter: 'cursor' },
    );
  }
  return { c: k['c'], i: k['i'] };
}

/** Como {@link readKeyset}, pero la clave de orden es una fecha ISO (listas por `createdAt`). */
export function readDateKeyset(
  cursor: string | undefined,
): KeysetPosition | null {
  const k = readKeyset(cursor);
  if (k && Number.isNaN(Date.parse(k.c))) {
    throw badRequestWithReason(
      'El cursor de paginación no es válido',
      SystemErrorReason.INVALID_CURSOR,
      { parameter: 'cursor' },
    );
  }
  return k;
}

/** Un actor que no es de plataforma sin organización activa no tiene alcance alguno. */
export const tenantScopeRequired = () =>
  forbiddenWithReason(
    'La operación requiere una organización activa',
    SystemErrorReason.TENANT_REQUIRED,
  );

export const protectedElement = (): PreconditionFailedException =>
  new PreconditionFailedException(
    'No se puede ocultar a administradores una pantalla de gobierno de la visibilidad',
    undefined,
    R.UI_RULE_PROTECTED_ELEMENT,
  );
