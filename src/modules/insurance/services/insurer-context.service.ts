import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import { CatalogRepository } from '../repositories';

/** Roles que operan una aseguradora, siempre vigentes **en su tenant**. */
const INSURER_ROLES = ['INSURANCE_OPERATOR', 'SECURITY_ADMIN', 'SUPERADMIN'];

/** La aseguradora que opera la sesión y el tenant del que salió. */
export interface InsurerContext {
  /** `insurance.insurance_carriers.id` del tenant activo. */
  readonly carrierId: string;
  /** El tenant activo. */
  readonly tenantId: string;
}

/**
 * Quién es la aseguradora en una petición de su consola, y si la sesión puede
 * operarla.
 *
 * Siempre sale del **tenant activo**, nunca de un parámetro del cliente: si el
 * cliente mandara un id de aseguradora sería un IDOR esperando pasar. La
 * autoridad es la membresía OWNER/ADMIN del tenant o un rol de aseguradora
 * **vigente en ese tenant**: un rol concedido en otra organización no vale acá
 * (`roleAuthorizesInTenant`).
 *
 * Nació de `InsurerReceivedClaimsService` cuando el directorio de pacientes
 * necesitó exactamente la misma barrera; `InsuranceAnalyticsService` tiene
 * todavía su copia idéntica.
 */
@Injectable()
export class InsurerContextService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogRepo - Aseguradora de un tenant.
   * @param tenantAdministration - Si una sesión administra un tenant.
   */
  constructor(
    private readonly catalogRepo: CatalogRepository,
    private readonly tenantAdministration: TenantAdministrationService,
  ) {}

  /**
   * La aseguradora del tenant activo, si la sesión puede operarla.
   *
   * @param em - Contexto de persistencia.
   * @param actor - La sesión.
   * @param accessDenied - El mensaje del 403, el mismo para las dos causas: la
   *   pantalla que pregunta decide cómo se llama lo que no se puede ver.
   * @returns Su id y el del tenant activo.
   * @throws ForbiddenException si el tenant no es una aseguradora o la sesión
   *   no es OWNER/ADMIN de ella ni tiene un rol de aseguradora en ese tenant.
   */
  async resolve(
    em: EntityManager,
    actor: AuthenticatedUser,
    accessDenied: string,
  ): Promise<InsurerContext> {
    const tenantId = requireTenantId();
    const carrier = await this.catalogRepo.findCarrierByTenantId(em, tenantId);
    if (!carrier) throw new ForbiddenException(accessDenied);

    const canAdminister = await this.tenantAdministration.canAdminister(
      em,
      tenantId,
      actor,
    );
    const hasRole = INSURER_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (!canAdminister && !hasRole) throw new ForbiddenException(accessDenied);
    return { carrierId: carrier.id, tenantId };
  }
}
