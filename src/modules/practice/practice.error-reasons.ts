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
  SPACE_PARENT_RULE = 'SPACE_PARENT_RULE',
  /** La función no admite esa forma (perfil de función). */
  FUNCTION_FORM_MISMATCH = 'FUNCTION_FORM_MISMATCH',
  /** La tipología del establecimiento no admite esa función. */
  TYPOLOGY_NOT_ALLOWED = 'TYPOLOGY_NOT_ALLOWED',
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
  /**
   * 404 del padre o de la unidad referenciados: no existen, son de otra sede o
   * de otro tenant (no se distingue, para no revelar nada).
   */
  PARENT_NOT_FOUND = 'PARENT_NOT_FOUND',
  UNIT_NOT_FOUND = 'UNIT_NOT_FOUND',
  /** Referencia (padre, unidad) a otra sede. */
  CROSS_SITE_REFERENCE = 'CROSS_SITE_REFERENCE',
  /** La sede no está activa. */
  SITE_NOT_ACTIVE = 'SITE_NOT_ACTIVE',
  /** El espacio está retirado: no se edita ni se mueve. */
  SPACE_RETIRED = 'SPACE_RETIRED',

  // --- Ciclo de vida --------------------------------------------------------
  SPACE_INVALID_TRANSITION = 'SPACE_INVALID_TRANSITION',
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
  SPACE_OWNER_TAKEN = 'SPACE_OWNER_TAKEN',
  /** Esa unidad ya está vinculada (vigente) al espacio. */
  ASSIGNMENT_EXISTS = 'ASSIGNMENT_EXISTS',

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
  /** Ya hay una habilitación del tenant con ese número de resolución. */
  LICENSE_NUMBER_TAKEN = 'LICENSE_NUMBER_TAKEN',
  /** `notes` con texto: `facility_licenses` no tiene dónde guardarlo. */
  LICENSE_NOTES_UNSUPPORTED = 'LICENSE_NOTES_UNSUPPORTED',
  /** Estado de habilitación que `facility_licenses` no puede guardar. */
  LICENSE_STATUS_UNSUPPORTED = 'LICENSE_STATUS_UNSUPPORTED',
}

/**
 * Concurrencia optimista (`If-Match`): **412** si no coincide (contrato §3,
 * RFC 9110 §13.1.1) y **428** si falta (RFC 6585 §3; el contrato no lo dice y
 * la web ya lo espera así, «Desvíos» WEB-F1 punto 3).
 *
 * `PreconditionFailedException` del proyecto responde 422 (precondición de
 * negocio), por eso esta clase aparte.
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
      reason === PracticeErrorReason.IF_MATCH_REQUIRED
        ? HttpStatus.PRECONDITION_REQUIRED
        : HttpStatus.PRECONDITION_FAILED,
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
  [PracticeErrorReason.SPACE_PARENT_RULE]:
    'Ese tipo de espacio no puede ir dentro del padre elegido',
  [PracticeErrorReason.FUNCTION_FORM_MISMATCH]:
    'La función elegida no admite esa forma de espacio',
  [PracticeErrorReason.TYPOLOGY_NOT_ALLOWED]:
    'La tipología del establecimiento no admite esa función',
  [PracticeErrorReason.SPACE_UNKNOWN_CODE]: 'Código desconocido en el catálogo',
  [PracticeErrorReason.SPACE_CYCLE]:
    'El espacio no puede quedar dentro de uno de sus propios hijos',
  [PracticeErrorReason.PARENT_NOT_ACTIVE]:
    'El espacio padre no está en un estado que lo permita',
  [PracticeErrorReason.SPACE_INVALID_TRANSITION]:
    'Ese cambio de estado no se puede hacer desde el estado actual',
  [PracticeErrorReason.LIFECYCLE_REASON_REQUIRED]:
    'Hay que indicar el motivo del cambio de estado',
  [PracticeErrorReason.BULK_PATTERN_INVALID]:
    'El patrón tiene que tener un solo rango, como {A..H} o {1..12}',
  [PracticeErrorReason.BULK_LIMIT_EXCEEDED]:
    'El alta masiva admite como máximo 200 espacios',
};

/** Mensajes de filas de importación que no son `PracticeErrorReason`. */
const ROW_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'No existe en la sede',
  NOT_AN_OBJECT: 'La fila no tiene el formato esperado',
  [PracticeErrorReason.SPACE_CODE_TAKEN]:
    'Ya existe un espacio con ese código en la sede',
};

/**
 * Texto para la persona de un `reason` de fila (importación, alta masiva).
 * Los `reason` de class-validator (`isString`, `isInt`…) se leen «valor
 * inválido»: el campo ya dice cuál.
 *
 * @param reason - Código de la fila.
 */
export function reasonMessage(reason: string): string {
  return (
    ROW_MESSAGES[reason] ??
    MESSAGES[reason as PracticeErrorReason] ??
    'Valor inválido'
  );
}

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
    MESSAGES[reason as PracticeErrorReason] ??
    'Regla de estructura no cumplida';
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
