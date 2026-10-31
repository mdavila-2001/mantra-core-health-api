import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import type { Request } from 'express';
import { JWT_ALGORITHM, loadAuthEnv } from '../../../../common/auth/auth.env';
import type { JwtPayload } from '../../../../common/auth/jwt-payload.interface';
import { SessionValidator } from '../../../../common/auth/session-validator';
import {
  CLIENT_ERROR_LIMITS,
  clientErrorFingerprint,
  safeApiRouteOrNull,
  safeRouteOrNull,
  safeToken,
  sanitizeClientMessage,
  sanitizeErrorType,
} from '../../domain/client-error-sanitizer';
import {
  TelemetryClientErrorsRepository,
  type ClientErrorRow,
} from '../../infrastructure/repositories/telemetry-client-errors.repository';
import { ERROR_CLASS_CONCEPT_BY_CODE, TELE } from '../../telemetry.concepts';
import type {
  CaptureClientErrorsDto,
  ClientErrorsResponseDto,
} from '../../presentation/dto/client-error.dto';

/** Actor que el servidor pudo probar con un token válido. */
export interface ClientErrorActor {
  userId: string;
  sessionId: string | null;
  tenantId: string | null;
}

/** Una cadena `X.Y.Z` de versión: lo único que se acepta como «versión conocida». */
const VERSION = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,39}$/u;

/**
 * Ingesta pública de errores del cliente (H3.S1.M2).
 *
 * Es pública porque el error más importante es el que ocurre antes de tener
 * sesión (pantalla de acceso, chunk caído al recargar). Por eso **todo** lo que
 * llega es hostil: se sanea de nuevo (mensaje, tipo, rutas, identificadores), la
 * huella la calcula el servidor y la identidad (`user_id`, sesión, tenant del
 * actor) sólo se llena si hay un token válido con sesión activa — nunca del
 * cuerpo.
 */
@Injectable()
export class TelemetryClientErrorsService {
  constructor(
    private readonly repo: TelemetryClientErrorsRepository,
    private readonly jwt: JwtService,
    private readonly sessions: SessionValidator,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryClientErrorsService.name);
  }

  /** Actor de la petición si trae un access token válido y su sesión sigue activa; si no, `null`. */
  async optionalActor(request: Pick<Request, 'headers'>): Promise<ClientErrorActor | null> {
    const header = request.headers.authorization;
    const token = typeof header === 'string' && /^Bearer\s+/iu.test(header)
      ? header.replace(/^Bearer\s+/iu, '').trim()
      : undefined;
    if (!token) return null;
    try {
      // El secreto se lee al momento de verificar, igual que `JwtStrategy`: el
      // `JwtModule` global se registra al importar, antes de que ConfigModule
      // haya poblado el entorno, y puede traer otro secreto.
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: loadAuthEnv().secret,
        algorithms: [JWT_ALGORITHM],
      });
      if (payload.typ !== 'access') return null;
      await this.sessions.assertActive(payload);
      const sessionId = payload.sid
        ? await this.repo.sessionIdOf(payload.sub, payload.sid)
        : null;
      const declared = request.headers['x-tenant-id'];
      const wanted = Array.isArray(declared) ? declared[0] : declared;
      const tenants = payload.tenants ?? [];
      const tenantId = wanted && tenants.includes(wanted)
        ? wanted
        : tenants.length === 1
          ? tenants[0]
          : null;
      return { userId: payload.sub, sessionId, tenantId };
    } catch {
      return null;
    }
  }

  /** Sanea un error y lo vuelve fila; `null` si no cumple el mínimo (versión conocida). */
  toRow(
    item: CaptureClientErrorsDto['errors'][number],
    actor: ClientErrorActor | null,
    now: Date,
  ): ClientErrorRow | null {
    const appVersion = item.appVersion?.trim();
    if (!appVersion || !VERSION.test(appVersion)) return null;
    const errorType = sanitizeErrorType(item.errorType);
    const message = sanitizeClientMessage(item.message);
    const route = safeRouteOrNull(item.routeTemplate);
    const occurred = item.occurredAt ? new Date(item.occurredAt) : now;
    // Un reloj del cliente descabellado no manda el error a otra ventana.
    const skew = Math.abs(now.getTime() - occurred.getTime());
    const occurredAt = Number.isNaN(skew) || skew > 7 * 24 * 3_600_000 ? now : occurred;
    const method = item.httpMethod?.toUpperCase();
    return {
      receivedAt: now,
      occurredAt,
      portalTypeConceptId: item.portal === 'MOBILE' ? TELE.PORTAL_MOBILE : TELE.PORTAL_WEB,
      actorTenantId: actor?.tenantId ?? null,
      userId: actor?.userId ?? null,
      sessionId: actor?.sessionId ?? null,
      routeTemplate: route,
      fingerprint: clientErrorFingerprint({
        errorClass: item.errorClass,
        errorType,
        message,
        route,
      }),
      errorClassConceptId: ERROR_CLASS_CONCEPT_BY_CODE[item.errorClass],
      errorType,
      sanitizedMessage: message,
      httpMethod:
        method && /^[A-Z]{3,7}$/u.test(method)
          ? method.slice(0, CLIENT_ERROR_LIMITS.httpMethod)
          : null,
      apiRouteTemplate: safeApiRouteOrNull(item.apiRouteTemplate),
      httpStatus: item.httpStatus ?? null,
      apiErrorCode: safeToken(item.apiErrorCode, CLIENT_ERROR_LIMITS.apiCode),
      requestId: safeToken(item.requestId, CLIENT_ERROR_LIMITS.requestId),
      supportCode: safeToken(item.supportCode, CLIENT_ERROR_LIMITS.supportCode),
      appVersion,
      buildId: safeToken(item.buildId, CLIENT_ERROR_LIMITS.buildId),
      screenSize: item.screenSize ?? null,
      isOnline: item.isOnline ?? null,
      suppressedCount: item.suppressedCount ?? 0,
    };
  }

  async ingest(
    dto: CaptureClientErrorsDto,
    request: Pick<Request, 'headers'>,
  ): Promise<ClientErrorsResponseDto> {
    const actor = await this.optionalActor(request);
    const now = new Date();
    const rows = dto.errors
      .map((item) => this.toRow(item, actor, now))
      .filter((row): row is ClientErrorRow => row !== null);
    await this.repo.insertMany(rows);
    const rejected = dto.errors.length - rows.length;
    this.logger.info(
      { operation: 'telemetry.client-errors.ingest', inserted: rows.length, rejected, identified: actor !== null },
      'Client errors ingested',
    );
    return { inserted: rows.length, rejected };
  }
}
