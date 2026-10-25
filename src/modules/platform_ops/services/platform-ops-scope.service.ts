import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import {
  Runbooks,
  ServiceComponents,
  ServiceLevelIndicators,
  ServiceLevelObjectives,
} from '../entities';
import { PlatformOpsErrorReason } from '../platform_ops.error-reasons';

/** Mensaje y `reason` únicos con los que el módulo dice "no existe" fuera de alcance. */
const OUT_OF_SCOPE = {
  message: 'Recurso no disponible',
  reason: PlatformOpsErrorReason.PLATFORM_OPS_RESOURCE_OUT_OF_SCOPE,
} as const;

/**
 * Alcance de tenant de las operaciones de plataforma.
 *
 * Las rutas reciben el UUID de un cambio, un despliegue, un incidente, un SLO,
 * un runbook…; el interceptor de tenant sólo contrasta lo que el cuerpo declara
 * literalmente, no el propietario de ese UUID. Aquí el tenant sale siempre del
 * contexto verificado del request —nunca del cuerpo— y cada agregado se
 * resuelve **dentro** de él: los que llevan `tenant_id` se buscan por
 * `id + tenant_id`, y los que no (SLO, política de error budget, plan de
 * capacidad, revisión de preparación…) heredan el tenant de su componente.
 *
 * Un recurso de otro tenant responde exactamente igual que uno inexistente
 * (`404`, mismo mensaje y `reason`, sin `details`). Un recurso sin tenant
 * (`tenant_id` nulo) no pertenece a ninguna organización y tampoco es alcanzable
 * desde aquí: un barrido de plataforma necesita un tenant explícito en el
 * contexto (`X-Tenant-Id`).
 */
@Injectable()
export class PlatformOpsScope {
  /**
   * Tenant del contexto verificado del request.
   *
   * @throws PreconditionFailedException si el request no fijó tenant.
   */
  activeTenantId(): string {
    return requireTenantId();
  }

  /**
   * Tenant propietario de un alta: el del contexto. Un cuerpo que declara otro
   * se rechaza como recurso fuera de alcance.
   *
   * @param declared - `tenantId` que trae el DTO, si lo trae.
   * @returns El tenant activo.
   * @throws ResourceNotFoundException si el cuerpo contradice el contexto.
   */
  ownerTenantId(declared?: string): string {
    const tenantId = requireTenantId();
    if (declared !== undefined && declared !== tenantId) {
      throw this.outOfScope();
    }
    return tenantId;
  }

  /** Excepción uniforme de "recurso no disponible". */
  outOfScope(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      OUT_OF_SCOPE.message,
      undefined,
      OUT_OF_SCOPE.reason,
    );
  }

  /**
   * Exige que un recurso ya cargado pertenezca al tenant activo.
   *
   * @param resource - Recurso cargado, o `null` si no se encontró.
   * @param resourceTenantId - Tenant propietario del recurso.
   * @returns El mismo recurso, acotado al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  require<T>(
    resource: T | null | undefined,
    resourceTenantId: string | null | undefined,
  ): T {
    return assertResourceInTenant(
      resource,
      resourceTenantId,
      requireTenantId(),
      OUT_OF_SCOPE,
    );
  }

  /** Exige un recurso cuyo tenant es el de su componente. */
  async viaComponent<T>(
    tx: EntityManager,
    resource: T | null | undefined,
    componentId: string,
  ): Promise<T> {
    if (resource === null || resource === undefined) {
      requireTenantId();
      throw this.outOfScope();
    }
    const component = await tx.findOne(ServiceComponents, { id: componentId });
    return this.require(resource, component?.tenantId);
  }

  /** Exige un recurso cuyo tenant es el de su SLO (SLO → indicador → componente). */
  async viaSlo<T>(
    tx: EntityManager,
    resource: T | null | undefined,
    sloId: string,
  ): Promise<T> {
    if (resource === null || resource === undefined) {
      requireTenantId();
      throw this.outOfScope();
    }
    const slo = await tx.findOne(ServiceLevelObjectives, { id: sloId });
    const indicator = slo
      ? await tx.findOne(ServiceLevelIndicators, {
          id: slo.serviceLevelIndicatorId,
        })
      : null;
    const component = indicator
      ? await tx.findOne(ServiceComponents, {
          id: indicator.serviceComponentId,
        })
      : null;
    return this.require(resource, component?.tenantId);
  }

  /** Exige un recurso cuyo tenant es el de su runbook. */
  async viaRunbook<T>(
    tx: EntityManager,
    resource: T | null | undefined,
    runbookId: string,
  ): Promise<T> {
    if (resource === null || resource === undefined) {
      requireTenantId();
      throw this.outOfScope();
    }
    const runbook = await tx.findOne(Runbooks, { id: runbookId });
    return this.require(resource, runbook?.tenantId);
  }
}
