import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FrontendViewFields,
  FrontendViewFilters,
  FrontendViewSortOptions,
  FrontendViewActions,
  FrontendViewKpis,
  FrontendViewStates,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateFieldData {
  frontendPageViewId: string;
  fieldCode: string;
  sourceColumn: string;
  label: string;
  dataType: string;
  displayComponentConceptId?: string;
  formatMask?: string;
  responsivePriority?: number;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  sensitive?: boolean;
  permissionId?: string;
  emptyDisplayText?: string;
  metadataJson?: unknown;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateFilterData {
  frontendPageViewId: string;
  filterCode: string;
  label: string;
  operatorValueSetId: string;
  inputTypeConceptId: string;
  valueSetId?: string;
  dynamicEnumDefinitionId?: string;
  sourceColumn?: string;
  defaultValueJson?: unknown;
  required?: boolean;
  urlParameterName?: string;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateSortOptionData {
  frontendPageViewId: string;
  sortCode: string;
  label: string;
  sortExpression: string;
  directionConceptId: string;
  nullsPositionConceptId: string;
  stableTieBreakerExpression?: string;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateActionData {
  frontendPageViewId: string;
  actionCode: string;
  label: string;
  actionTypeConceptId: string;
  routeTemplate?: string;
  requiredPermissionId?: string;
  allowedStateValueSetId?: string;
  confirmationPolicyConceptId?: string;
  idempotencyRequired?: boolean;
  iconKey?: string;
  prominenceConceptId?: string;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateKpiData {
  frontendPageViewId: string;
  kpiCode: string;
  label: string;
  valueColumn: string;
  comparisonColumn: string;
  unitConceptId?: string;
  formatMask?: string;
  thresholdRulesJson?: unknown;
  drilldownRouteTemplate?: string;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateStateData {
  frontendPageViewId: string;
  stateTypeConceptId: string;
  title: string;
  message: string;
  illustrationKey?: string;
  recoveryActionCode?: string;
  telemetryEventCode?: string;
  retryAllowed?: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de las tablas hijas de un contrato de vista (allow-list de
 * campos, filtros, orden, acciones, KPIs y estados). Una sola clase agrupa el
 * acceso porque todas cuelgan de `frontend_page_views` y se crean en la misma
 * transacción tras el flush de la vista padre.
 */
@Injectable()
export class FrontendViewChildrenRepository {
  listFields(
    em: EntityManager,
    frontendPageViewId: string,
  ): Promise<FrontendViewFields[]> {
    return em.find(
      FrontendViewFields,
      { frontendPageViewId },
      { orderBy: { ordinal: 'asc' } },
    );
  }

  listActions(
    em: EntityManager,
    frontendPageViewId: string,
  ): Promise<FrontendViewActions[]> {
    return em.find(
      FrontendViewActions,
      { frontendPageViewId },
      { orderBy: { ordinal: 'asc' } },
    );
  }

  createField(em: EntityManager, data: CreateFieldData): FrontendViewFields {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewFields,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createFilter(em: EntityManager, data: CreateFilterData): FrontendViewFilters {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewFilters,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createSortOption(
    em: EntityManager,
    data: CreateSortOptionData,
  ): FrontendViewSortOptions {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewSortOptions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createAction(em: EntityManager, data: CreateActionData): FrontendViewActions {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewActions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createKpi(em: EntityManager, data: CreateKpiData): FrontendViewKpis {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewKpis,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createState(em: EntityManager, data: CreateStateData): FrontendViewStates {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewStates,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
