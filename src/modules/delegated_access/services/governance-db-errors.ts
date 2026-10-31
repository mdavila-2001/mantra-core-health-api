import { HttpStatus } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

/**
 * Traducción de los errores de la base de datos del gobierno de accesos
 * (modelo v4.2.72) a las razones estables de `DelegatedAccessErrorReason`
 * (CONTRATO-GOBIERNO §8.4). La API valida ANTES de escribir; esto es la red de
 * seguridad cuando la base rechaza algo que ya se coló (una carrera, un dato
 * de otra capa), para que el cliente reciba la razón de negocio y no un 400/500
 * genérico del filtro global.
 *
 * SQLSTATE tratados: `23514` (CHECK y disparadores de integridad), `23503`
 * (padre inexistente u oculto por RLS: el disparador falla cerrado igual que el
 * FK), `23505` (únicos parciales) y `23001` (la bitácora WORM no admite
 * `UPDATE` ni `DELETE`). Un error que no es de estas tablas, o cuya restricción
 * no tiene razón de negocio propia, devuelve `undefined` y lo trata el filtro
 * global.
 */

/** SQLSTATE y restricción que se leen del error del driver (o de su cadena de causas). */
export interface DbViolation {
  /** SQLSTATE de 5 caracteres. */
  readonly sqlstate: string;
  /** Nombre de la restricción, si el driver lo trae. */
  readonly constraint?: string;
  /** Mensaje del servidor (los disparadores solo se distinguen por él). */
  readonly message?: string;
}

/** Esquema de las tablas del gobierno de accesos. */
const SCHEMA = 'delegated_access';

/** Recorre el error y sus causas buscando un SQLSTATE. */
export function readDbViolation(error: unknown): DbViolation | undefined {
  let current: unknown = error;
  for (
    let depth = 0;
    depth < 6 && current && typeof current === 'object';
    depth += 1
  ) {
    const e = current as Record<string, unknown>;
    const code = e.code ?? e.sqlState;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
      return {
        sqlstate: code,
        ...(typeof e.constraint === 'string'
          ? { constraint: e.constraint }
          : {}),
        ...(typeof e.message === 'string' ? { message: e.message } : {}),
      };
    }
    current = e.cause ?? e.originalError ?? e.driverError;
  }
  return undefined;
}

type Factory = () => Error;

const CHECKS: Readonly<Record<string, Factory>> = {
  ck_four_eyes_requests_not_self: () =>
    new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'No puede aprobar lo que usted mismo pidió ni lo que le afecta.',
      undefined,
      'FOUR_EYES_SELF_APPROVAL',
    ),
  ck_four_eyes_requests_hash: () =>
    new ConflictException(
      'El cuerpo de la solicitud no es válido: pida una nueva.',
      undefined,
      'FOUR_EYES_PAYLOAD_INVALID',
    ),
  ck_access_review_items_comment: () =>
    new PreconditionFailedException(
      'Para revocar o ajustar un acceso escriba un comentario de al menos 10 caracteres.',
      undefined,
      'REVIEW_COMMENT_REQUIRED',
    ),
  ck_support_scope_grants_condition: () =>
    new PreconditionFailedException(
      'La condición del permiso es de una versión que no se puede leer.',
      undefined,
      'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
    ),
  ck_support_grant_actions_condition: () =>
    new PreconditionFailedException(
      'La condición de la acción es de una versión que no se puede leer.',
      undefined,
      'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
    ),
};

const UNIQUES: Readonly<Record<string, Factory>> = {
  uq_four_eyes_requests_pending_payload: () =>
    new ConflictException(
      'Ya hay una solicitud pendiente igual a esta.',
      undefined,
      'FOUR_EYES_DUPLICATE_PENDING',
    ),
  uq_governance_rules_active: () =>
    new ConflictException(
      'Ya existe una regla activa igual a esta.',
      undefined,
      'GOVERNANCE_RULE_DUPLICATE',
    ),
  uq_access_review_campaigns_recert_month: () =>
    new ConflictException(
      'Ya existe una campaña de recertificación para ese mes.',
      undefined,
      'REVIEW_CAMPAIGN_DUPLICATE',
    ),
  uq_access_review_items_campaign_grant: () =>
    new ConflictException(
      'Ese acceso ya figura en la campaña.',
      undefined,
      'REVIEW_CAMPAIGN_DUPLICATE',
    ),
  uq_lifecycle_cases_open_suspension: () =>
    new ConflictException(
      'La persona ya está suspendida.',
      undefined,
      'ENGAGEMENT_ALREADY_SUSPENDED',
    ),
};

/**
 * Traduce un error de la base a la excepción de negocio del gobierno de accesos.
 *
 * @param error - Lo que lanzó el ORM o el driver.
 * @returns La excepción estable, o `undefined` si no es de estas tablas o no
 *   tiene razón de negocio propia (la trata el filtro global).
 */
export function mapGovernanceDbError(error: unknown): Error | undefined {
  const violation = readDbViolation(error);
  if (!violation) return undefined;
  const { sqlstate, constraint = '', message = '' } = violation;
  switch (sqlstate) {
    case '23514':
      // Disparador «la persona revisada no puede ser su propia revisora».
      if (/la persona revisada .* no puede ser revisora/.test(message)) {
        return new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Quien tiene el acceso no puede revisarlo.',
          undefined,
          'REVIEW_NOT_REVIEWER',
        );
      }
      return CHECKS[constraint]?.();
    case '23503':
      // Padre inexistente u oculto por RLS (o de otra organización): 404 uniforme,
      // sin decir cuál de las dos cosas pasó.
      return message.includes(SCHEMA) || constraint.includes('delegated_access')
        ? new ResourceNotFoundException(
            'Recurso no encontrado',
            undefined,
            'RESOURCE_NOT_FOUND',
          )
        : undefined;
    case '23505':
      return UNIQUES[constraint]?.();
    case '23001':
      return message.includes('access_decision_log') ||
        message.includes('append-only')
        ? new ConflictException(
            'Este registro es de solo anexar: no se modifica ni se borra.',
            undefined,
            'APPEND_ONLY',
          )
        : undefined;
    default:
      return undefined;
  }
}
