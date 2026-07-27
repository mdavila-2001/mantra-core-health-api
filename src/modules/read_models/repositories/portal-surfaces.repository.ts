import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PortalSurfaces } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una superficie de portal. */
export interface CreatePortalSurfaceData {
  portalCode: string;
  name: string;
  portalTypeConceptId: string;
  audienceRoleValueSetId?: string;
  tenantScoped?: boolean;
  patientScoped?: boolean;
  defaultRoute?: string;
  description?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `read_models.portal_surfaces`. */
@Injectable()
export class PortalSurfacesRepository {
  findByCode(
    em: EntityManager,
    portalCode: string,
  ): Promise<PortalSurfaces | null> {
    return em.findOne(PortalSurfaces, { portalCode });
  }

  create(em: EntityManager, data: CreatePortalSurfaceData): PortalSurfaces {
    const { actorUserId, ...rest } = data;
    return em.create(
      PortalSurfaces,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
