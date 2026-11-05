import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import {
  forbiddenWithReason,
  serviceUnavailableWithReason,
} from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';
import { IS_PUBLIC_KEY } from './public.decorator';
import { roleAuthorizesInTenant } from './roles.guard';
import {
  PERMISSION_DECISION_POINT,
  REQUIRED_PERMISSION_KEY,
  pdpActionForCode,
  resolvePermissionMode,
  type PermissionDecisionPoint,
  type PermissionQuery,
  type PermissionVerdict,
  type RequiredPermissionMetadata,
  type ResolvedPermissionMode,
} from './permission-decision.port';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-user.interface';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resultado de un chequeo, tal como queda en el log. */
type Outcome =
  | 'AGREE'
  | 'SHADOW_WOULD_DENY'
  | 'SHADOW_NOT_EVALUABLE'
  | 'SHADOW_PDP_ERROR'
  | 'ENFORCE_PERMIT'
  | 'ENFORCE_DENY'
  | 'ENFORCE_NOT_EVALUABLE'
  | 'ENFORCE_PDP_UNAVAILABLE';

/** Pregunta lista para el PDP, o por qué no se pudo armar. */
type Prepared =
  | {
      readonly ok: true;
      readonly query: PermissionQuery;
      readonly actor: AuthenticatedUser;
    }
  | { readonly ok: false; readonly cause: 'NO_ACTOR' | 'TENANT_UNRESOLVED' };

/**
 * Guarda de `@RequirePermission('modulo.recurso.accion')`.
 *
 * La monta el propio decorador con `@UseGuards`, así que sólo corre en las
 * rutas que lo declaran y siempre **después** de los guards globales: si
 * `@Roles` ya negó, no llega acá. Por eso:
 *
 * | Modo | `@Roles` niega | `@Roles` permite y PDP `PERMIT` | `@Roles` permite y PDP `DENY` | PDP caído |
 * |---|---|---|---|---|
 * | `off` | 403 (RolesGuard) | pasa | pasa | pasa |
 * | `shadow` | 403 (RolesGuard) | pasa | pasa + log `SHADOW_WOULD_DENY` | pasa + log |
 * | `enforce` | 403 (RolesGuard) | pasa | 403 `PERMISSION_INSUFFICIENT` | 503 `AUTHZ_DECISION_UNAVAILABLE` |
 *
 * - `SUPERADMIN` de plataforma pasa sin consultar (misma regla que `RolesGuard`
 *   y que el adaptador de `bulk_import`); uno acotado a un tenant, no.
 * - Tenant: el que resolvió `TenantScopeGuard`; si no hay, el único tenant del
 *   actor. Sin tenant no se puede preguntar: `enforce` niega (fail-closed),
 *   `shadow` lo registra.
 * - El PDP se resuelve por el token {@link PERMISSION_DECISION_POINT} (lo provee
 *   `AuthzModule`); si el módulo del controlador no lo ve, se busca en todo el
 *   contenedor. Ausente ⇒ `enforce` responde 503.
 * - En `shadow` la consulta se lanza sin esperarla: no añade latencia ni puede
 *   tumbar la petición.
 * - El log nunca lleva la URL real (puede llevar ids o query con datos), sólo
 *   la plantilla de la ruta.
 */
@Injectable()
export class RequirePermissionGuard implements CanActivate {
  private readonly warnedInvalidModes = new Set<string>();
  private resolvedPdp: PermissionDecisionPoint | undefined;

  constructor(
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger,
    @Optional() private readonly moduleRef?: ModuleRef,
    @Optional()
    @Inject(PERMISSION_DECISION_POINT)
    injectedPdp?: PermissionDecisionPoint,
  ) {
    this.logger.setContext(RequirePermissionGuard.name);
    this.resolvedPdp = injectedPdp ?? undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      RequiredPermissionMetadata | undefined
    >(REQUIRED_PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!required) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const mode = resolvePermissionMode(required.code);
    this.warnInvalidMode(mode);
    if (mode.mode === 'off') return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (roleAuthorizesInTenant(request.user, 'SUPERADMIN', undefined)) {
      return true;
    }

    const prepared = this.prepare(request, required);
    const logBase = this.logBase(request, required, mode);

    if (mode.mode === 'shadow') {
      void this.shadow(prepared, logBase);
      return true;
    }
    return this.enforce(prepared, logBase, required.code);
  }

  private async enforce(
    prepared: Prepared,
    logBase: Record<string, unknown>,
    code: string,
  ): Promise<boolean> {
    if (!prepared.ok) {
      this.logger.warn(
        {
          ...logBase,
          outcome: 'ENFORCE_NOT_EVALUABLE' satisfies Outcome,
          cause: prepared.cause,
        },
        'Permiso fino no evaluable: se deniega (fail-closed)',
      );
      throw forbiddenWithReason(
        'Permiso insuficiente para la operación',
        SystemErrorReason.PERMISSION_INSUFFICIENT,
        { permission: code, cause: prepared.cause },
      );
    }
    let verdict: PermissionVerdict;
    try {
      verdict = await this.decide(prepared);
    } catch (error) {
      this.logger.error(
        {
          ...logBase,
          outcome: 'ENFORCE_PDP_UNAVAILABLE' satisfies Outcome,
          error: error instanceof Error ? error.message : String(error),
        },
        'PDP no disponible: se deniega (fail-closed)',
      );
      throw serviceUnavailableWithReason(
        'No se pudo verificar el permiso de la operación',
        SystemErrorReason.AUTHZ_DECISION_UNAVAILABLE,
        { permission: code },
      );
    }
    if (verdict.decision !== 'PERMIT') {
      this.logger.warn(
        {
          ...logBase,
          outcome: 'ENFORCE_DENY' satisfies Outcome,
          pdpReason: verdict.reason,
        },
        'Permiso fino denegado por el PDP',
      );
      throw forbiddenWithReason(
        'Permiso insuficiente para la operación',
        SystemErrorReason.PERMISSION_INSUFFICIENT,
        { permission: code },
      );
    }
    this.logger.debug(
      { ...logBase, outcome: 'ENFORCE_PERMIT' satisfies Outcome },
      'Permiso fino concedido',
    );
    return true;
  }

  /** Nunca lanza: todo termina en el log. */
  private async shadow(
    prepared: Prepared,
    logBase: Record<string, unknown>,
  ): Promise<void> {
    if (!prepared.ok) {
      this.logger.warn(
        {
          ...logBase,
          outcome: 'SHADOW_NOT_EVALUABLE' satisfies Outcome,
          cause: prepared.cause,
        },
        'Permiso fino no evaluable (shadow): decide @Roles',
      );
      return;
    }
    try {
      const verdict = await this.decide(prepared);
      if (verdict.decision === 'PERMIT') {
        this.logger.debug(
          { ...logBase, outcome: 'AGREE' satisfies Outcome },
          'Permiso fino coincide con @Roles (shadow)',
        );
      } else {
        this.logger.warn(
          {
            ...logBase,
            outcome: 'SHADOW_WOULD_DENY' satisfies Outcome,
            pdpReason: verdict.reason,
          },
          'Discrepancia @Roles/PDP: en enforce esta petición se denegaría',
        );
      }
    } catch (error) {
      this.logger.warn(
        {
          ...logBase,
          outcome: 'SHADOW_PDP_ERROR' satisfies Outcome,
          error: error instanceof Error ? error.message : String(error),
        },
        'PDP no disponible (shadow): decide @Roles',
      );
    }
  }

  /** Lanza si el PDP no está registrado o falla. */
  private async decide(
    prepared: Extract<Prepared, { ok: true }>,
  ): Promise<PermissionVerdict> {
    const pdp = this.pdp();
    if (!pdp) throw new Error('PERMISSION_DECISION_POINT no registrado');
    return pdp.decide(prepared.query, prepared.actor);
  }

  /** Sólo se cachea si se encontró: una ausencia se vuelve a buscar. */
  private pdp(): PermissionDecisionPoint | undefined {
    if (this.resolvedPdp) return this.resolvedPdp;
    try {
      this.resolvedPdp =
        this.moduleRef?.get<PermissionDecisionPoint>(
          PERMISSION_DECISION_POINT,
          { strict: false },
        ) ?? undefined;
    } catch {
      this.resolvedPdp = undefined;
    }
    return this.resolvedPdp;
  }

  private prepare(
    request: AuthenticatedRequest,
    required: RequiredPermissionMetadata,
  ): Prepared {
    const actor = request.user;
    if (!actor) return { ok: false, cause: 'NO_ACTOR' };
    const tenantId =
      request.resolvedTenantId ??
      (actor.tenantIds?.length === 1 ? actor.tenantIds[0] : undefined);
    if (!tenantId) return { ok: false, cause: 'TENANT_UNRESOLVED' };
    const resourceId = this.resourceId(request, required.resourceIdParam);
    return {
      ok: true,
      actor,
      query: {
        userId: actor.id,
        tenantId,
        resource: required.code,
        action: required.pdpAction ?? pdpActionForCode(required.code),
        ...(resourceId ? { resourceId } : {}),
      },
    };
  }

  private resourceId(
    request: AuthenticatedRequest,
    param: string | undefined,
  ): string | undefined {
    if (!param) return undefined;
    const params = request.params as Record<string, unknown> | undefined;
    const raw = params?.[param];
    const value: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
    return typeof value === 'string' && UUID_PATTERN.test(value)
      ? value
      : undefined;
  }

  private logBase(
    request: AuthenticatedRequest,
    required: RequiredPermissionMetadata,
    mode: ResolvedPermissionMode,
  ): Record<string, unknown> {
    const route = (request as { route?: { path?: unknown } }).route?.path;
    return {
      operation: 'authz.permission.check',
      permission: required.code,
      mode: mode.mode,
      modeSource: mode.source,
      userId: request.user?.id,
      tenantId: request.resolvedTenantId,
      method: request.method,
      route: typeof route === 'string' ? route : undefined,
    };
  }

  private warnInvalidMode(mode: ResolvedPermissionMode): void {
    if (!mode.invalid || this.warnedInvalidModes.has(mode.invalid)) return;
    this.warnedInvalidModes.add(mode.invalid);
    this.logger.warn(
      {
        operation: 'authz.permission.mode',
        invalid: mode.invalid,
        applied: mode.mode,
      },
      'Valor de AUTHZ_PERMISSION_MODE no reconocido: se ignora',
    );
  }
}
