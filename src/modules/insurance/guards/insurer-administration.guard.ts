import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../../common/auth/authenticated-user.interface';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { CatalogRepository } from '../repositories';

const INSURER_ADMINISTRATION_ROLES_KEY = 'insurerAdministrationRoles';

/**
 * Roles de plataforma: pasan sin mirar la membresía, igual que en
 * `TenantAdministrationService.isPlatform()`. `SUPERADMIN` se repite aunque
 * `RolesGuard` ya lo trate como comodín: este guard no depende de aquél.
 */
const PLATFORM_ROLES: readonly string[] = ['SECURITY_ADMIN', 'SUPERADMIN'];

/** Mismo texto que usa `InsuranceCampaignsService.tenantOf()` para el mismo caso. */
const NO_TENANT_MESSAGE =
  'Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización';

const NOT_ADMINISTRATOR_MESSAGE =
  'Se requiere ser OWNER o ADMIN de la aseguradora activa';

/**
 * Declara en el controlador que la ruta es una **mutación de la aseguradora**
 * y monta {@link InsurerAdministrationGuard}.
 *
 * Reemplaza, como barrera de borde, al `@Roles()` vacío que dejaba entrar a
 * cualquier sesión válida hasta el servicio. No se reemplazó por
 * `@Roles('INSURANCE_OPERATOR', …)` porque la autoridad de una aseguradora no
 * es un rol del JWT: el dueño que la registró tiene sólo el rol global `USER`
 * (`iam-organization-self-registration.service.ts`) y manda por su membresía
 * `OWNER`/`ADMIN` del tenant, que es lo que exigen los servicios
 * (`LinkedClaimAccessService.assertInsurer`,
 * `InsuranceCampaignsService.administrableCarrier`). Un `@Roles` con cualquier
 * rol de negocio lo habría dejado afuera; uno con `USER` no filtra a nadie.
 *
 * @param legacyRoles - Roles globales que además pasan, cuando el servicio los
 *   acepta por su cuenta (p. ej. `BILLING`/`FINANCE` en los reclamos sin pedido
 *   vinculado, ver `assertLegacyClaimRoles`).
 * @returns El decorador compuesto.
 */
export const InsurerAdministration = (...legacyRoles: string[]) =>
  applyDecorators(
    SetMetadata(INSURER_ADMINISTRATION_ROLES_KEY, legacyRoles),
    UseGuards(InsurerAdministrationGuard),
  );

/**
 * Exige, antes de llegar al servicio, que quien muta algo de la aseguradora
 * pueda hacerlo. Pasa, en este orden:
 *
 * 1. rol de plataforma (`SECURITY_ADMIN`, `SUPERADMIN`);
 * 2. uno de los roles heredados que declara {@link InsurerAdministration};
 * 3. `OWNER`/`ADMIN` activo del tenant resuelto **y** ese tenant es una
 *    aseguradora (`insurance_carriers.tenant_id`).
 *
 * Si no, 403. No reemplaza a la autorización del servicio —que además cruza el
 * recurso concreto con la aseguradora (el reclamo, la campaña, el lote)—: es la
 * misma regla aplicada antes, para que una sesión de paciente o de clínica no
 * llegue a abrir la transacción de una escritura que no le corresponde.
 *
 * ## Por qué consulta la base y cómo convive con RLS
 *
 * La membresía no viaja en el token (sólo la lista de tenants), así que se lee
 * de `directory.tenant_memberships`, en un fork propio, como hace
 * `PharmaLabScopeGuard`. Los guards corren **antes** que
 * `TenantContextInterceptor`, que es quien fija `app.current_tenant_id`; con
 * `RLS_ENFORCE=true` las políticas fallan cerradas sin ese GUC y la consulta
 * no vería la membresía de nadie. Por eso, en ese modo, la lectura se hace en
 * una transacción que fija el mismo GUC que fijará el interceptor —el tenant
 * que `TenantScopeGuard` ya resolvió y validó contra las membresías del token—.
 */
@Injectable()
export class InsurerAdministrationGuard implements CanActivate {
  /**
   * @param reflector - Lector de metadata de la ruta.
   * @param em - Contexto de persistencia; se usa un fork por petición.
   * @param tenantAdministration - Regla OWNER/ADMIN que comparten los servicios.
   * @param catalog - Resuelve la aseguradora de un tenant.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly em: EntityManager,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly catalog: CatalogRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    // Ruta no pública sin sujeto: `JwtAuthGuard` ya la habrá rechazado. Si
    // llegara acá, no hay a quién autorizar.
    if (!actor) throw new ForbiddenException(NOT_ADMINISTRATOR_MESSAGE);

    const legacyRoles =
      this.reflector.getAllAndOverride<string[]>(
        INSURER_ADMINISTRATION_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];
    const roles = actor.roles ?? [];
    if ([...PLATFORM_ROLES, ...legacyRoles].some((r) => roles.includes(r))) {
      return true;
    }

    const tenantId = request.resolvedTenantId;
    if (!tenantId) throw new ForbiddenException(NO_TENANT_MESSAGE);

    if (!(await this.administersInsurer(tenantId, actor))) {
      throw new ForbiddenException(NOT_ADMINISTRATOR_MESSAGE);
    }
    return true;
  }

  /** `OWNER`/`ADMIN` activo de `tenantId`, y `tenantId` es una aseguradora. */
  private async administersInsurer(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const em = this.em.fork();
    const check = async (tx: EntityManager): Promise<boolean> => {
      if (!(await this.tenantAdministration.canAdminister(tx, tenantId, actor)))
        return false;
      return (await this.catalog.findCarrierByTenantId(tx, tenantId)) !== null;
    };

    if (process.env.RLS_ENFORCE !== 'true') return check(em);

    return em.transactional(async (tx) => {
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenantId,
      ]);
      return check(tx);
    });
  }
}
