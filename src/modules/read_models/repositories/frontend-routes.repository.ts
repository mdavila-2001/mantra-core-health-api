import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FrontendRoutes } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una ruta de frontend. */
export interface CreateFrontendRouteData {
  portalSurfaceId: string;
  routeCode: string;
  routePattern: string;
  pageTitle: string;
  navigationGroup?: string;
  navigationIconKey?: string;
  breadcrumbJson?: unknown;
  requiredPermissionId?: string;
  purposeOfUseConceptId?: string;
  featureFlagCode?: string;
  requiresPatientContext?: boolean;
  requiresTenantContext?: boolean;
  cachePolicyConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `read_models.frontend_routes`. */
@Injectable()
export class FrontendRoutesRepository {
  findBySurfaceAndCode(
    em: EntityManager,
    portalSurfaceId: string,
    routeCode: string,
  ): Promise<FrontendRoutes | null> {
    return em.findOne(FrontendRoutes, { portalSurfaceId, routeCode });
  }

  create(em: EntityManager, data: CreateFrontendRouteData): FrontendRoutes {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendRoutes,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
