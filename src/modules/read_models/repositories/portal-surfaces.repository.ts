import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PortalSurfaces } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una superficie de portal. */
export interface CreatePortalSurfaceData {
  /**
   * Valor de portal code mantenido por la instancia.
   */
  portalCode: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Identificador asociado a audience role value set.
   */
  audienceRoleValueSetId?: string;
  /**
   * Valor de tenant scoped mantenido por la instancia.
   */
  tenantScoped?: boolean;
  /**
   * Valor de patient scoped mantenido por la instancia.
   */
  patientScoped?: boolean;
  /**
   * Valor de default route mantenido por la instancia.
   */
  defaultRoute?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `read_models.portal_surfaces`. */
@Injectable()
export class PortalSurfacesRepository {
  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param portalCode - Valor de portal code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<PortalSurfaces | null>`.
   */
  findByCode(
    em: EntityManager,
    portalCode: string,
  ): Promise<PortalSurfaces | null> {
    return em.findOne(PortalSurfaces, { portalCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PortalSurfaces`.
   */
  create(em: EntityManager, data: CreatePortalSurfaceData): PortalSurfaces {
    const { actorUserId, ...rest } = data;
    return em.create(
      PortalSurfaces,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
