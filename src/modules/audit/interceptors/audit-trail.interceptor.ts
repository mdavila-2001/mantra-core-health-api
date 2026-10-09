import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { from, lastValueFrom, Observable } from 'rxjs';
import {
  ACCESS_LOGGED_KEY,
  AUDIT_TRAIL_KEY,
  SKIP_AUDIT_TRAIL_KEY,
  deriveRouteAuditIdentity,
  isUuid,
  joinRouteTemplate,
  readUuidParam,
  runWithAuditRequestContext,
  toInetAddress,
  type AccessLoggedOptions,
  type AuditRequestContext,
  type AuditTrailOptions,
  type RouteAuditIdentity,
} from '../../../common/audit-trail';
import { CONCEPTS } from '../../../common/constants/concepts';
import { getCurrentTenantId } from '../../../common/tenant/tenant-context';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../../common/auth/authenticated-user.interface';
import { AUD } from '../audit.concepts';
import { AuditLogRepository, DataAccessLogRepository } from '../repositories';

/** Verbos que mutan estado: toda ruta con uno de ellos deja sello. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Propósito por defecto de una lectura de PHI: la atención del paciente. */
const DEFAULT_ACCESS_PURPOSE = 'TREATMENT';
/** Propósito del titular leyendo lo suyo (mismo valor que `ChartMeReadService`). */
const SELF_ACCESS_PURPOSE = 'PATIENT_ACCESS';

/** Lo que la petición aporta a la bitácora además del actor. */
type AuditableRequest = AuthenticatedRequest & {
  readonly ip?: string;
  readonly method: string;
  readonly params: Record<string, unknown>;
};

/**
 * Bitácora TRANSVERSAL (informe C §8.4, opción B con atomicidad oportunista).
 *
 * Toda ruta HTTP autenticada que muta (`POST/PUT/PATCH/DELETE`) deja un eslabón
 * en la cadena WORM `audit.audit_log`:
 *
 *  - **Éxito.** Sella `success: true` al terminar el handler. Si hay una
 *    transacción de la petición abierta (`RLS_ENFORCE=true`: la abre
 *    `TenantContextInterceptor`, registrado ANTES que éste), el sello se une a
 *    ella como savepoint y se confirma junto con la mutación. Si no la hay, va en
 *    una transacción propia apenas después del commit del caso de uso: no es
 *    atómico, y por eso los servicios de PHI, dinero, permisos y consentimiento
 *    siguen sellando dentro de su transacción (§1.1). Cuando un servicio ya selló,
 *    el interceptor no repite (`markAuditSealed` en `AuditLogRepository.append`).
 *  - **Fallo.** Sella `success: false` en una transacción `REQUIRES_NEW` —el
 *    rollback del caso de uso no se lleva la evidencia— y re-lanza el error
 *    ORIGINAL. Si sellar falla, se registra y gana el error original: un rechazo
 *    nunca se convierte en otra cosa.
 *
 * Las lecturas marcadas con `@AccessLogged()` escriben `audit.data_access_log`
 * ANTES de ejecutar el handler; si no se puede escribir, no se lee.
 *
 * Nunca hace UPDATE ni DELETE sobre `audit_log` / `data_access_log`: sólo
 * INSERT, que es lo único que permiten `trg_forbid_mutation` y
 * `trg_forbid_update` (`SQL/10_audit/05_constraints.sql`).
 *
 * Sin actor no hay sello: `audit_log.user_id` es `NOT NULL`. Las rutas
 * `@Public()` que mutan deben declarar su rastro alternativo en la allowlist
 * del control de CI (`tools/alovida/audit-trail-coverage.mjs`).
 */
@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditTrailInterceptor.name);

  /** Con RLS, una transacción propia necesita fijar el tenant como lo hace la de la petición. */
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  /**
   * @param em - EntityManager raíz; cada sello trabaja sobre un fork limpio.
   * @param reflector - Lector de los decoradores de bitácora.
   * @param auditLogRepo - Cadena WORM `audit.audit_log`.
   * @param dataAccessLogRepo - Registro de lecturas `audit.data_access_log`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reflector: Reflector,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly dataAccessLogRepo: DataAccessLogRepository,
  ) {}

  /**
   * Abre el contexto de bitácora de la petición y, según el verbo y los
   * decoradores, sella la mutación o registra la lectura.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<AuditableRequest>();
    const user = request.user;
    if (!user) return next.handle();

    const auditContext: AuditRequestContext = {
      ip: toInetAddress(request.ip),
      sessionId: user.sessionId,
      actorUserId: user.id,
      sealedSuccess: false,
      sealedFailure: false,
    };
    const run = <T>(fn: () => Promise<T>): Observable<T> =>
      from(runWithAuditRequestContext(auditContext, fn));

    if (MUTATING_METHODS.has(request.method.toUpperCase())) {
      if (this.isSkipped(context)) return this.withContext(auditContext, next);
      return run(() =>
        this.sealAround(context, request, user, next, auditContext),
      );
    }

    const accessLogged = this.reflector.getAllAndOverride<
      AccessLoggedOptions | undefined
    >(ACCESS_LOGGED_KEY, [context.getHandler(), context.getClass()]);
    if (!accessLogged) return this.withContext(auditContext, next);

    return run(async () => {
      await this.recordAccess(accessLogged, request, user);
      return lastValueFrom(next.handle());
    });
  }

  /**
   * Deja pasar el flujo del handler tal cual (sin colapsarlo a un único valor)
   * pero dentro del contexto de bitácora, para que los sellos que haga el propio
   * servicio lleven `ip` y dispositivo.
   */
  private withContext(
    auditContext: AuditRequestContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return new Observable((subscriber) =>
      runWithAuditRequestContext(auditContext, () =>
        next.handle().subscribe(subscriber),
      ),
    );
  }

  private isSkipped(context: ExecutionContext): boolean {
    const reason = this.reflector.getAllAndOverride<string | undefined>(
      SKIP_AUDIT_TRAIL_KEY,
      [context.getHandler(), context.getClass()],
    );
    return typeof reason === 'string' && reason.trim().length > 0;
  }

  /** Ejecuta el handler y sella su resultado, éxito o fallo. */
  private async sealAround(
    context: ExecutionContext,
    request: AuditableRequest,
    user: AuthenticatedUser,
    next: CallHandler<unknown>,
    auditContext: AuditRequestContext,
  ): Promise<unknown> {
    let result: unknown;
    try {
      result = await lastValueFrom(next.handle());
    } catch (error) {
      if (!auditContext.sealedFailure) {
        await this.sealFailure(
          this.identityOf(context, request, undefined),
          request,
          user,
        );
      }
      throw error;
    }
    if (!auditContext.sealedSuccess) {
      await this.sealSuccess(
        this.identityOf(context, request, result),
        request,
        user,
      );
    }
    return result;
  }

  private identityOf(
    context: ExecutionContext,
    request: AuditableRequest,
    result: unknown,
  ): RouteAuditIdentity {
    return deriveRouteAuditIdentity({
      method: request.method,
      routeTemplate: this.routeTemplate(context),
      params: request.params ?? {},
      result,
      options: this.reflector.getAllAndOverride<AuditTrailOptions | undefined>(
        AUDIT_TRAIL_KEY,
        [context.getHandler(), context.getClass()],
      ),
    });
  }

  /** Plantilla de la ruta tal como la declaran `@Controller()` y el verbo. */
  private routeTemplate(context: ExecutionContext): string {
    const first = (value: unknown): string =>
      Array.isArray(value)
        ? first(value[0])
        : typeof value === 'string'
          ? value
          : '';
    return joinRouteTemplate(
      first(Reflect.getMetadata(PATH_METADATA, context.getClass())),
      first(Reflect.getMetadata(PATH_METADATA, context.getHandler())),
    );
  }

  /** Tenant del sello: el del contexto de la petición (no el custodio, §8.3). */
  private tenantOf(request: AuditableRequest): string | undefined {
    const tenantId = getCurrentTenantId() ?? request.resolvedTenantId;
    return isUuid(tenantId) ? tenantId : undefined;
  }

  /**
   * Sello de éxito. Se une a la transacción de la petición si existe; si no,
   * abre una propia (después del commit del caso de uso). Un fallo al sellar se
   * registra y NO convierte en error una mutación que ya se confirmó.
   */
  private async sealSuccess(
    identity: RouteAuditIdentity,
    request: AuditableRequest,
    user: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = this.tenantOf(request);
    const fork = this.em.fork({ clear: true, keepTransactionContext: true });
    const joinsRequestTransaction = fork.isInTransaction();
    try {
      await fork.transactional(async (tx) => {
        if (!joinsRequestTransaction) await this.applyRlsContext(tx, tenantId);
        await this.append(tx, identity, user, tenantId, true);
      });
    } catch (error) {
      this.logSealFailure(identity, error);
    }
  }

  /**
   * Sello de fallo, en una transacción NUEVA: el rollback del caso de uso no
   * puede llevárselo (forma de `insurance-campaigns.service.ts`).
   */
  private async sealFailure(
    identity: RouteAuditIdentity,
    request: AuditableRequest,
    user: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = this.tenantOf(request);
    try {
      await this.em.fork({ clear: true }).transactional(
        async (tx) => {
          await this.applyRlsContext(tx, tenantId);
          await this.append(tx, identity, user, tenantId, false);
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
    } catch (error) {
      this.logSealFailure(identity, error);
    }
  }

  private async append(
    tx: EntityManager,
    identity: RouteAuditIdentity,
    user: AuthenticatedUser,
    tenantId: string | undefined,
    success: boolean,
  ): Promise<void> {
    await this.auditLogRepo.append(tx, {
      userId: user.id,
      action: identity.action,
      entity: identity.entity,
      entityId: identity.entityId,
      outcomeConceptId: success
        ? CONCEPTS.OUTCOME_SUCCESS
        : CONCEPTS.OUTCOME_FAILURE,
      tenantId,
      recordedByUserId: user.id,
    });
  }

  /**
   * Registra la lectura de PHI antes de servirla. Un paciente tomado de la ruta
   * sólo se escribe si existe: `patient_profile_id` es FK y un id inexistente
   * convertiría un 404 legítimo en un 500. El error de escritura se propaga: sin
   * evidencia del acceso, no hay lectura.
   */
  private async recordAccess(
    options: AccessLoggedOptions,
    request: AuditableRequest,
    user: AuthenticatedUser,
  ): Promise<void> {
    const params = request.params ?? {};
    const tenantId = this.tenantOf(request);
    const fork = this.em.fork({ clear: true, keepTransactionContext: true });
    const joinsRequestTransaction = fork.isInTransaction();
    await fork.transactional(async (tx) => {
      if (!joinsRequestTransaction) await this.applyRlsContext(tx, tenantId);
      this.dataAccessLogRepo.record(tx, {
        userId: user.id,
        actionConceptId: AUD.ACTION_READ,
        patientProfileId: await this.accessedPatient(tx, options, params, user),
        tenantId,
        purpose:
          options.purpose ??
          (options.patient === 'actor'
            ? SELF_ACCESS_PURPOSE
            : DEFAULT_ACCESS_PURPOSE),
        resourceType: options.resourceType,
        resourceId: options.resourceId
          ? readUuidParam(options.resourceId, params)
          : undefined,
        recordedByUserId: user.id,
      });
    });
  }

  private async accessedPatient(
    tx: EntityManager,
    options: AccessLoggedOptions,
    params: Readonly<Record<string, unknown>>,
    user: AuthenticatedUser,
  ): Promise<string | undefined> {
    if (!options.patient) return undefined;
    if (options.patient === 'actor') {
      return isUuid(user.patientProfileId) ? user.patientProfileId : undefined;
    }
    const candidate = readUuidParam(options.patient, params);
    if (!candidate) return undefined;
    const rows = await tx.execute<{ id: string }[]>(
      'SELECT id FROM profiles.patient_profiles WHERE id = ? LIMIT 1',
      [candidate],
    );
    return rows.length > 0 ? candidate : undefined;
  }

  /**
   * Fija el contexto RLS en una transacción que abrió la bitácora (no en la de
   * la petición). Con tenant, el del actor; sin él, la elevación SYSTEM local a
   * esta transacción, que sólo contiene el INSERT del sello.
   */
  private async applyRlsContext(
    tx: EntityManager,
    tenantId: string | undefined,
  ): Promise<void> {
    if (!this.enforceRls) return;
    if (tenantId) {
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenantId,
      ]);
      return;
    }
    await tx.execute("select set_config('app.system_context', 'true', true)");
  }

  private logSealFailure(identity: RouteAuditIdentity, error: unknown): void {
    this.logger.error(
      `AUDIT_SEAL_FAILED ${identity.action} entity=${identity.entity}` +
        ` id=${identity.entityId ?? '-'}: ${
          error instanceof Error ? error.message : String(error)
        }`,
    );
  }
}
