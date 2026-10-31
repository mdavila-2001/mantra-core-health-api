import { createHash, createHmac, randomUUID } from 'node:crypto';
import { redactDriverMessage } from '../../orm/observability/sql-redaction';
import { redactShareTokenInUrl } from '../../logging/share-token-redaction';
import {
  errorDiagnosticsEnabled,
  ownFramesOf,
  violationsForLog,
} from '../../common/filters/error-diagnostics';
import { sanitizeRoute } from '../http-sli/http-sli.aggregator';
import { instanceIdentity } from './instance-identity';
import {
  operationResolver,
  type OperationResolver,
} from './operation-resolver';

/**
 * Sink de errores del filtro global (H3 del portal «Sistema»).
 *
 * Cada excepción que `AllExceptionsFilter` convierte en respuesta entra acá
 * como un **evento** (qué pasó, en qué petición, con qué `requestId`) y como
 * miembro de un **grupo** (la huella estable: el mismo fallo repetido k veces
 * es un grupo con k eventos, no k filas sueltas).
 *
 * ## Qué NUNCA entra
 *
 * Ni la URL real (sólo la plantilla), ni el cuerpo, ni cabeceras, ni IP, ni el
 * `user_id` (sólo `actor_hash`, un HMAC con secreto propio), ni valores de
 * fila: el mensaje pasa por `redactDriverMessage` y, además, se pliegan UUID y
 * secuencias largas de dígitos. El mensaje interno de un 5xx sólo se guarda
 * con `API_ERROR_DIAGNOSTICS=true`, igual que el log.
 *
 * ## Acotación
 *
 *  - Tope de **500 eventos por minuto por instancia**: por encima de eso sólo
 *    se cuenta (el grupo sube su total, no hay fila de evento) y
 *    `sampledOutEvents` lo declara para `notMeasured.errorSampling`.
 *  - `UNAUTHENTICATED` y `RATE_LIMITED` se agregan **sin evento individual**:
 *    son ruido y un vector de llenado.
 *  - Memoria: a lo sumo `MAX_PENDING_EVENTS` eventos y `MAX_PENDING_GROUPS`
 *    grupos entre dos volcados; el exceso se cuenta en `droppedEvents`.
 *
 * `record` no lanza y no hace E/S.
 */

export const MAX_EVENTS_PER_MINUTE = 500;
export const MAX_PENDING_EVENTS = 20_000;
export const MAX_PENDING_GROUPS = 2_000;
const MAX_MESSAGE_CHARS = 500;
const FINGERPRINT_FRAMES = 3;
const SAMPLE_FRAMES = 15;
const MINUTE_MS = 60_000;

/** Códigos que se agregan sin evento individual. */
export const COUNT_ONLY_CODES: ReadonlySet<string> = new Set([
  'UNAUTHENTICATED',
  'RATE_LIMITED',
]);

export interface ErrorCapture {
  /** Estado HTTP de la respuesta. */
  readonly status: number;
  /** `code` normalizado **antes** de la censura de los 5xx. */
  readonly code: string;
  readonly reason?: string;
  readonly exception: unknown;
  /** Mensaje que ya se le devuelve al cliente (para los <500). */
  readonly clientMessage?: string;
  readonly method: string;
  /** Plantilla de ruta o `UNMATCHED`; nunca la URL real. */
  readonly routeTemplate?: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly userId?: string;
  readonly actorTenantId?: string;
  readonly durationMs?: number;
  /** `{sqlstate, constraint, table, column}` del error del driver. */
  readonly internals?: unknown;
  /** `details` del cuerpo (se usa sólo para `violationsForLog`). */
  readonly details?: unknown;
  readonly at?: Date;
}

/** Fila lista para `observability.error_events`. */
export interface ErrorEventRow {
  readonly id: string;
  readonly occurredAt: Date;
  readonly fingerprint: string;
  readonly requestId: string | null;
  readonly traceId: string | null;
  readonly instanceId: string;
  readonly source: 'api';
  readonly httpStatus: number;
  readonly errorCode: string;
  readonly errorReason: string | null;
  readonly exceptionType: string | null;
  readonly moduleCode: string;
  readonly operationKey: string | null;
  readonly httpMethod: string;
  readonly routeTemplate: string;
  readonly actorTenantId: string | null;
  readonly actorHash: string | null;
  readonly durationMs: number | null;
  readonly sqlstate: string | null;
  readonly constraintName: string | null;
  readonly tableName: string | null;
  readonly columnName: string | null;
  readonly violationsJson:
    readonly { field: string; constraints: string[] }[] | null;
  readonly messageRedacted: string | null;
  readonly framesJson: readonly string[] | null;
}

/** Cambio pendiente sobre un grupo (`observability.error_groups`). */
export interface ErrorGroupDelta {
  readonly fingerprint: string;
  readonly httpStatus: number;
  readonly errorCode: string;
  readonly errorReason: string | null;
  readonly exceptionType: string | null;
  readonly moduleCode: string;
  readonly operationKey: string | null;
  readonly httpMethod: string;
  readonly routeTemplate: string;
  readonly title: string;
  readonly sampleMessage: string | null;
  readonly sampleFrames: readonly string[] | null;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
  readonly lastRequestId: string | null;
  /** Ocurrencias que NO tienen fila de evento (tope, ruido). */
  readonly countOnly: number;
}

export interface DrainedErrors {
  readonly groups: ErrorGroupDelta[];
  readonly events: ErrorEventRow[];
}

/** Pliega identificadores y datos de un mensaje antes de guardarlo. */
export function scrubMessage(raw: string): string {
  const text = redactShareTokenInUrl(raw);
  return redactDriverMessage(text)
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':uuid',
    )
    .replace(/\d{6,}/g, ':n')
    .slice(0, MAX_MESSAGE_CHARS);
}

function exceptionTypeOf(exception: unknown): string | null {
  if (exception instanceof Error) {
    return exception.constructor?.name || exception.name || 'Error';
  }
  return exception === undefined || exception === null
    ? null
    : typeof exception;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REQUEST_ID_CHARS = 128;

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Huella estable de un error: la misma causa produce la misma, en cualquier instancia. */
export function errorFingerprint(parts: {
  code: string;
  reason?: string | null;
  exceptionType?: string | null;
  method: string;
  routeTemplate: string;
  frames: readonly string[];
}): string {
  return createHash('sha256')
    .update(
      [
        parts.code,
        parts.reason ?? '',
        parts.exceptionType ?? '',
        parts.method,
        parts.routeTemplate,
        parts.frames.slice(0, FINGERPRINT_FRAMES).join(','),
      ].join('|'),
    )
    .digest('hex');
}

export class ErrorSink {
  private enabled = false;
  private actorSecret: string | null = null;
  private readonly groups = new Map<string, ErrorGroupDelta>();
  private events: ErrorEventRow[] = [];
  private readonly perMinute = new Map<number, number>();
  private sampledOut = 0;
  private dropped = 0;

  constructor(
    private readonly resolver: OperationResolver = operationResolver,
    private readonly instanceId: string = instanceIdentity.id,
  ) {}

  configure(options: {
    enabled: boolean;
    actorHashSecret: string | null;
  }): void {
    this.enabled = options.enabled;
    this.actorSecret = options.actorHashSecret;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get pendingEvents(): number {
    return this.events.length;
  }

  get pendingGroups(): number {
    return this.groups.size;
  }

  /** Eventos que sólo se contaron (tope por minuto), desde el arranque. */
  get sampledOutEvents(): number {
    return this.sampledOut;
  }

  /** Eventos descartados por el tope de memoria, desde el arranque. */
  get droppedEvents(): number {
    return this.dropped;
  }

  get actorHashAvailable(): boolean {
    return this.actorSecret !== null;
  }

  /** `HMAC-SHA256(user_id, secreto)` en hexadecimal, o `null` sin secreto. */
  actorHashOf(userId: string | undefined): string | null {
    if (!userId || !this.actorSecret) return null;
    return createHmac('sha256', this.actorSecret).update(userId).digest('hex');
  }

  record(input: ErrorCapture): void {
    if (!this.enabled) return;
    try {
      this.doRecord(input);
    } catch {
      // Medir no puede romper la respuesta de error.
    }
  }

  private doRecord(input: ErrorCapture): void {
    const at = input.at ?? new Date();
    const error =
      input.exception instanceof Error ? input.exception : undefined;
    const method = (input.method || 'GET').toUpperCase();
    const route = sanitizeRoute(input.routeTemplate ?? '');
    const resolved = this.resolver.resolve(method, route);
    const frames = ownFramesOf(error?.stack, SAMPLE_FRAMES);
    const exceptionType = exceptionTypeOf(input.exception);
    const reason = input.reason ?? null;
    // `x-request-id` puede venir de fuera (con proxy confiable): se acota.
    const requestId = input.requestId
      ? input.requestId.slice(0, MAX_REQUEST_ID_CHARS)
      : null;
    const actorTenantId =
      input.actorTenantId && UUID_RE.test(input.actorTenantId)
        ? input.actorTenantId
        : null;

    const fingerprint = errorFingerprint({
      code: input.code,
      reason,
      exceptionType,
      method,
      routeTemplate: route,
      frames,
    });

    // 4xx: el mensaje que ya ve el cliente. 5xx: el interno, sólo con diagnóstico.
    let message: string | null = null;
    if (input.status < 500) {
      message = input.clientMessage ? scrubMessage(input.clientMessage) : null;
    } else if (errorDiagnosticsEnabled() && error?.message) {
      message = scrubMessage(error.message);
    }

    let group = this.groups.get(fingerprint);
    if (!group) {
      if (this.groups.size >= MAX_PENDING_GROUPS) {
        this.dropped += 1;
        return;
      }
      group = {
        fingerprint,
        httpStatus: input.status,
        errorCode: input.code,
        errorReason: reason,
        exceptionType,
        moduleCode: resolved.moduleCode,
        operationKey: resolved.operationKey,
        httpMethod: method,
        routeTemplate: route,
        title: `${input.code} · ${reason ?? '—'} · ${method} ${route}`.slice(
          0,
          250,
        ),
        sampleMessage: message,
        sampleFrames: frames.length > 0 ? frames : null,
        firstSeenAt: at,
        lastSeenAt: at,
        lastRequestId: requestId,
        countOnly: 0,
      };
      this.groups.set(fingerprint, group);
    } else {
      this.groups.set(fingerprint, {
        ...group,
        firstSeenAt: at < group.firstSeenAt ? at : group.firstSeenAt,
        lastSeenAt: at > group.lastSeenAt ? at : group.lastSeenAt,
        lastRequestId:
          at >= group.lastSeenAt
            ? (requestId ?? group.lastRequestId)
            : group.lastRequestId,
      });
    }

    const countOnly = (): void => {
      const current = this.groups.get(fingerprint)!;
      this.groups.set(fingerprint, {
        ...current,
        countOnly: current.countOnly + 1,
      });
    };

    if (COUNT_ONLY_CODES.has(input.code)) {
      countOnly();
      return;
    }

    const minute = Math.floor(at.getTime() / MINUTE_MS) * MINUTE_MS;
    const used = this.perMinute.get(minute) ?? 0;
    if (used >= MAX_EVENTS_PER_MINUTE) {
      this.sampledOut += 1;
      countOnly();
      return;
    }
    if (this.events.length >= MAX_PENDING_EVENTS) {
      this.dropped += 1;
      countOnly();
      return;
    }
    this.perMinute.set(minute, used + 1);
    if (this.perMinute.size > 120) {
      const oldest = [...this.perMinute.keys()].sort((a, b) => a - b)[0];
      this.perMinute.delete(oldest);
    }

    const integrity = isRecord(input.internals) ? input.internals : {};
    const violations = violationsForLog(input.details).violations;

    this.events.push({
      id: randomUUID(),
      occurredAt: at,
      fingerprint,
      requestId,
      traceId: input.traceId ?? null,
      instanceId: this.instanceId,
      source: 'api',
      httpStatus: input.status,
      errorCode: input.code,
      errorReason: reason,
      exceptionType,
      moduleCode: resolved.moduleCode,
      operationKey: resolved.operationKey,
      httpMethod: method,
      routeTemplate: route,
      actorTenantId,
      actorHash: this.actorHashOf(input.userId),
      durationMs:
        input.durationMs !== undefined && Number.isFinite(input.durationMs)
          ? Math.max(0, Math.round(input.durationMs))
          : null,
      sqlstate: str(integrity.sqlstate),
      constraintName: str(integrity.constraint),
      tableName: str(integrity.table),
      columnName: str(integrity.column),
      violationsJson: violations
        ? violations.slice(0, 20).map((v) => ({
            field: String(v.field).slice(0, 120),
            constraints: isRecord(v.constraints)
              ? Object.keys(v.constraints).slice(0, 10)
              : [],
          }))
        : null,
      messageRedacted: message,
      framesJson: frames.length > 0 ? frames : null,
    });
  }

  /** Entrega lo pendiente y lo olvida (los contadores de sesión se conservan). */
  drain(): DrainedErrors {
    const drained: DrainedErrors = {
      groups: [...this.groups.values()].sort((a, b) =>
        a.fingerprint.localeCompare(b.fingerprint),
      ),
      events: this.events,
    };
    this.groups.clear();
    this.events = [];
    return drained;
  }
}

/** Sink del proceso: lo comparten el filtro de excepciones y el servicio de volcado. */
export const errorSink = new ErrorSink();
