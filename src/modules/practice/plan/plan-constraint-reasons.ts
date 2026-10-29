/**
 * Traducción de lo que la base rechaza en el plano (`23P01`, `23505`, `23503`,
 * `23514`, `23001`) a un `reason` y un HTTP (CONTRATO-PLANO §3.4, «Mapa
 * constraint/mensaje → reason»).
 *
 * Es la red de seguridad del validador en memoria: si éste deja pasar algo que
 * el modelo rechaza, el guardado igual falla con el mismo vocabulario y no con
 * un 500. Los triggers del patch F1c ponen su código `PLAN_*` al principio del
 * mensaje; el texto del servidor sólo sirve para **elegir** el `reason` y para
 * sacar el id del espacio señalado, nunca se reenvía.
 */
import { HttpStatus } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FloorPlanReason } from './floor-plan.error-reasons';
import { PracticeErrorReason } from '../practice.error-reasons';
import type { PlanLayoutError } from './floor-plan.types';

/** Lo que se sabe de un error de PostgreSQL. */
export interface PlanDbViolation {
  readonly sqlstate: string;
  readonly constraint?: string;
  readonly text: string;
}

/** Cómo responder a una violación reconocida. */
export interface PlanDbTranslation {
  readonly status: HttpStatus;
  readonly reason: FloorPlanReason;
  readonly message: string;
  /** Tipo del sujeto señalado en un error por elemento. */
  readonly subjectKind: 'SPACE' | 'ELEMENT' | 'CANVAS';
  /** Id del espacio/elemento señalado, si el mensaje del trigger lo trae. */
  readonly subjectId?: string;
}

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const PLAN_TOKEN_RE = /\b(PLAN_[A-Z_]+|SPACE_MOVE_BREAKS_PLAN)\b/;

/**
 * Busca el error de PostgreSQL dentro de lo capturado (el ORM lo envuelve según
 * la versión) y lo normaliza.
 *
 * @param error - Lo capturado.
 * @returns La violación, o `null` si no hay un SQLSTATE de cinco caracteres.
 */
export function readPlanDbViolation(error: unknown): PlanDbViolation | null {
  const seen = new Set<unknown>();
  let cursor: unknown = error;
  for (let depth = 0; depth < 5 && cursor && !seen.has(cursor); depth += 1) {
    seen.add(cursor);
    const candidate = cursor as {
      code?: unknown;
      constraint?: unknown;
      message?: unknown;
      cause?: unknown;
      driverError?: unknown;
    };
    if (
      typeof candidate.code === 'string' &&
      /^[0-9A-Z]{5}$/.test(candidate.code)
    ) {
      return {
        sqlstate: candidate.code,
        constraint:
          typeof candidate.constraint === 'string'
            ? candidate.constraint
            : undefined,
        text: typeof candidate.message === 'string' ? candidate.message : '',
      };
    }
    cursor = candidate.driverError ?? candidate.cause;
  }
  return null;
}

const CONSTRAINT_REASONS: Readonly<
  Record<
    string,
    { status: HttpStatus; reason: FloorPlanReason; message: string }
  >
> = {
  ex_space_placements_no_overlap: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_SIBLING_OVERLAP,
    message: 'Dos espacios hermanos comparten superficie en el lienzo',
  },
  ux_space_placements_care_space: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_SPACE_ALREADY_PLACED,
    message: 'El espacio ya está dibujado en un lienzo',
  },
  ux_floor_plans_anchor_current: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_ANCHOR_TAKEN,
    message: 'El espacio ancla ya tiene un lienzo vigente',
  },
  ux_floor_plans_site_campus_current: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_CAMPUS_EXISTS,
    message: 'La sede ya tiene un lienzo de campus vigente',
  },
  ux_floor_plans_site_code: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_CODE_TAKEN,
    message: 'Ya existe un lienzo con ese código en la sede',
  },
};

/** Reasons que traen los triggers del modelo y su respuesta. */
const TOKEN_REASONS: Readonly<
  Record<
    string,
    {
      status: HttpStatus;
      reason: FloorPlanReason;
      message: string;
      kind: 'SPACE' | 'ELEMENT' | 'CANVAS';
      /** Qué uuid del mensaje es el sujeto: 0 el primero, -1 el último. */
      uuidAt: number;
    }
  >
> = {
  PLAN_GEOMETRY_INVALID: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_GEOMETRY_INVALID,
    message: 'La figura no es un polígono simple válido',
    kind: 'SPACE',
    uuidAt: 0,
  },
  PLAN_OUT_OF_BOUNDS: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_OUT_OF_BOUNDS,
    message: 'La figura sale del lienzo',
    kind: 'SPACE',
    uuidAt: 0,
  },
  PLAN_PARENT_NOT_PLACED: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_PARENT_NOT_PLACED,
    message: 'El padre del espacio no está dibujado en este lienzo',
    kind: 'SPACE',
    uuidAt: -1,
  },
  PLAN_CHILD_OUTSIDE_PARENT: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
    message: 'El espacio no cabe dentro de la figura de su padre',
    kind: 'SPACE',
    uuidAt: 0,
  },
  PLAN_HAS_PLACED_CHILDREN: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_HAS_PLACED_CHILDREN,
    message: 'El espacio tiene hijos dibujados; quitalos primero',
    kind: 'SPACE',
    uuidAt: 0,
  },
  PLAN_HOST_NOT_WALL: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_HOST_NOT_WALL,
    message: 'La abertura debe estar sobre un muro del mismo lienzo',
    kind: 'ELEMENT',
    uuidAt: 0,
  },
  PLAN_OPENING_OUTSIDE_WALL: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_OPENING_OUTSIDE_WALL,
    message: 'La abertura excede el largo del muro',
    kind: 'ELEMENT',
    uuidAt: 0,
  },
  PLAN_BOUNDS_EXCLUDE_CONTENT: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_BOUNDS_EXCLUDE_CONTENT,
    message: 'Achicar el lienzo dejaría espacios o elementos fuera',
    kind: 'CANVAS',
    uuidAt: 0,
  },
  PLAN_ANCHOR_IMMUTABLE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_ANCHOR_IMMUTABLE,
    message: 'La sede y el ancla de un lienzo no se cambian',
    kind: 'CANVAS',
    uuidAt: 0,
  },
  PLAN_RETIRED: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.PLAN_RETIRED,
    message: 'El lienzo está clausurado y no admite cambios de dibujo',
    kind: 'CANVAS',
    uuidAt: 0,
  },
  PLAN_SPACE_OTHER_SITE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
    message: 'El espacio es de otro establecimiento que el lienzo',
    kind: 'SPACE',
    uuidAt: 0,
  },
  PLAN_CONNECT_SPACE_OTHER_SITE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    reason: FloorPlanReason.PLAN_ELEMENT_INVALID,
    message: 'El espacio conectado no es del establecimiento del lienzo',
    kind: 'ELEMENT',
    uuidAt: 0,
  },
  SPACE_MOVE_BREAKS_PLAN: {
    status: HttpStatus.CONFLICT,
    reason: FloorPlanReason.SPACE_MOVE_BREAKS_PLAN,
    message: 'Mover el espacio rompería su dibujo; sacalo del plano antes',
    kind: 'SPACE',
    uuidAt: 0,
  },
};

/**
 * Decide cómo responder a una violación de la base del plano.
 *
 * @param error - Lo capturado.
 * @returns La traducción, o `null` si no es una defensa del plano.
 */
export function translatePlanDbError(error: unknown): PlanDbTranslation | null {
  const violation = readPlanDbViolation(error);
  if (!violation) return null;
  const { sqlstate, constraint, text } = violation;

  if (constraint && CONSTRAINT_REASONS[constraint]) {
    const rule = CONSTRAINT_REASONS[constraint];
    return { ...rule, subjectKind: 'SPACE' };
  }
  // El driver no siempre trae `constraint`: se busca el nombre en el texto.
  for (const [name, rule] of Object.entries(CONSTRAINT_REASONS)) {
    if (text.includes(name)) return { ...rule, subjectKind: 'SPACE' };
  }

  if (sqlstate === '23503') {
    // FK compuesta por tenant o trigger de coherencia: nunca se revela que existe.
    if (
      /_tenant_/.test(constraint ?? text) ||
      /PLAN_NOT_FOUND|PLAN_SPACE_NOT_FOUND/.test(text)
    ) {
      return {
        status: HttpStatus.NOT_FOUND,
        reason: FloorPlanReason.PLAN_LAYOUT_INVALID,
        message: 'Recurso no encontrado',
        subjectKind: 'CANVAS',
      };
    }
    return null;
  }

  const token = PLAN_TOKEN_RE.exec(text)?.[1];
  if (token && TOKEN_REASONS[token]) {
    const rule = TOKEN_REASONS[token];
    const uuids = text.match(UUID_RE) ?? [];
    const subjectId =
      uuids.length === 0
        ? undefined
        : rule.uuidAt < 0
          ? uuids[uuids.length + rule.uuidAt]
          : uuids[rule.uuidAt];
    return {
      status: rule.status,
      reason: rule.reason,
      message: rule.message,
      subjectKind: rule.kind,
      subjectId,
    };
  }

  if (sqlstate === '23514') {
    const name = constraint ?? '';
    if (name.startsWith('ck_space_placements_')) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        reason: FloorPlanReason.PLAN_GEOMETRY_INVALID,
        message: 'La geometría del espacio no es válida',
        subjectKind: 'SPACE',
      };
    }
    if (name.startsWith('ck_plan_elements_')) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        reason: FloorPlanReason.PLAN_ELEMENT_INVALID,
        message: 'El elemento no es válido',
        subjectKind: 'ELEMENT',
      };
    }
    if (name.startsWith('ck_floor_plans_')) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        reason: FloorPlanReason.PLAN_CANVAS_INVALID,
        message: 'Los datos del lienzo no son válidos',
        subjectKind: 'CANVAS',
      };
    }
  }
  return null;
}

/**
 * Convierte una traducción en la excepción HTTP que corresponde.
 *
 * Los rechazos de dibujo (422 por elemento) salen como `PLAN_LAYOUT_INVALID`
 * con `details.errors`, igual que los del validador; el resto, con su propio
 * `reason`.
 *
 * @param translation - Resultado de {@link translatePlanDbError}.
 * @param fallbackSubjectId - Id a señalar si el mensaje del trigger no trae uno.
 * @param requestId - Id de correlación de la petición.
 * @returns La excepción lista para lanzar.
 */
export function planDbException(
  translation: PlanDbTranslation,
  fallbackSubjectId: string,
  requestId?: string,
): DomainException {
  if (translation.status === HttpStatus.NOT_FOUND) {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
    );
  }
  if (translation.status === HttpStatus.CONFLICT) {
    return new ConflictException(
      translation.message,
      translation.subjectId ? { spaceId: translation.subjectId } : undefined,
      translation.reason,
    );
  }
  const error: PlanLayoutError = {
    kind: translation.subjectKind,
    id: translation.subjectId ?? fallbackSubjectId,
    code: translation.reason,
    message: translation.message,
  };
  return new PreconditionFailedException(
    'El dibujo no es válido',
    { errors: [error], requestId: requestId ?? null, source: 'database' },
    FloorPlanReason.PLAN_LAYOUT_INVALID,
  );
}

/** 412 por `layoutVersion` desactualizado. */
export function layoutVersionMismatch(
  currentVersion: number,
  expectedVersion: number,
  changedAt: string | null,
): DomainException {
  return new DomainException(
    HttpStatus.PRECONDITION_FAILED,
    ErrorCode.CONCURRENCY_CONFLICT,
    'Otra persona modificó este plano; recargalo y volvé a aplicar tus cambios',
    { currentVersion, expectedVersion, layoutChangedAt: changedAt },
    FloorPlanReason.PLAN_VERSION_MISMATCH,
  );
}

/** Reglas del dibujo que un `move` del árbol puede romper al confirmarse. */
const MOVE_BREAKING_REASONS: ReadonlySet<FloorPlanReason> = new Set([
  FloorPlanReason.PLAN_PARENT_NOT_PLACED,
  FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
  FloorPlanReason.SPACE_MOVE_BREAKS_PLAN,
]);

/**
 * Traduce el rechazo de la base a un `move` del árbol (`POST /care-spaces/:id/move`).
 *
 * Mover un espacio dibujado revalida su dibujo y el de sus descendientes con
 * los triggers diferidos del plano, así que el rechazo llega al confirmar la
 * transacción con el vocabulario del dibujo (`PLAN_PARENT_NOT_PLACED`,
 * `PLAN_CHILD_OUTSIDE_PARENT`). Para quien mueve en el árbol se informa con una
 * sola regla: 409 `SPACE_MOVE_BREAKS_PLAN`, y se pide sacar el dibujo antes.
 *
 * @param error - Lo capturado al mover.
 * @param spaceId - El espacio que se movió.
 * @returns El 409 a lanzar, o `null` si no es un rechazo del dibujo.
 */
export function moveBreaksPlanException(
  error: unknown,
  spaceId: string,
): ConflictException | null {
  const translation = translatePlanDbError(error);
  if (!translation || !MOVE_BREAKING_REASONS.has(translation.reason))
    return null;
  return new ConflictException(
    'Mover el espacio rompería su dibujo en el plano; sacalo del plano antes de moverlo',
    { spaceId },
    FloorPlanReason.SPACE_MOVE_BREAKS_PLAN,
  );
}
