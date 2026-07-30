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

/**
 * Describe el contrato estructural de create field data.
 */
export interface CreateFieldData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Valor de field code mantenido por la instancia.
   */
  fieldCode: string;
  /**
   * Valor de source column mantenido por la instancia.
   */
  sourceColumn: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label: string;
  /**
   * Valor de data type mantenido por la instancia.
   */
  dataType: string;
  /**
   * Identificador asociado a display component concept.
   */
  displayComponentConceptId?: string;
  /**
   * Valor de format mask mantenido por la instancia.
   */
  formatMask?: string;
  /**
   * Valor de responsive priority mantenido por la instancia.
   */
  responsivePriority?: number;
  /**
   * Valor de sortable mantenido por la instancia.
   */
  sortable?: boolean;
  /**
   * Valor de filterable mantenido por la instancia.
   */
  filterable?: boolean;
  /**
   * Valor de searchable mantenido por la instancia.
   */
  searchable?: boolean;
  /**
   * Valor de sensitive mantenido por la instancia.
   */
  sensitive?: boolean;
  /**
   * Identificador asociado a permission.
   */
  permissionId?: string;
  /**
   * Valor de empty display text mantenido por la instancia.
   */
  emptyDisplayText?: string;
  /**
   * Valor de metadata json mantenido por la instancia.
   */
  metadataJson?: unknown;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create filter data.
 */
export interface CreateFilterData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Valor de filter code mantenido por la instancia.
   */
  filterCode: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label: string;
  /**
   * Identificador asociado a operator value set.
   */
  operatorValueSetId: string;
  /**
   * Identificador asociado a input type concept.
   */
  inputTypeConceptId: string;
  /**
   * Identificador asociado a value set.
   */
  valueSetId?: string;
  /**
   * Identificador asociado a dynamic enum definition.
   */
  dynamicEnumDefinitionId?: string;
  /**
   * Valor de source column mantenido por la instancia.
   */
  sourceColumn?: string;
  /**
   * Valor de default value json mantenido por la instancia.
   */
  defaultValueJson?: unknown;
  /**
   * Valor de required mantenido por la instancia.
   */
  required?: boolean;
  /**
   * Valor de url parameter name mantenido por la instancia.
   */
  urlParameterName?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create sort option data.
 */
export interface CreateSortOptionData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Valor de sort code mantenido por la instancia.
   */
  sortCode: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label: string;
  /**
   * Valor de sort expression mantenido por la instancia.
   */
  sortExpression: string;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId: string;
  /**
   * Identificador asociado a nulls position concept.
   */
  nullsPositionConceptId: string;
  /**
   * Valor de stable tie breaker expression mantenido por la instancia.
   */
  stableTieBreakerExpression?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create action data.
 */
export interface CreateActionData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Valor de action code mantenido por la instancia.
   */
  actionCode: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label: string;
  /**
   * Identificador asociado a action type concept.
   */
  actionTypeConceptId: string;
  /**
   * Valor de route template mantenido por la instancia.
   */
  routeTemplate?: string;
  /**
   * Identificador asociado a required permission.
   */
  requiredPermissionId?: string;
  /**
   * Identificador asociado a allowed state value set.
   */
  allowedStateValueSetId?: string;
  /**
   * Identificador asociado a confirmation policy concept.
   */
  confirmationPolicyConceptId?: string;
  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  idempotencyRequired?: boolean;
  /**
   * Valor de icon key mantenido por la instancia.
   */
  iconKey?: string;
  /**
   * Identificador asociado a prominence concept.
   */
  prominenceConceptId?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create kpi data.
 */
export interface CreateKpiData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Valor de kpi code mantenido por la instancia.
   */
  kpiCode: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label: string;
  /**
   * Valor de value column mantenido por la instancia.
   */
  valueColumn: string;
  /**
   * Valor de comparison column mantenido por la instancia.
   */
  comparisonColumn: string;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Valor de format mask mantenido por la instancia.
   */
  formatMask?: string;
  /**
   * Valor de threshold rules json mantenido por la instancia.
   */
  thresholdRulesJson?: unknown;
  /**
   * Valor de drilldown route template mantenido por la instancia.
   */
  drilldownRouteTemplate?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create state data.
 */
export interface CreateStateData {
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Identificador asociado a state type concept.
   */
  stateTypeConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de message mantenido por la instancia.
   */
  message: string;
  /**
   * Valor de illustration key mantenido por la instancia.
   */
  illustrationKey?: string;
  /**
   * Valor de recovery action code mantenido por la instancia.
   */
  recoveryActionCode?: string;
  /**
   * Valor de telemetry event code mantenido por la instancia.
   */
  telemetryEventCode?: string;
  /**
   * Valor de retry allowed mantenido por la instancia.
   */
  retryAllowed?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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
  /**
   * Obtiene list fields.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param frontendPageViewId - Identificador de frontend page view.
   * @returns Resultado de list fields conforme al contrato `Promise<FrontendViewFields[]>`.
   */
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

  /**
   * Obtiene list actions.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param frontendPageViewId - Identificador de frontend page view.
   * @returns Resultado de list actions conforme al contrato `Promise<FrontendViewActions[]>`.
   */
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

  /**
   * Crea create field.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create field conforme al contrato `FrontendViewFields`.
   */
  createField(em: EntityManager, data: CreateFieldData): FrontendViewFields {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewFields,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create filter.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create filter conforme al contrato `FrontendViewFilters`.
   */
  createFilter(em: EntityManager, data: CreateFilterData): FrontendViewFilters {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewFilters,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create sort option.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create sort option conforme al contrato `FrontendViewSortOptions`.
   */
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

  /**
   * Crea create action.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create action conforme al contrato `FrontendViewActions`.
   */
  createAction(em: EntityManager, data: CreateActionData): FrontendViewActions {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewActions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create kpi.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create kpi conforme al contrato `FrontendViewKpis`.
   */
  createKpi(em: EntityManager, data: CreateKpiData): FrontendViewKpis {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewKpis,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create state.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create state conforme al contrato `FrontendViewStates`.
   */
  createState(em: EntityManager, data: CreateStateData): FrontendViewStates {
    const { actorUserId, ...rest } = data;
    return em.create(
      FrontendViewStates,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
