import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { lastValueFrom, from, Observable } from 'rxjs';
import type { Request } from 'express';
import { runWithTenant } from './tenant-context';
import { findTenantScopeViolation } from './tenant-scope';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

/** Rol comodín que puede operar sobre cualquier tenant. */
const WILDCARD_ROLE = 'SUPERADMIN';

/**
 * Establece y **hace cumplir** el contexto de tenant de cada petición.
 *
 * Reglas, en orden:
 *  1. Las rutas `@Public()` y los transportes no-HTTP pasan sin contexto: no hay
 *     actor del que derivar un tenant.
 *  2. El tenant sale de `X-Tenant-Id` o, si la cabecera falta, de la membresía
 *     única del actor. Con varias membresías y sin cabecera se rechaza (403):
 *     adivinar cuál de ellas quiso usar sería exactamente el tipo de suposición
 *     que este interceptor existe para evitar.
 *  3. El tenant resuelto debe pertenecer al actor, salvo que sea `SUPERADMIN`.
 *  4. El cuerpo no puede declarar un tenant propietario distinto del resuelto
 *     (ver `tenant-scope.ts`). Este es el punto que cierra el agujero real: sin
 *     él, `dto.tenantId` viaja del cliente a la fila sin que nadie lo contraste.
 *
 * Las cuatro reglas se aplican SIEMPRE. `RLS_ENFORCE` no las gobierna: es una
 * capa adicional —fijar `app.current_tenant_id` para las políticas RLS de la
 * base— y una autorización que depende de una bandera que nadie define no es
 * una autorización. Antes de esto, `RLS_ENFORCE` sin definir dejaba el
 * aislamiento entero apagado.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  /**
   * Aislamiento a nivel de base: envuelve el handler en una transacción y fija
   * `app.current_tenant_id` para que las políticas RLS acoten cada consulta.
   * Requiere que la app se conecte con un rol sin BYPASSRLS (`DB_APP_USER`).
   */
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reflector - Lector de metadatos de ruta, para detectar `@Public()`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Resuelve, valida y propaga el tenant del request.
   *
   * @param context - Contexto de ejecución de Nest.
   * @param next - Siguiente eslabón de la cadena.
   * @returns El flujo del handler, ejecutado dentro del contexto de tenant.
   * @throws ForbiddenException si el tenant no se puede resolver sin ambigüedad,
   *         no pertenece al actor, o el cuerpo declara uno distinto.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        /** Sujeto autenticado que inyecta `JwtAuthGuard`. */
        user?: AuthenticatedUser;
      }
    >();

    const user = request.user;
    if (!user) {
      // Ruta no pública sin sujeto: `JwtAuthGuard` ya la habrá rechazado. No se
      // inventa un contexto de tenant para una identidad que no existe.
      return next.handle();
    }

    const tenantId = this.resolveTenantId(request, user);
    if (tenantId === undefined) {
      // Actor comodín sin tenant declarado: opera en modo sistema, entre tenants.
      return next.handle();
    }
    this.assertBodyStaysInTenant(request.body, tenantId, user);

    if (!this.enforceRls) {
      return from(runWithTenant(tenantId, () => lastValueFrom(next.handle())));
    }

    return from(
      runWithTenant(tenantId, () =>
        this.em.transactional(async () => {
          await this.em.execute(
            "select set_config('app.current_tenant_id', ?, true)",
            [tenantId],
          );
          return lastValueFrom(next.handle());
        }),
      ),
    );
  }

  /**
   * Determina el tenant del request y verifica que el actor pertenezca a él.
   *
   * @returns el tenant resuelto, o `undefined` cuando el actor es `SUPERADMIN` y
   *          no declara ninguno: ese es el modo sistema (workers, operaciones
   *          administrativas entre tenants), que no debe quedar acotado a uno.
   * @throws ForbiddenException si un actor normal no puede resolver un tenant sin
   *         ambigüedad, o si declara uno del que no es miembro.
   */
  private resolveTenantId(
    request: Request,
    user: AuthenticatedUser,
  ): string | undefined {
    const header = request.headers['x-tenant-id'];
    const declared = Array.isArray(header) ? header[0] : header;
    const memberships = user.tenantIds ?? [];
    const isWildcard = user.roles?.includes(WILDCARD_ROLE) ?? false;

    if (declared) {
      if (!isWildcard && !memberships.includes(declared)) {
        throw new ForbiddenException(
          'El actor no pertenece al tenant indicado en X-Tenant-Id',
        );
      }
      return declared;
    }

    if (memberships.length === 1) {
      return memberships[0];
    }

    // `SUPERADMIN` sin cabecera opera entre tenants: acotarlo a uno rompería los
    // flujos de sistema. Un actor normal, en cambio, tiene que poder resolver su
    // tenant sin ambigüedad, o el `tenantId` del cuerpo volvería a ser su elección.
    if (isWildcard) {
      return undefined;
    }

    throw new ForbiddenException(
      memberships.length === 0
        ? 'El actor no pertenece a ningún tenant: indique X-Tenant-Id.'
        : 'El actor pertenece a varios tenants: indique cuál en X-Tenant-Id.',
    );
  }

  /**
   * Rechaza el request si el cuerpo declara un tenant propietario distinto del
   * resuelto. `SUPERADMIN` queda exento: opera a través de tenants por diseño.
   *
   * @throws ForbiddenException con el campo y el valor en conflicto.
   */
  private assertBodyStaysInTenant(
    body: unknown,
    tenantId: string,
    user: AuthenticatedUser,
  ): void {
    if (user.roles?.includes(WILDCARD_ROLE)) {
      return;
    }

    const violation = findTenantScopeViolation(body, tenantId);
    if (violation) {
      throw new ForbiddenException(
        `El cuerpo declara ${violation.field}=${violation.declared}, ajeno al ` +
          `tenant del actor (${tenantId}).`,
      );
    }
  }
}
