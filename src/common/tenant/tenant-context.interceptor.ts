import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { lastValueFrom, from, Observable } from 'rxjs';
import type { Request } from 'express';
import { runWithTenant } from './tenant-context';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

/**
 * Establece el contexto de tenant de la petición y, cuando el aislamiento está
 * activado (`RLS_ENFORCE=true`), fija `app.current_tenant_id` en la conexión
 * para que las políticas RLS acoten cada consulta al tenant del actor.
 *
 * Reglas:
 *  - Si el request trae `X-Tenant-Id`, debe pertenecer a los tenants del sujeto
 *    (o el sujeto ser `SUPERADMIN`); de lo contrario se rechaza (403).
 *  - Sin cabecera de tenant no se fija contexto: el request opera en modo
 *    sistema (la política RLS es permisiva cuando el GUC no está fijado), lo que
 *    preserva el comportamiento de los flujos que aún no propagan tenant.
 *  - Con `RLS_ENFORCE=true` el handler se ejecuta dentro de una transacción para
 *    que `SET LOCAL` acote todas sus consultas a la misma conexión.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly enforce = process.env.RLS_ENFORCE === 'true';

  constructor(private readonly em: EntityManager) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const headerTenant = request.headers['x-tenant-id'];
    const tenantId = Array.isArray(headerTenant) ? headerTenant[0] : headerTenant;

    if (!tenantId) {
      return next.handle();
    }

    // Verificación de pertenencia: el actor debe ser miembro del tenant que
    // declara, salvo que sea SUPERADMIN (comodín administrativo).
    const user = request.user;
    const isSuperadmin = user?.roles?.includes('SUPERADMIN') ?? false;
    const isMember = user?.tenantIds?.includes(tenantId) ?? false;
    if (!isSuperadmin && !isMember) {
      throw new ForbiddenException(
        'El actor no pertenece al tenant indicado en X-Tenant-Id',
      );
    }

    if (!this.enforce) {
      // Contexto disponible para servicios, sin forzar RLS todavía.
      return from(runWithTenant(tenantId, () => lastValueFrom(next.handle())));
    }

    // Aislamiento activo: transacción por request + SET LOCAL del tenant.
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
}
