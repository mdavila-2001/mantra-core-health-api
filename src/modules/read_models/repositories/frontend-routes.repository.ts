import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FrontendRoutes } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una ruta de frontend. */
export interface CreateFrontendRouteData {
  /**
   * Identificador asociado a portal surface.
   */
  portalSurfaceId: string;
  /**
   * Valor de route code mantenido por la instancia.
   */
  routeCode: string;
  /**
   * Valor de route pattern mantenido por la instancia.
   */
  routePattern: string;
  /**
   * Valor de page title mantenido por la instancia.
   */
  pageTitle: string;
  /**
   * Valor de navigation group mantenido por la instancia.
   */
  navigationGroup?: string;
  /**
   * Valor de navigation icon key mantenido por la instancia.
   */
  navigationIconKey?: string;
  /**
   * Valor de breadcrumb json mantenido por la instancia.
   */
  breadcrumbJson?: unknown;
  /**
   * Identificador asociado a required permission.
   */
  requiredPermissionId?: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId?: string;
  /**
   * Valor de feature flag code mantenido por la instancia.
   */
  featureFlagCode?: string;
  /**
   * Valor de requires patient context mantenido por la instancia.
   */
  requiresPatientContext?: boolean;
  /**
   * Valor de requires tenant context mantenido por la instancia.
   */
  requiresTenantContext?: boolean;
  /**
   * Identificador asociado a cache policy concept.
   */
  cachePolicyConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `read_models.frontend_routes`. */
@Injectable()
export class FrontendRoutesRepository {
  /**
   * Obtiene find by surface and code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param portalSurfaceId - Identificador de portal surface.
   * @param routeCode - Valor de route code requerido por la operación.
   * @returns Resultado de find by surface and code conforme al contrato `Promise<FrontendRoutes | null>`.
   */
  findBySurfaceAndCode(
    em: EntityManager,
    portalSurfaceId: string,
    routeCode: string,
  ): Promise<FrontendRoutes | null> {
    return em.findOne(FrontendRoutes, { portalSurfaceId, routeCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FrontendRoutes`.
   */
  create(em: EntityManager, data: CreateFrontendRouteData): FrontendRoutes {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendRoutes,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
