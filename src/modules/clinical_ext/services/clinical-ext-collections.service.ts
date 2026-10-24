import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { CdsRules, ImmunizationSchedules, OrderSets } from '../entities';
import type {
  CdsRuleItemDto,
  ImmunizationScheduleItemDto,
  ListCdsRulesQueryDto,
  ListImmunizationSchedulesQueryDto,
  ListOrderSetsQueryDto,
  OrderSetItemDto,
} from '../dto';

/**
 * Lecturas de colección de `clinical_ext`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ClinicalExtCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar las reglas de apoyo a la decisión clínica del tenant (V18-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCdsRules(
    query: ListCdsRulesQueryDto,
  ): Promise<PageResponseDto<CdsRuleItemDto>> {
    return listTenantCollection(this.em.fork(), CdsRules, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({
        ruleTypeConceptId: query.ruleTypeConceptId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): CdsRuleItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        ruleTypeConceptId: row.ruleTypeConceptId,
        severityConceptId: row.severityConceptId,
        logicJson: row.logicJson ?? null,
        messageTemplate: row.messageTemplate ?? null,
        isActive: row.isActive,
        version: row.version ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los conjuntos de órdenes del tenant (V18-05).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listOrderSets(
    query: ListOrderSetsQueryDto,
  ): Promise<PageResponseDto<OrderSetItemDto>> {
    return listTenantCollection(this.em.fork(), OrderSets, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({
        specialtyConceptId: query.specialtyConceptId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): OrderSetItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        specialtyConceptId: row.specialtyConceptId ?? null,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        conditionConceptId: row.conditionConceptId ?? null,
        version: row.version,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los esquemas de inmunización del tenant (V18-12).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listImmunizationSchedules(
    query: ListImmunizationSchedulesQueryDto,
  ): Promise<PageResponseDto<ImmunizationScheduleItemDto>> {
    return listTenantCollection(this.em.fork(), ImmunizationSchedules, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({
        vaccineConceptId: query.vaccineConceptId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ImmunizationScheduleItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        vaccineConceptId: row.vaccineConceptId,
        name: row.name,
        recommendedAgeDays: row.recommendedAgeDays ?? null,
        doseNumber: row.doseNumber ?? null,
        intervalDays: row.intervalDays ?? null,
        jurisdictionConceptId: row.jurisdictionConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
