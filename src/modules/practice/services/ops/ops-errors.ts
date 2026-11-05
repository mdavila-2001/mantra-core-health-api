import { HttpStatus } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import { exclusionReasonOf } from '../../../../common/filters/exclusion-constraint-reasons';
import type { Verdict } from '../../domain/ops/cleaning-rules';

/** `reason` de la operación de F2 (CONTRATO-F2-F5 §F2.3). */
export enum InfraOpsErrorReason {
  BLOCK_REASON_REQUIRED = 'BLOCK_REASON_REQUIRED',
  BLOCK_REASON_TEXT_REQUIRED = 'BLOCK_REASON_TEXT_REQUIRED',
  BLOCK_EXPECTED_END_REQUIRED = 'BLOCK_EXPECTED_END_REQUIRED',
  BLOCK_REASON_KIND_MISMATCH = 'BLOCK_REASON_KIND_MISMATCH',
  SPACE_NOT_ACTIVE = 'SPACE_NOT_ACTIVE',
  SPACE_OCCUPIED = 'SPACE_OCCUPIED',
  BLOCK_OVERLAP = 'BLOCK_OVERLAP',
  BLOCK_NOT_OPEN = 'BLOCK_NOT_OPEN',
  FUTURE_COMMITMENTS_CONFLICT = 'FUTURE_COMMITMENTS_CONFLICT',
  OPS_VERSION_MISMATCH = 'OPS_VERSION_MISMATCH',
  OPS_VERSION_REQUIRED = 'OPS_VERSION_REQUIRED',
  BLOCK_ALREADY_ENDED = 'BLOCK_ALREADY_ENDED',
  CLEANING_ORDER_ALREADY_OPEN = 'CLEANING_ORDER_ALREADY_OPEN',
  ISOLATION_ROOM_NOT_CAPABLE = 'ISOLATION_ROOM_NOT_CAPABLE',
  ISOLATION_REASON_REQUIRED = 'ISOLATION_REASON_REQUIRED',
  ISOLATION_COHORT_REQUIRES_APPROVAL = 'ISOLATION_COHORT_REQUIRES_APPROVAL',
  TERMINAL_CLEANING_REQUIRED = 'TERMINAL_CLEANING_REQUIRED',
  CLEANING_ORDER_INVALID_TRANSITION = 'CLEANING_ORDER_INVALID_TRANSITION',
  INSPECTION_REASON_REQUIRED = 'INSPECTION_REASON_REQUIRED',
  INSPECTION_BY_CLEANER_NOT_ALLOWED = 'INSPECTION_BY_CLEANER_NOT_ALLOWED',
  TERMINAL_INSPECTION_REQUIRES_SUPERVISOR = 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
  SPACE_NOT_BOOKABLE = 'SPACE_NOT_BOOKABLE',
  CODE_UNKNOWN = 'CODE_UNKNOWN',
}

/** Mensajes para la persona (de usted). */
const MESSAGES: Record<string, string> = {
  BLOCK_REASON_REQUIRED: 'Indique el motivo del bloqueo',
  BLOCK_REASON_TEXT_REQUIRED: 'Describa el motivo cuando elige «Otro»',
  BLOCK_EXPECTED_END_REQUIRED:
    'Indique una fecha estimada de fin posterior al inicio',
  BLOCK_REASON_KIND_MISMATCH: 'Ese motivo no corresponde a ese tipo de bloqueo',
  SPACE_NOT_ACTIVE: 'El espacio no está activo',
  SPACE_OCCUPIED: 'El espacio está ocupado o reservado',
  BLOCK_OVERLAP: 'El espacio ya tiene un bloqueo en ese período',
  BLOCK_NOT_OPEN: 'No hay un bloqueo abierto que terminar',
  FUTURE_COMMITMENTS_CONFLICT:
    'Hay compromisos futuros en ese período; confirme o reprograme',
  BLOCK_ALREADY_ENDED: 'El bloqueo ya terminó o fue cancelado',
  CLEANING_ORDER_ALREADY_OPEN:
    'El espacio ya tiene una orden de limpieza abierta',
  ISOLATION_ROOM_NOT_CAPABLE:
    'El espacio no reúne las condiciones de ese aislamiento',
  ISOLATION_REASON_REQUIRED: 'Indique el motivo del aislamiento',
  ISOLATION_COHORT_REQUIRES_APPROVAL:
    'La cohorte necesita el aval de control de infecciones',
  TERMINAL_CLEANING_REQUIRED: 'El espacio requiere limpieza terminal',
  CLEANING_ORDER_INVALID_TRANSITION:
    'Ese paso no se puede hacer desde el estado actual de la orden',
  INSPECTION_REASON_REQUIRED: 'Indique por qué se rechaza la limpieza',
  INSPECTION_BY_CLEANER_NOT_ALLOWED:
    'Quien terminó la limpieza no puede inspeccionarla',
  TERMINAL_INSPECTION_REQUIRES_SUPERVISOR:
    'La limpieza terminal la inspecciona un supervisor',
  SPACE_NOT_BOOKABLE: 'El espacio no se puede reservar en esa ventana',
  CODE_UNKNOWN: 'Código desconocido en el catálogo',
};

/** 409 del contrato. */
const CONFLICT_REASONS = new Set<string>([
  'SPACE_OCCUPIED',
  'BLOCK_OVERLAP',
  'FUTURE_COMMITMENTS_CONFLICT',
  'BLOCK_ALREADY_ENDED',
  'BLOCK_NOT_OPEN',
  'CLEANING_ORDER_ALREADY_OPEN',
  'CLEANING_ORDER_INVALID_TRANSITION',
]);

/** 403 del contrato. */
const FORBIDDEN_REASONS = new Set<string>([
  'ISOLATION_COHORT_REQUIRES_APPROVAL',
  'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
]);

/**
 * Excepción del `reason` con el código HTTP que fija el contrato (409, 403 o
 * 422 por defecto).
 *
 * @param reason - `reason`.
 * @param details - Detalle.
 */
export function opsError(
  reason: string,
  details: Record<string, unknown> = {},
): DomainException {
  const message = MESSAGES[reason] ?? 'Regla de operación no cumplida';
  if (CONFLICT_REASONS.has(reason))
    return new ConflictException(message, details, reason);
  if (FORBIDDEN_REASONS.has(reason))
    return new InsufficientRoleException(message, details, reason);
  return new PreconditionFailedException(message, details, reason);
}

/**
 * Lanza el error de un veredicto que no pasó.
 *
 * @param verdict - Veredicto del dominio.
 */
export function enforce(verdict: Verdict): void {
  if (!verdict.ok) throw opsError(verdict.reason, verdict.details ?? {});
}

/** 412/428 de `If-Match-Ops` (versión operativa separada de `row_version`). */
export class OpsVersionException extends DomainException {
  /**
   * @param missing - Faltó la cabecera (428) o no coincide (412).
   * @param details - `expected`/`actual`.
   */
  constructor(missing: boolean, details?: Record<string, unknown>) {
    super(
      missing
        ? HttpStatus.PRECONDITION_REQUIRED
        : HttpStatus.PRECONDITION_FAILED,
      ErrorCode.CONCURRENCY_CONFLICT,
      missing
        ? 'Falta la cabecera If-Match-Ops con la versión operativa'
        : 'El estado operativo cambió desde que se leyó; recargar y reintentar',
      details,
      missing
        ? InfraOpsErrorReason.OPS_VERSION_REQUIRED
        : InfraOpsErrorReason.OPS_VERSION_MISMATCH,
    );
  }
}

/** Versión de una cabecera `3`, `"3"` o `W/"3"`; `NaN` si no se entiende. */
function versionOf(raw: string): number {
  const m = /^(?:W\/)?"?(\d+)"?$/.exec(raw.trim());
  return m ? Number(m[1]) : NaN;
}

/**
 * Exige `If-Match-Ops` = `ops_version` actual.
 *
 * @param header - Cabecera recibida.
 * @param opsVersion - Versión operativa actual.
 */
export function assertIfMatchOps(
  header: string | undefined,
  opsVersion: number,
): void {
  if (!header?.trim()) throw new OpsVersionException(true);
  const expected = versionOf(header);
  if (expected !== opsVersion) {
    throw new OpsVersionException(false, {
      expected: Number.isNaN(expected) ? header : expected,
      actual: opsVersion,
    });
  }
}

/** SQLSTATE y restricción de un error del driver (recorre `cause`). */
function sqlStateOf(
  error: unknown,
): { code: string; constraint?: string } | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const c = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (typeof c.code === 'string' && /^[0-9A-Z]{5}$/.test(c.code)) {
      return {
        code: c.code,
        constraint: typeof c.constraint === 'string' ? c.constraint : undefined,
      };
    }
    current = c.cause;
  }
  return undefined;
}

/**
 * Traduce lo que rechaza la base en una escritura de F2–F5 (§0.2):
 * `23503` (FK compuesta `(tenant_id, x_id)` o trigger de mismo tenant) → 404
 * genérico, sin decir qué falló; `23P01` → el `reason` del mapa
 * `constraint → reason`. Lo demás se relanza.
 *
 * @param error - Lo que lanzó el `flush` o el SQL.
 */
export function translateInfraWriteError(error: unknown): unknown {
  const state = sqlStateOf(error);
  if (!state) return error;
  if (state.code === '23503')
    return new ResourceNotFoundException('Recurso no encontrado');
  if (state.code === '23P01') {
    const mapped = exclusionReasonOf(state.constraint);
    if (mapped) return new ConflictException(mapped.message, {}, mapped.reason);
  }
  return error;
}

/**
 * `flush` con la traducción de `translateInfraWriteError`.
 *
 * @param tx - Transacción en curso.
 */
export async function flushInfra(tx: EntityManager): Promise<void> {
  try {
    await tx.flush();
  } catch (error) {
    throw translateInfraWriteError(error);
  }
}

/**
 * Corre `fn` traduciendo los errores de la base (para SQL crudo y para un
 * `flush` implícito del outbox).
 *
 * @param fn - Escritura.
 */
export async function guardInfraWrite<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw translateInfraWriteError(error);
  }
}
