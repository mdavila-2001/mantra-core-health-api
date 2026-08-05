import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IpAccessRules, ServicePrincipals } from '../entities';

/**
 * Acceso a datos de identidades no humanas y reglas de acceso por IP del esquema
 * `authz`: `service_principals` e `ip_access_rules`. Stateless.
 *
 * Nota: `service_principals` no expone columna de tenant en el modelo actual, por
 * lo que el listado se ofrece como `listAll`; `ip_access_rules` sí está acotado
 * por `tenant_id`.
 */
@Injectable()
export class AuthzServicePrincipalsRepository {
  /** Service principal por id, si existe. */
  findServicePrincipalById(
    em: EntityManager,
    id: string,
  ): Promise<ServicePrincipals | null> {
    return em.findOne(ServicePrincipals, { id });
  }

  /** Todos los service principals registrados. */
  listServicePrincipals(em: EntityManager): Promise<ServicePrincipals[]> {
    return em.find(ServicePrincipals, {});
  }

  /** Regla de acceso por IP por id, acotada al tenant. */
  findIpAccessRuleById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<IpAccessRules | null> {
    return em.findOne(IpAccessRules, { id, tenantId });
  }

  /** Reglas de acceso por IP definidas para el tenant. */
  listIpAccessRulesByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<IpAccessRules[]> {
    return em.find(IpAccessRules, { tenantId });
  }
}
