import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FrontendPageViews } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una vista de página. */
export interface CreatePageViewData {
  frontendRouteId: string;
  readModelDefinitionId: string;
  viewCode: string;
  viewTypeConceptId: string;
  title?: string;
  description?: string;
  fieldMaskPolicyId?: string;
  defaultSortCode?: string;
  pollingIntervalSeconds?: number;
  supportsCursorPagination?: boolean;
  supportsExport?: boolean;
  supportsSavedFilters?: boolean;
  layoutSpecJson?: unknown;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `read_models.frontend_page_views`. */
@Injectable()
export class FrontendPageViewsRepository {
  findById(em: EntityManager, id: string): Promise<FrontendPageViews | null> {
    return em.findOne(FrontendPageViews, { id });
  }

  findByRouteAndCode(
    em: EntityManager,
    frontendRouteId: string,
    viewCode: string,
  ): Promise<FrontendPageViews | null> {
    return em.findOne(FrontendPageViews, { frontendRouteId, viewCode });
  }

  /** Cuenta vistas que apuntan a una definición (guarda de retiro, UC-30-13). */
  countByDefinition(em: EntityManager, readModelDefinitionId: string): Promise<number> {
    return em.count(FrontendPageViews, { readModelDefinitionId });
  }

  create(em: EntityManager, data: CreatePageViewData): FrontendPageViews {
    const { actorUserId, ...rest } = data;
    return em.create(FrontendPageViews, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }
}
