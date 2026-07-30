import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FrontendPageViews } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una vista de página. */
export interface CreatePageViewData {
  /**
   * Identificador asociado a frontend route.
   */
  frontendRouteId: string;
  /**
   * Identificador asociado a read model definition.
   */
  readModelDefinitionId: string;
  /**
   * Valor de view code mantenido por la instancia.
   */
  viewCode: string;
  /**
   * Identificador asociado a view type concept.
   */
  viewTypeConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a field mask policy.
   */
  fieldMaskPolicyId?: string;
  /**
   * Valor de default sort code mantenido por la instancia.
   */
  defaultSortCode?: string;
  /**
   * Valor de polling interval seconds mantenido por la instancia.
   */
  pollingIntervalSeconds?: number;
  /**
   * Valor de supports cursor pagination mantenido por la instancia.
   */
  supportsCursorPagination?: boolean;
  /**
   * Valor de supports export mantenido por la instancia.
   */
  supportsExport?: boolean;
  /**
   * Valor de supports saved filters mantenido por la instancia.
   */
  supportsSavedFilters?: boolean;
  /**
   * Valor de layout spec json mantenido por la instancia.
   */
  layoutSpecJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `read_models.frontend_page_views`. */
@Injectable()
export class FrontendPageViewsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<FrontendPageViews | null>`.
   */
  findById(em: EntityManager, id: string): Promise<FrontendPageViews | null> {
    return em.findOne(FrontendPageViews, { id });
  }

  /**
   * Obtiene find by route and code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param frontendRouteId - Identificador de frontend route.
   * @param viewCode - Valor de view code requerido por la operación.
   * @returns Resultado de find by route and code conforme al contrato `Promise<FrontendPageViews | null>`.
   */
  findByRouteAndCode(
    em: EntityManager,
    frontendRouteId: string,
    viewCode: string,
  ): Promise<FrontendPageViews | null> {
    return em.findOne(FrontendPageViews, { frontendRouteId, viewCode });
  }

  /** Cuenta vistas que apuntan a una definición (guarda de retiro, UC-30-13). */
  countByDefinition(
    em: EntityManager,
    readModelDefinitionId: string,
  ): Promise<number> {
    return em.count(FrontendPageViews, { readModelDefinitionId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FrontendPageViews`.
   */
  create(em: EntityManager, data: CreatePageViewData): FrontendPageViews {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendPageViews,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
