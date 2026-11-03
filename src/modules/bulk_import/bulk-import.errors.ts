import { HttpStatus } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
} from '../../common';
import { BulkImportReason } from './bulk-import.error-reasons';
import { REASON_MESSAGES } from './services/row-messages';

/** 404: el lote no existe o es de otra organización (misma respuesta a propósito). */
export function batchNotAvailable(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    REASON_MESSAGES[BulkImportReason.BATCH_NOT_AVAILABLE],
    undefined,
    BulkImportReason.BATCH_NOT_AVAILABLE,
  );
}

/** 404: el tipo de carga no existe. */
export function kindUnknown(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    REASON_MESSAGES[BulkImportReason.KIND_UNKNOWN],
    undefined,
    BulkImportReason.KIND_UNKNOWN,
  );
}

/** 409 con un motivo del catálogo. */
export function conflict(reason: BulkImportReason): ConflictException {
  return new ConflictException(REASON_MESSAGES[reason], undefined, reason);
}

/** 400 con un motivo del catálogo y detalle opcional (sin valores recibidos). */
export function badRequest(
  reason: BulkImportReason,
  details?: Record<string, unknown>,
): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    REASON_MESSAGES[reason],
    details,
    reason,
  );
}

/** 403: falta el permiso fino del tipo de carga. */
export function permissionRequired(permission: string): DomainException {
  return new DomainException(
    HttpStatus.FORBIDDEN,
    ErrorCode.FORBIDDEN,
    REASON_MESSAGES[BulkImportReason.PERMISSION_REQUIRED],
    { permission },
    BulkImportReason.PERMISSION_REQUIRED,
  );
}
