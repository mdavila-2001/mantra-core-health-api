import { HttpStatus } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
} from '../../common';

/**
 * Sub-códigos de negocio (`reason`) de la estructura de `practice` (F1,
 * contrato §3). `code` dice el tipo HTTP; `reason`, cuál error fue.
 */
export enum PracticeErrorReason {
  // --- Árbol físico ---------------------------------------------------------
  /** Ya hay un espacio con ese código en la sede (los códigos no se reutilizan). */
  SPACE_CODE_TAKEN = 'SPACE_CODE_TAKEN',
  /** La forma no puede colgar de la forma del padre (o de la raíz). */
  SPACE_PARENT_RULE_VIOLATION = 'SPACE_PARENT_RULE_VIOLATION',
  /** La función no admite esa forma (perfil de función). */
  SPACE_FUNCTION_FORM_MISMATCH = 'SPACE_FUNCTION_FORM_MISMATCH',
  /** La tipología del establecimiento no admite esa función. */
  SPACE_TYPOLOGY_FORBIDDEN = 'SPACE_TYPOLOGY_FORBIDDEN',
  /** Un código (forma, función, atributo) que el catálogo no conoce. */
  SPACE_UNKNOWN_CODE = 'SPACE_UNKNOWN_CODE',
  /** `code` o `formCode` de un espacio ya activado. */
  SPACE_IMMUTABLE_FIELD = 'SPACE_IMMUTABLE_FIELD',
  /** El movimiento dejaría al espacio colgando de su descendiente. */
  SPACE_CYCLE = 'SPACE_CYCLE',
  /** El retiro tiene bloqueos (`details.blockers`). */
  SPACE_RETIRE_BLOCKED = 'SPACE_RETIRE_BLOCKED',
  /** La suspensión dejaría hijos más activos que el padre. */
  SPACE_SUSPEND_BLOCKED = 'SPACE_SUSPEND_BLOCKED',
  /** El padre no está activo (o planificado, en un alta planificada). */
  PARENT_NOT_ACTIVE = 'PARENT_NOT_ACTIVE',
  /** Referencia (padre, unidad) a otra sede. */
  CROSS_SITE_REFERENCE = 'CROSS_SITE_REFERENCE',
  /** La sede no está activa. */
  SITE_NOT_ACTIVE = 'SITE_NOT_ACTIVE',
  /** El espacio está retirado: no se edita ni se mueve. */
  SPACE_RETIRED = 'SPACE_RETIRED',

  // --- Ciclo de vida --------------------------------------------------------
  LIFECYCLE_INVALID_TRANSITION = 'LIFECYCLE_INVALID_TRANSITION',
  LIFECYCLE_REASON_REQUIRED = 'LIFECYCLE_REASON_REQUIRED',

  // --- Concurrencia ---------------------------------------------------------
  /** Falta `If-Match` en una escritura que lo exige. */
  IF_MATCH_REQUIRED = 'IF_MATCH_REQUIRED',
  /** `If-Match` no coincide con `row_version`. */
  ROW_VERSION_MISMATCH = 'ROW_VERSION_MISMATCH',

  // --- Alta masiva e importación --------------------------------------------
  BULK_PATTERN_INVALID = 'BULK_PATTERN_INVALID',
  BULK_LIMIT_EXCEEDED = 'BULK_LIMIT_EXCEEDED',
  /** Alguna fila de la importación (o del alta masiva) no pasa. */
  IMPORT_INVALID_ROWS = 'IMPORT_INVALID_ROWS',

  // --- Vínculo espacio ↔ unidad ---------------------------------------------
  /** Ya hay una unidad propietaria vigente. */
  ASSIGNMENT_OWNER_TAKEN = 'ASSIGNMENT_OWNER_TAKEN',
  /** Esa unidad ya está vinculada (vigente) al espacio. */
  ASSIGNMENT_DUPLICATE = 'ASSIGNMENT_DUPLICATE',

  // --- Unidades -------------------------------------------------------------
  UNIT_CODE_TAKEN = 'UNIT_CODE_TAKEN',
  UNIT_RETIRE_BLOCKED = 'UNIT_RETIRE_BLOCKED',
  UNIT_SUSPEND_BLOCKED = 'UNIT_SUSPEND_BLOCKED',
  UNIT_CYCLE = 'UNIT_CYCLE',

  // --- Establecimiento ------------------------------------------------------
  /** La tipología nueva deja espacios existentes fuera de regla (`details.conflicts`). */
  TYPOLOGY_CONFLICT = 'TYPOLOGY_CONFLICT',
  /**
   * El código SNIS no se puede usar o verificar. Genérico a propósito: no dice
   * si existe en otra organización (f1b, unicidad global de verificados).
   */
  SNIS_CODE_UNAVAILABLE = 'SNIS_CODE_UNAVAILABLE',
  /** No hay código SNIS declarado que verificar. */
  SNIS_CODE_MISSING = 'SNIS_CODE_MISSING',
  /** Estado de habilitación que `facility_licenses` no puede guardar. */
  LICENSE_STATUS_UNSUPPORTED = 'LICENSE_STATUS_UNSUPPORTED',
  /** Sólo la plataforma decide la verificación de una habilitación. */
  LICENSE_STATUS_PLATFORM_ONLY = 'LICENSE_STATUS_PLATFORM_ONLY',
}

/**
 * 412 de concurrencia optimista (`If-Match`).
 *
 * `PreconditionFailedException` del proyecto responde 422 (precondición de
 * negocio); el contrato pide **412** para `If-Match`, que es la semántica HTTP
 * de la cabecera (RFC 9110 §13.1.1).
 */
export class IfMatchFailedException extends DomainException {
  /**
   * @param reason - `IF_MATCH_REQUIRED` o `ROW_VERSION_MISMATCH`.
   * @param details - `expected`/`actual` cuando aplica.
   */
  constructor(
    reason:
      | PracticeErrorReason.IF_MATCH_REQUIRED
      | PracticeErrorReason.ROW_VERSION_MISMATCH,
    details?: Record<string, unknown>,
  ) {
    super(
      HttpStatus.PRECONDITION_FAILED,
      ErrorCode.CONCURRENCY_CONFLICT,
      reason === PracticeErrorReason.IF_MATCH_REQUIRED
        ? 'Falta la cabecera If-Match con la versión del recurso'
        : 'El recurso cambió desde que se leyó; recargar y reintentar',
      details,
      reason,
    );
  }
}

/** Mensajes para el usuario por `reason` de regla (422/409). */
const MESSAGES: Partial<Record<PracticeErrorReason, string>> = {
  [PracticeErrorReason.SPACE_PARENT_RULE_VIOLATION]:
    'Ese tipo de espacio no puede ir dentro del padre elegido',
  [PracticeErrorReason.SPACE_FUNCTION_FORM_MISMATCH]:
    'La función elegida no admite esa forma de espacio',
  [PracticeErrorReason.SPACE_TYPOLOGY_FORBIDDEN]:
    'La tipología del establecimiento no admite esa función',
  [PracticeErrorReason.SPACE_UNKNOWN_CODE]: 'Código desconocido en el catálogo',
  [PracticeErrorReason.SPACE_CYCLE]:
    'El espacio no puede quedar dentro de uno de sus propios hijos',
  [PracticeErrorReason.PARENT_NOT_ACTIVE]:
    'El espacio padre no está en un estado que lo permita',
  [PracticeErrorReason.LIFECYCLE_INVALID_TRANSITION]:
    'Ese cambio de estado no se puede hacer desde el estado actual',
  [PracticeErrorReason.LIFECYCLE_REASON_REQUIRED]:
    'Hay que indicar el motivo del cambio de estado',
  [PracticeErrorReason.BULK_PATTERN_INVALID]:
    'El patrón tiene que tener un solo rango, como {A..H} o {1..12}',
  [PracticeErrorReason.BULK_LIMIT_EXCEEDED]:
    'El alta masiva admite como máximo 200 espacios',
};

/**
 * Traduce un veredicto de regla a la excepción de dominio que corresponde.
 *
 * @param reason - `reason` del veredicto.
 * @param details - Detalle del veredicto.
 */
export function ruleException(
  reason: string,
  details: Record<string, unknown>,
): DomainException {
  const message =
    MESSAGES[reason as PracticeErrorReason] ?? 'Regla de estructura no cumplida';
  return new PreconditionFailedException(message, details, reason);
}

/** 409 con reason del módulo. */
export function conflict(
  reason: PracticeErrorReason,
  message: string,
  details: Record<string, unknown>,
): ConflictException {
  return new ConflictException(message, details, reason);
}
